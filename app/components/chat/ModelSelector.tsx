import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { IconButton } from '~/components/ui/IconButton';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'react-toastify';
import { useLocalStorage } from '~/hooks/useLocalStorage';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
  modelLoading?: string;
  error?: string | null;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  modelLoading,
  error,
}: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [recentModels, setRecentModels] = useLocalStorage<string[]>('recent-models', []);
  const [pinnedModels, setPinnedModels] = useLocalStorage<string[]>('pinned-models', []);

  // Trouver le modèle actuel
  const currentModel = useMemo(() => modelList.find(m => m.name === model), [model, modelList]);

  // Fonction de recherche optimisée
  const searchModel = useCallback((model: ModelInfo, query: string) => {
    const searchLower = query.toLowerCase();
    return model.label.toLowerCase().includes(searchLower) || 
           model.provider?.toLowerCase().includes(searchLower) ||
           model.description?.toLowerCase().includes(searchLower);
  }, []);

  // Filtrer et grouper les modèles avec mémorisation
  const { modelsByProvider, favoriteModels } = useMemo(() => {
    const grouped: Record<string, ModelInfo[]> = {};
    const favorites: ModelInfo[] = [];
    
    modelList.forEach(model => {
      if (model.provider) {
        // Filtrer par recherche si une requête existe
        if (searchQuery && !searchModel(model, searchQuery)) {
          return;
        }

        // Filtrer par provider sélectionné
        if (selectedProvider && model.provider !== selectedProvider) {
          return;
        }

        if (!grouped[model.provider]) {
          grouped[model.provider] = [];
        }
        grouped[model.provider].push(model);

        // Ajouter aux favoris si épinglé ou récent
        if (pinnedModels.includes(model.name) || recentModels.includes(model.name)) {
          favorites.push(model);
        }
      }
    });

    return { 
      modelsByProvider: grouped, 
      favoriteModels: favorites.sort((a, b) => {
        // Prioriser les modèles épinglés
        const aPinned = pinnedModels.includes(a.name);
        const bPinned = pinnedModels.includes(b.name);
        if (aPinned !== bPinned) return bPinned ? 1 : -1;
        
        // Ensuite trier par ordre de récence
        const aIndex = recentModels.indexOf(a.name);
        const bIndex = recentModels.indexOf(b.name);
        return aIndex - bIndex;
      })
    };
  }, [modelList, searchQuery, selectedProvider, pinnedModels, recentModels, searchModel]);

  // Gérer la sélection d'un modèle
  const handleModelSelect = useCallback((p: ProviderInfo, m: ModelInfo) => {
    setProvider?.(p);
    setModel?.(m.name);
    setIsOpen(false);
    
    // Mettre à jour les modèles récents
    setRecentModels((prev: string[]) => {
      const newRecent = [m.name, ...prev.filter((name: string) => name !== m.name)].slice(0, 5);
      return newRecent;
    });
    
    toast.success(`Modèle ${m.label} sélectionné`);
  }, [setProvider, setModel, setRecentModels]);

  // Gérer l'épinglage d'un modèle
  const togglePinModel = useCallback((modelName: string) => {
    setPinnedModels((prev: string[]) => 
      prev.includes(modelName)
        ? prev.filter((name: string) => name !== modelName)
        : [...prev, modelName]
    );
  }, [setPinnedModels]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          setIsOpen(false);
        } else if (e.key === '/' && e.ctrlKey) {
          e.preventDefault();
          const searchInput = document.querySelector<HTMLInputElement>('#model-search');
          searchInput?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  if (error) {
    return (
      <div className="mb-2 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-200">
        <div className="flex items-center gap-2">
          <div className="i-ph:warning-circle text-red-500 w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Bouton de sélection principal avec info-bulle */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative mb-2 flex items-center gap-2 px-3 h-9 text-sm rounded-lg border border-neutral-800 bg-neutral-900 text-white hover:border-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-700 transition-all duration-300"
        title="Ctrl + / pour rechercher"
      >
        <div className={`${provider?.icon || 'i-ph:robot'} w-4 h-4 text-neutral-300`} />
        <span className="truncate font-medium text-white">
          {provider?.name || 'Sélectionner'} / {currentModel?.label || 'Modèle'}
        </span>
        {currentModel?.maxTokenAllowed && (
          <span className="text-xs text-neutral-300 ml-2 bg-neutral-800 px-2 py-0.5 rounded">
            {currentModel.maxTokenAllowed.toLocaleString()}t
          </span>
        )}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center bg-neutral-800/90 rounded-lg">
          <span className="text-xs text-white">Cliquer pour changer de modèle</span>
        </div>
      </button>

      {/* Modal de sélection */}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[600px] max-h-[85vh] bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 overflow-hidden z-50">
            <div className="p-6">
              <Dialog.Title className="text-xl font-medium text-white mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="i-ph:brain-duotone text-neutral-300 w-6 h-6" />
                  Sélection du Modèle IA
                </div>
                <div className="text-xs text-neutral-300">
                  Ctrl + / pour rechercher
                </div>
              </Dialog.Title>

              {/* Barre de recherche et filtres */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <input
                    id="model-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un modèle... (Ctrl + /)"
                    className="w-full px-4 py-3 pl-10 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors placeholder-neutral-400"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <div className="i-ph:magnifying-glass text-neutral-400 w-4 h-4" />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <div className="i-ph:x w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filtres par provider avec compteurs */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedProvider(null)}
                    className={`px-4 py-2 text-xs rounded-lg transition-colors flex items-center gap-2 ${
                      !selectedProvider
                        ? 'bg-neutral-700 text-white font-medium'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-750 border border-neutral-700'
                    }`}
                    title="Afficher tous les modèles"
                    aria-label="Afficher tous les modèles"
                  >
                    <div className="i-ph:list text-neutral-300 w-3 h-3" />
                    Tous ({modelList.length})
                  </button>
                  {providerList.map((p) => {
                    const count = modelsByProvider[p.name]?.length || 0;
                    return (
                      <button
                        key={p.name}
                        onClick={() => setSelectedProvider(p.name)}
                        title={`Filtrer les modèles ${p.name}`}
                        aria-label={`Filtrer les modèles ${p.name}`}
                        disabled={count === 0}
                        className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all duration-200 ${
                          selectedProvider === p.name
                            ? 'bg-neutral-700 text-white font-medium shadow-sm'
                            : count === 0 
                              ? 'bg-neutral-800/50 text-neutral-400 cursor-not-allowed opacity-50'
                              : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-750 border border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <div className={`${p.icon || 'i-ph:robot'} w-3 h-3 ${count === 0 ? 'opacity-50' : ''}`} />
                        {p.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favoris et récents */}
              {favoriteModels.length > 0 && !searchQuery && !selectedProvider && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                    <div className="i-ph:star text-neutral-400 w-4 h-4" />
                    Favoris et Récents
                  </div>
                  <div className="grid gap-2">
                    {favoriteModels.map((m) => {
                      const p = providerList.find(p => p.name === m.provider);
                      const isPinned = pinnedModels.includes(m.name);
                      if (!p) return null;
                      return (
                        <div key={m.name} className="relative group">
                          <button
                            onClick={() => handleModelSelect(p, m)}
                            className="w-full flex items-center gap-3 p-4 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-left transition-all duration-200"
                          >
                            <div className={`${p.icon || 'i-ph:robot'} w-4 h-4 text-neutral-300`} />
                            <div className="flex-1">
                              <div className="font-medium text-white">{m.label}</div>
                              <div className="text-xs text-neutral-400">{p.name}</div>
                            </div>
                            {isPinned && (
                              <div className="i-ph:push-pin-fill text-neutral-300 w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => togglePinModel(m.name)}
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title={isPinned ? "Désépingler" : "Épingler"}
                          >
                            <div className={`${isPinned ? 'i-ph:push-pin-slash' : 'i-ph:push-pin'} w-4 h-4 text-neutral-300 hover:text-white`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Liste des modèles avec animations */}
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                {Object.entries(modelsByProvider).map(([providerName, models]) => {
                  const p = providerList.find(p => p.name === providerName);
                  if (!p) return null;

                  return (
                    <div key={providerName} className="space-y-3">
                      <div className="flex items-center gap-2 text-neutral-400 pb-2 border-b border-neutral-900">
                        <div className={`${p.icon || 'i-ph:robot'} w-4 h-4 text-neutral-500`} />
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-neutral-500 ml-auto">
                          {models.length} modèle{models.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {modelLoading === 'all' || modelLoading === p.name ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="i-svg-spinners:90-ring-with-bg text-neutral-400 w-6 h-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {models.map((m) => {
                            const isPinned = pinnedModels.includes(m.name);
                            const isSelected = provider?.name === p.name && model === m.name;
                            return (
                              <div key={m.name} className="relative group">
                                <button
                                  onClick={() => handleModelSelect(p, m)}
                                  className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all duration-200 ${
                                    isSelected
                                      ? 'border-neutral-700 bg-neutral-900 shadow-lg'
                                      : 'border-neutral-900 hover:border-neutral-800 bg-neutral-900 hover:bg-neutral-850'
                                  }`}
                                  aria-selected={isSelected}
                                  role="option"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-neutral-200">
                                      {m.label}
                                    </div>
                                    {m.maxTokenAllowed && (
                                      <div className="text-xs text-neutral-500 mt-2 flex items-center gap-2 bg-neutral-950/50 w-fit px-2 py-1 rounded">
                                        <div className="i-ph:database w-3 h-3" />
                                        {m.maxTokenAllowed.toLocaleString()} tokens max
                                      </div>
                                    )}
                                    {m.description && (
                                      <div className="text-xs text-neutral-400 mt-1 line-clamp-2">
                                        {m.description}
                                      </div>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <div className="i-ph:check-circle-fill text-neutral-400 w-5 h-5" />
                                  )}
                                  {isPinned && (
                                    <div className="i-ph:push-pin-fill text-neutral-400 w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => togglePinModel(m.name)}
                                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={isPinned ? "Désépingler" : "Épingler"}
                                  aria-label={isPinned ? "Désépingler le modèle" : "Épingler le modèle"}
                                >
                                  <div className={`${isPinned ? 'i-ph:push-pin-slash' : 'i-ph:push-pin'} w-4 h-4 text-neutral-400 hover:text-neutral-200`} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {Object.keys(modelsByProvider).length === 0 && (
                  <div className="text-center py-12 text-neutral-500">
                    {searchQuery ? (
                      <>
                        <div className="i-ph:magnifying-glass text-neutral-700 w-12 h-12 mx-auto mb-4" />
                        <p className="mb-4">Aucun modèle ne correspond à votre recherche</p>
                        <p className="text-sm">
                          Suggestions :
                          <ul className="mt-2 space-y-1">
                            <li>• Vérifiez l'orthographe</li>
                            <li>• Utilisez des mots-clés plus généraux</li>
                            <li>• Essayez une autre catégorie</li>
                          </ul>
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="i-ph:robot text-neutral-700 w-12 h-12 mx-auto mb-4" />
                        <p>Aucun modèle disponible</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Pied de modal avec raccourcis */}
              <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center">
                <div className="text-xs text-neutral-400">
                  {currentModel ? (
                    <>
                      Modèle actuel : <span className="text-white">{currentModel.label}</span>
                    </>
                  ) : (
                    'Aucun modèle sélectionné'
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-neutral-400">
                    <kbd className="px-2 py-1 bg-neutral-800 rounded">Esc</kbd> pour fermer
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
