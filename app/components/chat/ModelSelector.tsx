import type { ProviderInfo } from '~/types/model';
import { useEffect, useMemo, memo } from 'react';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { classNames } from '~/utils/classNames';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
  isProjectOpen?: boolean;
}

const ModelCard = memo(
  ({ modelOption, isSelected, onSelect }: { modelOption: ModelInfo; isSelected: boolean; onSelect: () => void }) => (
    <div
      onClick={onSelect}
      className={classNames(
        'p-3 rounded-lg border cursor-pointer transition-all',
        'hover:border-bolt-elements-focus hover:bg-bolt-elements-background-depth-2',
        {
          'border-bolt-elements-focus bg-bolt-elements-background-depth-2': isSelected,
          'border-bolt-elements-borderColor bg-bolt-elements-prompt-background': !isSelected,
        },
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={classNames(
              'i-ph:robot text-lg',
              isSelected ? 'text-bolt-elements-textPrimary' : 'text-bolt-elements-textTertiary',
            )}
          />
          <div className="flex flex-col">
            <span
              className={classNames(
                'text-sm font-medium',
                isSelected ? 'text-bolt-elements-textPrimary' : 'text-bolt-elements-textSecondary',
              )}
            >
              {modelOption.label}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-bolt-elements-textTertiary">
                <div className="i-ph:token text-sm" />
                <span>{modelOption.maxTokenAllowed.toLocaleString()} tokens</span>
              </div>
            </div>
          </div>
        </div>
        {isSelected && <div className="i-ph:check-circle-fill text-green-500 text-lg" />}
      </div>
    </div>
  ),
);

ModelCard.displayName = 'ModelCard';

const ProviderButton = memo(
  ({
    providerOption,
    isSelected,
    onSelect,
  }: {
    providerOption: ProviderInfo;
    isSelected: boolean;
    onSelect: () => void;
  }) => (
    <div
      onClick={onSelect}
      className={classNames(
        'px-3 py-1.5 rounded-lg border cursor-pointer transition-all inline-flex items-center gap-2',
        'hover:border-bolt-elements-focus hover:bg-bolt-elements-background-depth-2',
        {
          'border-bolt-elements-focus bg-bolt-elements-background-depth-2': isSelected,
          'border-bolt-elements-borderColor bg-bolt-elements-prompt-background': !isSelected,
        },
      )}
    >
      <div
        className={classNames(
          providerOption.icon || 'i-ph:cube',
          'text-lg',
          isSelected ? 'text-bolt-elements-textPrimary' : 'text-bolt-elements-textTertiary',
        )}
      />
      <span
        className={classNames(
          'text-sm',
          isSelected ? 'text-bolt-elements-textPrimary' : 'text-bolt-elements-textSecondary',
        )}
      >
        {providerOption.name}
      </span>
      {isSelected && <div className="i-ph:check-circle-fill text-green-500 text-sm" />}
    </div>
  ),
);

ProviderButton.displayName = 'ProviderButton';

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  isProjectOpen = false,
}: ModelSelectorProps) => {
  useEffect(() => {
    if (providerList.length === 0) {
      return;
    }

    if (provider && !providerList.map((p) => p.name).includes(provider.name)) {
      const firstEnabledProvider = providerList[0];
      setProvider?.(firstEnabledProvider);

      const firstModel = modelList.find((m) => m.provider === firstEnabledProvider.name);

      if (firstModel) {
        setModel?.(firstModel.name);
      }
    }
  }, [providerList, provider, setProvider, modelList, setModel]);

  const filteredModels = useMemo(
    () => [...modelList].filter((e) => e.provider === provider?.name && e.name),
    [modelList, provider?.name],
  );

  if (providerList.length === 0) {
    return (
      <div className="mb-2 p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary">
        <p className="text-center">
          Aucun fournisseur n'est actuellement activé. Veuillez activer au moins un fournisseur dans les paramètres pour
          commencer à utiliser le chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="i-ph:cube-duotone text-lg text-bolt-elements-textSecondary" />
            <label className="text-xs font-medium text-bolt-elements-textSecondary">Fournisseur</label>
          </div>
          {isProjectOpen && (
            <div className="flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
              <div className="i-ph:info text-sm" />
              <span>La possibilité de changer de modèle pendant une conversation sera bientôt disponible</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {providerList.map((providerOption) => (
            <ProviderButton
              key={providerOption.name}
              providerOption={providerOption}
              isSelected={providerOption.name === provider?.name}
              onSelect={() => {
                if (!isProjectOpen && providerOption.name !== provider?.name && setProvider) {
                  setProvider(providerOption);

                  const firstModel = modelList.find((m) => m.provider === providerOption.name);

                  if (firstModel && setModel) {
                    setModel(firstModel.name);
                  }
                }
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="i-ph:brain-duotone text-lg text-bolt-elements-textSecondary" />
            <label className="text-xs font-medium text-bolt-elements-textSecondary">Modèle</label>
          </div>
          {isProjectOpen && (
            <div className="flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
              <div className="i-ph:info text-sm" />
              <span>La possibilité de changer de modèle pendant une conversation sera bientôt disponible</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
          {filteredModels.map((modelOption, index) => (
            <ModelCard
              key={modelOption.name || index}
              modelOption={modelOption}
              isSelected={modelOption.name === model}
              onSelect={() => !isProjectOpen && setModel?.(modelOption.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
