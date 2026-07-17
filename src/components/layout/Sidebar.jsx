import React from 'react';
import { LuMessageSquare, LuGitFork, LuCloudUpload } from 'react-icons/lu';
import './Sidebar.css';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* Brand Logo SHB */}
        <div className="brand-logo">
          <div className="logo-icon">S</div>
          <div className="brand-text">
            <span className="brand-name">SHB Graph-RAG</span>
            <span className="brand-sub">Compliance AI</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <LuMessageSquare />
            <span>AI Chatbot Pháp quy</span>
          </button>
          
          <button 
            className={`menu-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <LuGitFork />
            <span>Khám phá Đồ thị</span>
          </button>
          
          <button 
            className={`menu-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <LuCloudUpload />
            <span>Quản trị Văn bản</span>
          </button>
        </nav>
      </div>

      {/* Cán bộ tín dụng / RM Profile (Bank A Brief context) */}
      <div className="sidebar-footer">
        <div className="user-avatar">RM</div>
        <div className="user-info">
          <span className="user-name">Nguyễn Văn An</span>
          <span className="user-role">RM - Phòng Bán lẻ</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
