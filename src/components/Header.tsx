
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SettingsDialog from '@/components/SettingsDialog';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Left side - Sidebar trigger and compact title */}
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-medium">Think Tank AI</h1>
            <Badge variant="outline" className="text-xs h-5">Assistant</Badge>
          </div>
        </div>

        {/* Center - Status indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Active</span>
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-2">
          <SettingsDialog />
          
          {user && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8">
                <User className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">{user.email}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="flex items-center gap-2 h-8"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
