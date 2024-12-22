import { AnimatePresence, motion } from 'framer-motion';
import type { ActionAlert } from '~/types/actions';
import { classNames } from '~/utils/classNames';

interface Props {
  alert: ActionAlert;
  clearAlert: () => void;
  postMessage: (message: string) => void;
}

export default function ChatAlert({ alert, clearAlert, postMessage }: Props) {
  const { description, content } = alert;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 30 }}
      className="bg-gradient-to-b from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 rounded-xl shadow-2xl border border-bolt-elements-borderColor overflow-hidden max-h-[80vh] backdrop-blur-sm"
    >
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-bolt-elements-button-danger-background/20">
            <div className="i-ph:warning-duotone text-3xl text-bolt-elements-button-danger-text" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
              Une erreur est survenue
            </h3>
            <p className="text-sm text-bolt-elements-textTertiary mt-1">
              Laissez Bolt vous aider à résoudre ce problème
            </p>
          </div>
          <button
            onClick={clearAlert}
            className="p-2 hover:bg-bolt-elements-background-depth-1 rounded-lg transition-colors"
          >
            <div className="i-ph:x text-xl text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-bolt-elements-textSecondary">
            Nous avons rencontré une erreur lors de l'exécution des commandes terminal. NeuroCode peut analyser cette
            erreur et proposer une solution adaptée.
          </p>

          {description && (
            <div className="relative">
              <div className="absolute -left-2 top-0 bottom-0 w-1 bg-bolt-elements-button-danger-background rounded-full" />
              <div className="text-xs font-mono text-bolt-elements-textSecondary p-4 bg-bolt-elements-background-depth-1/50 rounded-lg overflow-auto max-h-[200px] backdrop-blur-sm border border-bolt-elements-borderColor/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="i-ph:terminal text-bolt-elements-textTertiary" />
                  <p className="text-bolt-elements-textTertiary font-medium">Détails de l'erreur</p>
                </div>
                <pre className="whitespace-pre-wrap">{description}</pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => postMessage(`*Fix this error on terminal* \n\`\`\`sh\n${content}\n\`\`\`\n`)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="i-ph:sparkle text-xl" />
              Résoudre
            </button>
            <button
              onClick={clearAlert}
              className="px-6 py-3 rounded-lg text-sm font-medium bg-bolt-elements-button-secondary-background hover:bg-bolt-elements-button-secondary-backgroundHover text-bolt-elements-button-secondary-text transition-all hover:shadow-md"
            >
              Ignorer
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
