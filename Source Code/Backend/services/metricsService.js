'use strict';

/**
 * Metrics Service
 *
 * Lightweight, zero-dependency metrics collector for the chat system.
 * Tracks application, database, and Redis metrics in-process using simple
 * counters and gauges.  Metrics are exposed via the /api/chat/health and
 * /api/chat/metrics endpoints.
 *
 * Design goals:
 *   - No external monitoring agent required (works out-of-the-box)
 *   - Prometheus-compatible text format for optional scraping
 *   - Graceful degradation: metric collection never throws to callers
 *
 * Requirements: 20.1, 20.2, 20.5, 20.6, 20.8
 */

// ─── In-process metric stores ─────────────────────────────────────────────────

/**
 * Counters – monotonically increasing values.
 * @type {Map<string, number>}
 */
const counters = new Map();

/**
 * Gauges – point-in-time values that can go up or down.
 * @type {Map<string, number>}
 */
const gauges = new Map();

/**
 * Histograms – store a rolling window of samples for latency percentiles.
 * Each entry is { sum, count, buckets: number[] }.
 * @type {Map<string, { sum: number, count: number, samples: number[] }>}
 */
const histograms = new Map();

/** Maximum samples kept per histogram (ring-buffer style). */
const MAX_HISTOGRAM_SAMPLES = 1000;

/** Timestamp when the process started (for uptime calculation). */
const PROCESS_START_MS = Date.now();

// ─── Initialise default metrics ───────────────────────────────────────────────

// Application
gauges.set('socket_connections_active', 0);
counters.set('messages_sent_total', 0);
counters.set('messages_delivered_total', 0);
counters.set('messages_read_total', 0);
counters.set('api_requests_total', 0);
counters.set('api_errors_total', 0);
counters.set('rate_limit_hits_total', 0);
counters.set('file_uploads_total', 0);
counters.set('file_upload_errors_total', 0);
counters.set('socket_connections_total', 0);
counters.set('socket_disconnections_total', 0);
counters.set('socket_auth_failures_total', 0);

// Database
counters.set('db_queries_total', 0);
counters.set('db_query_errors_total', 0);
gauges.set('db_connection_pool_size', 0);
gauges.set('db_connection_pool_available', 0);

// Redis
counters.set('redis_commands_total', 0);
counters.set('redis_errors_total', 0);
counters.set('redis_cache_hits_total', 0);
counters.set('redis_cache_misses_total', 0);
counters.set('redis_key_expirations_total', 0);
gauges.set('redis_connected_clients', 0);
gauges.set('redis_memory_used_bytes', 0);

// Histograms
histograms.set('message_delivery_latency_ms', { sum: 0, count: 0, samples: [] });
histograms.set('api_response_time_ms', { sum: 0, count: 0, samples: [] });
histograms.set('db_query_duration_ms', { sum: 0, count: 0, samples: [] });

// Per-endpoint request/error counters
// key: `endpoint:${method}:${path}` → { requests, errors, totalDurationMs }
const endpointStats = new Map();

// ─── Counter helpers ──────────────────────────────────────────────────────────

/**
 * Increment a counter by delta (default 1).
 * @param {string} name
 * @param {number} [delta=1]
 */
function increment(name, delta = 1) {
  try {
    counters.set(name, (counters.get(name) || 0) + delta);
  } catch (_) { /* never throw */ }
}

/**
 * Set a gauge to an absolute value.
 * @param {string} name
 * @param {number} value
 */
function setGauge(name, value) {
  try {
    gauges.set(name, value);
  } catch (_) { /* never throw */ }
}

/**
 * Adjust a gauge by delta (positive or negative).
 * @param {string} name
 * @param {number} delta
 */
function adjustGauge(name, delta) {
  try {
    gauges.set(name, (gauges.get(name) || 0) + delta);
  } catch (_) { /* never throw */ }
}

/**
 * Record a latency sample in a histogram.
 * @param {string} name
 * @param {number} valueMs
 */
