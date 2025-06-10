
import { Brain } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        {/* Logo and Welcome */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/10 rounded-full">
            <Brain className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Think Tank AI Assistant
          </h1>
          <p className="text-sm text-gray-500 font-medium">Cape Town | Johannesburg</p>
          <p className="text-lg text-gray-600">
            I'm your Think Tank AI assistant. I can help you search our knowledge base, resolve service desk issues, and find solutions from our integrated data sources.
          </p>
        </div>

        {/* Business Owner */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Business Owner: Raaziq Gamieldien
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
