import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWorkspace from '../chat/ChatWorkspace';
import GraphWorkspace from '../graph/GraphWorkspace';
import AdminWorkspace from '../admin/AdminWorkspace';

export const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'graph' | 'admin'
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state

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
      </main>
    </div>
  );
};

export default AppLayout;
