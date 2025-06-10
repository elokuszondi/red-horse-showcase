
import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Brain, Clock, FileText, Code, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KnowledgeSidebarProps {
  open: boolean;
  onClose: () => void;
}

const knowledgeCategories = [
  {
    id: 'recent',
    title: 'Recently Used',
    icon: Clock,
    items: [
      'React Best Practices',
      'TypeScript Interfaces',
      'API Integration Patterns',
    ],
  },
  {
    id: 'development',
    title: 'Development',
    icon: Code,
    items: [
      'React Hooks',
      'State Management',
      'Component Architecture',
      'Performance Optimization',
      'Testing Strategies',
    ],
  },
  {
    id: 'documentation',
    title: 'Documentation',
    icon: FileText,
    items: [
      'API Reference',
      'Style Guide',
      'Design System',
      'Deployment Guide',
    ],
  },
  {
    id: 'learning',
    title: 'Learning Resources',
    icon: BookOpen,
    items: [
      'Tutorials',
      'Best Practices',
      'Code Examples',
      'Video Guides',
    ],
  },
];

const KnowledgeSidebar: React.FC<KnowledgeSidebarProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['recent']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = knowledgeCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0 || searchQuery === '');

  return (
    <>
      <div className={`
        fixed lg:relative top-0 left-0 h-full bg-gray-50 border-r border-gray-200 z-50
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-80 lg:w-80
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-gray-900">Knowledge Base</h2>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-all-smooth"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto chat-scrollbar p-4 space-y-2">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              const isExpanded = expandedCategories.includes(category.id);

              return (
                <div key={category.id} className="space-y-1">
                  <Button
                    variant="ghost"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full justify-start p-2 h-auto hover:bg-gray-100 transition-all-smooth"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{category.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </Button>

                  {isExpanded && (
                    <div className="ml-6 space-y-1 animate-fade-in">
                      {category.items.map((item, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start p-2 h-auto text-left text-gray-700 hover:bg-blue-50 hover:text-primary transition-all-smooth"
                        >
                          <span className="text-sm">{item}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <p className="text-xs text-gray-500 text-center">
              Future: Document upload & search
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default KnowledgeSidebar;
