import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaSearch, FaComments, FaExclamationTriangle, FaInbox } from 'react-icons/fa';
import { fetchConversations, unarchiveConversation } from '../../Redux/Chat/action';
import ConversationListItem from './ConversationListItem';
import './ConversationList.css';

// Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 7.7, 10.5

/**
 * ConversationList — container component.
 *
 * Props:
 *   onSelectConversation  — function(conversation) called when an item is clicked
 *   activeConversationId  — string, the currently selected conversation _id
 */
const ConversationList = ({ onSelectConversation, activeConversationId }) => {
  const dispatch = useDispatch();

  // ── Redux state ────────────────────────────────────────────────────────────
  const { conversations, conversationsLoading, presence, totalUnreadCount } =
    useSelector((state) => state.chat);
  const currentUser = useSelector((state) => state.auth?.data?.user);

  // ── Local state ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // ── Fetch on mount and when tab changes ───────────────────────────────────
  useEffect(() => {
    dispatch(fetchConversations({ includeArchived: activeTab === 'archived' }));
  }, [dispatch, activeTab]);

  // ── Filter conversations locally ──────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];

    let list = conversations;

    // Emergency filter
    if (emergencyOnly) {
      list = list.filter((c) => c.isEmergency);
    }

    // Search filter — match participant name or last message preview
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) => {
        // Determine the other participant's name
        let otherName = '';
        if (currentUser?.userType === 'doctor') {
          const p = c.patientId;
          otherName = typeof p === 'object' ? (p?.name || '') : '';
        } else {
          const d = c.doctorId;
          otherName = typeof d === 'object' ? (d?.name || '') : '';
        }

        const preview = c.lastMessage?.content || '';
        return (
          otherName.toLowerCase().includes(q) ||
          preview.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [conversations, searchQuery, emergencyOnly, currentUser]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setEmergencyOnly(false);
  };

  const handleSelectConversation = (conversation) => {
    if (typeof onSelectConversation === 'function') {
      onSelectConversation(conversation);
    }
  };

  // Unarchive a conversation and refresh the list (Req 9.4)
  const handleUnarchive = async (e, conversationId) => {
    e.stopPropagation(); // prevent selecting the conversation
    await dispatch(unarchiveConversation(conversationId));
    dispatch(fetchConversations({ includeArchived: true }));
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="conversation-skeleton">
        <div className="skeleton-avatar shimmer" />
        <div className="skeleton-content">
          <div className="skeleton-line skeleton-name shimmer" />
          <div className="skeleton-line skeleton-preview shimmer" />
          <div className="skeleton-line skeleton-meta shimmer" />
        </div>
      </div>
    ));

  const renderEmpty = () => (
    <div className="conversation-list-empty">
      <FaComments className="empty-icon" />
      <p className="empty-title">
        {searchQuery
          ? 'No conversations match your search'
          : activeTab === 'archived'
          ? 'No archived conversations'
          : emergencyOnly
          ? 'No emergency conversations'
          : 'No conversations yet'}
      </p>
      <p className="empty-subtitle">
        {!searchQuery && activeTab === 'active' && !emergencyOnly
          ? 'Start a conversation with your doctor or patient.'
          : ''}
      </p>
    </div>
  );

  return (
    <div className="conversation-list-container">
      {/* Header */}
      <div className="conversation-list-header">
        <h2 className="conversation-list-title">Messages</h2>
        {totalUnreadCount > 0 && (
          <span className="conversation-list-total-unread">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="conversation-list-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search conversations…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          aria-label="Search conversations"
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="conversation-list-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'active'}
          className={`conversation-list-tab${activeTab === 'active' ? ' active' : ''}`}
          onClick={() => handleTabChange('active')}
        >
          Active
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'archived'}
          className={`conversation-list-tab${activeTab === 'archived' ? ' active' : ''}`}
          onClick={() => handleTabChange('archived')}
        >
          Archived
        </button>
      </div>

      {/* Filters */}
      <div className="conversation-list-filters">
        <button
          className={`emergency-filter-btn${emergencyOnly ? ' active' : ''}`}
          onClick={() => setEmergencyOnly((prev) => !prev)}
          aria-pressed={emergencyOnly}
          title="Show emergency conversations only"
        >
          <FaExclamationTriangle size={12} />
          Emergency Only
        </button>
      </div>

      {/* List */}
      <div className="conversation-list-items" role="list">
        {conversationsLoading ? (
          <div className="conversation-list-loading">{renderSkeletons()}</div>
        ) : filteredConversations.length === 0 ? (
          renderEmpty()
        ) : (
          filteredConversations.map((conversation) => (
            <div key={conversation._id} className="conversation-list-item-wrapper">
              <ConversationListItem
                conversation={conversation}
                currentUser={currentUser}
                presence={presence}
                isActive={conversation._id === activeConversationId}
                onClick={() => handleSelectConversation(conversation)}
              />
              {/* Unarchive button — only shown in the archived tab (Req 9.4) */}
              {activeTab === 'archived' && (
                <button
                  className="conversation-unarchive-btn"
                  onClick={(e) => handleUnarchive(e, conversation._id)}
                  title="Unarchive conversation"
                  aria-label="Unarchive conversation"
                >
                  <FaInbox size={12} />
                  <span>Unarchive</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
