
import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import SavedChatsSidebar from '@/components/SavedChatsSidebar';
import Header from '@/components/Header';
import { ChatProvider } from '@/contexts/ChatContext';
import { SavedChatsProvider } from '@/contexts/SavedChatsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

const Index = () => {
  return (
    <AuthProvider>
      <AuthWrapper>
        <SavedChatsProvider>
          <ChatProvider>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                {/* Main App Sidebar using shadcn */}
                <AppSidebar />
                
                {/* Main Content Area */}
                <SidebarInset className="flex-1">
                  <div className="flex flex-col h-full">
                    <Header />
                    <ChatInterface />
                  </div>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </ChatProvider>
        </SavedChatsProvider>
      </AuthWrapper>
    </AuthProvider>
  );
};

export default Index;
