
import React from 'react';
import { User, Star, Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface GuestModePromptProps {
  onDismiss: () => void;
  queryCount: number;
}

const GuestModePrompt: React.FC<GuestModePromptProps> = ({ onDismiss, queryCount }) => {
  const { signInWithGoogle, signInWithMicrosoft } = useAuth();

  const features = [
    { icon: Save, text: 'Save conversation history', available: false },
    { icon: Upload, text: 'Upload your own documents', available: false },
    { icon: Star, text: 'Premium AI features', available: false },
    { icon: User, text: 'Personalized experience', available: false }
  ];

  return (
    <Card className="mx-4 mb-4 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          You're using Guest Mode ({queryCount}/3 queries)
        </CardTitle>
        <CardDescription>
          Sign in to unlock the full Think Tank AI experience
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <feature.icon className={`h-4 w-4 ${feature.available ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={feature.available ? '' : 'line-through'}>{feature.text}</span>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button onClick={signInWithMicrosoft} className="flex-1" size="sm">
            Sign in with Microsoft
          </Button>
          <Button onClick={signInWithGoogle} variant="outline" className="flex-1" size="sm">
            Sign in with Google
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="w-full text-xs text-gray-500"
        >
          Continue as guest
        </Button>
      </CardContent>
    </Card>
  );
};

export default GuestModePrompt;
