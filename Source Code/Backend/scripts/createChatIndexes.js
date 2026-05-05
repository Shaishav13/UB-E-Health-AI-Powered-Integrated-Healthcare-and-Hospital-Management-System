/**
 * createChatIndexes.js
 *
 * One-time script to create all required indexes for the Doctor-Patient Chat
 * System. Safe to run multiple times (createIndex is idempotent).
 *
 * Usage:
 *   node Backend/scripts/createChatIndexes.js
 *
 * Requirements: 20.5
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

// ─── DB connection ────────────────────────────────────────────────────────────

async function connect() {
  const uri = process.env.MONGO_URI || process.env.DB_URI || 'mongodb://localhost:27017/ehealth';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('✓ Connected to MongoDB:', uri.replace(/\/\/.*@/, '//***@'));
}

// ─── Index definitions ────────────────────────────────────────────────────────

/**
 * All indexes are defined here so they can be created and verified in one place.
 * Each entry: { collection, key, options }
 */
const INDEX_SPECS = [
  // ── Conversation ──────────────────────────────────────────────────────────
  {
    collection: 'conversations',
    key: { doctorId: 1, patientId: 1 },
    options: { unique: true, name: 'idx_conv_doctor_patient_unique' },
    description: 'Compound unique index on (doctorId, patientId)',
  },
  {
    collection: 'conversations',
    key: { doctorId: 1, 'metadata.lastActivityAt': -1 },
    options: { name: 'idx_conv_doctor_activity' },
    description: 'Doctor conversation list sorted by last activity',
  },
  {
    collection: 'conversations',
    key: { patientId: 1, 'metadata.lastActivityAt': -1 },
    options: { name: 'idx_conv_patient_activity' },
    description: 'Patient conversation list sorted by last activity',
  },
  {
    collection: 'conversations',
    key: { isEmergency: 1 },
    options: { name: 'idx_conv_emergency' },
    description: 'Filter emergency conversations',
  },

  // ── Message ───────────────────────────────────────────────────────────────
  {
    collection: 'messages',
    key: { conversationId: 1, createdAt: -1 },
    options: { name: 'idx_msg_conv_created' },
    description: 'Compound index on (conversationId, createdAt) for efficient message retrieval',
  },
  {
    collection: 'messages',
    key: { conversationId: 1, isEmergency: 1 },
    options: { name: 'idx_msg_conv_emergency' },
    description: 'Compound index on (conversationId, isEmergency) for emergency filtering',
  },
  {
    collection: 'messages',
    key: { content: 'text' },
    options: { name: 'idx_msg_text_search' },
    description: 'Full-text search index on message content',
  },

  // ── ChatFile ──────────────────────────────────────────────────────────────
  {
    collection: 'chatfiles',
    key: { conversationId: 1, createdAt: -1 },
    options: { name: 'idx_chatfile_conv_created' },
    description: 'Compound index on (conversationId, createdAt) for file retrieval',
  },
  {
    collection: 'chatfiles',
    key: { messageId: 1 },
    options: { name: 'idx_chatfile_message' },
    description: 'Index on messageId for quick attachment lookup',
  },
  {
    collection: 'chatfiles',
    key: { uploadedBy: 1 },
    options: { name: 'idx_chatfile_uploader' },
    description: 'Index on uploadedBy for user file queries',
  },
];

// ─── Create indexes ───────────────────────────────────────────────────────────

async function createIndexes() {
  const db = mongoose.connection.db;
  const results = [];

  for (const spec of INDEX_SPECS) {
    try {
      const collection = db.collection(spec.collection);
      const indexName = await collection.createIndex(spec.key, spec.options);
      console.log(`  ✓ [${spec.collection}] ${spec.description} → "${indexName}"`);
      results.push({ ...spec, status: 'created', indexName });
    } catch (err) {
      // Code 85 = IndexOptionsConflict, 86 = IndexKeySpecsConflict — already exists with different options
      if (err.code === 85 || err.code === 86) {
        console.warn(`  ⚠ [${spec.collection}] ${spec.description} — conflict: ${err.message}`);
        results.push({ ...spec, status: 'conflict', error: err.message });
      } else {
        console.error(`  ✗ [${spec.collection}] ${spec.description} — error: ${err.message}`);
        results.push({ ...spec, status: 'error', error: err.message });
      }
    }
  }

  return results;
}

