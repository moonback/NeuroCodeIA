import React, { useState, useEffect, useRef } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { ProviderInfo } from '~/types/model';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

// Correspondance entre les fournisseurs et leurs variables d'environnement
const ENV_API_KEY_MAP: Record<string, string> = {
  Anthropic: 'ANTHROPIC_API_KEY',
  OpenAI: 'OPENAI_API_KEY',
  xAI: 'XAI_API_KEY',
  Cohere: 'COHERE_API_KEY',
  Google: 'GOOGLE_API_KEY',
  Groq: 'GROQ_API_KEY',
  HuggingFace: 'HUGGINGFACE_API_KEY',
  Deepseek: 'DEEPSEEK_API_KEY',
  Mistral: 'MISTRAL_API_KEY',
  Together: 'TOGETHER_API_KEY',
  OpenRouter: 'OPENROUTER_API_KEY',
};

export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isEnvKeySet, setIsEnvKeySet] = useState(false);
  const [forceEdit, setForceEdit] = useState(false);
  const previousProvider = useRef(provider.name);

  useEffect(() => {
    if (previousProvider.current !== provider.name) {
      setTempKey('');
      setApiKey('');
      setIsEditing(false);
      setForceEdit(false);
      previousProvider.current = provider.name;
    }
  }, [provider.name, setApiKey]);

  useEffect(() => {
    const verifierCleAPI = async () => {
      try {
        const response = await fetch(`/api/check-env-key?provider=${encodeURIComponent(provider.name)}`);
        const data = await response.json();
        setIsEnvKeySet((data as { isSet: boolean }).isSet);
      } catch (error) {
        console.error('Échec de la vérification de la clé API:', error);
        setIsEnvKeySet(false);
      }
    };

    verifierCleAPI();
  }, [provider.name]);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsEditing(false);
    setForceEdit(false);
  };

  return (
    <div className="flex flex-col space-y-3 p-3 rounded-lg bg-bolt-elements-background-depth-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bolt-elements-textSecondary">
            Clé API {provider?.name}
          </span>
          {!isEditing && (
            <div className="flex items-center gap-2">
              {isEnvKeySet && !forceEdit ? (
                <div className="flex items-center gap-2">
                  <div className="i-ph:check-circle-fill text-green-500 w-4 h-4" />
                  <span className="text-xs text-green-500">
                    Définie via {ENV_API_KEY_MAP[provider.name]}
                  </span>
                  <IconButton
                    onClick={() => setForceEdit(true)}
                    title="Remplacer la clé d'environnement"
                    className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 ml-2 rounded-lg"
                  >
                    <div className="i-ph:pencil-simple w-4 h-4" />
                  </IconButton>
                </div>
              ) : apiKey ? (
                <div className="flex items-center gap-2">
                  <div className="i-ph:check-circle-fill text-green-500 w-4 h-4" />
                  <span className="text-xs text-green-500">Définie via l'interface</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="i-ph:x-circle-fill text-red-500 w-4 h-4" />
                  <span className="text-xs text-red-500">
                    Non définie
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(isEditing && !isEnvKeySet) || (isEditing && forceEdit) ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={tempKey}
                placeholder="Saisir la clé API"
                onChange={(e) => setTempKey(e.target.value)}
                className="w-[300px] px-3 py-2 text-sm rounded-lg
                          border border-bolt-elements-borderColor
                          bg-bolt-elements-prompt-background text-bolt-elements-textPrimary
                          focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus
                          hover:border-bolt-elements-focus transition-all"
              />
              <IconButton
                onClick={handleSave}
                title="Enregistrer la clé API"
                className="bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg"
              >
                <div className="i-ph:check w-4 h-4" />
              </IconButton>
              <IconButton
                onClick={() => {
                  setIsEditing(false);
                  setForceEdit(false);
                }}
                title="Annuler"
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg"
              >
                <div className="i-ph:x w-4 h-4" />
              </IconButton>
            </div>
          ) : (
            <>
              {(!isEnvKeySet || forceEdit) && (
                <IconButton
                  onClick={() => setIsEditing(true)}
                  title="Modifier la clé API"
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg"
                >
                  <div className="i-ph:pencil-simple w-4 h-4" />
                </IconButton>
              )}
              {provider?.getApiKeyLink && !isEnvKeySet && (
                <IconButton
                  onClick={() => window.open(provider?.getApiKeyLink)}
                  title="Obtenir une clé API"
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg flex items-center gap-2"
                >
                  <span className="text-xs whitespace-nowrap">
                    {provider?.labelForGetApiKey || 'Obtenir une clé API'}
                  </span>
                  <div className={`${provider?.icon || 'i-ph:key'} w-4 h-4`} />
                </IconButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
