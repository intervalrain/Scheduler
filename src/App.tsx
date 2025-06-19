import React, { useState } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { Header } from './components/Header';
import { CalendarModule } from './components/modules/CalendarModule';
import { GanttModule } from './components/modules/GanttModule';
import { KanbanModule } from './components/modules/KanbanModule';
import { SettingModal } from './components/SettingModal';

const AppContent: React.FC = () => {
  const { isDarkMode, setIsDarkMode } = useAppContext();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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
    <div className={`flex flex-col h-screen bg-background ${isDarkMode ? 'dark' : ''}`}>
      <Header 
        onSettingsClick={() => setShowSettingsModal(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {renderModule()}
      <SettingModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
