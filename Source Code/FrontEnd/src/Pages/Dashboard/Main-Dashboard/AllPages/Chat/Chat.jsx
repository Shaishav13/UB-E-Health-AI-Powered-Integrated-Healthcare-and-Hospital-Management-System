import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { FaComments, FaUserMd, FaUser, FaPlus, FaSpinner } from "react-icons/fa";
import { MdMarkChatUnread } from "react-icons/md";
import Sidebar from "../../GlobalFiles/Sidebar";
import ConversationList from "../../../../../Components/Chat/ConversationList";
import ChatWindow from "../../../../../Components/Chat/ChatWindow";
import Footer from "../../../../../Components/Footer";
import {
  setActiveConversation,
  clearActiveConversation,
  fetchUnreadCount,
  createConversation,
} from "../../../../../Redux/Chat/action";
import {
  initSocketService,
  connect,
  disconnect,
} from "../../../../../services/socketService";
import "./Chat.css";

const API_URL = "http://127.0.0.1:3001";

function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: token };
}

/**
 * Chat page — two-panel layout with Sidebar.
 *
 * On first load (no conversations yet) the page shows the user's
 * assigned contacts so they can start a conversation:
 *   - Patient  → sees their single assigned doctor
 *   - Doctor   → sees all their assigned patients
 *
 * Requirements: 14.1, 22.2, 22.4, 3.3, 3.4
 */
const Chat = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.data?.user);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [mobileShowWindow, setMobileShowWindow] = useState(false);

  // Assigned contacts state
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsMessage, setContactsMessage] = useState("");
  const [startingChat, setStartingChat] = useState(null); // contactId being initiated

  // ── Socket initialisation ──────────────────────────────────────────────────
  useEffect(() => {
    initSocketService(dispatch);
    connect();
    dispatch(fetchUnreadCount());
    return () => {
      disconnect();
      dispatch(clearActiveConversation());
    };
  }, [dispatch]);

  // ── Fetch assigned contacts ────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    try {
      setContactsLoading(true);
      const res = await axios.get(`${API_URL}/api/chat/assigned-contacts`, {
        headers: authHeader(),
      });
      setContacts(res.data.contacts || []);
      setContactsMessage(res.data.message || "");
    } catch (err) {
      setContactsMessage(
        err.response?.data?.message || "Could not load contacts."
      );
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    dispatch(setActiveConversation(conversation._id));
    setMobileShowWindow(true);
  };

  const handleCloseWindow = () => {
    setMobileShowWindow(false);
    setSelectedConversation(null);
    dispatch(clearActiveConversation());
  };

  /**
   * Start (or open existing) conversation with an assigned contact.
   * Determines doctorId / patientId based on current user's role.
   */
  const handleStartChat = async (contact) => {
    if (!currentUser) return;
    setStartingChat(contact._id);
    try {
      let doctorId, patientId;
      if (currentUser.userType === "patient") {
        doctorId = contact._id;
        patientId = currentUser._id;
      } else {
        doctorId = currentUser._id;
        patientId = contact._id;
      }

      const result = await dispatch(createConversation(doctorId, patientId));
      if (result?.conversation) {
        handleSelectConversation(result.conversation);
      } else if (result?.error) {
        alert(result.message || "Could not start conversation.");
      }
    } catch (err) {
      alert("Could not start conversation. Please try again.");
    } finally {
      setStartingChat(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="chat-page-container">
        <Sidebar />

        <div className="chat-page-content">
          {/* Page header */}
          <div className="chat-page-header">
            <div className="chat-page-header-left">
              <MdMarkChatUnread className="chat-page-header-icon" />
              <div>
                <h1 className="chat-page-title">Messages</h1>
                <p className="chat-page-subtitle">
                  {currentUser?.userType === "doctor"
                    ? "Chat with your assigned patients"
                    : "Chat with your assigned doctor"}
                </p>
              </div>
            </div>
          </div>

          {/* Main chat area */}
          <div className="chat-page-body">
            {/* ── Assigned contacts panel ─────────────────────────────────── */}
            <div className="chat-contacts-panel">
              <div className="chat-contacts-header">
                <h2 className="chat-contacts-title">
                  {currentUser?.userType === "doctor"
                    ? "My Patients"
                    : "My Doctor"}
                </h2>
                <span className="chat-contacts-subtitle">
                  {currentUser?.userType === "doctor"
                    ? "Start a chat with any assigned patient"
                    : "Start a chat with your assigned doctor"}
                </span>
              </div>

              <div className="chat-contacts-list">
                {contactsLoading ? (
                  <div className="chat-contacts-loading">
                    <FaSpinner className="spin-icon" />
                    <span>Loading contacts…</span>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="chat-contacts-empty">
                    {currentUser?.userType === "doctor" ? (
                      <FaUser size={36} className="chat-contacts-empty-icon" />
                    ) : (
                      <FaUserMd size={36} className="chat-contacts-empty-icon" />
                    )}
                    <p className="chat-contacts-empty-text">
                      {contactsMessage ||
                        (currentUser?.userType === "patient"
                          ? "You have no assigned doctor yet. Please book an appointment first."
                          : "No patients assigned to you yet.")}
                    </p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact._id} className="chat-contact-card">
                      {/* Avatar */}
                      <div className="chat-contact-avatar">
                        {contact.profilePicture ? (
                          <img
                            src={contact.profilePicture}
                            alt={contact.name}
                            className="chat-contact-avatar-img"
                          />
                        ) : (
                          <span className="chat-contact-avatar-letter">
                            {contact.name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="chat-contact-info">
                        <div className="chat-contact-name">
                          {contact.role === "doctor" ? "Dr. " : ""}
                          {contact.name}
                        </div>
                        <div className="chat-contact-meta">
                          {contact.role === "doctor" ? (
                            <>
                              <FaUserMd size={11} />
                              <span>{contact.department || "Doctor"}</span>
                            </>
                          ) : (
                            <>
                              <FaUser size={11} />
                              <span>
                                {contact.gender
                                  ? `${contact.gender}, ${contact.age} yrs`
                                  : "Patient"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Start chat button */}
                      <button
                        className="chat-contact-btn"
                        onClick={() => handleStartChat(contact)}
                        disabled={startingChat === contact._id}
                        title={`Start chat with ${contact.name}`}
                        aria-label={`Start chat with ${contact.name}`}
                      >
                        {startingChat === contact._id ? (
                          <FaSpinner className="spin-icon" size={14} />
                        ) : (
                          <>
                            <FaPlus size={11} />
                            <span>Chat</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Conversation list + chat window ─────────────────────────── */}
            <div className="chat-main-area">
              {/* Conversation list */}
              <div
                className={
                  "chat-list-panel" +
                  (mobileShowWindow ? " chat-list-panel-hidden" : "")
                }
              >
                <ConversationList
                  onSelectConversation={handleSelectConversation}
                  activeConversationId={selectedConversation?._id}
                />
              </div>

              {/* Chat window */}
              <div
                className={
                  "chat-window-panel" +
                  (mobileShowWindow ? " chat-window-panel-visible" : "")
                }
              >
                {selectedConversation ? (
                  <ChatWindow
                    conversation={selectedConversation}
                    onClose={handleCloseWindow}
                  />
                ) : (
                  <div className="chat-window-placeholder">
                    <FaComments size={56} className="chat-placeholder-icon" />
                    <h3 className="chat-placeholder-title">
                      Select a conversation
                    </h3>
                    <p className="chat-placeholder-text">
                      Choose an existing conversation from the list, or start a
                      new one using the contacts panel on the left.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Chat;
