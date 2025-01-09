import React, { useState, useEffect } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { ProviderInfo } from '~/types/model';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

const apiKeyMemoizeCache: { [k: string]: Record<string, string> } = {};

export function getApiKeysFromCookies() {
  try {
    const storedApiKeys = Cookies.get('apiKeys');
    let parsedKeys = {};

    if (storedApiKeys) {
      parsedKeys = apiKeyMemoizeCache[storedApiKeys];

      if (!parsedKeys) {
        parsedKeys = apiKeyMemoizeCache[storedApiKeys] = JSON.parse(storedApiKeys);
      }
    }

    return parsedKeys;
  } catch (error) {
    console.error('Erreur lors de la lecture des clés API:', error);
    return {};
  }
}

export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    validateApiKey(tempKey);
  }, [tempKey]);

  const validateApiKey = (key: string) => {
    if (!key) {
      setIsValid(true);
      setErrorMessage('');
      return;
    }

    // Validation basique de la clé API selon le provider
    let isKeyValid = true;
    let message = '';

    switch (provider.name.toLowerCase()) {
      case 'openai':
        isKeyValid = key.startsWith('sk-') && key.length > 20;
        message = !isKeyValid ? 'La clé OpenAI doit commencer par sk- et avoir au moins 20 caractères' : '';
        break;
      case 'anthropic':
        isKeyValid = key.startsWith('sk-ant-') && key.length > 20;
        message = !isKeyValid ? 'La clé Anthropic doit commencer par sk-ant- et avoir au moins 20 caractères' : '';
        break;
      // Ajoutez d'autres validations spécifiques aux providers ici
    }

    setIsValid(isKeyValid);
    setErrorMessage(message);
  };

  const handleSave = () => {
    if (!isValid) {
      toast.error(errorMessage || 'Clé API invalide');
      return;
    }

    try {
      setApiKey(tempKey);
      setIsEditing(false);
      toast.success('Clé API sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la clé API:', error);
      toast.error('Erreur lors de la sauvegarde de la clé API');
    }
  };

  return (
    <div className="flex items-start sm:items-center mt-2 mb-2 flex-col sm:flex-row">
      <div className="w-full">
        <span className="text-sm text-bolt-elements-textSecondary">Clé API {provider?.name} :</span>
        {!isEditing && (
          <div className="flex items-center mb-4">
            <span className="flex-1 text-xs text-bolt-elements-textPrimary mr-2">
              {apiKey ? '••••••••' : 'Non définie (fonctionnera si définie dans le fichier .env)'}
            </span>
            <IconButton onClick={() => setIsEditing(true)} title="Modifier la clé API">
              <div className="i-ph:pencil-simple" />
            </IconButton>
          </div>
        )}

        {isEditing && (
          <div className="flex flex-col gap-2 w-full mt-2">
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={tempKey}
                placeholder="Votre clé API"
                onChange={(e) => setTempKey(e.target.value)}
                className={`flex-1 px-2 py-1 text-xs lg:text-sm rounded border ${
                  isValid ? 'border-bolt-elements-borderColor' : 'border-red-500'
                } bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus`}
              />
              <IconButton 
                onClick={handleSave} 
                title="Enregistrer la clé API"
                disabled={!isValid && tempKey !== ''}
              >
                <div className="i-ph:check" />
              </IconButton>
              <IconButton onClick={() => {
                setIsEditing(false);
                setTempKey(apiKey);
                setErrorMessage('');
              }} title="Annuler">
                <div className="i-ph:x" />
              </IconButton>
            </div>
            {errorMessage && (
              <span className="text-xs text-red-500">{errorMessage}</span>
            )}
          </div>
        )}
      </div>

      {!isEditing && provider?.getApiKeyLink && (
        <IconButton 
          className="ml-auto" 
          onClick={() => window.open(provider?.getApiKeyLink)} 
          title="Obtenir une clé API"
        >
          <span className="mr-2 text-xs lg:text-sm">{provider?.labelForGetApiKey || 'Obtenir une clé API'}</span>
          <div className={provider?.icon || 'i-ph:key'} />
        </IconButton>
      )}
    </div>
  );
};
