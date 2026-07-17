import React from 'react';
import { ChatProvider } from './context/ChatContext';
import { GraphProvider } from './context/GraphContext';
import { AdminProvider } from './context/AdminContext';
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <ChatProvider>
      <GraphProvider>
        <AdminProvider>
          <AppLayout />
        </AdminProvider>
      </GraphProvider>
    </ChatProvider>
  );
}

export default App;
