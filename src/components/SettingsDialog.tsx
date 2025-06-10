
import { useState, useEffect } from 'react';
import { Settings, Moon, Sun } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  notifications: boolean;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

const SettingsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    autoSave: true,
    notifications: true,
    fontSize: 'medium',
    compactMode: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('thinktank-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Apply theme changes to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Apply font size changes
  useEffect(() => {
    const root = document.documentElement;
    
    switch (settings.fontSize) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
      default:
        root.style.fontSize = '16px';
        break;
    }
  }, [settings.fontSize]);

  // Apply compact mode
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [settings.compactMode]);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('thinktank-settings', JSON.stringify(newSettings));
  };

  const handleSave = () => {
    // Settings are already saved on change, just close dialog
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8">
          <Settings className="h-3 w-3" />
          <span className="hidden sm:inline text-xs">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">General</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-save conversations</Label>
                <p className="text-sm text-muted-foreground">Automatically save your conversations</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(value) => handleSettingChange('autoSave', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications about updates</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(value) => handleSettingChange('notifications', value)}
              />
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={settings.theme === 'light' ? 'default' : 'outline'}
                  onClick={() => handleSettingChange('theme', 'light')}
                  className="justify-start h-12"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={settings.theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleSettingChange('theme', 'dark')}
                  className="justify-start h-12"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={settings.theme === 'system' ? 'default' : 'outline'}
                  onClick={() => handleSettingChange('theme', 'system')}
                  className="justify-start h-12"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Font Size</Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value: 'small' | 'medium' | 'large') => handleSettingChange('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact mode</Label>
                <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(value) => handleSettingChange('compactMode', value)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
