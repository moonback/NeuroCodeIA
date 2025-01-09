import React, { useEffect, useState } from 'react';
import { Switch } from '~/components/ui/Switch';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { useSettings } from '~/lib/hooks/useSettings';
import { BugAntIcon, BeakerIcon, CodeBracketIcon, CommandLineIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { VoiceSettingsComponent } from './VoiceSettings';

// Interface pour les prompts personnalisés
interface CustomPrompt {
  id: string;
  label: string;
  promptContent: string;
}

// Fonction pour charger les prompts personnalisés depuis le localStorage
const loadCustomPrompts = (): CustomPrompt[] => {
  try {
    const saved = localStorage.getItem('neurocode_custom_templates');
    if (!saved) return [];
    const templates = JSON.parse(saved);
    return templates
      .filter((t: any) => t.category === 'prompts')
      .map((t: any) => ({
        id: t.id,
        label: t.name,
        promptContent: t.promptContent
      }));
  } catch (error) {
    console.error('Erreur lors du chargement des prompts:', error);
    return [];
  }
};

export default function FeaturesTab() {
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const {
    debug,
    enableDebugMode,
    isLocalModel,
    enableLocalModels,
    enableEventLogs,
    isLatestBranch,
    enableLatestBranch,
    promptId,
    setPromptId,
    autoSelectTemplate,
    setAutoSelectTemplate,
    enableContextOptimization,
    contextOptimizationEnabled,
  } = useSettings();

  // Charger les prompts personnalisés au démarrage
  useEffect(() => {
    const loaded = loadCustomPrompts();
    setCustomPrompts(loaded);
  }, []);

  const handleToggle = (enabled: boolean) => {
    enableDebugMode(enabled);
    enableEventLogs(enabled);
  };

  // Combiner les prompts par défaut avec les prompts personnalisés
  const allPrompts = [...PromptLibrary.getList(), ...customPrompts];

  return (
    <div className="space-y-6">
      {/* Section Fonctionnalités Principales */}
      <div className="bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <CodeBracketIcon className="w-6 h-6 text-bolt-elements-textSecondary" />
          <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">Fonctionnalités Optionnelles</h3>
        </div>

        <div className="space-y-6">
          {/* Débogage */}
          <div className="feature-card p-4 rounded-lg bg-bolt-elements-bg-depth-1 hover:bg-bolt-elements-bg-depth-3 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BugAntIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
                <span className="text-bolt-elements-textPrimary font-medium">Fonctionnalités de Débogage</span>
              </div>
              <Switch className="ml-auto" checked={debug} onCheckedChange={handleToggle} />
            </div>
          </div>

          {/* Branche Principale */}
          <div className="feature-card p-4 rounded-lg bg-bolt-elements-bg-depth-1 hover:bg-bolt-elements-bg-depth-3 transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CommandLineIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
                  <span className="text-bolt-elements-textPrimary font-medium">Utiliser la Branche Principale</span>
                </div>
                <p className="text-sm text-bolt-elements-textTertiary ml-8">
                  Vérifier les mises à jour sur la branche principale au lieu de la branche stable
                </p>
              </div>
              <Switch className="ml-auto" checked={isLatestBranch} onCheckedChange={enableLatestBranch} />
            </div>
          </div>

          {/* Sélection Auto */}
          <div className="feature-card p-4 rounded-lg bg-bolt-elements-bg-depth-1 hover:bg-bolt-elements-bg-depth-3 transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CodeBracketIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
                  <span className="text-bolt-elements-textPrimary font-medium">Sélection Automatique du Modèle</span>
                </div>
                <p className="text-sm text-bolt-elements-textTertiary ml-8">
                  Laisser NeuroCode sélectionner le meilleur modèle de démarrage pour votre projet
                </p>
              </div>
              <Switch className="ml-auto" checked={autoSelectTemplate} onCheckedChange={setAutoSelectTemplate} />
            </div>
          </div>

          {/* Optimisation Contexte */}
          <div className="feature-card p-4 rounded-lg bg-bolt-elements-bg-depth-1 hover:bg-bolt-elements-bg-depth-3 transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CommandLineIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
                  <span className="text-bolt-elements-textPrimary font-medium">Optimisation du Contexte</span>
                </div>
                <p className="text-sm text-bolt-elements-textTertiary ml-8">
                  Masque le contenu des fichiers dans la discussion et optimise le contexte
                </p>
              </div>
              <Switch className="ml-auto" checked={contextOptimizationEnabled} onCheckedChange={enableContextOptimization} />
            </div>
          </div>
        </div>
      </div>

      {/* Section Paramètres Vocaux */}
      <div className="bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <SpeakerWaveIcon className="w-6 h-6 text-bolt-elements-textSecondary" />
          <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">Paramètres Vocaux</h3>
        </div>
        <VoiceSettingsComponent />
      </div>

      {/* Section Expérimentale */}
      <div className="bg-bolt-elements-bg-depth-2 border border-bolt-elements-borderColor rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BeakerIcon className="w-6 h-6 text-amber-500" />
          <div>
            <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">Fonctionnalités Expérimentales</h3>
            <p className="text-sm text-amber-500 mt-1">
              Ces fonctionnalités sont en phase de test et peuvent être instables
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Fournisseurs Expérimentaux */}
          <div className="feature-card p-4 rounded-lg bg-bolt-elements-bg-depth-1 hover:bg-bolt-elements-bg-depth-3 transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <BeakerIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
                  <span className="text-bolt-elements-textPrimary font-medium">Fournisseurs Expérimentaux</span>
                </div>
                <p className="text-sm text-bolt-elements-textTertiary ml-8">
                  Activer les fournisseurs expérimentaux comme Ollama, LMStudio et OpenAILike
                </p>
              </div>
              <Switch className="ml-auto" checked={isLocalModel} onCheckedChange={enableLocalModels} />
            </div>
          </div>

          {/* Bibliothèque d'Invites */}
          <div className="feature-card p-4 rounded-lg bg-bolt-elements-bg-depth-1 hover:bg-bolt-elements-bg-depth-3 transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <BeakerIcon className="w-5 h-5 text-bolt-elements-textSecondary" />
                  <span className="text-bolt-elements-textPrimary font-medium">Bibliothèque d'Invites</span>
                </div>
                <p className="text-sm text-bolt-elements-textTertiary ml-8">
                  Sélectionnez une invite de la bibliothèque comme invite système
                </p>
              </div>
              <select
                value={promptId}
                onChange={(e) => setPromptId(e.target.value)}
                className="p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all text-sm min-w-[200px]"
              >
                <optgroup label="Prompts par défaut">
                  {PromptLibrary.getList().map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
                </optgroup>
                {customPrompts.length > 0 && (
                  <optgroup label="Prompts personnalisés">
                    {customPrompts.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
