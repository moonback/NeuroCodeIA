import * as RadixDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, type ReactElement, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { DialogTitle, dialogVariants, dialogBackdropVariants } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import styles from './Settings.module.scss';
import ProvidersTab from './providers/ProvidersTab';
import { useSettings } from '~/lib/hooks/useSettings';
import FeaturesTab from './features/FeaturesTab';
import DebugTab from './debug/DebugTab';
import EventLogsTab from './event-logs/EventLogsTab';
import ConnectionsTab from './connections/ConnectionsTab';
import DataTab from './data/DataTab';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  initialTab?: TabType;
}

type TabType = 'data' | 'providers' | 'features' | 'debug' | 'event-logs' | 'connection';

const tabTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 }
};

export const SettingsWindow = ({ open, onClose, initialTab = 'data' }: SettingsProps) => {
  const { debug, eventLogs } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Réinitialiser l'onglet actif quand la fenêtre se ferme
  useEffect(() => {
    if (!open) {
      setActiveTab(initialTab);
      setSearchTerm('');
    }
  }, [open, initialTab]);

  const tabs: { id: TabType; label: string; icon: string; component?: ReactElement; description: string }[] = [
    {
      id: 'data',
      label: 'Données',
      icon: 'i-ph:database',
      component: <DataTab />,
      description: 'Gérer vos données et l\'historique des conversations'
    },
    {
      id: 'providers',
      label: 'Fournisseurs',
      icon: 'i-ph:key',
      component: <ProvidersTab />,
      description: 'Configurer vos fournisseurs d\'IA'
    },
    {
      id: 'connection',
      label: 'Connexion',
      icon: 'i-ph:link',
      component: <ConnectionsTab />,
      description: 'Gérer vos connexions externes'
    },
    {
      id: 'features',
      label: 'Fonctionnalités',
      icon: 'i-ph:star',
      component: <FeaturesTab />,
      description: 'Activer ou désactiver les fonctionnalités'
    },
    ...(debug ? [{
      id: 'debug' as TabType,
      label: 'Débogage',
      icon: 'i-ph:bug',
      component: <DebugTab />,
      description: 'Outils de débogage avancés'
    }] : []),
    ...(eventLogs ? [{
      id: 'event-logs' as TabType,
      label: 'Journaux',
      icon: 'i-ph:list-bullets',
      component: <EventLogsTab />,
      description: 'Consulter les journaux d\'événements'
    }] : []),
  ];

  const filteredTabs = tabs.filter(tab =>
    tab.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tab.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <RadixDialog.Root open={open}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay asChild onClick={onClose}>
          <motion.div
            className="bg-black/50 fixed inset-0 z-max backdrop-blur-sm"
            initial="closed"
            animate="open"
            exit="closed"
            variants={dialogBackdropVariants}
          />
        </RadixDialog.Overlay>
        <RadixDialog.Content
          aria-describedby={undefined}
          asChild
          onKeyDown={handleKeyPress}
        >
          <motion.div
            className="fixed top-[50%] left-[50%] z-max h-[85vh] w-[90vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%] border border-bolt-elements-borderColor rounded-lg shadow-lg focus:outline-none overflow-hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={dialogVariants}
          >
            <div className="flex h-full">
              <div className={classNames(
                'w-48 border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4 flex flex-col',
                styles['settings-tabs'],
              )}>
                <DialogTitle className="flex-shrink-0 text-lg font-semibold text-bolt-elements-textPrimary mb-4">
                  Paramètres
                </DialogTitle>

                <input
                  type="search"
                  placeholder="Rechercher..."
                  className="mb-4 w-full px-3 py-2 rounded-md bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="flex-1 overflow-y-auto">
                  {filteredTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={classNames(
                        'w-full text-left p-2 rounded-md mb-2 transition-all duration-200',
                        activeTab === tab.id ? styles.active : '',
                        'hover:bg-bolt-elements-background-depth-3'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={tab.icon} />
                        <div>
                          <div>{tab.label}</div>
                          <div className="text-xs text-bolt-elements-textSecondary">
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-bolt-elements-borderColor flex flex-col gap-2">
                  <a
                    href="https://github.com/stackblitz-labs/bolt.diy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classNames(styles['settings-button'], 'flex items-center gap-2')}
                  >
                    <div className="i-ph:github-logo" />
                    GitHub
                  </a>
                  <a
                    href="https://stackblitz-labs.github.io/bolt.diy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classNames(styles['settings-button'], 'flex items-center gap-2')}
                  >
                    <div className="i-ph:book" />
                    Documentation
                  </a>
                </div>
              </div>

              <div className="flex-1 flex flex-col p-8 pt-10 bg-bolt-elements-background-depth-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    className="flex-1 overflow-y-auto"
                    {...tabTransition}
                  >
                    {tabs.find((tab) => tab.id === activeTab)?.component}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <RadixDialog.Close asChild onClick={onClose}>
              <IconButton
                icon="i-ph:x"
                className="absolute top-[10px] right-[10px]"
                aria-label="Fermer les paramètres"
              />
            </RadixDialog.Close>
          </motion.div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
