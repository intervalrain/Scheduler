import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Calendar } from './components/Calendar';
import { SettingModal } from './components/SettingModal';

const App: React.FC = () => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <AppProvider>
      <div className={`flex flex-col h-screen bg-background ${isDarkMode ? 'dark' : ''}`}>
        <Header 
          onSettingsClick={() => setShowSettingsModal(true)}
          isDarkMode={isDarkMode}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <Calendar />
        </div>
        <SettingModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
        />
      </div>
    </AppProvider>
  );
};

export default App;
