import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';

// Types
interface ArtifactProps {
  messageId: string;
}

interface ShellCodeBlockProps {
  className?: string; 
  code: string;
}

interface ActionListProps {
  actions: ActionState[];
}

// Constants
const HIGHLIGHTER_OPTIONS = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus']
};

const ACTION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Utilities
const getIconColor = (status: ActionState['status']): string => {
  const colors = {
    pending: 'text-bolt-elements-textTertiary',
    running: 'text-bolt-elements-loader-progress', 
    complete: 'text-bolt-elements-icon-success',
    aborted: 'text-bolt-elements-textSecondary',
    failed: 'text-bolt-elements-icon-error',
  };
  return colors[status] || '';
};

// Initialize highlighter
const shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> = 
  import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(HIGHLIGHTER_OPTIONS));

if (import.meta.hot) {
  import.meta.hot.data.shellHighlighter = shellHighlighter;
}

// Components
const ShellCodeBlock = memo(({ className, code }: ShellCodeBlockProps) => (
  <div
    className={classNames('text-xs', className)}
    dangerouslySetInnerHTML={{
      __html: shellHighlighter.codeToHtml(code, {
        lang: 'shell',
        theme: 'dark-plus',
      }),
    }}
  />
));

const ActionIcon = ({ status, type }: { status: ActionState['status']; type: string }) => {
  if (status === 'running') {
    return type !== 'start' ? 
      <div className="i-svg-spinners:90-ring-with-bg" /> : 
      <div className="i-ph:terminal-window-duotone" />;
  }
  
  const icons = {
    pending: <div className="i-ph:circle-duotone" />,
    complete: <div className="i-ph:check" />,
    failed: <div className="i-ph:x" />,
    aborted: <div className="i-ph:x" />,
  };

  return icons[status] || null;
};

const ActionList = memo(({ actions }: ActionListProps) => {
  const openArtifactInWorkbench = (filePath: string) => {
    if (workbenchStore.currentView.get() !== 'code') {
      workbenchStore.currentView.set('code');
    }

    workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.15 }}
    >
      <ul className="list-none space-y-2.5">
        {actions.map((action, index) => {
          const isLast = index === actions.length - 1;
          return (
            <motion.li
              key={index}
              variants={ACTION_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.2, ease: cubicEasingFn }}
            >
              <div className="flex items-center gap-1.5 text-sm">
                <div className={classNames('text-lg', getIconColor(action.status))}>
                  <ActionIcon status={action.status} type={action.type} />
                </div>

                {action.type === 'file' ? (
                  <div>
                    Créer{' '}
                    <code
                      className="bg-bolt-elements-artifacts-inlineCode-background text-bolt-elements-artifacts-inlineCode-text px-1.5 py-1 rounded-md text-bolt-elements-item-contentAccent hover:underline cursor-pointer transition-colors duration-200 hover:bg-bolt-elements-artifacts-inlineCode-backgroundHover"
                      onClick={() => openArtifactInWorkbench(action.filePath)}
                      title="Ouvrir dans l'éditeur"
                    >
                      {action.filePath}
                    </code>
                  </div>
                ) : action.type === 'shell' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <span className="flex-1">Exécuter la commande</span>
                  </div>
                ) : action.type === 'start' ? (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      workbenchStore.currentView.set('preview');
                    }}
                    className="flex items-center w-full min-h-[28px] hover:text-bolt-elements-textTertiary transition-colors duration-200"
                    title="Voir l'aperçu"
                  >
                    <span className="flex-1">Démarrer l'application</span>
                  </a>
                ) : null}
              </div>

              {(action.type === 'shell' || action.type === 'start') && (
                <ShellCodeBlock
                  className={classNames('mt-1', { 'mb-3.5': !isLast })}
                  code={action.content}
                />
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

// Main Component
export const Artifact = memo(({ messageId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[messageId];
  
  const actions = useStore(
    computed(artifact.runner.actions, actions => Object.values(actions))
  );

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }

    if (actions.length !== 0 && artifact.type === 'bundled') {
      const finished = !actions.find(action => action.status !== 'complete');
      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions]);

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  const toggleWorkbench = () => {
    const showWorkbench = workbenchStore.showWorkbench.get();
    workbenchStore.showWorkbench.set(!showWorkbench);
  };

  return (
    <div className="artifact border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150">
      <div className="flex">
        <button
          className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
          onClick={toggleWorkbench}
        >
          {artifact.type === 'bundled' && (
            <>
              <div className="p-4">
                {allActionFinished ? (
                  <div className="i-ph:files-light" style={{ fontSize: '2rem' }} />
                ) : (
                  <div className="i-svg-spinners:90-ring-with-bg" style={{ fontSize: '2rem' }} />
                )}
              </div>
              <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
            </>
          )}
          <div className="px-5 p-3.5 w-full text-left">
            <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm truncate">
              {artifact?.title || 'Sans titre'}
            </div>
            <div className="w-full text-bolt-elements-textSecondary text-xs mt-0.5 flex items-center gap-1">
              <span className="i-ph:arrow-square-out text-[14px]" />
              Ouvrir dans le Workbench
            </div>
          </div>
        </button>

        <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />

        <AnimatePresence>
          {actions.length && artifact.type !== 'bundled' && (
            <motion.button
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              exit={{ width: 0 }}
              transition={{ duration: 0.15, ease: cubicEasingFn }}
              className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover"
              onClick={toggleActions}
            >
              <div className="p-4">
                <div className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'} />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {artifact.type !== 'bundled' && showActions && actions.length > 0 && (
          <motion.div
            className="actions"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-bolt-elements-artifacts-borderColor h-[1px]" />
            <div className="p-5 text-left bg-bolt-elements-actions-background">
              <ActionList actions={actions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