// ─── Verify indexes with explain() ───────────────────────────────────────────

async function verifyIndexes() {
  const db = mongoose.connection.db;

  console.log('\n── Index verification (explain() queries) ──────────────────────────────');

  // 1. Conversation list query (most common)
  try {
    const plan = await db.collection('conversations').find(
      { doctorId: new mongoose.Types.ObjectId(), 'isArchived.doctor': false },
      { explain: 'queryPlanner' }
    ).sort({ 'metadata.lastActivityAt': -1 }).limit(20).explain('queryPlanner');

    const stage = plan?.queryPlanner?.winningPlan?.inputStage?.stage
      || plan?.queryPlanner?.winningPlan?.stage;
    console.log(`  Conversation list query → winning stage: ${stage}`);
  } catch (e) {
    console.log(`  Conversation list query → explain skipped (${e.message})`);
  }

  // 2. Message pagination query
  try {
    const plan = await db.collection('messages').find(
      { conversationId: new mongoose.Types.ObjectId(), isDeleted: false },
      { explain: 'queryPlanner' }
    ).sort({ createdAt: -1 }).limit(50).explain('queryPlanner');

    const stage = plan?.queryPlanner?.winningPlan?.inputStage?.stage
      || plan?.queryPlanner?.winningPlan?.stage;
    console.log(`  Message pagination query → winning stage: ${stage}`);
  } catch (e) {
    console.log(`  Message pagination query → explain skipped (${e.message})`);
  }

  // 3. Emergency message filter
  try {
    const plan = await db.collection('messages').find(
      { conversationId: new mongoose.Types.ObjectId(), isEmergency: true, isDeleted: false },
      { explain: 'queryPlanner' }
    ).explain('queryPlanner');

    const stage = plan?.queryPlanner?.winningPlan?.inputStage?.stage
      || plan?.queryPlanner?.winningPlan?.stage;
    console.log(`  Emergency message query → winning stage: ${stage}`);
  } catch (e) {
    console.log(`  Emergency message query → explain skipped (${e.message})`);
  }

  // 4. ChatFile retrieval
  try {
    const plan = await db.collection('chatfiles').find(
      { conversationId: new mongoose.Types.ObjectId(), isScanned: true },
      { explain: 'queryPlanner' }
    ).sort({ createdAt: -1 }).limit(20).explain('queryPlanner');

    const stage = plan?.queryPlanner?.winningPlan?.inputStage?.stage
      || plan?.queryPlanner?.winningPlan?.stage;
    console.log(`  ChatFile retrieval query → winning stage: ${stage}`);
  } catch (e) {
    console.log(`  ChatFile retrieval query → explain skipped (${e.message})`);
  }
}

// ─── List existing indexes ────────────────────────────────────────────────────

async function listIndexes() {
  const db = mongoose.connection.db;
  const collections = ['conversations', 'messages', 'chatfiles'];

  console.log('\n── Existing indexes ────────────────────────────────────────────────────');
  for (const col of collections) {
    try {
      const indexes = await db.collection(col).indexes();
      console.log(`\n  ${col} (${indexes.length} indexes):`);
      indexes.forEach((idx) => {
        const keys = JSON.stringify(idx.key);
        const flags = [
          idx.unique ? 'unique' : null,
          idx.sparse ? 'sparse' : null,
        ].filter(Boolean).join(', ');
        console.log(`    • ${idx.name}: ${keys}${flags ? ` [${flags}]` : ''}`);
      });
    } catch (e) {
      console.log(`  ${col} → could not list indexes: ${e.message}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  try {
    await connect();

    console.log('\n── Creating chat system indexes ────────────────────────────────────────');
    const results = await createIndexes();

    const created = results.filter((r) => r.status === 'created').length;
    const conflicts = results.filter((r) => r.status === 'conflict').length;
    const errors = results.filter((r) => r.status === 'error').length;

    console.log(`\n  Summary: ${created} created, ${conflicts} conflicts, ${errors} errors`);

    await listIndexes();
    await verifyIndexes();

    if (errors > 0) {
      console.error('\n✗ Some indexes failed to create. Review errors above.');
      process.exit(1);
    } else {
      console.log('\n✓ All indexes created successfully.');
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB.');
  }
}

main();
