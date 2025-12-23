import React from "react";
import { FaUserMd } from "react-icons/fa";
import { MdNotificationsActive } from "react-icons/md";
import { ImMenu } from "react-icons/im";

const Topbar = ({ onclick }) => {
  return (
    <>
      <style>{`
        .topbar-container {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 28px;
          background: #ffffff;
          border-bottom: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .topbar-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0b6b61;
          letter-spacing: 0.5px;
        }

        .menu-icon {
          font-size: 1.6rem;
          color: #0b6b61;
          cursor: pointer;
          transition: 0.25s ease;
        }
        .menu-icon:hover {
          transform: scale(1.12);
        }

        /* Search Box */
        .topbar-search {
          width: 45%;
          position: relative;
        }
        .topbar-search input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(11, 107, 97, 0.25);
          font-size: 0.95rem;
          background: #f9fafb;
          transition: 0.25s ease;
        }
        .topbar-search input:focus {
          outline: none;
          background: #ffffff;
          border-color: #0b6b61;
          box-shadow: 0 0 0 4px rgba(11,107,97,0.15);
        }

        .icons-area {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .top-icon {
          font-size: 1.6rem;
          color: #0b6b61;
          cursor: pointer;
          transition: 0.25s ease;
        }
        .top-icon:hover {
          transform: scale(1.15);
          filter: drop-shadow(0 0 6px rgba(11,107,97,0.25));
        }

      `}</style>

      <div className="topbar-container">
        
        {/* LEFT SIDE */}
        <div className="topbar-left">
          <ImMenu className="menu-icon" onClick={onclick} />
          <h2 className="topbar-title">E-Health Management Hub</h2>
        </div>

        {/* SEARCH BAR */}
        <div className="topbar-search">
          <input type="text" placeholder="Search patient by Health ID..." />
        </div>

        {/* RIGHT ICON AREA */}
        <div className="icons-area">
          <MdNotificationsActive className="top-icon" />
          <FaUserMd className="top-icon" />
        </div>
      </div>
    </>
  );
};

export default Topbar;
