
import React, { useState } from 'react';
import { Plus, MessageSquare, Search, Trash2, Calendar, MoreVertical, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePersistentChat } from '@/contexts/PersistentChatContext';
import { useChatContext } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface PersistentChatSidebarProps {
  open: boolean;
  onClose: () => void;
}

const PersistentChatSidebar: React.FC<PersistentChatSidebarProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { 
    chats, 
    currentChatId, 
    createNewChat, 
    loadChat, 
    deleteChat, 
    updateCurrentChatTitle,
    isLoading 
  } = usePersistentChat();
  const { clearMessages } = useChatContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!open || !user) return null;

  const handleNewChat = async () => {
    const newChatId = await createNewChat();
    if (newChatId) {
      clearMessages();
      onClose();
    }
  };

  const handleChatSelect = async (chatId: string) => {
    await loadChat(chatId);
    onClose();
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    await deleteChat(chatId);
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (newTitle.trim() && currentChatId === chatId) {
      await updateCurrentChatTitle(newTitle.trim());
    }
    setEditingChatId(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const filteredChats = chats.filter(chat => 
    searchTerm === '' || 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 z-50 lg:relative lg:z-auto overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={handleNewChat}
            disabled={isLoading}
            className="w-full flex items-center gap-2 justify-start"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          
          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin h-6 w-6 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-sm">Loading chats...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No saved conversations yet</p>
              <p className="text-xs mt-1">Start chatting to see history here</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    currentChatId === chat.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      {editingChatId === chat.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRenameChat(chat.id, editTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameChat(chat.id, editTitle);
                            } else if (e.key === 'Escape') {
                              setEditingChatId(null);
                              setEditTitle('');
                            }
                          }}
                          className="text-sm"
                          autoFocus
                        />
                      ) : (
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {chat.title}
                        </h3>
                      )}
                      
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDate(chat.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingChatId(chat.id);
                            setEditTitle(chat.title);
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteChat(e as any, chat.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PersistentChatSidebar;
