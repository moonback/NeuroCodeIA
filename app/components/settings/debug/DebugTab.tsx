import React, { useCallback, useEffect, useState } from 'react';
import { useSettings } from '~/lib/hooks/useSettings';
import { toast } from 'react-toastify';
import { providerBaseUrlEnvKeys } from '~/utils/constants';
import {
  BugAntIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ServerIcon,
  CircleStackIcon,
  GlobeAltIcon,
  CpuChipIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ProviderStatus {
  name: string;
  enabled: boolean;
  isLocal: boolean;
  isRunning: boolean | null;
  error?: string;
  lastChecked: Date;
  responseTime?: number;
  url: string | null;
}

interface SystemInfo {
  os: string;
  browser: string;
  screen: string;
  language: string;
  timezone: string;
  memory: string;
  cores: number;
  deviceType: string;
  colorDepth: string;
  pixelRatio: number;
  online: boolean;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
}

interface IProviderConfig {
  name: string;
  settings: {
    enabled: boolean;
    baseUrl?: string;
  };
}

interface CommitData {
  commit: string;
  version?: string;
}

const connitJson: CommitData = {
  commit: __COMMIT_HASH,
  version: __APP_VERSION,
};

const LOCAL_PROVIDERS = ['Ollama', 'LMStudio', 'OpenAILike'];

const versionHash = connitJson.commit;
const versionTag = connitJson.version;

const GITHUB_URLS = {
  original: 'https://api.github.com/repos/stackblitz-labs/bolt.diy/commits/main',
  fork: 'https://api.github.com/repos/Stijnus/bolt.new-any-llm/commits/main',
  commitJson: async (branch: string) => {
    try {
      const response = await fetch(`https://api.github.com/repos/stackblitz-labs/bolt.diy/commits/${branch}`);
      const data: { sha: string } = await response.json();

      const packageJsonResp = await fetch(
        `https://raw.githubusercontent.com/stackblitz-labs/bolt.diy/${branch}/package.json`,
      );
      const packageJson: { version: string } = await packageJsonResp.json();

      return {
        commit: data.sha.slice(0, 7),
        version: packageJson.version,
      };
    } catch (error) {
      console.log('Failed to fetch local commit info:', error);
      throw new Error('Failed to fetch local commit info');
    }
  },
};

function getSystemInfo(): SystemInfo {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBrowserInfo = (): string => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';

    if (ua.includes('Firefox/')) {
      browser = 'Firefox';
    } else if (ua.includes('Chrome/')) {
      if (ua.includes('Edg/')) {
        browser = 'Edge';
      } else if (ua.includes('OPR/')) {
        browser = 'Opera';
      } else {
        browser = 'Chrome';
      }
    } else if (ua.includes('Safari/')) {
      if (!ua.includes('Chrome')) {
        browser = 'Safari';
      }
    }

    // Extract version number
    const match = ua.match(new RegExp(`${browser}\\/([\\d.]+)`));
    const version = match ? ` ${match[1]}` : '';

    return `${browser}${version}`;
  };

  const getOperatingSystem = (): string => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;

    if (ua.includes('Win')) {
      return 'Windows';
    }

    if (ua.includes('Mac')) {
      if (ua.includes('iPhone') || ua.includes('iPad')) {
        return 'iOS';
      }

      return 'macOS';
    }

    if (ua.includes('Linux')) {
      return 'Linux';
    }

    if (ua.includes('Android')) {
      return 'Android';
    }

    return platform || 'Unknown';
  };

  const getDeviceType = (): string => {
    const ua = navigator.userAgent;

    if (ua.includes('Mobile')) {
      return 'Mobile';
    }

    if (ua.includes('Tablet')) {
      return 'Tablet';
    }

    return 'Desktop';
  };

  // Get more detailed memory info if available
  const getMemoryInfo = (): string => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return `${formatBytes(memory.jsHeapSizeLimit)} (Used: ${formatBytes(memory.usedJSHeapSize)})`;
    }

    return 'Not available';
  };

  return {
    os: getOperatingSystem(),
    browser: getBrowserInfo(),
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    memory: getMemoryInfo(),
    cores: navigator.hardwareConcurrency || 0,
    deviceType: getDeviceType(),

    // Add new fields
    colorDepth: `${window.screen.colorDepth}-bit`,
    pixelRatio: window.devicePixelRatio,
    online: navigator.onLine,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
  };
}

