
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your application settings here.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground">Settings panel coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
