import React, { useState, useEffect, useRef } from 'react';
import { 
  LuMessageSquare, 
  LuGitFork, 
  LuCloudUpload, 
  LuChevronLeft, 
  LuChevronRight,
  LuSettings,
  LuLogOut,
  LuActivity,
  LuDatabase,
  LuBrain,
  LuSparkles,
  LuX,
  LuSun,
  LuMoon,
  LuFolderOpen
} from 'react-icons/lu';
import { useChatContext } from '../../context/ChatContext';
import { useGraphContext } from '../../context/GraphContext';
import './Sidebar.css';

export const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { sendMessage } = useChatContext();
  const { searchGraph, searchQuery } = useGraphContext();
  
  const [localSearch, setLocalSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'info' | 'error'
  
  const searchInputRef = useRef(null);
  const settingsRef = useRef(null);

  // Lấy cấu hình model từ localStorage hoặc mặc định để hiển thị ở RAG status panel
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('shb_selected_model') || '';
  });
  const [deepSearch] = useState(() => {
    return localStorage.getItem('shb_deep_search') === 'true';
  });

  // Quản lý theme sáng/tối
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('shb_app_theme') || 'light';
  });

  // Tải danh sách models động từ API để hiển thị nhãn chính xác ở Sidebar
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 
          (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:8000'
            : 'https://api.compliance.shb.com.vn');
            
        const response = await fetch(`${baseUrl}/models`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.models) {
            setAvailableModels(data.models);
          }
        }
      } catch (error) {
        console.warn('Sidebar không thể kết nối API /models:', error);
      }
    };
    fetchModels();
  }, []);

  const getModelLabel = (modelId) => {
    const found = availableModels.find(m => m.id === modelId);
    if (found) {
      return found.label.split('·')[0].trim();
    }
    return modelId === '' ? 'Mặc định' : 'Mặc định';
  };

  // Đồng bộ theme với body tag
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('shb_app_theme', theme);
  }, [theme]);

  // Đồng bộ model khi có thay đổi từ phía ChatInput
  useEffect(() => {
    const handleStorageUpdate = () => {
      setSelectedModel(localStorage.getItem('shb_selected_model') || '');
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('local-storage-update', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('local-storage-update', handleStorageUpdate);
    };
  }, []);

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
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('chat');
        showToast('Đã chuyển sang AI Chatbot', 'info');
      }
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('graph');
        showToast('Đã chuyển sang Đồ thị Tri thức', 'info');
      }
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        setActiveTab('admin');
        showToast('Đã chuyển sang Quản trị văn bản', 'info');
      }
      if (e.altKey && e.key === '4') {
        e.preventDefault();
        setActiveTab('documents');
        showToast('Đã chuyển sang Kho Tài liệu', 'info');
      }
      if (e.altKey && e.key === '5') {
        e.preventDefault();
        setActiveTab('evaluation');
        showToast('Đã chuyển sang Đánh giá hiệu năng', 'info');
      }
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
    if (activeTab === 'graph') {
      searchGraph(val);
    }
  };

  // Xử lý gửi câu hỏi nhanh từ Sidebar sang Chatbot
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && localSearch.trim()) {
      e.preventDefault();
      sendMessage(localSearch);
      setActiveTab('chat');
      showToast('Đã gửi câu hỏi tới AI Chatbot', 'success');
      setLocalSearch('');
      if (activeTab === 'graph') {
        searchGraph('');
      }
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
  };

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

          <button
            className={`nav-menu-item ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
            title="Kho Tài liệu (⌥4)"
          >
            <div className="nav-item-icon-wrapper">
              <LuFolderOpen />
            </div>
            {!isCollapsed && <span className="nav-item-label">Kho Tài liệu</span>}
            {!isCollapsed && <span className="nav-item-shortcut">⌥4</span>}
          </button>

          <button
            className={`nav-menu-item ${activeTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluation')}
            title="Đánh giá Hiệu năng (⌥5)"
          >
            <div className="nav-item-icon-wrapper">
              <LuActivity />
            </div>
            {!isCollapsed && <span className="nav-item-label">Đánh giá RAG</span>}
            {!isCollapsed && <span className="nav-item-shortcut">⌥5</span>}
          </button>
        </nav>
      </div>

      {/* Interactive Settings Popover (Chỉ giữ chức năng Đăng xuất và cấu hình profile RM) */}
      {showSettings && (
        <div className="settings-popover panel signature-reveal" ref={settingsRef}>
          <div className="popover-header">
            <span className="popover-title">Quản lý Tài khoản RM</span>
            <button className="popover-close-btn" onClick={() => setShowSettings(false)}>
              <LuX />
            </button>
          </div>
          
          <div className="popover-section text-center">
            <div className="user-profile-avatar-large">RM</div>
            <h3 className="user-profile-name-large">Nguyễn Văn An</h3>
            <p className="user-profile-role-large">Chuyên viên Quan hệ Khách hàng (RM)</p>
            <p className="user-profile-dept-large text-muted">Khối Bán lẻ & Tín dụng - SHB Hội sở</p>
          </div>

          <div className="popover-divider"></div>

          <div className="popover-actions">
            <button className="popover-action-btn danger-action" onClick={() => {
              showToast('Đã đăng xuất tài khoản RM An', 'info');
              setShowSettings(false);
            }}>
              <LuLogOut className="action-icon" />
              <span>Đăng xuất tài khoản</span>
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
                {getModelLabel(selectedModel)}
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
              title="Xem thông tin tài khoản"
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
              title="Xem thông tin tài khoản"
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
    </aside>
  );
};

export default Sidebar;
