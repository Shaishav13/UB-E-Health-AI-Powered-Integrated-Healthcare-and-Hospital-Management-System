import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { FaComments } from "react-icons/fa";
import { MdMarkChatUnread } from "react-icons/md";
import Sidebar from "../../GlobalFiles/Sidebar";
import ConversationList from "../../../../../Components/Chat/ConversationList";
import ChatWindow from "../../../../../Components/Chat/ChatWindow";
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
            {/* ── Conversation list + chat window ─────────────────────────── */}
            <div className="chat-main-area">
              <div className={"chat-list-panel" + (mobileShowWindow ? " chat-list-panel-hidden" : "")}>
                <ConversationList
                  onSelectConversation={handleSelectConversation}
                  activeConversationId={selectedConversation?._id}
                  contacts={contacts}
                  contactsLoading={contactsLoading}
                  onStartChat={handleStartChat}
                />
              </div>

              <div className={"chat-window-panel" + (mobileShowWindow ? " chat-window-panel-visible" : "")}>
                {selectedConversation ? (
                  <ChatWindow conversation={selectedConversation} onClose={handleCloseWindow} />
                ) : (
                  <div className="chat-window-placeholder">
                    <FaComments size={48} className="chat-placeholder-icon" />
                    <h3 className="chat-placeholder-title">Select a conversation</h3>
                    <p className="chat-placeholder-text">
                      Choose a conversation from the list, or use <strong>+ New</strong> to start one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
