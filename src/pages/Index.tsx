
import { useState } from 'react';
import { Menu, History, Settings, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/ChatInterface';
import SavedChatsSidebar from '@/components/SavedChatsSidebar';
import PersistentChatSidebar from '@/components/PersistentChatSidebar';
import SavedChatsPanel from '@/components/SavedChatsPanel';
import KnowledgeSidebar from '@/components/KnowledgeSidebar';
import ThinkTankSidebar from '@/components/ThinkTankSidebar';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import SettingsDialog from '@/components/SettingsDialog';
import Header from '@/components/Header';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'chat' | 'knowledge' | 'thinktank' | 'analytics'>('chat');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const renderSidebar = () => {
    switch (activePanel) {
      case 'chat':
        // Use persistent chat sidebar for authenticated users, legacy for guests
        return user ? (
          <PersistentChatSidebar 
            open={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
        ) : (
          <SavedChatsSidebar 
            open={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
        );
      case 'knowledge':
        return <KnowledgeSidebar className="w-80" />;
      case 'thinktank':
        return <ThinkTankSidebar className="w-80" />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return null;
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex">
            {renderSidebar()}
          </div>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="lg:hidden">
              {renderSidebar()}
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Mobile Header with Menu */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2"
              >
                <Menu className="h-4 w-4" />
                Menu
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={activePanel === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActivePanel('chat')}
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant={activePanel === 'knowledge' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActivePanel('knowledge')}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant={activePanel === 'thinktank' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActivePanel('thinktank')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Panel Navigation */}
            <div className="hidden lg:flex items-center justify-between p-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Button
                  variant={activePanel === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActivePanel('chat')}
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  {user ? 'Chat History' : 'Saved Chats'}
                </Button>
                <Button
                  variant={activePanel === 'knowledge' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActivePanel('knowledge')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Knowledge
                </Button>
                <Button
                  variant={activePanel === 'thinktank' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActivePanel('thinktank')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Think Tank
                </Button>
                <Button
                  variant={activePanel === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActivePanel('analytics')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>

            {/* Chat Interface */}
            {activePanel === 'chat' && <ChatInterface />}
            {activePanel === 'analytics' && <AnalyticsDashboard />}
            {(activePanel === 'knowledge' || activePanel === 'thinktank') && (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    {activePanel === 'knowledge' ? 'Knowledge Base' : 'Think Tank'}
                  </h3>
                  <p className="text-sm">
                    {activePanel === 'knowledge' 
                      ? 'Access your documents and knowledge base here'
                      : 'Advanced AI analytics and insights'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Dialog */}
        <SettingsDialog 
          open={settingsOpen} 
          onOpenChange={setSettingsOpen} 
        />
      </div>
    </AuthWrapper>
  );
};

export default Index;
