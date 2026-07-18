import React, { useState } from 'react';
import { ChatProvider } from './context/ChatContext';
import { GraphProvider } from './context/GraphContext';
import { AdminProvider } from './context/AdminContext';
import AppLayout from './components/layout/AppLayout';
import WelcomeScreen from './components/layout/WelcomeScreen';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <ChatProvider>
      <GraphProvider>
        <AdminProvider>
          {showWelcome ? (
            <WelcomeScreen onEnter={() => setShowWelcome(false)} />
          ) : (
            <AppLayout />
          )}
        </AdminProvider>
      </GraphProvider>
    </ChatProvider>
  );
}

export default App;
