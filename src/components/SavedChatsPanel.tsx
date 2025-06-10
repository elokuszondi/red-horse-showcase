
import React, { useState } from 'react';
import { MessageSquare, Search, Trash2, Calendar, MoreVertical, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSavedChats } from '@/contexts/SavedChatsContext';
import { useChatContext } from '@/contexts/ChatContext';
import { sessionManager } from '@/services/sessionManager';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface SavedChatsPanelProps {
  className?: string;
}

const SavedChatsPanel: React.FC<SavedChatsPanelProps> = ({ className = '' }) => {
  const { savedChats, deleteChat, currentChatId } = useSavedChats();
  const { loadConversation } = useChatContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Get sessions from sessionManager for real-time data
  const allSessions = sessionManager.getUserSessions();

  const formatDate = (date: Date | number) => {
    const d = typeof date === 'number' ? new Date(date) : date;
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return d.toLocaleDateString();
  };

  const filteredChats = allSessions.filter(session => 
    session.conversationHistory.length > 0 && 
    (searchTerm === '' || 
     session.conversationHistory[0]?.query.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleChatSelect = async (sessionId: string) => {
    console.log('Loading conversation:', sessionId);
    await loadConversation(sessionId);
  };

  const handleDeleteChat = (sessionId: string) => {
    sessionManager.deleteSession(sessionId);
    deleteChat(sessionId);
  };

  const handleRenameChat = (sessionId: string, newTitle: string) => {
    // This would require extending sessionManager to support renaming
    setEditingChatId(null);
    setEditTitle('');
  };

  const getChatTitle = (session: any) => {
    if (session.conversationHistory.length > 0) {
      const firstQuery = session.conversationHistory[0].query;
      return firstQuery.length > 50 ? firstQuery.substring(0, 50) + '...' : firstQuery;
    }
    return 'New Conversation';
  };

  return (
    <div className={`h-full flex flex-col bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Chat History</h2>
        
        {/* Search */}
        <div className="relative">
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
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No saved conversations yet</p>
            <p className="text-xs mt-1">Start chatting to see history here</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredChats.map((session) => (
              <div
                key={session.id}
                className={`group p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  sessionManager.getCurrentSession()?.id === session.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => handleChatSelect(session.id)}
                  >
                    {editingChatId === session.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRenameChat(session.id, editTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameChat(session.id, editTitle);
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
                        {getChatTitle(session)}
                      </h3>
                    )}
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDate(session.lastActivity)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {session.conversationHistory.length} exchange{session.conversationHistory.length !== 1 ? 's' : ''}
                    </p>
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
                          setEditingChatId(session.id);
                          setEditTitle(getChatTitle(session));
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteChat(session.id)}
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
  );
};

export default SavedChatsPanel;
