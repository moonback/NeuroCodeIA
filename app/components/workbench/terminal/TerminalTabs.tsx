import { useStore } from '@nanostores/react';
import React, { memo, useEffect, useRef, useState } from 'react';
import { Panel, type ImperativePanelHandle } from 'react-resizable-panels';
import { IconButton } from '~/components/ui/IconButton';
import { shortcutEventEmitter } from '~/lib/hooks';
import { themeStore } from '~/lib/stores/theme';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { Terminal, type TerminalRef } from './Terminal';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Terminal');

const MAX_TERMINALS = 5;
export const DEFAULT_TERMINAL_SIZE = 25;

interface TerminalTab {
  id: number;
  name: string;
  searchHistory: string[];
}

export const TerminalTabs = memo(() => {
  const showTerminal = useStore(workbenchStore.showTerminal);
  const theme = useStore(themeStore);

  const terminalRefs = useRef<Array<TerminalRef | null>>([]);
  const terminalPanelRef = useRef<ImperativePanelHandle>(null);
  const terminalToggledByShortcut = useRef(false);

  const [activeTerminal, setActiveTerminal] = useState(0);
  const [terminalCount, setTerminalCount] = useState(1);
  const [terminals, setTerminals] = useState<TerminalTab[]>([
    { id: 0, name: 'Terminal', searchHistory: [] }
  ]);
  const [showRenameInput, setShowRenameInput] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: number } | null>(null);

  const addTerminal = () => {
    if (terminalCount < MAX_TERMINALS) {
      const newId = terminalCount;
      setTerminalCount(terminalCount + 1);
      setActiveTerminal(newId);
      setTerminals([...terminals, { 
        id: newId, 
        name: `Terminal ${newId}`,
        searchHistory: []
      }]);
    }
  };

  const renameTerminal = (id: number, newName: string) => {
    setTerminals(terminals.map(term => 
      term.id === id ? { ...term, name: newName } : term
    ));
    setShowRenameInput(null);
  };

  const closeTerminal = (indexToClose: number) => {
    if (indexToClose === 0) return;
    
    terminalRefs.current = terminalRefs.current.filter((_, index) => index !== indexToClose);
    setTerminalCount(terminalCount - 1);
    setTerminals(terminals.filter(term => term.id !== indexToClose));
    
    if (activeTerminal === indexToClose) {
      setActiveTerminal(indexToClose - 1);
    } else if (activeTerminal > indexToClose) {
      setActiveTerminal(activeTerminal - 1);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // Ctrl+Tab pour naviguer entre les onglets
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      setActiveTerminal((activeTerminal + 1) % (terminalCount + 1));
    }
    // Ctrl+Shift+Tab pour naviguer en arrière
    if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      setActiveTerminal(activeTerminal === 0 ? terminalCount : activeTerminal - 1);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [activeTerminal, terminalCount]);

  useEffect(() => {
    const { current: terminal } = terminalPanelRef;

    if (!terminal) {
      return;
    }

    const isCollapsed = terminal.isCollapsed();

    if (!showTerminal && !isCollapsed) {
      terminal.collapse();
    } else if (showTerminal && isCollapsed) {
      terminal.resize(DEFAULT_TERMINAL_SIZE);
    }

    terminalToggledByShortcut.current = false;
  }, [showTerminal]);

  useEffect(() => {
    const unsubscribeFromEventEmitter = shortcutEventEmitter.on('toggleTerminal', () => {
      terminalToggledByShortcut.current = true;
    });

    const unsubscribeFromThemeStore = themeStore.subscribe(() => {
      for (const ref of Object.values(terminalRefs.current)) {
        ref?.reloadStyles();
      }
    });

    return () => {
      unsubscribeFromEventEmitter();
      unsubscribeFromThemeStore();
    };
  }, []);

  return (
    <Panel
      ref={terminalPanelRef}
      defaultSize={showTerminal ? DEFAULT_TERMINAL_SIZE : 0}
      minSize={10}
      collapsible
      onExpand={() => {
        if (!terminalToggledByShortcut.current) {
          workbenchStore.toggleTerminal(true);
        }
      }}
      onCollapse={() => {
        if (!terminalToggledByShortcut.current) {
          workbenchStore.toggleTerminal(false);
        }
      }}
    >
      <div className="h-full">
        <div className="bg-bolt-elements-terminals-background h-full flex flex-col">
          <div className="flex items-center bg-bolt-elements-background-depth-2 border-y border-bolt-elements-borderColor gap-1.5 min-h-[34px] p-2">
            {terminals.map((terminal) => {
              const isActive = activeTerminal === terminal.id;

              return (
                <React.Fragment key={terminal.id}>
                  <div
                    className={classNames(
                      'flex items-center text-sm cursor-pointer gap-1.5 px-3 py-2 h-full whitespace-nowrap rounded-full',
                      {
                        'bg-bolt-elements-terminals-buttonBackground text-bolt-elements-textPrimary': isActive,
                        'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-terminals-buttonBackground':
                          !isActive,
                      }
                    )}
                    onClick={() => setActiveTerminal(terminal.id)}
                    onContextMenu={(e) => handleContextMenu(e, terminal.id)}
                  >
                    <div className="i-ph:terminal-window-duotone text-lg" />
                    {showRenameInput === terminal.id ? (
                      <input
                        type="text"
                        defaultValue={terminal.name}
                        autoFocus
                        onBlur={(e) => renameTerminal(terminal.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameTerminal(terminal.id, e.currentTarget.value);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent border-none outline-none w-20"
                      />
                    ) : (
                      terminal.name
                    )}
                    {terminal.id !== 0 && (
                      <IconButton
                        icon="i-ph:x"
                        size="sm"
                        className="ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTerminal(terminal.id);
                        }}
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            })}
            {terminalCount < MAX_TERMINALS && (
              <IconButton icon="i-ph:plus" size="md" onClick={addTerminal} />
            )}
            <IconButton
              className="ml-auto"
              icon="i-ph:caret-down"
              title="Close"
              size="md"
              onClick={() => workbenchStore.toggleTerminal(false)}
            />
          </div>

          {contextMenu && (
            <div
              className="fixed bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md shadow-lg p-2 z-50"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                className="block w-full text-left px-2 py-1 hover:bg-bolt-elements-terminals-buttonBackground rounded"
                onClick={() => {
                  setShowRenameInput(contextMenu.tabId);
                  setContextMenu(null);
                }}
              >
                Renommer
              </button>
              <button
                className="block w-full text-left px-2 py-1 hover:bg-bolt-elements-terminals-buttonBackground rounded"
                onClick={() => {
                  // Clear terminal history
                  const terminal = terminalRefs.current[contextMenu.tabId];
                  if (terminal) {
                    terminal.clear?.();
                  }
                  setContextMenu(null);
                }}
              >
                Effacer l'historique
              </button>
            </div>
          )}

          {terminals.map((terminal) => {
            const isActive = activeTerminal === terminal.id;
            const isBoltTerminal = terminal.id === 0;

            return (
              <Terminal
                key={terminal.id}
                id={`terminal_${terminal.id}`}
                className={classNames('h-full overflow-hidden', {
                  hidden: !isActive,
                })}
                ref={(ref) => {
                  if (ref) {
                    terminalRefs.current[terminal.id] = ref;
                  }
                }}
                onTerminalReady={(term) => 
                  isBoltTerminal 
                    ? workbenchStore.attachBoltTerminal(term)
                    : workbenchStore.attachTerminal(term)
                }
                onTerminalResize={(cols, rows) => workbenchStore.onTerminalResize(cols, rows)}
                theme={theme}
              />
            );
          })}
        </div>
      </div>
    </Panel>
  );
});
