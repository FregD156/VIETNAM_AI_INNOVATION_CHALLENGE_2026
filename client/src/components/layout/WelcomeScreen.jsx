import React, { useState } from 'react';
import { LuMessageSquare, LuGitFork, LuCloudUpload, LuSparkles, LuArrowRight, LuShieldAlert } from 'react-icons/lu';
import './WelcomeScreen.css';

export const WelcomeScreen = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleStart = () => {
    setIsExiting(true);
    // Chờ animation fadeOut chạy xong (600ms) rồi chuyển tab
    setTimeout(() => {
      onEnter();
    }, 550);
  };

  return (
    <div className={`welcome-screen-container ${isExiting ? 'exit-fade' : ''}`}>
      {/* Các hạt sáng nền trôi lập lờ đại diện cho các Node tri thức */}
      <div className="glow-particle-bg particle-1"></div>
      <div className="glow-particle-bg particle-2"></div>
      <div className="glow-particle-bg particle-3"></div>

      <div className="welcome-inner-wrapper">
        {/* Logo SHB lớn mang tính tượng trưng: hình vuông ôm trọn hình tròn */}
        <header className="welcome-logo-header animate-pop">
          <div className="logo-square-large">
            <div className="logo-circle-inner-large">
              <span className="logo-text-s">S</span>
            </div>
          </div>
          <div className="welcome-brand-meta">
            <span className="welcome-brand-title">SHB COMPLIANCE</span>
            <span className="welcome-brand-badge">ADVANCED GRAPH-RAG PLATFORM</span>
          </div>
        </header>

        {/* Tiêu đề chính giới thiệu dự án */}
        <section className="welcome-hero-section">
          <h1 className="welcome-main-title">
            Hệ thống Tra cứu & Phân tích Pháp quy <span className="highlight-gradient">Graph-RAG</span>
          </h1>
          <p className="welcome-hero-desc">
            Sự kết hợp đột phá giữa Đồ thị tri thức (Knowledge Graph) và Mô hình ngôn ngữ lớn (RAG) 
            được thiết kế chuyên biệt phục vụ công tác rà soát tuân thủ và tra cứu thông tư tức thì cho Cán bộ nhân viên SHB.
          </p>
        </section>

        {/* 3 Cột giới thiệu 3 tính năng lõi */}
        <section className="welcome-features-grid">
          <div className="feature-intro-card panel interactive delay-1">
            <div className="feature-icon-circle chat-color">
              <LuMessageSquare />
            </div>
            <h3 className="feature-intro-title">Trợ lý RAG Chatbot</h3>
            <p className="feature-intro-desc">
              Tra cứu thông tư, quy trình nội bộ bằng ngôn ngữ tự nhiên. Hỗ trợ ghi âm giọng nói tiếng Việt và đọc câu trả lời tự động.
            </p>
          </div>

          <div className="feature-intro-card panel interactive delay-2">
            <div className="feature-icon-circle graph-color">
              <LuGitFork />
            </div>
            <h3 className="feature-intro-title">Đồ thị Tri thức (KG)</h3>
            <p className="feature-intro-desc">
              Trực quan hóa mạng lưới liên đới giữa các văn bản pháp luật của NHNN và quy chế SHB, tự động cảnh báo xung đột luật chéo.
            </p>
          </div>

          <div className="feature-intro-card panel interactive delay-3">
            <div className="feature-icon-circle admin-color">
              <LuCloudUpload />
            </div>
            <h3 className="feature-intro-title">Quản trị & So khớp</h3>
            <p className="feature-intro-desc">
              Tải lên các tài liệu mới, duyệt cập nhật đồ thị thời gian thực và so sánh thay đổi khác biệt (diff) giữa các phiên bản điều khoản.
            </p>
          </div>
        </section>

        {/* Nút bắt đầu trải nghiệm */}
        <footer className="welcome-action-footer">
          <button className="btn-welcome-start interactive" onClick={handleStart}>
            <LuSparkles className="btn-welcome-sparkle-icon" />
            <span>BẮT ĐẦU TRẢI NGHIỆM</span>
            <LuArrowRight className="btn-welcome-arrow" />
          </button>
          
          <div className="welcome-system-meta monospace">
            <LuShieldAlert className="meta-shield-icon" />
            <span>Chế độ kiểm duyệt tuân thủ tối cao • FPT AI Factory Engine</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WelcomeScreen;
