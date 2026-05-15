import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaSearch, FaComments, FaExclamationTriangle, FaInbox, FaPlus, FaUserMd, FaUser, FaSpinner, FaTimes } from 'react-icons/fa';
import { fetchConversations, unarchiveConversation } from '../../Redux/Chat/action';
import ConversationListItem from './ConversationListItem';
import './ConversationList.css';

/**
 * ConversationList
 *
 * Props:
 *   onSelectConversation  — called when a conversation is clicked
 *   activeConversationId  — currently selected conversation _id
 *   contacts              — array of assigned contacts (doctor/patients)
 *   contactsLoading       — bool
 *   onStartChat           — called with a contact to start/open a conversation
 */
const ConversationList = ({
  onSelectConversation,
  activeConversationId,
  contacts = [],
  contactsLoading = false,
  onStartChat,
}) => {
  const dispatch = useDispatch();

  const { conversations, conversationsLoading, presence, totalUnreadCount } =
    useSelector((state) => state.chat);
  const currentUser = useSelector((state) => state.auth?.data?.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived' | 'new'
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [startingChat, setStartingChat] = useState(null);

  useEffect(() => {
    if (activeTab !== 'new') {
      dispatch(fetchConversations({ includeArchived: activeTab === 'archived' }));
    }
  }, [dispatch, activeTab]);

  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];
    let list = conversations;
    if (emergencyOnly) list = list.filter((c) => c.isEmergency);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) => {
        let otherName = '';
        if (currentUser?.userType === 'doctor') {
          const p = c.patientId;
          otherName = typeof p === 'object' ? (p?.name || '') : '';
        } else {
          const d = c.doctorId;
          otherName = typeof d === 'object' ? (d?.name || '') : '';
        }
        const preview = c.lastMessage?.content || '';
        return otherName.toLowerCase().includes(q) || preview.toLowerCase().includes(q);
      });
    }
    return list;
  }, [conversations, searchQuery, emergencyOnly, currentUser]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setEmergencyOnly(false);
  };

  const handleSelectConversation = (conversation) => {
    if (typeof onSelectConversation === 'function') onSelectConversation(conversation);
  };

  const handleUnarchive = async (e, conversationId) => {
    e.stopPropagation();
    await dispatch(unarchiveConversation(conversationId));
    dispatch(fetchConversations({ includeArchived: true }));
  };

  const handleStartChat = async (contact) => {
    if (!onStartChat) return;
    setStartingChat(contact._id);
    await onStartChat(contact);
    setStartingChat(null);
    // Switch back to active tab after starting chat
    setActiveTab('active');
  };

  const renderSkeletons = () =>
    Array.from({ length: 4 }).map((_, i) => (
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
          ? 'Use the + New Chat tab to start a conversation.'
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

      {/* Search — only shown on active/archived tabs */}
      {activeTab !== 'new' && (
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
            <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
      )}

      {/* Tabs — Active | Archived | + New Chat */}
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
        <button
          role="tab"
          aria-selected={activeTab === 'new'}
          className={`conversation-list-tab new-chat-tab${activeTab === 'new' ? ' active' : ''}`}
          onClick={() => handleTabChange('new')}
          title="Start a new conversation"
        >
          <FaPlus size={10} />
          New
        </button>
      </div>

      {/* Emergency filter — only on active/archived */}
      {activeTab !== 'new' && (
        <div className="conversation-list-filters">
          <button
            className={`emergency-filter-btn${emergencyOnly ? ' active' : ''}`}
            onClick={() => setEmergencyOnly((prev) => !prev)}
            aria-pressed={emergencyOnly}
            title="Show emergency conversations only"
          >
            <FaExclamationTriangle size={11} />
            Emergency Only
          </button>
        </div>
      )}

      {/* ── New Chat panel ─────────────────────────────────────── */}
      {activeTab === 'new' && (
        <div className="new-chat-panel">
          <div className="new-chat-panel-header">
            <span>
              {currentUser?.userType === 'doctor'
                ? 'Start a chat with an assigned patient'
                : 'Start a chat with your assigned doctor'}
            </span>
            <button
              className="new-chat-close-btn"
              onClick={() => handleTabChange('active')}
              title="Close"
            >
              <FaTimes size={12} />
            </button>
          </div>

          {contactsLoading ? (
            <div className="new-chat-loading">
              <FaSpinner className="spin-icon" />
              <span>Loading…</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="new-chat-empty">
              {currentUser?.userType === 'doctor' ? (
                <FaUser size={28} className="new-chat-empty-icon" />
              ) : (
                <FaUserMd size={28} className="new-chat-empty-icon" />
              )}
              <p>
                {currentUser?.userType === 'patient'
                  ? 'No assigned doctor yet. Book an appointment first.'
                  : 'No patients assigned to you yet.'}
              </p>
            </div>
          ) : (
            <div className="new-chat-contacts">
              {contacts.map((contact) => (
                <div key={contact._id} className="new-chat-contact-row">
                  {/* Avatar */}
                  <div className="new-chat-avatar">
                    {contact.profilePicture ? (
                      <img src={contact.profilePicture} alt={contact.name} />
                    ) : (
                      <span>{contact.name?.charAt(0).toUpperCase() || '?'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="new-chat-contact-info">
                    <div className="new-chat-contact-name">
                      {contact.role === 'doctor' ? 'Dr. ' : ''}{contact.name}
                    </div>
                    <div className="new-chat-contact-meta">
                      {contact.role === 'doctor' ? (
                        <><FaUserMd size={10} /><span>{contact.department || 'Doctor'}</span></>
                      ) : (
                        <><FaUser size={10} /><span>{contact.gender ? `${contact.gender}, ${contact.age} yrs` : 'Patient'}</span></>
                      )}
                    </div>
                  </div>

                  {/* Start button */}
                  <button
                    className="new-chat-start-btn"
                    onClick={() => handleStartChat(contact)}
                    disabled={startingChat === contact._id}
                  >
                    {startingChat === contact._id ? (
                      <FaSpinner className="spin-icon" size={12} />
                    ) : (
                      'Chat'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Conversation list ──────────────────────────────────── */}
      {activeTab !== 'new' && (
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
                {activeTab === 'archived' && (
                  <button
                    className="conversation-unarchive-btn"
                    onClick={(e) => handleUnarchive(e, conversation._id)}
                    title="Unarchive conversation"
                  >
                    <FaInbox size={12} />
                    <span>Unarchive</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationList;
