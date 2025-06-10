
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const ModelSelector = ({ selectedModel, onModelChange }: ModelSelectorProps) => {
  const models = [
    { 
      id: 'gpt-4o', 
      name: 'GPT-4o', 
      description: 'Most capable model for complex tasks',
      isDefault: true 
    },
    { 
      id: 'gpt-4o-mini', 
      name: 'GPT-4o Mini', 
      description: 'Faster and more efficient for simple tasks',
      isDefault: false 
    }
  ];

  const selectedModelInfo = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-40">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{selectedModelInfo.name}</span>
              {selectedModelInfo.isDefault && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span>{model.name}</span>
                  {model.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;
