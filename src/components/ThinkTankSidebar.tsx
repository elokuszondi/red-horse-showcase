
import { X, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThinkTankSidebarProps {
  open: boolean;
  onClose: () => void;
}

const ThinkTankSidebar = ({ open, onClose }: ThinkTankSidebarProps) => {
  if (!open) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 z-50 lg:relative lg:z-auto overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Think Tank Console</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600">
            Sidebar content will be populated with real data from your integrations.
          </p>
        </div>
      </div>
    </>
  );
};

export default ThinkTankSidebar;
