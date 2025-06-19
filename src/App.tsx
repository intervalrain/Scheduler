import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { UserProvider, useUserContext } from './contexts/UserContext';
import { Header } from './components/Header';
import { CalendarModule } from './components/modules/CalendarModule';
import { GanttModule } from './components/modules/GanttModule';
import { KanbanModule } from './components/modules/KanbanModule';
import { WorkAreaModule } from './components/modules/WorkAreaModule';
import { DashboardModule } from './components/modules/DashboardModule';
import { SettingModal } from './components/SettingModal';

const AppContent: React.FC = () => {
  const { isDarkMode } = useUserContext();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderModule = () => {
    switch (activeTab) {
      case 'calendar':
        return <CalendarModule />;
      case 'gantt':
        return <GanttModule />;
      case 'kanban':
        return <KanbanModule />;
      case 'workarea':
        return <WorkAreaModule />;
      case 'dashboard':
        return <DashboardModule />;
      default:
        return <DashboardModule />;
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
    <UserProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </UserProvider>
  );
};

export default App;
