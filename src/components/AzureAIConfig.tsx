
import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Loader2, Shield, Lock, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SecureSecretService from '@/services/secureSecretService';
import ApiConfigService from '@/services/apiConfigService';

interface AzureConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
}

interface AzureAIConfigProps {
  onConfigUpdate: (config: AzureConfig) => void;
}

const AzureAIConfig = ({ onConfigUpdate }: AzureAIConfigProps) => {
  const [config, setConfig] = useState<AzureConfig>({
    endpoint: 'https://43931-mb7vprdo-swedencentral.openai.azure.com/',
    apiKey: '',
    deploymentName: 'o4-mini'
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useSecureStorage, setUseSecureStorage] = useState(true);
  const [configName, setConfigName] = useState('default');
  const [savedConfigs, setSavedConfigs] = useState<string[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const { toast } = useToast();

  // Load config from storage on mount
  useEffect(() => {
    const loadConfig = async () => {
      if (useSecureStorage) {
        try {
          const storedConfig = await SecureSecretService.retrieveSecret('azure_ai_config');
          if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            setConfig(prev => ({ ...prev, ...parsed }));
            return;
          }
        } catch (error) {
          console.log('Secure storage not available, falling back to localStorage');
          setUseSecureStorage(false);
        }
      }

      // Fallback to localStorage for manual storage
      try {
        const stored = localStorage.getItem('azure-ai-config');
        if (stored) {
          const parsed = JSON.parse(stored);
          setConfig(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error('Failed to load config from localStorage:', error);
      }
    };

    loadConfig();
    loadSavedConfigs();
  }, [useSecureStorage]);

  const loadSavedConfigs = async () => {
    if (useSecureStorage) {
      try {
        const result = await ApiConfigService.listApiConfigs();
        if (result.success && result.data) {
          setSavedConfigs(result.data.map((config: any) => config.config_name));
        }
      } catch (error) {
        console.error('Failed to load saved configs:', error);
      }
    }
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('azure-ai-config', JSON.stringify(config));
      onConfigUpdate(config);
      setIsOpen(false);
      toast({
        title: "Configuration Saved",
        description: "Your Azure AI configuration has been saved locally."
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration to local storage",
        variant: "destructive"
      });
    }
  };

  const saveToSecureStorage = async () => {
    setIsLoading(true);
    
    try {
      if (configName) {
        // Save via Edge Function
        const result = await ApiConfigService.saveApiConfig({
          configName,
          apiKey: config.apiKey,
          endpointUrl: config.endpoint
        });

        if (result.success) {
          onConfigUpdate(config);
          setIsOpen(false);
          loadSavedConfigs();
          toast({
            title: "Configuration Saved",
            description: `Configuration "${configName}" has been saved securely.`
          });
        } else {
          throw new Error(result.error || 'Failed to save configuration');
        }
      } else {
        // Fallback to old method
        const result = await SecureSecretService.storeSecret({
          secret: JSON.stringify(config),
          keyName: 'azure_ai_config'
        });

        if (result.success) {
          onConfigUpdate(config);
          setIsOpen(false);
          toast({
            title: "Configuration Saved",
            description: "Your Azure AI configuration has been saved securely."
          });
        } else {
          throw new Error(result.error || 'Failed to save configuration');
        }
      }
    } catch (error) {
      console.error('Secure save error:', error);
      toast({
        title: "Secure Save Failed",
        description: "Failed to save securely. Consider using manual storage instead.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedConfig = async (configName: string) => {
    setIsLoading(true);
    try {
      const result = await ApiConfigService.getApiConfig(configName);
      if (result.success && result.data) {
        setConfig(prev => ({
          ...prev,
          endpoint: result.data.endpoint_url,
          apiKey: result.data.api_key
        }));
        setSelectedConfig(configName);
        toast({
          title: "Configuration Loaded",
          description: `Configuration "${configName}" has been loaded.`
        });
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSavedConfig = async (configName: string) => {
    setIsLoading(true);
    try {
      const result = await ApiConfigService.deleteApiConfig(configName);
      if (result.success) {
        loadSavedConfigs();
        toast({
          title: "Configuration Deleted",
          description: `Configuration "${configName}" has been deleted.`
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.apiKey.trim()) {
      toast({
        title: "Validation Error",
        description: "API Key is required",
        variant: "destructive"
      });
      return;
    }

    if (useSecureStorage) {
      await saveToSecureStorage();
    } else {
      saveToLocalStorage();
    }
  };

  const handleInputChange = (field: keyof AzureConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Azure AI Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Azure AI Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Storage Method Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {useSecureStorage ? (
                <Shield className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {useSecureStorage ? "Secure Storage" : "Manual Storage"}
                </p>
                <p className="text-xs text-gray-500">
                  {useSecureStorage 
                    ? "Encrypted backend storage" 
                    : "Local browser storage"}
                </p>
              </div>
            </div>
            <Switch
              checked={useSecureStorage}
              onCheckedChange={setUseSecureStorage}
              disabled={isLoading}
            />
          </div>

          {/* Secure Storage Section - Only show when secure storage is enabled */}
          {useSecureStorage && (
            <div className="space-y-4 border p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="configName">Configuration Name</Label>
                <Input
                  id="configName"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Enter configuration name"
                  disabled={isLoading}
                />
              </div>

              {savedConfigs.length > 0 && (
                <div className="space-y-2">
                  <Label>Saved Configurations</Label>
                  <Select value={selectedConfig} onValueChange={loadSavedConfig}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedConfigs.map((name) => (
                        <SelectItem key={name} value={name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSavedConfig(name);
                              }}
                              className="h-6 w-6 p-0 ml-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Manual Input Fields - Only show when manual storage is enabled */}
          {!useSecureStorage && (
            <div className="space-y-4 border p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Azure OpenAI Endpoint</Label>
                <Input
                  id="endpoint"
                  value={config.endpoint}
                  onChange={(e) => handleInputChange('endpoint', e.target.value)}
                  placeholder="https://your-resource.openai.azure.com/"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    placeholder="Enter your Azure OpenAI API key"
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                    disabled={isLoading}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deploymentName">Deployment Name</Label>
                <Input
                  id="deploymentName"
                  value={config.deploymentName}
                  onChange={(e) => handleInputChange('deploymentName', e.target.value)}
                  placeholder="o4-mini, gpt-4, etc."
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
          
          {useSecureStorage ? (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              🔒 Your API key will be stored securely using encrypted backend storage.
            </div>
          ) : (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              💾 Your API key will be stored locally in your browser.
            </div>
          )}
          
          <Button onClick={handleSave} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {`Save Configuration ${useSecureStorage ? '(Secure)' : '(Local)'}`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AzureAIConfig;
