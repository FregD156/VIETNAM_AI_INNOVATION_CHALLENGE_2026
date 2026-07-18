import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWorkspace from '../chat/ChatWorkspace';
import GraphWorkspace from '../graph/GraphWorkspace';
import AdminWorkspace from '../admin/AdminWorkspace';
import DocumentsWorkspace from '../documents/DocumentsWorkspace';
import EvaluationWorkspace from '../evaluation/EvaluationWorkspace';

export const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'graph' | 'admin' | 'documents' | 'evaluation'
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state

  // Lắng nghe sự kiện đổi tab toàn cục để hỗ trợ chuyển hướng liên kết
  React.useEffect(() => {
    const handleTabChange = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  return (
    <div className="app-container">
      {/* Navigation bar with collapse control */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      {/* Content panel hosting transitioned workspaces */}
      <main className="main-content">
        <div className={`workspace-wrapper ${activeTab === 'chat' ? 'active' : ''}`}>
          <ChatWorkspace />
        </div>
        
        <div className={`workspace-wrapper ${activeTab === 'graph' ? 'active' : ''}`}>
          <GraphWorkspace />
        </div>
        
        <div className={`workspace-wrapper ${activeTab === 'admin' ? 'active' : ''}`}>
          <AdminWorkspace />
        </div>

        <div className={`workspace-wrapper ${activeTab === 'documents' ? 'active' : ''}`}>
          <DocumentsWorkspace />
        </div>

        <div className={`workspace-wrapper ${activeTab === 'evaluation' ? 'active' : ''}`}>
          <EvaluationWorkspace />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
