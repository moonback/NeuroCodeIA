import React, { useEffect, useState } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { LOCAL_PROVIDERS, URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
import type { IProviderConfig } from '~/types/model';
import { logStore } from '~/lib/stores/logs';
import { BeakerIcon, MagnifyingGlassIcon, ServerIcon, CloudIcon, InformationCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { providerBaseUrlEnvKeys } from '~/utils/constants';

const DefaultIcon = '/icons/Default.svg';

const getProviderDescription = (name: string): string => {
  const descriptions: { [key: string]: string } = {
    'OpenAI': 'GPT-3.5, GPT-4',
    'Anthropic': 'Claude 2, Claude Instant',
    'Ollama': 'Modèles locaux',
    'LMStudio': 'Interface locale',
    'OpenAILike': 'Compatible OpenAI',
  };
  return descriptions[name] || 'Service IA';
};

export default function ProvidersTab() {
  const { providers, updateProviderSettings, isLocalModel } = useSettings();
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  useEffect(() => {
    let newFilteredProviders: IProviderConfig[] = Object.entries(providers).map(([key, value]) => ({
      ...value,
      name: key,
    }));

    if (searchTerm && searchTerm.length > 0) {
      newFilteredProviders = newFilteredProviders.filter((provider) =>
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (!isLocalModel) {
      newFilteredProviders = newFilteredProviders.filter((provider) => !LOCAL_PROVIDERS.includes(provider.name));
    }

    newFilteredProviders.sort((a, b) => a.name.localeCompare(b.name));
    const regular = newFilteredProviders.filter((p) => !URL_CONFIGURABLE_PROVIDERS.includes(p.name));
    const urlConfigurable = newFilteredProviders.filter((p) => URL_CONFIGURABLE_PROVIDERS.includes(p.name));
    setFilteredProviders([...regular, ...urlConfigurable]);
  }, [providers, searchTerm, isLocalModel]);

  const renderProviderCard = (provider: IProviderConfig) => {
    const envBaseUrlKey = providerBaseUrlEnvKeys[provider.name].baseUrlKey;
    const envBaseUrl = envBaseUrlKey ? import.meta.env[envBaseUrlKey] : undefined;
    const isUrlConfigurable = URL_CONFIGURABLE_PROVIDERS.includes(provider.name);
    const isExpanded = expandedProvider === provider.name;

    return (
      <div
        key={provider.name}
        className={`provider-card p-3 rounded-lg hover:bg-bolt-elements-bg-depth-3 transition-all border border-bolt-elements-borderColor ${
          isExpanded ? 'bg-bolt-elements-bg-depth-2' : 'bg-bolt-elements-bg-depth-1'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-md bg-bolt-elements-bg-depth-2 p-1 flex items-center justify-center">
              <img
                src={`/icons/${provider.name}.svg`}
                onError={(e) => {
                  e.currentTarget.src = DefaultIcon;
                }}
                alt={`${provider.name} icon`}
                className="w-5 h-5 dark:invert"
              />
            </div>
            {provider.settings.enabled && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-bolt-elements-bg-depth-1" />
            )}
          </div>

          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-bolt-elements-textPrimary truncate">{provider.name}</span>
              <div className="flex items-center gap-1.5">
                {isUrlConfigurable && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 leading-none">
                    Beta
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                  provider.settings.enabled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {provider.settings.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-bolt-elements-textTertiary truncate">
                {getProviderDescription(provider.name)}
              </span>
              {envBaseUrl && (
                <span className="text-[10px] text-green-400 flex items-center gap-1">
                  <ServerIcon className="w-3 h-3" />
                  .env
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpandedProvider(isExpanded ? null : provider.name)}
              className={`p-1 rounded-md hover:bg-bolt-elements-bg-depth-3 text-bolt-elements-textTertiary transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <Switch
              className="ml-auto"
              checked={provider.settings.enabled}
              onCheckedChange={(enabled) => {
                updateProviderSettings(provider.name, { ...provider.settings, enabled });
                logStore.logProvider(`${enabled ? 'Activation' : 'Désactivation'} de ${provider.name}`, { provider: provider.name });
              }}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-bolt-elements-borderColor">
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="flex items-center justify-between px-2 py-1 rounded bg-bolt-elements-bg-depth-1">
                <span className="text-bolt-elements-textSecondary">Type</span>
                <span className="text-bolt-elements-textPrimary font-medium">
                  {isUrlConfigurable ? 'Auto-hébergé' : 'Cloud'}
                </span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 rounded bg-bolt-elements-bg-depth-1">
                <span className="text-bolt-elements-textSecondary">État</span>
                <span className={`font-medium ${provider.settings.enabled ? 'text-green-500' : 'text-gray-500'}`}>
                  {provider.settings.enabled ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            </div>

            {isUrlConfigurable && provider.settings.enabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-bolt-elements-textSecondary">
                    {envBaseUrl ? 'URL personnalisée' : 'URL de base'}
                  </label>
                </div>
                <input
                  type="text"
                  value={provider.settings.baseUrl || ''}
                  onChange={(e) => {
                    const newBaseUrl = e.target.value.trim() || undefined;
                    updateProviderSettings(provider.name, { ...provider.settings, baseUrl: newBaseUrl });
                    logStore.logProvider(`Configuration URL: ${provider.name}`, {
                      provider: provider.name,
                      baseUrl: newBaseUrl,
                    });
                  }}
                  placeholder={`URL pour ${provider.name}`}
                  className="w-full bg-white dark:bg-bolt-elements-background-depth-4 px-2 py-1.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-bolt-elements-focus placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const regularProviders = filteredProviders.filter((p) => !URL_CONFIGURABLE_PROVIDERS.includes(p.name));
  const urlConfigurableProviders = filteredProviders.filter((p) => URL_CONFIGURABLE_PROVIDERS.includes(p.name));

  return (
    <div className="space-y-4 p-4">
      <div className="bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CloudIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
            <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Fournisseurs</h3>
          </div>
          <div className="relative flex-grow max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-bolt-elements-textTertiary" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-bolt-elements-background-depth-4 pl-8 pr-3 py-1.5 text-sm rounded focus:outline-none focus:ring-1 focus:ring-bolt-elements-focus placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {regularProviders.map(renderProviderCard)}
        </div>
      </div>

      {urlConfigurableProviders.length > 0 && (
        <div className="bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BeakerIcon className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Expérimental</h3>
              <p className="text-xs text-amber-500">Configuration avancée requise</p>
            </div>
          </div>

          <div className="space-y-2">
            {urlConfigurableProviders.map(renderProviderCard)}
          </div>
        </div>
      )}
    </div>
  );
}
