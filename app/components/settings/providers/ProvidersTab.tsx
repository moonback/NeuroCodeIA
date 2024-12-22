import React, { useEffect, useState } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { LOCAL_PROVIDERS, URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
import type { IProviderConfig } from '~/types/model';
import { logStore } from '~/lib/stores/logs';
import { motion } from 'framer-motion';
import DefaultIcon from '/icons/Default.svg';
import { providerBaseUrlEnvKeys } from '~/utils/constants';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProvidersTab() {
  const { providers, updateProviderSettings, isLocalModel } = useSettings();
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);

  useEffect(() => {
    let newFilteredProviders = Object.entries(providers)
      .map(([key, value]) => ({
        ...value,
        name: key,
      }))
      .filter((provider) =>
        !searchTerm ||
        provider.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (!isLocalModel) {
      newFilteredProviders = newFilteredProviders.filter(
        (provider) => !LOCAL_PROVIDERS.includes(provider.name)
      );
    }

    newFilteredProviders.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredProviders(newFilteredProviders);
  }, [providers, searchTerm, isLocalModel]);

  const renderProviderCard = (provider: IProviderConfig) => {
    const envBaseUrlKey = providerBaseUrlEnvKeys[provider.name].baseUrlKey;
    const envBaseUrl = envBaseUrlKey ? import.meta.env[envBaseUrlKey] : undefined;
    const isUrlConfigurable = URL_CONFIGURABLE_PROVIDERS.includes(provider.name);

    return (
      <motion.div
        variants={itemVariants}
        key={provider.name}
        className="provider-card relative"
        onMouseEnter={() => setHoveredProvider(provider.name)}
        onMouseLeave={() => setHoveredProvider(null)}
      >
        <div className={`
          flex flex-col bg-bolt-elements-background-depth-2
          p-6 rounded-xl border transition-all duration-200
          ${hoveredProvider === provider.name
            ? 'border-bolt-elements-focus shadow-lg transform scale-[1.02]'
            : 'border-bolt-elements-borderColor'
          }
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={`/icons/${provider.name}.svg`}
                  onError={(e) => { e.currentTarget.src = DefaultIcon }}
                  alt={`${provider.name} icon`}
                  className="w-8 h-8 dark:invert transition-transform duration-200 hover:scale-110"
                />
                {provider.settings.enabled && (
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-bolt-elements-background-depth-2"
                    title="Fournisseur actif"
                  />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary">
                  {provider.name}
                </h3>
                {isUrlConfigurable && (
                  <span className="text-xs text-bolt-elements-textTertiary">
                    Configuration personnalisée disponible
                  </span>
                )}
              </div>
            </div>
            <Switch
              className="ml-auto"
              checked={provider.settings.enabled}
              onCheckedChange={(enabled) => {
                updateProviderSettings(provider.name, { ...provider.settings, enabled });
                logStore.logProvider(
                  `Provider ${provider.name} ${enabled ? 'enabled' : 'disabled'}`,
                  { provider: provider.name }
                );
              }}
              title={provider.settings.enabled ? 'Désactiver' : 'Activer'}
            />
          </div>

          {isUrlConfigurable && provider.settings.enabled && (
            <div className="mt-2 space-y-2">
              {envBaseUrl && (
                <div className="px-3 py-1.5 bg-green-500/10 rounded-md">
                  <span className="text-xs text-green-500">
                    Configuration .env : {envBaseUrl}
                  </span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm text-bolt-elements-textSecondary">
                  {envBaseUrl ? 'URL personnalisée' : 'URL du service'} :
                </label>
                <input
                  type="text"
                  value={provider.settings.baseUrl || ''}
                  onChange={(e) => {
                    const newBaseUrl = e.target.value.trim() || undefined;
                    updateProviderSettings(provider.name, {
                      ...provider.settings,
                      baseUrl: newBaseUrl
                    });
                    logStore.logProvider(`Base URL updated for ${provider.name}`, {
                      provider: provider.name,
                      baseUrl: newBaseUrl,
                    });
                  }}
                  placeholder={`Entrez l'URL pour ${provider.name}`}
                  className={`
                    w-full px-3 py-2 rounded-lg transition-all duration-200
                    bg-bolt-elements-background-depth-3
                    border border-bolt-elements-borderColor
                    focus:border-bolt-elements-focus focus:ring-1 focus:ring-bolt-elements-focus
                    text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary
                  `}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const regularProviders = filteredProviders.filter(p => !URL_CONFIGURABLE_PROVIDERS.includes(p.name));
  const urlConfigurableProviders = filteredProviders.filter(p => URL_CONFIGURABLE_PROVIDERS.includes(p.name));

  return (
    <div className="p-6 space-y-8">
      <div className="relative">
        <input
          type="search"
          placeholder="Rechercher des fournisseurs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`
            w-full pl-10 pr-4 py-2.5 rounded-xl transition-all duration-200
            bg-bolt-elements-background-depth-3
            border border-bolt-elements-borderColor
            focus:border-bolt-elements-focus focus:ring-1 focus:ring-bolt-elements-focus
            text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary
          `}
        />
        <div className="absolute left-3.5 top-3 text-bolt-elements-textTertiary">
          <div className="i-ph:magnifying-glass" />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {regularProviders.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-bolt-elements-textPrimary">
              Fournisseurs standards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regularProviders.map(renderProviderCard)}
            </div>
          </section>
        )}

        {urlConfigurableProviders.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">
                Fournisseurs expérimentaux
              </h2>
              <p className="mt-2 text-sm text-bolt-elements-textSecondary">
                Ces fournisseurs sont expérimentaux et vous permettent d'exécuter des modèles
                d'IA localement ou de vous connecter à votre propre infrastructure.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {urlConfigurableProviders.map(renderProviderCard)}
            </div>
          </section>
        )}

        {filteredProviders.length === 0 && (
          <div className="text-center py-12 text-bolt-elements-textSecondary">
            Aucun fournisseur trouvé pour "{searchTerm}"
          </div>
        )}
      </motion.div>
    </div>
  );
}
