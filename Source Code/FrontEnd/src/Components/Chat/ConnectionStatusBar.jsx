/**
 * ConnectionStatusBar — displays a slim banner at the top of the chat window
 * when the socket is not connected.
 *
 * Requirements: 23.1, 23.2, 23.3, 23.8
 *
 * Shows nothing when the socket is connected (status === 'connected').
 * Shows a yellow "reconnecting" bar while attempting to reconnect.
 * Shows a red "failed" bar when all reconnect attempts are exhausted.
 */

import { useState, useEffect } from 'react';
import { onConnectionStatusChange, getConnectionStatus } from '../../services/socketService';
import { FaWifi, FaExclamationTriangle, FaSync } from 'react-icons/fa';

const STATUS_CONFIG = {
  connecting: {
    className: 'conn-bar conn-bar-connecting',
    icon: <FaSync size={12} className="conn-bar-icon spin" />,
    getMessage: (attempt) =>
      attempt ? `Reconnecting… (attempt ${attempt})` : 'Connecting to chat server…',
  },
  disconnected: {
    className: 'conn-bar conn-bar-disconnected',
    icon: <FaWifi size={12} className="conn-bar-icon" />,
    getMessage: () => 'Disconnected. Attempting to reconnect…',
  },
  failed: {
    className: 'conn-bar conn-bar-failed',
    icon: <FaExclamationTriangle size={12} className="conn-bar-icon" />,
    getMessage: () =>
      'Could not reconnect. Please check your internet connection.',
  },
};

/**
 * ConnectionStatusBar
 *
 * Props: none — reads status directly from the socket service.
 */
const ConnectionStatusBar = () => {
  const [status, setStatus] = useState(getConnectionStatus);
  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((newStatus, newAttempt) => {
      setStatus(newStatus);
      setAttempt(newAttempt ?? null);
    });
    return unsubscribe;
  }, []);

  // Don't render anything when connected or idle
  if (status === 'connected' || status === 'idle') return null;

  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <div className={config.className} role="status" aria-live="polite">
      {config.icon}
      <span className="conn-bar-text">{config.getMessage(attempt)}</span>
    </div>
  );
};

export default ConnectionStatusBar;
