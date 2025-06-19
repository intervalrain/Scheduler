import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { Header } from './components/Header';
import { CalendarModule } from './components/modules/CalendarModule';
import { GanttModule } from './components/modules/GanttModule';
import { KanbanModule } from './components/modules/KanbanModule';
import { SettingModal } from './components/SettingModal';

const App: React.FC = () => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  const renderModule = () => {
    switch (activeTab) {
      case 'calendar':
        return <CalendarModule />;
      case 'gantt':
        return <GanttModule />;
      case 'kanban':
        return <KanbanModule />;
      default:
        return <CalendarModule />;
    }
  };

  return (
    <AppProvider>
      <div className={`flex flex-col h-screen bg-background ${isDarkMode ? 'dark' : ''}`}>
        <Header 
          onSettingsClick={() => setShowSettingsModal(true)}
          isDarkMode={isDarkMode}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {renderModule()}
        <SettingModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
        />
      </div>
    </AppProvider>
  );
};

export default App;
