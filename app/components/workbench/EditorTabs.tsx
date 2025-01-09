import React, { memo } from 'react';
import { classNames } from '../../utils/classNames';

interface EditorTab {
  filePath: string;
  isUnsaved: boolean;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTab?: string;
  onTabSelect: (filePath: string) => void;
  onTabClose: (filePath: string) => void;
}

export const EditorTabs = memo(({ tabs, activeTab, onTabSelect, onTabClose }: EditorTabsProps) => {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="relative flex overflow-x-auto bg-gradient-to-b from-bolt-background-secondary to-bolt-background-primary border-b border-bolt-elements-borderColor">
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-bolt-elements-borderColor opacity-30" />
      
      {tabs.map((tab) => {
        const isActive = tab.filePath === activeTab;
        const fileName = tab.filePath.split('/').pop() || '';
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

        return (
          <div
            key={tab.filePath}
            className={classNames(
              'group relative flex items-center gap-3 px-4 py-2.5 cursor-pointer',
              'border-r border-bolt-elements-borderColor/30 min-w-[140px] max-w-[220px]',
              'transition-all duration-200 ease-in-out',
              'hover:bg-bolt-elements-hover/40',
              isActive ? [
                'bg-bolt-background-primary',
                'before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[2px]',
                'before:bg-gradient-to-r before:from-bolt-elements-accent/70 before:via-bolt-elements-accent before:to-bolt-elements-accent/70',
                'after:absolute after:bottom-[2px] after:left-0 after:right-0 after:h-[1px]',
                'after:bg-bolt-elements-accent/20 after:blur-sm'
              ] : [
                'opacity-75 hover:opacity-100',
                'hover:backdrop-brightness-110'
              ]
            )}
            onClick={() => onTabSelect(tab.filePath)}
          >
            <div className={classNames(
              'shrink-0 w-4 h-4 transition-transform duration-200',
              'group-hover:scale-110',
              {
                // Code et Scripts
                'i-ph:file-ts-duotone text-blue-400': fileExtension === 'ts' || fileExtension === 'tsx',
                'i-ph:file-js-duotone text-yellow-400': fileExtension === 'js' || fileExtension === 'jsx',
                
                // Styles et Markup
                'i-ph:paint-brush-duotone text-purple-400': ['css', 'scss', 'sass'].includes(fileExtension),
                'i-ph:browser-duotone text-orange-400': fileExtension === 'html',
                'i-ph:image-duotone text-green-400': fileExtension === 'svg',
                
                // Data et Config
                'i-ph:brackets-curly-duotone text-yellow-300': fileExtension === 'json',
                'i-ph:list-bullets-duotone text-gray-300': fileExtension === 'yml' || fileExtension === 'yaml',
                'i-ph:article-duotone text-blue-300': fileExtension === 'md' || fileExtension === 'markdown',
                'i-ph:cube-duotone text-blue-400': fileName === 'Dockerfile' || fileName === 'docker-compose.yml',
                
                // Langages de programmation
                'i-ph:terminal-window-duotone text-green-400': fileExtension === 'py',
                'i-ph:gear-duotone text-orange-400': fileExtension === 'rs',
                'i-ph:function-duotone text-blue-300': fileExtension === 'go',
                'i-ph:database-duotone text-purple-300': fileExtension === 'php',
                'i-ph:coffee-duotone text-red-400': fileExtension === 'java',
                
                // Images
                'i-ph:image-square-duotone text-pink-400': ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension),
                
                // Par défaut
                'i-ph:file-text-duotone text-gray-400': !['ts', 'tsx', 'js', 'jsx', 'css', 'scss', 'sass', 'html', 'svg', 'json', 'yml', 'yaml', 'md', 'markdown', 'py', 'rs', 'go', 'php', 'java', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension)
              }
            )} />
            
            <span className={classNames(
              'truncate flex-1 text-sm transition-all duration-200',
              'text-white/90 group-hover:text-white',
              isActive ? 'font-semibold' : 'font-medium'
            )}>
              {fileName}
            </span>
            
            {tab.isUnsaved && (
              <div className={classNames(
                'w-1.5 h-1.5 rounded-full',
                'bg-gradient-to-r from-bolt-elements-accent to-bolt-elements-accent/80',
                'animate-pulse shadow-lg shadow-bolt-elements-accent/20',
                'ring-4 ring-bolt-elements-accent/10'
              )} />
            )}
            
            <button
              className={classNames(
                'opacity-0 group-hover:opacity-100',
                'transition-all duration-200 ease-in-out',
                'hover:bg-white/10 rounded-full p-1 -mr-1',
                'backdrop-blur-sm',
                'group/close'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.filePath);
              }}
            >
              <div className={classNames(
                'i-ph:x-bold w-3.5 h-3.5',
                'text-white/70 group-hover/close:text-white',
                'transition-transform duration-200',
                'group-hover/close:scale-110 group-hover/close:rotate-90'
              )} />
            </button>
          </div>
        );
      })}
    </div>
  );
}); 