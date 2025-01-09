import React, { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { db, deleteById, getAll, setMessages } from '~/lib/persistence';
import { logStore } from '~/lib/stores/logs';
import { classNames } from '~/utils/classNames';
import type { Message } from 'ai';

// Liste des fournisseurs supportés qui peuvent avoir des clés API
const API_KEY_PROVIDERS = [
  'Anthropic',
  'OpenAI', 
  'Google',
  'Groq',
  'HuggingFace',
  'OpenRouter',
  'Deepseek',
  'Mistral',
  'OpenAILike',
  'Together',
  'xAI',
  'Perplexity',
  'Cohere',
  'AzureOpenAI',
  'AmazonBedrock',
] as const;

interface ApiKeys {
  [key: string]: string;
}

export default function DataTab() {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const downloadAsJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAllChats = async () => {
    if (!db) {
      const error = new Error('La base de données n\'est pas disponible');
      logStore.logError('Échec de l\'exportation des conversations - BDD indisponible', error);
      toast.error('La base de données n\'est pas disponible');

      return;
    }

    try {
      const allChats = await getAll(db);
      const exportData = {
        chats: allChats,
        exportDate: new Date().toISOString(),
      };

      downloadAsJson(exportData, `toutes-conversations-${new Date().toISOString()}.json`);
      logStore.logSystem('Conversations exportées avec succès', { count: allChats.length });
      toast.success('Conversations exportées avec succès');
    } catch (error) {
      logStore.logError('Échec de l\'exportation des conversations', error);
      toast.error('Échec de l\'exportation des conversations');
      console.error(error);
    }
  };

  const handleDeleteAllChats = async () => {
    const confirmDelete = window.confirm('Êtes-vous sûr de vouloir supprimer toutes les conversations ? Cette action est irréversible.');

    if (!confirmDelete) {
      return;
    }

    if (!db) {
      const error = new Error('La base de données n\'est pas disponible');
      logStore.logError('Échec de la suppression des conversations - BDD indisponible', error);
      toast.error('La base de données n\'est pas disponible');

      return;
    }

    try {
      setIsDeleting(true);

      const allChats = await getAll(db);
      await Promise.all(allChats.map((chat) => deleteById(db!, chat.id)));
      logStore.logSystem('Toutes les conversations ont été supprimées avec succès', { count: allChats.length });
      toast.success('Toutes les conversations ont été supprimées avec succès');
      navigate('/', { replace: true });
    } catch (error) {
      logStore.logError('Échec de la suppression des conversations', error);
      toast.error('Échec de la suppression des conversations');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportSettings = () => {
    const settings = {
      providers: Cookies.get('providers'),
      isDebugEnabled: Cookies.get('isDebugEnabled'),
      isEventLogsEnabled: Cookies.get('isEventLogsEnabled'),
      isLocalModelsEnabled: Cookies.get('isLocalModelsEnabled'),
      promptId: Cookies.get('promptId'),
      isLatestBranch: Cookies.get('isLatestBranch'),
      commitHash: Cookies.get('commitHash'),
      eventLogs: Cookies.get('eventLogs'),
      selectedModel: Cookies.get('selectedModel'),
      selectedProvider: Cookies.get('selectedProvider'),
      githubUsername: Cookies.get('githubUsername'),
      githubToken: Cookies.get('githubToken'),
      bolt_theme: localStorage.getItem('bolt_theme'),
    };

    downloadAsJson(settings, 'bolt-parametres.json');
    toast.success('Paramètres exportés avec succès');
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);

        Object.entries(settings).forEach(([key, value]) => {
          if (key === 'bolt_theme') {
            if (value) {
              localStorage.setItem(key, value as string);
            }
          } else if (value) {
            Cookies.set(key, value as string);
          }
        });

        toast.success('Paramètres importés avec succès. Veuillez rafraîchir la page pour appliquer les changements.');
      } catch (error) {
        toast.error('Échec de l\'importation des paramètres. Assurez-vous que le fichier est un fichier JSON valide.');
        console.error('Échec de l\'importation des paramètres:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportApiKeyTemplate = () => {
    const template: ApiKeys = {};
    API_KEY_PROVIDERS.forEach((provider) => {
      template[`${provider}_API_KEY`] = '';
    });

    template.OPENAI_LIKE_API_BASE_URL = '';
    template.LMSTUDIO_API_BASE_URL = '';
    template.OLLAMA_API_BASE_URL = '';
    template.TOGETHER_API_BASE_URL = '';

    downloadAsJson(template, 'modele-cles-api.json');
    toast.success('Modèle de clés API exporté avec succès');
  };

  const handleImportApiKeys = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const apiKeys = JSON.parse(e.target?.result as string);
        let importedCount = 0;
        const consolidatedKeys: Record<string, string> = {};

        API_KEY_PROVIDERS.forEach((provider) => {
          const keyName = `${provider}_API_KEY`;

          if (apiKeys[keyName]) {
            consolidatedKeys[provider] = apiKeys[keyName];
            importedCount++;
          }
        });

        if (importedCount > 0) {
          // Stocker toutes les clés API dans un seul cookie au format JSON
          Cookies.set('apiKeys', JSON.stringify(consolidatedKeys));

          // Définir également des cookies individuels pour la rétrocompatibilité
          Object.entries(consolidatedKeys).forEach(([provider, key]) => {
            Cookies.set(`${provider}_API_KEY`, key);
          });

          toast.success(`${importedCount} clé(s) API/URL importée(s) avec succès. Actualisation de la page pour appliquer les changements...`);

          // Recharger la page après un court délai pour permettre de voir le toast
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.warn('Aucune clé API valide trouvée dans le fichier');
        }

        // Définir les URLs de base si elles existent
        ['OPENAI_LIKE_API_BASE_URL', 'LMSTUDIO_API_BASE_URL', 'OLLAMA_API_BASE_URL', 'TOGETHER_API_BASE_URL'].forEach(
          (baseUrl) => {
            if (apiKeys[baseUrl]) {
              Cookies.set(baseUrl, apiKeys[baseUrl]);
            }
          },
        );
      } catch (error) {
        toast.error('Échec de l\'importation des clés API. Assurez-vous que le fichier est un fichier JSON valide.');
        console.error('Échec de l\'importation des clés API:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const processChatData = (
    data: any,
  ): Array<{
    id: string;
    messages: Message[];
    description: string;
    urlId?: string;
  }> => {
    // Gérer le format standard Bolt (conversation unique)
    if (data.messages && Array.isArray(data.messages)) {
      const chatId = crypto.randomUUID();
      return [
        {
          id: chatId,
          messages: data.messages,
          description: data.description || 'Conversation importée',
          urlId: chatId,
        },
      ];
    }

    // Gérer le format d'exportation Bolt (conversations multiples)
    if (data.chats && Array.isArray(data.chats)) {
      return data.chats.map((chat: { id?: string; messages: Message[]; description?: string; urlId?: string }) => ({
        id: chat.id || crypto.randomUUID(),
        messages: chat.messages,
        description: chat.description || 'Conversation importée',
        urlId: chat.urlId,
      }));
    }

    console.error('Aucun format correspondant trouvé pour:', data);
    throw new Error('Format de conversation non supporté');
  };

  const handleImportChats = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];

      if (!file || !db) {
        toast.error('Une erreur est survenue');
        return;
      }

      try {
        const content = await file.text();
        const data = JSON.parse(content);
        const chatsToImport = processChatData(data);

        for (const chat of chatsToImport) {
          await setMessages(db, chat.id, chat.messages, chat.urlId, chat.description);
        }

        logStore.logSystem('Conversations importées avec succès', { count: chatsToImport.length });
        toast.success(`${chatsToImport.length} conversation${chatsToImport.length > 1 ? 's' : ''} importée${chatsToImport.length > 1 ? 's' : ''} avec succès`);
        window.location.reload();
      } catch (error) {
        if (error instanceof Error) {
          logStore.logError('Échec de l\'importation des conversations:', error);
          toast.error('Échec de l\'importation des conversations: ' + error.message);
        } else {
          toast.error('Échec de l\'importation des conversations');
        }

        console.error(error);
      }
    };

    input.click();
  };

  return (
    <div className="p-4 bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-lg mb-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Gestion des données</h3>
        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-bolt-elements-textPrimary mb-2">Historique des conversations</h4>
              <p className="text-sm text-bolt-elements-textSecondary mb-4">Exportez ou supprimez tout votre historique de conversations.</p>
              <div className="flex gap-4">
                <button
                  onClick={handleExportAllChats}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors"
                >
                  Exporter toutes les conversations
                </button>
                <button
                  onClick={handleImportChats}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors"
                >
                  Importer des conversations
                </button>
                <button
                  onClick={handleDeleteAllChats}
                  disabled={isDeleting}
                  className={classNames(
                    'px-4 py-2 bg-bolt-elements-button-danger-background hover:bg-bolt-elements-button-danger-backgroundHover text-bolt-elements-button-danger-text rounded-lg transition-colors',
                    isDeleting ? 'opacity-50 cursor-not-allowed' : '',
                  )}
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer toutes les conversations'}
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-bolt-elements-textPrimary mb-2">Sauvegarde des paramètres</h4>
              <p className="text-sm text-bolt-elements-textSecondary mb-4">
                Exportez vos paramètres dans un fichier JSON ou importez des paramètres depuis un fichier précédemment exporté.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleExportSettings}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors"
                >
                  Exporter les paramètres
                </button>
                <label className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors cursor-pointer">
                  Importer les paramètres
                  <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-bolt-elements-textPrimary mb-2">Gestion des clés API</h4>
              <p className="text-sm text-bolt-elements-textSecondary mb-4">
                Importez des clés API depuis un fichier JSON ou téléchargez un modèle pour remplir vos clés.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleExportApiKeyTemplate}
                  className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors"
                >
                  Télécharger le modèle
                </button>
                <label className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-textPrimary rounded-lg transition-colors cursor-pointer">
                  Importer les clés API
                  <input type="file" accept=".json" onChange={handleImportApiKeys} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}