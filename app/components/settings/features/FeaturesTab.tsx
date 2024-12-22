import React from 'react';
import { Switch } from '~/components/ui/Switch';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { useSettings } from '~/lib/hooks/useSettings';
import { motion } from 'framer-motion';

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

interface FeatureCardProps {
  title: string;
  description?: string;
  icon: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  experimental?: boolean;
}

const FeatureCard = ({ title, description, icon, enabled, onToggle, experimental }: FeatureCardProps) => (
  <motion.div
    variants={itemVariants}
    className={`
      p-4 rounded-xl border transition-all duration-200
      ${enabled ? 'bg-bolt-elements-background-depth-3 border-bolt-elements-focus' : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor'}
      hover:border-bolt-elements-focus hover:shadow-md
    `}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`${icon} text-xl ${enabled ? 'text-bolt-elements-focus' : 'text-bolt-elements-textTertiary'}`} />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-bolt-elements-textPrimary">{title}</h4>
            {experimental && (
              <span
                className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500"
                title="Fonctionnalité expérimentale"
              >
                BETA
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-bolt-elements-textSecondary mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="flex-shrink-0"
      />
    </div>
  </motion.div>
);

export default function FeaturesTab() {
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
  } = useSettings();

  const handleToggle = (enabled: boolean) => {
    enableDebugMode(enabled);
    enableEventLogs(enabled);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 p-6"
    >
      <section>
        <h3 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">
          Fonctionnalités standards
        </h3>
        <div className="space-y-4">
          <FeatureCard
            title="Mode débogage"
            description="Activer les outils de développement et les journaux détaillés"
            icon="i-ph:bug"
            enabled={debug}
            onToggle={handleToggle}
          />
          <FeatureCard
            title="Branche principale"
            description="Vérifier les mises à jour sur la branche principale au lieu de la stable"
            icon="i-ph:git-branch"
            enabled={isLatestBranch}
            onToggle={enableLatestBranch}
          />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">
            Fonctionnalités expérimentales
          </h3>
          <p className="text-sm text-bolt-elements-textSecondary mt-2">
            Ces fonctionnalités sont en cours de développement et peuvent être instables.
          </p>
        </div>

        <div className="space-y-4">
          <FeatureCard
            title="Fournisseurs expérimentaux"
            description="Activer les fournisseurs d'IA en version bêta"
            icon="i-ph:flask"
            enabled={isLocalModel}
            onToggle={enableLocalModels}
            experimental
          />

          <motion.div
            variants={itemVariants}
            className={`
              p-4 rounded-xl border transition-all duration-200
              ${promptId ? 'bg-bolt-elements-background-depth-3 border-bolt-elements-focus' : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor'}
            `}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="i-ph:book-open text-xl text-bolt-elements-textTertiary" />
              <div>
                <h4 className="font-medium text-bolt-elements-textPrimary">
                  Bibliothèque de prompts
                </h4>
                <p className="text-sm text-bolt-elements-textSecondary mt-1">
                  Sélectionnez un prompt prédéfini comme prompt système
                </p>
              </div>
            </div>

            <div className="ml-8">
              <select
                value={promptId}
                onChange={(e) => setPromptId(e.target.value)}
                className={`
                  w-full p-2 rounded-lg transition-all duration-200
                  border border-bolt-elements-borderColor
                  bg-bolt-elements-background-depth-2
                  text-bolt-elements-textPrimary
                  focus:border-bolt-elements-focus focus:ring-1 focus:ring-bolt-elements-focus
                  hover:border-bolt-elements-focus
                `}
              >
                {PromptLibrary.getList().map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
