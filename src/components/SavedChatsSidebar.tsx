
import React from 'react';
import { Plus, MessageSquare, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedChats } from '@/contexts/SavedChatsContext';
import { useChatContext } from '@/contexts/ChatContext';

interface SavedChatsSidebarProps {
  open: boolean;
  onClose: () => void;
}

const SavedChatsSidebar: React.FC<SavedChatsSidebarProps> = ({ open, onClose }) => {
  const { savedChats, currentChatId, loadChat, deleteChat, createNewChat } = useSavedChats();
  const { clearMessages, setMessages } = useChatContext();

  if (!open) return null;

  const handleNewChat = () => {
    createNewChat();
    clearMessages();
    onClose();
  };

  const handleChatSelect = (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      loadChat(chatId);
    }
    onClose();
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

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
            className="w-full flex items-center gap-2 justify-start"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {savedChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No saved chats yet</p>
              <p className="text-xs mt-1">Start a conversation to see it here</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {savedChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    currentChatId === chat.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {chat.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDate(chat.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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

export default SavedChatsSidebar;
