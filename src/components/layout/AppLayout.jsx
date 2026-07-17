import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWorkspace from '../chat/ChatWorkspace';
import GraphWorkspace from '../graph/GraphWorkspace';
import AdminWorkspace from '../admin/AdminWorkspace';

export const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'graph' | 'admin'

  const renderWorkspace = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatWorkspace />;
      case 'graph':
        return <GraphWorkspace />;
      case 'admin':
        return <AdminWorkspace />;
      default:
        return <ChatWorkspace />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation bar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Content panel */}
      <main className="main-content">
        {renderWorkspace()}
      </main>
    </div>
  );
};

export default AppLayout;
