import { AnimatePresence, motion } from 'framer-motion';
import type { ActionAlert } from '~/types/actions';
import { classNames } from '~/utils/classNames';
import React, { useState } from 'react';

interface Props {
  alert: ActionAlert;
  clearAlert: () => void;
  postMessage: (message: string) => void;
}

export default function ChatAlert({ alert, clearAlert, postMessage }: Props) {
  const { description, content, source } = alert;
  const [showDetails, setShowDetails] = useState(false);

  const isPreview = source === 'preview';
  const isFileModification = source === 'file_modification';
  
  let title = isPreview ? 'Erreur de Prévisualisation' : isFileModification ? 'Modifications de Fichiers' : 'Erreur du Terminal';
  let message = isPreview
    ? 'Nous avons rencontré une erreur lors de la prévisualisation. Souhaitez-vous que NeuroCode analyse et aide à résoudre ce problème ?'
    : isFileModification
    ? 'Des fichiers ont été modifiés. Souhaitez-vous appliquer ces modifications ?'
    : 'Nous avons rencontré une erreur lors de l\'exécution des commandes. Souhaitez-vous que NeuroCode analyse et aide à résoudre ce problème ?';

  // Séparer la description en liste de fichiers pour les modifications
  const modifiedFiles = isFileModification ? description.split('\n') : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4 shadow-lg`}
      >
        <div className="flex items-start">
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className={classNames(
              `i-ph:${isFileModification ? 'files-duotone' : 'warning-duotone'} text-2xl`,
              isFileModification ? 'text-bolt-elements-button-primary-text' : 'text-bolt-elements-button-danger-text'
            )}></div>
          </motion.div>

          <div className="ml-3 flex-1">
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-sm font-medium text-bolt-elements-textPrimary`}
            >
              {title}
            </motion.h3>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`mt-2 text-sm text-bolt-elements-textSecondary`}
            >
              <p>{message}</p>
              {description && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-bolt-elements-textSecondary p-3 bg-bolt-elements-background-depth-3 rounded-md mt-4 mb-4 border border-bolt-elements-borderColor"
                >
                  {isFileModification ? (
                    <div className="space-y-1">
                      <div className="font-medium mb-2">Fichiers modifiés :</div>
                      {modifiedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="i-ph:file-text-duotone text-bolt-elements-button-primary-text" />
                          {file}
                        </div>
                      ))}
                      {content && (
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          className="mt-3 text-xs text-bolt-elements-button-primary-text hover:underline flex items-center gap-1"
                        >
                          <div className={`i-ph:${showDetails ? 'caret-up' : 'caret-down'}-bold`} />
                          {showDetails ? 'Masquer les détails' : 'Voir les détails'}
                        </button>
                      )}
                      {showDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-2 bg-bolt-elements-background-depth-4 rounded border border-bolt-elements-borderColor overflow-auto max-h-[300px]"
                        >
                          <pre className="text-xs whitespace-pre-wrap font-mono">{content}</pre>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <>Erreur détectée : {description}</>
                  )}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={classNames('flex gap-3')}>
                <button
                  onClick={() =>
                    postMessage(
                      isFileModification
                        ? `*Appliquer seulement mes modifications aux fichiers concernés* \n\`\`\`\n${content}\n\`\`\`\n`
                        : `*Corriger cette erreur ${isPreview ? 'de prévisualisation' : 'dans le terminal'}* \n\`\`\`${isPreview ? 'javascript' : 'shell'}\n${content}\n\`\`\`\n`,
                    )
                  }
                  className={classNames(
                    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200`,
                    'bg-bolt-elements-button-primary-background',
                    'hover:bg-bolt-elements-button-primary-backgroundHover hover:scale-105',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bolt-elements-button-danger-background',
                    'text-bolt-elements-button-primary-text',
                    'flex items-center gap-2',
                  )}
                >
                  <div className={isFileModification ? "i-ph:check-circle-duotone" : "i-ph:chat-circle-duotone"}></div>
                  {isFileModification ? 'Appliquer les modifications' : 'Fixer le problème'}
                </button>
                <button
                  onClick={clearAlert}
                  className={classNames(
                    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200`,
                    'bg-bolt-elements-button-secondary-background',
                    'hover:bg-bolt-elements-button-secondary-backgroundHover hover:scale-105',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bolt-elements-button-secondary-background',
                    'text-bolt-elements-button-secondary-text',
                  )}
                >
                  {isFileModification ? 'Ignorer' : 'Fermer'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