const checkProviderStatus = async (url: string | null, providerName: string): Promise<ProviderStatus> => {
  if (!url) {
    console.log(`[Debug] No URL provided for ${providerName}`);
    return {
      name: providerName,
      enabled: false,
      isLocal: true,
      isRunning: false,
      error: 'No URL configured',
      lastChecked: new Date(),
      url: null,
    };
  }

  console.log(`[Debug] Checking status for ${providerName} at ${url}`);

  const startTime = performance.now();

  try {
    if (providerName.toLowerCase() === 'ollama') {
      // Special check for Ollama root endpoint
      try {
        console.log(`[Debug] Checking Ollama root endpoint: ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'text/plain,application/json',
          },
        });
        clearTimeout(timeoutId);

        const text = await response.text();
        console.log(`[Debug] Ollama root response:`, text);

        if (text.includes('Ollama is running')) {
          console.log(`[Debug] Ollama running confirmed via root endpoint`);
          return {
            name: providerName,
            enabled: false,
            isLocal: true,
            isRunning: true,
            lastChecked: new Date(),
            responseTime: performance.now() - startTime,
            url,
          };
        }
      } catch (error) {
        console.log(`[Debug] Ollama root check failed:`, error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('aborted')) {
          return {
            name: providerName,
            enabled: false,
            isLocal: true,
            isRunning: false,
            error: 'Connection timeout',
            lastChecked: new Date(),
            responseTime: performance.now() - startTime,
            url,
          };
        }
      }
    }

    // Try different endpoints based on provider
    const checkUrls = [`${url}/api/health`, url.endsWith('v1') ? `${url}/models` : `${url}/v1/models`];
    console.log(`[Debug] Checking additional endpoints:`, checkUrls);

    const results = await Promise.all(
      checkUrls.map(async (checkUrl) => {
        try {
          console.log(`[Debug] Trying endpoint: ${checkUrl}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(checkUrl, {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          });
          clearTimeout(timeoutId);

          const ok = response.ok;
          console.log(`[Debug] Endpoint ${checkUrl} response:`, ok);

          if (ok) {
            try {
              const data = await response.json();
              console.log(`[Debug] Endpoint ${checkUrl} data:`, data);
            } catch {
              console.log(`[Debug] Could not parse JSON from ${checkUrl}`);
            }
          }

          return ok;
        } catch (error) {
          console.log(`[Debug] Endpoint ${checkUrl} failed:`, error);
          return false;
        }
      }),
    );

    const isRunning = results.some((result) => result);
    console.log(`[Debug] Final status for ${providerName}:`, isRunning);

    return {
      name: providerName,
      enabled: false,
      isLocal: true,
      isRunning,
      lastChecked: new Date(),
      responseTime: performance.now() - startTime,
      url,
    };
  } catch (error) {
    console.log(`[Debug] Provider check failed for ${providerName}:`, error);
    return {
      name: providerName,
      enabled: false,
      isLocal: true,
      isRunning: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date(),
      responseTime: performance.now() - startTime,
      url,
    };
  }
};

