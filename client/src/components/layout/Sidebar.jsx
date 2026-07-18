import React, { useState, useEffect, useRef } from 'react';
import { 
  LuMessageSquare, 
  LuGitFork, 
  LuCloudUpload, 
  LuChevronLeft, 
  LuChevronRight,
  LuSearch,
  LuSettings,
  LuLogOut,
  LuActivity,
  LuDatabase,
  LuBrain,
  LuSparkles,
  LuTrash2,
  LuCheck,
  LuX,
  LuSun,
  LuMoon
} from 'react-icons/lu';
import { useChatContext } from '../../context/ChatContext';
import { useGraphContext } from '../../context/GraphContext';
import './Sidebar.css';

export const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { sendMessage, clearChat } = useChatContext();
  const { searchGraph, searchQuery, setSearchQuery } = useGraphContext();
  
  const [localSearch, setLocalSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Modal xác nhận
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'info' | 'error'
  
  const searchInputRef = useRef(null);
  const settingsRef = useRef(null);

  // Lấy cấu hình model từ localStorage hoặc mặc định
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('shb_selected_model') || 'shb-core';
  });
  const [deepSearch, setDeepSearch] = useState(() => {
    return localStorage.getItem('shb_deep_search') === 'true';
  });

  // Quản lý theme sáng/tối
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('shb_app_theme') || 'dark';
  });

  // Đồng bộ theme với body tag
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('shb_app_theme', theme);
  }, [theme]);

  // Hiển thị thông báo (toast)
  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 3000);
    return () => clearTimeout(timer);
  };

  // Đồng bộ ô tìm kiếm địa phương với state của GraphContext khi đổi tab
  useEffect(() => {
    if (activeTab === 'graph') {
      setLocalSearch(searchQuery);
    }
  }, [activeTab, searchQuery]);

  // Đóng settings khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bộ lắng nghe phím tắt toàn cục (⌥1, ⌥2, ⌥3 và ⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + 1 -> Chat
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('chat');
        showToast('Đã chuyển sang AI Chatbot', 'info');
      }
      // Alt + 2 -> Graph
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('graph');
        showToast('Đã chuyển sang Đồ thị Tri thức', 'info');
      }
      // Alt + 3 -> Admin
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        setActiveTab('admin');
        showToast('Đã chuyển sang Quản trị văn bản', 'info');
      }
      // Cmd + K hoặc Ctrl + K -> Focus ô tìm kiếm nhanh
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCollapsed(false);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, setIsCollapsed]);

  // Xử lý thay đổi ô tìm kiếm
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    
    // Nếu đang ở tab Graph, tiến hành lọc đồ thị thời gian thực
    if (activeTab === 'graph') {
      searchGraph(val);
    }
  };

  // Xử lý gửi câu hỏi nhanh từ Sidebar sang Chatbot
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && localSearch.trim()) {
      e.preventDefault();
      
      // Gửi tin nhắn qua ChatContext
      sendMessage(localSearch);
      
      // Chuyển sang tab Chat
      setActiveTab('chat');
      
      showToast('Đã gửi câu hỏi tới AI Chatbot', 'success');
      
      // Clear ô tìm kiếm
      setLocalSearch('');
      if (activeTab === 'graph') {
        searchGraph('');
      }
      
      // Blur input
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
  };

  // Lưu cấu hình Model
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    localStorage.setItem('shb_selected_model', modelId);
    window.dispatchEvent(new Event('local-storage-update'));
    showToast(`Đã chuyển sang model ${modelId === 'shb-core' ? 'SHB Core RAG-v2' : modelId === 'gemini-pro' ? 'Gemini 1.5 Pro' : 'Gemini 1.5 Flash'}`, 'success');
  };

  // Lưu cấu hình Deep Search
  const toggleDeepSearch = () => {
    const nextVal = !deepSearch;
    setDeepSearch(nextVal);
    localStorage.setItem('shb_deep_search', String(nextVal));
    showToast(nextVal ? 'Đã bật Chế độ Phân tích Sâu (Deep Graph Search)' : 'Đã tắt Chế độ Phân tích Sâu', 'info');
  };

  // Kích hoạt Modal xác nhận xóa
  const handleQuickClearChat = () => {
    setShowConfirmModal(true);
  };

  const executeClearChat = () => {
    clearChat();
    showToast('Đã xóa sạch lịch sử chat', 'success');
    setShowSettings(false);
    setShowConfirmModal(false);
  };

  // Bấm vào search icon khi đang collapsed
  const handleSearchIconClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  return (
    <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-main">
        {/* Brand Header: Logo & Nút Toggle */}
        <div className="sidebar-brand-header">
          {!isCollapsed ? (
            <div className="brand-wrapper">
              <div className="brand-logo-shb">
                <div className="logo-square">
                  <div className="logo-circle-inner">S</div>
                </div>
              </div>
              <div className="brand-meta">
                <span className="brand-title">SHB Compliance</span>
                <span className="brand-badge-subtitle">RAG KNOWLEDGE BASE</span>
              </div>
            </div>
          ) : (
            <div className="brand-logo-shb collapsed" onClick={() => setIsCollapsed(false)}>
              <div className="logo-square">
                <div className="logo-circle-inner">S</div>
              </div>
            </div>
          )}

          <button 
            className="sidebar-collapse-trigger"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Mở rộng thanh menu (⌥)" : "Thu gọn thanh menu (⌥)"}
          >
            {isCollapsed ? <LuChevronRight /> : <LuChevronLeft />}
          </button>
        </div>

        {/* Smart Search Command Box */}
        <div className="sidebar-search-section">
          {!isCollapsed ? (
            <div className="search-box-wrapper">
              <LuSearch className="search-icon-inside" />
              <input
                ref={searchInputRef}
                type="text"
                className="search-input-field"
                placeholder="Tra cứu..."
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleSearchSubmit}
              />
              <span className="search-shortcut-badge" title="Phím tắt: Cmd+K hoặc Ctrl+K">⌘K</span>
            </div>
          ) : (
            <button 
              className="search-collapsed-btn" 
              onClick={handleSearchIconClick}
              title="Tìm kiếm nhanh (⌘K)"
            >
              <LuSearch />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav-menu">
          <button
            className={`nav-menu-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            title="AI Chatbot Pháp quy (⌥1)"
          >
            <div className="nav-item-icon-wrapper">
              <LuMessageSquare />
            </div>
            {!isCollapsed && <span className="nav-item-label">AI Chatbot Pháp quy</span>}
            {!isCollapsed && <span className="nav-item-shortcut">⌥1</span>}
          </button>

          <button
            className={`nav-menu-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
            title="Khám phá Đồ thị (⌥2)"
          >
            <div className="nav-item-icon-wrapper">
              <LuGitFork />
            </div>
            {!isCollapsed && <span className="nav-item-label">Khám phá Đồ thị</span>}
            {!isCollapsed && <span className="nav-item-shortcut">⌥2</span>}
          </button>

          <button
            className={`nav-menu-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            title="Quản trị Văn bản (⌥3)"
          >
            <div className="nav-item-icon-wrapper">
              <LuCloudUpload />
            </div>
            {!isCollapsed && <span className="nav-item-label">Quản trị Văn bản</span>}
            {!isCollapsed && <span className="nav-item-shortcut">⌥3</span>}
          </button>
        </nav>
      </div>

      {/* Interactive Settings Popover */}
      {showSettings && (
        <div className="settings-popover panel signature-reveal" ref={settingsRef}>
          <div className="popover-header">
            <span className="popover-title">Cấu hình RM & RAG AI</span>
            <button className="popover-close-btn" onClick={() => setShowSettings(false)}>
              <LuX />
            </button>
          </div>
          
          <div className="popover-section">
            <span className="popover-section-label">LỰA CHỌN MODEL AI RAG</span>
            <div className="model-select-group">
              <div 
                className={`model-option ${selectedModel === 'shb-core' ? 'selected' : ''}`}
                onClick={() => handleModelChange('shb-core')}
              >
                <div className="model-option-top">
                  <span className="model-option-name">SHB Core RAG-v2</span>
                  {selectedModel === 'shb-core' && <LuCheck className="check-icon" />}
                </div>
                <span className="model-option-desc">Tối ưu thuật ngữ luật và quy định nội bộ SHB</span>
              </div>

              <div 
                className={`model-option ${selectedModel === 'gemini-pro' ? 'selected' : ''}`}
                onClick={() => handleModelChange('gemini-pro')}
              >
                <div className="model-option-top">
                  <span className="model-option-name">Gemini 1.5 Pro</span>
                  {selectedModel === 'gemini-pro' && <LuCheck className="check-icon" />}
                </div>
                <span className="model-option-desc">Phù hợp lập luận phức tạp và phát hiện mâu thuẫn chéo</span>
              </div>

              <div 
                className={`model-option ${selectedModel === 'gemini-flash' ? 'selected' : ''}`}
                onClick={() => handleModelChange('gemini-flash')}
              >
                <div className="model-option-top">
                  <span className="model-option-name">Gemini 1.5 Flash</span>
                  {selectedModel === 'gemini-flash' && <LuCheck className="check-icon" />}
                </div>
                <span className="model-option-desc">Phản hồi siêu tốc, tóm tắt nội dung văn bản nhanh</span>
              </div>
            </div>
          </div>

          <div className="popover-section">
            <div className="toggle-setting-row">
              <div className="toggle-setting-info">
                <span className="toggle-setting-title">Chế độ phân tích sâu</span>
                <span className="toggle-setting-desc">Mở rộng truy vấn đồ thị sang các nút liên đới cấp 3</span>
              </div>
              <button 
                className={`toggle-switch-btn ${deepSearch ? 'active' : ''}`}
                onClick={toggleDeepSearch}
              >
                <div className="toggle-switch-handle"></div>
              </button>
            </div>
          </div>

          <div className="popover-divider"></div>

          <div className="popover-actions">
            <button 
              className="popover-action-btn danger-action" 
              onClick={handleQuickClearChat}
            >
              <LuTrash2 className="action-icon" />
              <span>Dọn dẹp phiên Chat</span>
            </button>
            <button className="popover-action-btn secondary-action" onClick={() => {
              showToast('Đã đăng xuất tài khoản RM', 'info');
              setShowSettings(false);
            }}>
              <LuLogOut className="action-icon" />
              <span>Đăng xuất (RM An)</span>
            </button>
          </div>
        </div>
      )}

      {/* Intelligent System Status (Di chuyển xuống dưới cùng, trên tên tài khoản) */}
      {!isCollapsed && (
        <div className="system-status-panel bottom-positioned">
          <div className="status-header">
            <span className="status-header-title">HỆ THỐNG PHÁP QUY AI</span>
          </div>
          <div className="status-grid">
            <div className="status-row">
              <LuBrain className="status-row-icon" />
              <span className="status-row-label">RAG Engine:</span>
              <span className="status-row-value monospace text-highlight">
                {selectedModel === 'shb-core' ? 'Core-v2' : selectedModel === 'gemini-pro' ? 'G-Pro' : 'G-Flash'}
              </span>
            </div>
            <div className="status-row">
              <LuDatabase className="status-row-icon" />
              <span className="status-row-label">Graph DB:</span>
              <span className="status-row-value monospace">2.5k nodes</span>
            </div>
            <div className="status-row">
              <LuActivity className="status-row-icon" />
              <span className="status-row-label">Độ trễ RAG:</span>
              <span className="status-row-value monospace">~42ms</span>
            </div>
            {deepSearch && (
              <div className="status-row deep-search-indicator-row">
                <LuSparkles className="status-row-icon glow-orange-icon" />
                <span className="status-row-label text-orange">Phân tích sâu:</span>
                <span className="status-row-value text-orange bold-text">ON</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User RM Profile Footer with Theme Toggle */}
      <div className="sidebar-footer-container">
        <div className="user-profile-summary" onClick={() => !isCollapsed && setShowSettings(!showSettings)}>
          <div className="user-avatar-circle" title="RM Nguyễn Văn An - Khối Bán lẻ SHB">
            RM
          </div>
          {!isCollapsed && (
            <div className="user-details-text">
              <span className="user-display-name">Nguyễn Văn An</span>
              <span className="user-display-role">RM - Khối Bán lẻ SHB</span>
            </div>
          )}
        </div>
        
        {!isCollapsed ? (
          <div className="sidebar-footer-actions">
            {/* Theme Toggle Button */}
            <button 
              className="btn-sidebar-theme-toggle"
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                showToast(`Đã chuyển sang giao diện ${theme === 'dark' ? 'sáng' : 'tối'}`, 'info');
              }}
              title={theme === 'dark' ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            >
              {theme === 'dark' ? <LuSun /> : <LuMoon />}
            </button>
            
            <button 
              className={`btn-sidebar-settings ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
              title="Cấu hình hệ thống"
            >
              <LuSettings />
            </button>
          </div>
        ) : (
          <div className="sidebar-footer-actions collapsed-actions">
            <button 
              className="btn-sidebar-theme-toggle collapsed-theme-btn"
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                showToast(`Đã chuyển sang giao diện ${theme === 'dark' ? 'sáng' : 'tối'}`, 'info');
              }}
              title={theme === 'dark' ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            >
              {theme === 'dark' ? <LuSun /> : <LuMoon />}
            </button>
            <button 
              className={`btn-sidebar-settings collapsed-settings ${showSettings ? 'active' : ''}`}
              onClick={() => {
                setIsCollapsed(false);
                setTimeout(() => setShowSettings(true), 150);
              }}
              title="Cấu hình hệ thống"
            >
              <LuSettings />
            </button>
          </div>
        )}
      </div>

      {/* Custom Toast Notification inside Sidebar */}
      {toastMessage && (
        <div className={`sidebar-toast-notification ${toastType}`}>
          <div className="toast-content-wrapper">
            <span className="toast-message-text">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Common Confirm Modal Overlay */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal-box panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal-title">Xác nhận xóa lịch sử</h3>
            <p className="confirm-modal-text">Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện hiện tại không? Hành động này không thể hoàn tác.</p>
            <div className="confirm-modal-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowConfirmModal(false)}>Hủy</button>
              <button className="btn-confirm-delete" onClick={executeClearChat}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
