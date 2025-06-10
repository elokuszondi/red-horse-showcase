
import { Brain } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-start gap-3">
        {/* AI Avatar */}
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        
        {/* Typing Animation */}
        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