function recordLatency(name, valueMs) {
  try {
    if (!histograms.has(name)) {
      histograms.set(name, { sum: 0, count: 0, samples: [] });
    }
    const h = histograms.get(name);
    h.sum += valueMs;
    h.count += 1;
    h.samples.push(valueMs);
    // Keep only the most recent MAX_HISTOGRAM_SAMPLES samples
    if (h.samples.length > MAX_HISTOGRAM_SAMPLES) {
      h.samples.shift();
    }
  } catch (_) { /* never throw */ }
}

// ─── Percentile calculation ───────────────────────────────────────────────────

/**
 * Calculate a percentile from a sorted array of numbers.
 * @param {number[]} sorted - Sorted array (ascending)
 * @param {number} p - Percentile 0–100
 * @returns {number}
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

/**
 * Summarise a histogram into { avg, p50, p95, p99, min, max, count }.
 * @param {string} name
 * @returns {{ avg: number, p50: number, p95: number, p99: number, min: number, max: number, count: number }}
 */
function summariseHistogram(name) {
  const h = histograms.get(name);
  if (!h || h.count === 0) {
    return { avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0, count: 0 };
  }
  const sorted = [...h.samples].sort((a, b) => a - b);
  return {
    avg: Math.round(h.sum / h.count),
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: h.count,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

// ── 27.1 Application metrics ──────────────────────────────────────────────────

/**
 * Record a new active WebSocket connection.
 * Call when a socket connects successfully.
 */
function recordSocketConnect() {
  increment('socket_connections_total');
  adjustGauge('socket_connections_active', 1);
}

/**
 * Record a WebSocket disconnection.
 * Call when a socket disconnects.
 */
function recordSocketDisconnect() {
  increment('socket_disconnections_total');
  adjustGauge('socket_connections_active', -1);
}

/**
 * Record a socket authentication failure.
 */
function recordSocketAuthFailure() {
  increment('socket_auth_failures_total');
}

/**
 * Record a message being sent (after successful persistence).
 * @param {number} [deliveryLatencyMs] - Optional end-to-end delivery latency
 */
function recordMessageSent(deliveryLatencyMs) {
  increment('messages_sent_total');
  if (typeof deliveryLatencyMs === 'number') {
    recordLatency('message_delivery_latency_ms', deliveryLatencyMs);
  }
}

/**
 * Record a message being marked as delivered.
 */
function recordMessageDelivered() {
  increment('messages_delivered_total');
}

/**
 * Record a message being marked as read.
 */
function recordMessageRead() {
  increment('messages_read_total');
}

/**
 * Record a rate-limit hit.
 */
function recordRateLimitHit() {
  increment('rate_limit_hits_total');
}

/**
 * Record a file upload (success or failure).
 * @param {boolean} success
 */
function recordFileUpload(success) {
  if (success) {
    increment('file_uploads_total');
  } else {
    increment('file_upload_errors_total');
  }
}

/**
 * Record an API request and its response time.
 * @param {string} method - HTTP method (GET, POST, …)
 * @param {string} path   - Route path (e.g. '/api/chat/conversations')
 * @param {number} statusCode
 * @param {number} durationMs
 */
function recordApiRequest(method, path, statusCode, durationMs) {
  increment('api_requests_total');
  recordLatency('api_response_time_ms', durationMs);

  const key = `${method.toUpperCase()}:${path}`;
  if (!endpointStats.has(key)) {
    endpointStats.set(key, { requests: 0, errors: 0, totalDurationMs: 0 });
  }
  const ep = endpointStats.get(key);
  ep.requests += 1;
  ep.totalDurationMs += durationMs;
  if (statusCode >= 400) {
    ep.errors += 1;
    increment('api_errors_total');
  }
}

// ── 27.2 Database metrics ─────────────────────────────────────────────────────

/**
 * Record a database query execution.
 * @param {number} durationMs
 * @param {boolean} [error=false]
 */
function recordDbQuery(durationMs, error = false) {
  increment('db_queries_total');
  recordLatency('db_query_duration_ms', durationMs);
  if (error) {
    increment('db_query_errors_total');
  }
}

/**
 * Update the MongoDB connection pool snapshot.
 * Call periodically (e.g. every 30 s) from the metrics collector.
 */
function updateDbPoolMetrics() {
  try {
    const mongoose = require('mongoose');
    const conn = mongoose.connection;
    if (conn && conn.db) {
      // Mongoose 6 exposes pool stats via the underlying driver
      const client = conn.getClient ? conn.getClient() : null;
      if (client && client.topology) {
        const servers = client.topology.s && client.topology.s.servers;
        if (servers) {
          let poolSize = 0;
          let available = 0;
          servers.forEach((server) => {
            if (server.s && server.s.pool) {
              poolSize += server.s.pool.totalConnectionCount || 0;
              available += server.s.pool.availableConnectionCount || 0;
            }
          });
          setGauge('db_connection_pool_size', poolSize);
          setGauge('db_connection_pool_available', available);
        }
      }
    }
  } catch (_) { /* non-fatal */ }
}

// ── 27.3 Redis metrics ────────────────────────────────────────────────────────

/**
 * Record a Redis command execution.
 * @param {boolean} [error=false]
 */
function recordRedisCommand(error = false) {
  increment('redis_commands_total');
  if (error) {
    increment('redis_errors_total');
  }
}

/**
 * Record a Redis cache hit or miss.
 * @param {boolean} hit
 */
function recordCacheAccess(hit) {
  if (hit) {
    increment('redis_cache_hits_total');
  } else {
    increment('redis_cache_misses_total');
  }
}

/**
 * Record a Redis key expiration event.
 */
function recordKeyExpiration() {
  increment('redis_key_expirations_total');
}

/**
 * Update Redis server-level metrics by querying INFO.
 * Call periodically (e.g. every 30 s) from the metrics collector.
 * @returns {Promise<void>}
 */
async function updateRedisMetrics() {
  try {
    const { redis: redisClient } = require('../configs/redis');
    const info = await redisClient.info('all');

    // Parse connected_clients
    const clientsMatch = info.match(/connected_clients:(\d+)/);
    if (clientsMatch) {
      setGauge('redis_connected_clients', parseInt(clientsMatch[1], 10));
    }

    // Parse used_memory
    const memMatch = info.match(/used_memory:(\d+)/);
    if (memMatch) {
      setGauge('redis_memory_used_bytes', parseInt(memMatch[1], 10));
    }

    // Parse expired_keys (cumulative – we track the delta as expirations)
    const expiredMatch = info.match(/expired_keys:(\d+)/);
    if (expiredMatch) {
      const current = parseInt(expiredMatch[1], 10);
      const previous = gauges.get('_redis_expired_keys_snapshot') || 0;
      if (current > previous) {
        increment('redis_key_expirations_total', current - previous);
      }
      setGauge('_redis_expired_keys_snapshot', current);
    }

    // Parse keyspace_hits / keyspace_misses for cache ratio
    const hitsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);
    if (hitsMatch) {
      const hits = parseInt(hitsMatch[1], 10);
      const prevHits = gauges.get('_redis_hits_snapshot') || 0;
      if (hits > prevHits) {
        increment('redis_cache_hits_total', hits - prevHits);
      }
      setGauge('_redis_hits_snapshot', hits);
    }
    if (missesMatch) {
      const misses = parseInt(missesMatch[1], 10);
      const prevMisses = gauges.get('_redis_misses_snapshot') || 0;
      if (misses > prevMisses) {
        increment('redis_cache_misses_total', misses - prevMisses);
      }
      setGauge('_redis_misses_snapshot', misses);
    }
  } catch (_) { /* Redis may be unavailable – non-fatal */ }
}

// ─── Snapshot builder ─────────────────────────────────────────────────────────

/**
 * Build a complete metrics snapshot suitable for JSON serialisation.
 * @returns {object}
 */
function getSnapshot() {
  const uptimeMs = Date.now() - PROCESS_START_MS;

  // Compute cache hit ratio
  const cacheHits = counters.get('redis_cache_hits_total') || 0;
  const cacheMisses = counters.get('redis_cache_misses_total') || 0;
  const cacheTotal = cacheHits + cacheMisses;
  const cacheHitRatio = cacheTotal > 0 ? Math.round((cacheHits / cacheTotal) * 10000) / 100 : null;

  // Per-endpoint summary
  const endpoints = {};
  endpointStats.forEach((stats, key) => {
    endpoints[key] = {
      requests: stats.requests,
      errors: stats.errors,
      errorRate: stats.requests > 0
        ? Math.round((stats.errors / stats.requests) * 10000) / 100
        : 0,
      avgResponseTimeMs: stats.requests > 0
        ? Math.round(stats.totalDurationMs / stats.requests)
        : 0,
    };
  });

  return {
    collectedAt: new Date().toISOString(),
    process: {
      uptimeMs,
      uptimeHuman: _formatUptime(uptimeMs),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
    },
    application: {
      socketConnectionsActive: gauges.get('socket_connections_active') || 0,
      socketConnectionsTotal: counters.get('socket_connections_total') || 0,
      socketDisconnectionsTotal: counters.get('socket_disconnections_total') || 0,
      socketAuthFailuresTotal: counters.get('socket_auth_failures_total') || 0,
      messagesSentTotal: counters.get('messages_sent_total') || 0,
      messagesDeliveredTotal: counters.get('messages_delivered_total') || 0,
      messagesReadTotal: counters.get('messages_read_total') || 0,
      rateLimitHitsTotal: counters.get('rate_limit_hits_total') || 0,
      fileUploadsTotal: counters.get('file_uploads_total') || 0,
      fileUploadErrorsTotal: counters.get('file_upload_errors_total') || 0,
      apiRequestsTotal: counters.get('api_requests_total') || 0,
      apiErrorsTotal: counters.get('api_errors_total') || 0,
      messageDeliveryLatency: summariseHistogram('message_delivery_latency_ms'),
      apiResponseTime: summariseHistogram('api_response_time_ms'),
      endpoints,
    },
    database: {
      queriesTotal: counters.get('db_queries_total') || 0,
      queryErrorsTotal: counters.get('db_query_errors_total') || 0,
      connectionPoolSize: gauges.get('db_connection_pool_size') || 0,
      connectionPoolAvailable: gauges.get('db_connection_pool_available') || 0,
      queryDuration: summariseHistogram('db_query_duration_ms'),
    },
    redis: {
      commandsTotal: counters.get('redis_commands_total') || 0,
      errorsTotal: counters.get('redis_errors_total') || 0,
      cacheHitsTotal: cacheHits,
      cacheMissesTotal: cacheMisses,
      cacheHitRatioPercent: cacheHitRatio,
      keyExpirationsTotal: counters.get('redis_key_expirations_total') || 0,
      connectedClients: gauges.get('redis_connected_clients') || 0,
      memoryUsedBytes: gauges.get('redis_memory_used_bytes') || 0,
      memoryUsedMb: Math.round((gauges.get('redis_memory_used_bytes') || 0) / 1024 / 1024 * 100) / 100,
    },
  };
}

// ─── Prometheus text format ───────────────────────────────────────────────────

/**
 * Render all metrics in Prometheus exposition format.
 * Useful for scraping by a Prometheus server or Grafana agent.
 * @returns {string}
 */
function getPrometheusText() {
  const lines = [];
  const snap = getSnapshot();

  const add = (name, value, help, type = 'gauge') => {
    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} ${type}`);
    lines.push(`${name} ${value}`);
  };

  // Process
  add('ehealth_process_uptime_seconds', Math.round(snap.process.uptimeMs / 1000),
    'Process uptime in seconds', 'counter');
  add('ehealth_process_memory_heap_mb', snap.process.memoryUsageMb,
    'Heap memory used in MB');

  // Application
  add('ehealth_socket_connections_active', snap.application.socketConnectionsActive,
    'Currently active WebSocket connections');
  add('ehealth_socket_connections_total', snap.application.socketConnectionsTotal,
    'Total WebSocket connections since start', 'counter');
  add('ehealth_messages_sent_total', snap.application.messagesSentTotal,
    'Total messages sent', 'counter');
  add('ehealth_messages_delivered_total', snap.application.messagesDeliveredTotal,
    'Total messages delivered', 'counter');
  add('ehealth_messages_read_total', snap.application.messagesReadTotal,
    'Total messages read', 'counter');
  add('ehealth_rate_limit_hits_total', snap.application.rateLimitHitsTotal,
    'Total rate limit violations', 'counter');
  add('ehealth_file_uploads_total', snap.application.fileUploadsTotal,
    'Total successful file uploads', 'counter');
  add('ehealth_api_requests_total', snap.application.apiRequestsTotal,
    'Total API requests', 'counter');
  add('ehealth_api_errors_total', snap.application.apiErrorsTotal,
    'Total API errors (4xx/5xx)', 'counter');
  add('ehealth_message_delivery_latency_p95_ms', snap.application.messageDeliveryLatency.p95,
    'Message delivery latency p95 in ms');
  add('ehealth_api_response_time_p95_ms', snap.application.apiResponseTime.p95,
    'API response time p95 in ms');

  // Database
  add('ehealth_db_queries_total', snap.database.queriesTotal,
    'Total database queries', 'counter');
  add('ehealth_db_query_errors_total', snap.database.queryErrorsTotal,
    'Total database query errors', 'counter');
  add('ehealth_db_connection_pool_size', snap.database.connectionPoolSize,
    'MongoDB connection pool size');
  add('ehealth_db_query_duration_p95_ms', snap.database.queryDuration.p95,
    'DB query duration p95 in ms');

  // Redis
  add('ehealth_redis_commands_total', snap.redis.commandsTotal,
    'Total Redis commands issued', 'counter');
  add('ehealth_redis_errors_total', snap.redis.errorsTotal,
    'Total Redis errors', 'counter');
  add('ehealth_redis_cache_hit_ratio_percent', snap.redis.cacheHitRatioPercent || 0,
    'Redis cache hit ratio as a percentage');
  add('ehealth_redis_memory_used_bytes', snap.redis.memoryUsedBytes,
    'Redis memory used in bytes');
  add('ehealth_redis_connected_clients', snap.redis.connectedClients,
    'Redis connected clients');

  return lines.join('\n') + '\n';
}

// ─── Background collector ─────────────────────────────────────────────────────

/** Interval handle for the background collector. */
let _collectorInterval = null;

/**
 * Start the background metrics collector.
 * Polls DB pool stats and Redis INFO every 30 seconds.
 * Safe to call multiple times (idempotent).
 */
function startCollector() {
  if (_collectorInterval) return; // already running

  const INTERVAL_MS = 30_000;

  _collectorInterval = setInterval(async () => {
    updateDbPoolMetrics();
    await updateRedisMetrics();
  }, INTERVAL_MS);

  // Don't prevent process exit
  if (_collectorInterval.unref) _collectorInterval.unref();

  console.log('✓ Metrics collector started (30 s interval)');
}

/**
 * Stop the background collector (useful in tests).
 */
function stopCollector() {
  if (_collectorInterval) {
    clearInterval(_collectorInterval);
    _collectorInterval = null;
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function _formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

// ─── Express middleware ───────────────────────────────────────────────────────

/**
 * Express middleware that records API request metrics automatically.
 * Mount before route handlers:
 *   app.use(metricsService.requestMetricsMiddleware);
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} next
 */
function requestMetricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    try {
      const durationMs = Date.now() - start;
      // Normalise dynamic segments: /api/chat/conversations/abc123 → /api/chat/conversations/:id
      const normalisedPath = req.route
        ? req.route.path
        : req.path.replace(/\/[a-f0-9]{24}/gi, '/:id');
      recordApiRequest(req.method, normalisedPath, res.statusCode, durationMs);
    } catch (_) { /* never throw from middleware */ }
  });

  next();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Application metrics (27.1)
  recordSocketConnect,
  recordSocketDisconnect,
  recordSocketAuthFailure,
  recordMessageSent,
  recordMessageDelivered,
  recordMessageRead,
  recordRateLimitHit,
  recordFileUpload,
  recordApiRequest,

  // Database metrics (27.2)
  recordDbQuery,
  updateDbPoolMetrics,

  // Redis metrics (27.3)
  recordRedisCommand,
  recordCacheAccess,
  recordKeyExpiration,
  updateRedisMetrics,

  // Generic primitives
  increment,
  setGauge,
  adjustGauge,
  recordLatency,

  // Snapshot / export
  getSnapshot,
  getPrometheusText,

  // Middleware
  requestMetricsMiddleware,

  // Lifecycle
  startCollector,
  stopCollector,
};