export default function DebugTab() {
  const { providers, isLatestBranch } = useSettings();
  const [activeProviders, setActiveProviders] = useState<ProviderStatus[]>([]);
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [systemInfo] = useState<SystemInfo>(getSystemInfo());
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const updateProviderStatuses = async () => {
    if (!providers) {
      return;
    }

    try {
      const entries = Object.entries(providers) as [string, IProviderConfig][];
      const statuses = await Promise.all(
        entries
          .filter(([, provider]) => LOCAL_PROVIDERS.includes(provider.name))
          .map(async ([, provider]) => {
            const envVarName =
              providerBaseUrlEnvKeys[provider.name].baseUrlKey || `REACT_APP_${provider.name.toUpperCase()}_URL`;

            // Access environment variables through import.meta.env
            let settingsUrl = provider.settings.baseUrl;

            if (settingsUrl && settingsUrl.trim().length === 0) {
              settingsUrl = undefined;
            }

            const url = settingsUrl || import.meta.env[envVarName] || null; // Ensure baseUrl is used
            console.log(`[Debug] Using URL for ${provider.name}:`, url, `(from ${envVarName})`);

            const status = await checkProviderStatus(url, provider.name);

            return {
              ...status,
              enabled: provider.settings.enabled ?? false,
            };
          }),
      );

      setActiveProviders(statuses);
    } catch (error) {
      console.error('[Debug] Failed to update provider statuses:', error);
    }
  };

  useEffect(() => {
    updateProviderStatuses();

    const interval = setInterval(updateProviderStatuses, 30000);

    return () => clearInterval(interval);
  }, [providers]);

  const handleCheckForUpdate = useCallback(async () => {
    if (isCheckingUpdate) {
      return;
    }

    try {
      setIsCheckingUpdate(true);
      setUpdateMessage('Checking for updates...');

      const branchToCheck = isLatestBranch ? 'main' : 'stable';
      console.log(`[Debug] Checking for updates against ${branchToCheck} branch`);

      const latestCommitResp = await GITHUB_URLS.commitJson(branchToCheck);

      const remoteCommitHash = latestCommitResp.commit;
      const currentCommitHash = versionHash;

      if (remoteCommitHash !== currentCommitHash) {
        setUpdateMessage(
          `Update available from ${branchToCheck} branch!\n` +
            `Current: ${currentCommitHash.slice(0, 7)}\n` +
            `Latest: ${remoteCommitHash.slice(0, 7)}`,
        );
      } else {
        setUpdateMessage(`You are on the latest version from the ${branchToCheck} branch`);
      }
    } catch (error) {
      setUpdateMessage('Failed to check for updates');
      console.error('[Debug] Failed to check for updates:', error);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [isCheckingUpdate, isLatestBranch]);

  const handleCopyToClipboard = useCallback(() => {
    const debugInfo = {
      Système: systemInfo,
      Fournisseurs: activeProviders.map((provider) => ({
        nom: provider.name,
        activé: provider.enabled,
        local: provider.isLocal,
        enFonctionnement: provider.isRunning,
        erreur: provider.error,
        dernièreVérification: provider.lastChecked,
        tempsRéponse: provider.responseTime,
        url: provider.url,
      })),
      Version: {
        hash: versionHash.slice(0, 7),
        branche: isLatestBranch ? 'principale' : 'stable',
      },
      Horodatage: new Date().toLocaleString('fr-FR'),
    };

    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2)).then(() => {
      toast.success('Informations de débogage copiées !');
    });
  }, [activeProviders, systemInfo, isLatestBranch]);

  return (
    <div className="space-y-4 p-4">
      {/* En-tête */}
      <div className="bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BugAntIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
            <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Débogage</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-bolt-elements-button-primary-background rounded-lg transition-colors hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              Copier les infos
            </button>
            <button
              onClick={handleCheckForUpdate}
              disabled={isCheckingUpdate}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-bolt-elements-button-primary-background rounded-lg transition-colors
                ${!isCheckingUpdate ? 'hover:bg-bolt-elements-button-primary-backgroundHover' : 'opacity-75 cursor-not-allowed'}
                text-bolt-elements-button-primary-text`}
            >
              <ArrowPathIcon className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              {isCheckingUpdate ? 'Vérification...' : 'Vérifier les mises à jour'}
            </button>
          </div>
        </div>

        {/* Message de mise à jour */}
        {updateMessage && (
          <div className={`rounded-lg p-3 ${
            updateMessage.includes('disponible') 
              ? 'bg-amber-50 border-l-4 border-amber-400 dark:bg-amber-500/10' 
              : 'bg-bolt-elements-surface'
          }`}>
            <p className="text-sm text-bolt-elements-textSecondary whitespace-pre-line">{updateMessage}</p>
            {updateMessage.includes('disponible') && (
              <div className="mt-3 text-sm">
                <p className="font-medium text-bolt-elements-textPrimary">Pour mettre à jour :</p>
                <ol className="list-decimal ml-4 mt-1 space-y-1 text-bolt-elements-textSecondary">
                  <li>
                    Récupérer les changements :
                    <code className="ml-2 px-2 py-0.5 rounded bg-bolt-elements-surface-hover font-mono text-xs">
                      git pull upstream main
                    </code>
                  </li>
                  <li>
                    Installer les dépendances :
                    <code className="ml-2 px-2 py-0.5 rounded bg-bolt-elements-surface-hover font-mono text-xs">
                      pnpm install
                    </code>
                  </li>
                  <li>Redémarrer l'application</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informations Système */}
      <div className="bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ComputerDesktopIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
          <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Informations Système</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoCard
            icon={<CircleStackIcon className="w-4 h-4" />}
            label="Système d'exploitation"
            value={systemInfo.os}
          />
          <InfoCard
            icon={<GlobeAltIcon className="w-4 h-4" />}
            label="Navigateur"
            value={systemInfo.browser}
          />
          <InfoCard
            icon={<ComputerDesktopIcon className="w-4 h-4" />}
            label="Affichage"
            value={`${systemInfo.screen} (${systemInfo.colorDepth})`}
          />
          <InfoCard
            icon={<ServerIcon className="w-4 h-4" />}
            label="Connexion"
            value={
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${systemInfo.online ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={systemInfo.online ? 'text-green-600' : 'text-red-600'}>
                  {systemInfo.online ? 'En ligne' : 'Hors ligne'}
                </span>
              </span>
            }
          />
          <InfoCard
            icon={<CpuChipIcon className="w-4 h-4" />}
            label="Processeur"
            value={`${systemInfo.cores} cœurs`}
          />
          <InfoCard
            icon={<ClockIcon className="w-4 h-4" />}
            label="Fuseau horaire"
            value={systemInfo.timezone}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-bolt-elements-borderColor">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-bolt-elements-textSecondary">Version</span>
              <code className="px-2 py-0.5 rounded bg-bolt-elements-surface-hover text-xs font-mono">
                {versionHash.slice(0, 7)}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-bolt-elements-textTertiary">
                v{versionTag || '0.0.1'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isLatestBranch ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
              }`}>
                {isLatestBranch ? 'développement' : 'stable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* État des Modèles Locaux */}
      <div className="bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ServerIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
          <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">État des Modèles Locaux</h3>
        </div>

        <div className="divide-y divide-bolt-elements-borderColor">
          {activeProviders.map((provider) => (
            <div key={provider.name} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 rounded-md bg-bolt-elements-bg-depth-1 p-1 flex items-center justify-center">
                      <img
                        src={`/icons/${provider.name}.svg`}
                        onError={(e) => {
                          e.currentTarget.src = '/icons/Default.svg';
                        }}
                        alt={provider.name}
                        className="w-5 h-5 dark:invert"
                      />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bolt-elements-bg-depth-2 ${
                      !provider.enabled ? 'bg-gray-400' 
                      : provider.isRunning ? 'bg-green-500' 
                      : 'bg-red-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-bolt-elements-textPrimary">
                        {provider.name}
                      </span>
                      <div className="flex gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          provider.enabled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {provider.enabled ? 'Activé' : 'Désactivé'}
                        </span>
                        {provider.enabled && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            provider.isRunning ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {provider.isRunning ? 'En ligne' : 'Hors ligne'}
                          </span>
                        )}
                      </div>
                    </div>
                    {provider.url && (
                      <p className="text-xs text-bolt-elements-textTertiary mt-0.5 truncate max-w-[300px]">
                        {provider.url}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-bolt-elements-textTertiary">
                  <div>Dernière vérification : {new Date(provider.lastChecked).toLocaleTimeString('fr-FR')}</div>
                  {provider.responseTime && (
                    <div>Temps de réponse : {Math.round(provider.responseTime)}ms</div>
                  )}
                </div>
              </div>

              {provider.error && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 rounded-md p-2">
                  <span className="font-medium">Erreur :</span> {provider.error}
                </div>
              )}
            </div>
          ))}
          {activeProviders.length === 0 && (
            <div className="py-8 text-center text-bolt-elements-textTertiary">
              Aucun modèle local configuré
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-bolt-elements-textTertiary">{icon}</span>
        <span className="text-xs text-bolt-elements-textSecondary">{label}</span>
      </div>
      <div className="text-sm font-medium text-bolt-elements-textPrimary">
        {value}
      </div>
    </div>
  );
}
