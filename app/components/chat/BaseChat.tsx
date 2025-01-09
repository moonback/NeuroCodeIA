/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { Message } from 'ai';
import React, { type RefCallback, useCallback, useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { MODEL_LIST, PROVIDER_LIST, initializeModelList } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { APIKeyManager, getApiKeysFromCookies } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';
import { FaBug } from 'react-icons/fa';
import fileSaver from 'file-saver';
const { saveAs } = fileSaver;

import styles from './BaseChat.module.scss';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';

import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import { ExamplePrompts } from '~/components/chat/ExamplePrompts';
import GitCloneButton from './GitCloneButton';

import FilePreview from './FilePreview';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import type { IProviderSetting, ProviderInfo } from '~/types/model';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { toast } from 'react-toastify';
import StarterTemplates from './StarterTemplates';
import type { ActionAlert } from '~/types/actions';
import ChatAlert from './ChatAlert';
import { LLMManager } from '~/lib/modules/llm/manager';
import type { FileMap } from '~/lib/stores/files';

const TEXTAREA_MIN_HEIGHT = 76;

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => Promise<string | void>;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  exportChat?: () => void;
  uploadedFiles?: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList?: string[];
  setImageDataList?: (dataList: string[]) => void;
  actionAlert?: ActionAlert;
  clearAlert?: () => void;
  files?: FileMap;
  handleProjectPlan?: () => Promise<void>;
}

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange: parentHandleInputChange,

      // promptEnhanced,
      enhancePrompt,
      sendMessage,
      handleStop,
      importChat,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
      files = {},
      handleProjectPlan,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
    const [modelList, setModelList] = useState(MODEL_LIST);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');
    const [modelError, setModelError] = useState<string | null>(null);
    const [showFileSuggestions, setShowFileSuggestions] = useState(false);
    const [fileSuggestions, setFileSuggestions] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState<number>(0);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
    const [hoveredFile, setHoveredFile] = useState<string | null>(null);
    const [filePreviewContent, setFilePreviewContent] = useState<string>('');
    const [groupByType, setGroupByType] = useState(false);
    const [searchMode, setSearchMode] = useState<'simple' | 'regex' | 'fuzzy'>('simple');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [showFileStats, setShowFileStats] = useState(false);

    const getProviderSettings = useCallback(() => {
      let providerSettings: Record<string, IProviderSetting> | undefined = undefined;

      try {
        const savedProviderSettings = Cookies.get('providers');

        if (savedProviderSettings) {
          const parsedProviderSettings = JSON.parse(savedProviderSettings);

          if (typeof parsedProviderSettings === 'object' && parsedProviderSettings !== null) {
            providerSettings = parsedProviderSettings;
          }
        }
      } catch (error) {
        console.error('Error loading Provider Settings from cookies:', error);

        // Clear invalid cookie data
        Cookies.remove('providers');
      }

      return providerSettings;
    }, []);
    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const results = event.results as unknown as { [key: number]: { [key: number]: { transcript: string } } };
          const transcript = Object.values(results)
            .map(result => Object.values(result)[0])
            .map(result => result.transcript)
            .join('');

          setTranscript(transcript);

          if (parentHandleInputChange) {
            const syntheticEvent = {
              target: { value: transcript },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            parentHandleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, []);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        const providerSettings = getProviderSettings();
        let parsedApiKeys: Record<string, string> | undefined = {};

        try {
          parsedApiKeys = getApiKeysFromCookies();
          setApiKeys(parsedApiKeys);
        } catch (error) {
          console.error('Erreur lors du chargement des clés API:', error);
          toast.error('Erreur lors du chargement des clés API');
          Cookies.remove('apiKeys');
        }

        setIsModelLoading('all');
        initializeModelList({ apiKeys: parsedApiKeys, providerSettings })
          .then((modelList) => {
            if (modelList.length === 0) {
              setModelError('Aucun modèle disponible. Veuillez vérifier vos clés API et la configuration des providers.');
              toast.warning('Aucun modèle disponible');
            } else {
              // S'assurer que chaque modèle a un provider défini
              const validatedModelList = modelList.map(model => ({
                ...model,
                provider: model.provider || provider?.name || ''
              })).filter(model => model.provider); // Ne garder que les modèles avec un provider

              setModelList(validatedModelList);

              // Si aucun provider n'est sélectionné, sélectionner le premier disponible
              if (!provider && providerList && providerList.length > 0) {
                const firstProvider = providerList[0];
                setProvider?.(firstProvider);
                
                // Sélectionner le premier modèle du provider
                const firstProviderModels = validatedModelList.filter(m => m.provider === firstProvider.name);
                if (firstProviderModels.length > 0) {
                  setModel?.(firstProviderModels[0].name);
                }
              }
              
              setModelError(null);
            }
          })
          .catch((error) => {
            console.error('Erreur lors de l\'initialisation de la liste des modèles:', error);
            setModelError('Erreur lors du chargement des modèles. Veuillez réessayer.');
            toast.error('Erreur lors du chargement des modèles');
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList, provider, setProvider, setModel]);

    const onApiKeysChange = async (providerName: string, apiKey: string) => {
      try {
        const newApiKeys = { ...apiKeys, [providerName]: apiKey };
        setApiKeys(newApiKeys);
        Cookies.set('apiKeys', JSON.stringify(newApiKeys));

        const provider = LLMManager.getInstance(import.meta.env || process.env || {}).getProvider(providerName);

        if (provider && provider.getDynamicModels) {
          setIsModelLoading(providerName);
          setModelError(null);

          try {
            const providerSettings = getProviderSettings();
            const staticModels = provider.staticModels;
            const dynamicModels = await provider.getDynamicModels(
              newApiKeys,
              providerSettings,
              import.meta.env || process.env || {},
            );

            if (dynamicModels.length === 0 && staticModels.length === 0) {
              toast.warning(`Aucun modèle disponible pour ${providerName}`);
            }

            // Mettre à jour uniquement les modèles du provider actuel
            setModelList((preModels) => {
              // Supprimer les anciens modèles du provider
              const otherProvidersModels = preModels.filter((x) => x.provider !== providerName);
              // Ajouter les nouveaux modèles du provider
              const newProviderModels = [...staticModels, ...dynamicModels].map(model => ({
                ...model,
                provider: providerName
              }));
              return [...otherProvidersModels, ...newProviderModels];
            });

            // Si le modèle actuel appartient au provider modifié, vérifier s'il est toujours disponible
            if (model && provider.name === providerName) {
              const modelStillExists = [...staticModels, ...dynamicModels].some(m => m.name === model);
              if (!modelStillExists) {
                // Si le modèle n'existe plus, sélectionner le premier modèle disponible
                const firstAvailableModel = [...staticModels, ...dynamicModels][0];
                if (firstAvailableModel) {
                  setModel?.(firstAvailableModel.name);
                  toast.info(`Le modèle précédent n'est plus disponible. Passage à ${firstAvailableModel.label}`);
                }
              }
            }
          } catch (error) {
            console.error('Erreur lors du chargement des modèles dynamiques:', error);
            toast.error(`Erreur lors du chargement des modèles pour ${providerName}`);
            setModelError(`Erreur lors du chargement des modèles pour ${providerName}`);
          }
          setIsModelLoading(undefined);
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la clé API:', error);
        toast.error('Erreur lors de la mise à jour de la clé API');
      }
    };

    const startListening = () => {
      if (recognition) {
        recognition.start();
        setIsListening(true);
      }
    };

    const stopListening = () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };

    const handleSendMessage = (event: React.UIEvent, messageInput?: string) => {
      if (sendMessage) {
        sendMessage(event, messageInput);

        if (recognition) {
          recognition.abort(); // Stop current recognition
          setTranscript(''); // Clear transcript
          setIsListening(false);

          // Clear the input by triggering handleInputChange with empty value
          if (parentHandleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            parentHandleInputChange(syntheticEvent);
          }
        }
      }
    };

    const handleFileUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
              const base64Image = e.target?.result as string;
              setUploadedFiles?.([...uploadedFiles, file]);
              setImageDataList?.([...imageDataList, base64Image]);
            };
            reader.readAsDataURL(file);
          }

          break;
        }
      }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      const position = event.target.selectionStart;
      setCursorPosition(position);

      const lastAtSymbol = value.lastIndexOf('@', position);
      if (lastAtSymbol !== -1) {
        const query = value.slice(lastAtSymbol + 1, position).toLowerCase();
        const suggestions = Object.keys(files)
          .filter(file => file.toLowerCase().includes(query))
          .sort((a, b) => {
            const aStartsWith = a.toLowerCase().split('/').pop()?.startsWith(query) || false;
            const bStartsWith = b.toLowerCase().split('/').pop()?.startsWith(query) || false;
            if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;
            return a.length - b.length;
          });
        setFileSuggestions(suggestions);
        setShowFileSuggestions(true);
        setSelectedSuggestionIndex(0);
      } else {
        setShowFileSuggestions(false);
      }

      parentHandleInputChange?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showFileSuggestions && fileSuggestions.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setSelectedSuggestionIndex(prev => 
              prev < fileSuggestions.length - 1 ? prev + 1 : 0
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setSelectedSuggestionIndex(prev => 
              prev > 0 ? prev - 1 : fileSuggestions.length - 1
            );
            break;
          case 'Tab':
          case 'Enter':
            if (showFileSuggestions) {
              event.preventDefault();
              insertFileReference(fileSuggestions[selectedSuggestionIndex]);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setShowFileSuggestions(false);
            break;
        }
      } else if (event.key === 'Enter') {
        if (event.shiftKey) return;
        event.preventDefault();
        if (isStreaming) {
          handleStop?.();
          return;
        }
        if (event.nativeEvent.isComposing) return;
        handleSendMessage?.(event);
      }
    };

    const insertFileReference = (filePath: string) => {
      if (!textareaRef?.current) return;

      const value = textareaRef.current.value;
      const lastAtSymbol = value.lastIndexOf('@', cursorPosition);
      
      const newValue = 
        value.slice(0, lastAtSymbol) + 
        '@' + filePath + 
        value.slice(cursorPosition);

      const syntheticEvent = {
        target: { value: newValue }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      parentHandleInputChange?.(syntheticEvent);
      setShowFileSuggestions(false);
    };

    const getFileTypeIcon = (extension?: string) => {
      switch (extension) {
        case 'js':
        case 'jsx':
          return 'i-vscode-icons:file-type-js-official';
        case 'ts':
        case 'tsx':
          return 'i-vscode-icons:file-type-typescript-official';
        case 'css':
          return 'i-vscode-icons:file-type-css';
        case 'scss':
        case 'sass':
          return 'i-vscode-icons:file-type-sass';
        case 'html':
          return 'i-vscode-icons:file-type-html';
        case 'json':
          return 'i-vscode-icons:file-type-json';
        case 'md':
          return 'i-vscode-icons:file-type-markdown';
        case 'py':
          return 'i-vscode-icons:file-type-python';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return 'i-vscode-icons:file-type-image';
        default:
          return 'i-vscode-icons:default-file';
      }
    };

    const getGroupedSuggestions = (suggestions: string[]) => {
      if (!groupByType) return suggestions;

      const groups: Record<string, string[]> = {
        'JavaScript': [],
        'TypeScript': [],
        'Styles': [],
        'Documents': [],
        'Images': [],
        'Configuration': [],
        'Autres': []
      };

      suggestions.forEach(file => {
        const ext = file.split('.').pop()?.toLowerCase();
        switch (ext) {
          case 'js':
          case 'jsx':
            groups['JavaScript'].push(file);
            break;
          case 'ts':
          case 'tsx':
            groups['TypeScript'].push(file);
            break;
          case 'css':
          case 'scss':
          case 'sass':
          case 'less':
            groups['Styles'].push(file);
            break;
          case 'md':
          case 'txt':
          case 'doc':
          case 'pdf':
            groups['Documents'].push(file);
            break;
          case 'png':
          case 'jpg':
          case 'jpeg':
          case 'gif':
          case 'svg':
            groups['Images'].push(file);
            break;
          case 'json':
          case 'yaml':
          case 'yml':
          case 'toml':
          case 'ini':
            groups['Configuration'].push(file);
            break;
          default:
            groups['Autres'].push(file);
        }
      });

      return Object.entries(groups)
        .filter(([_, files]) => files.length > 0)
        .flatMap(([group, groupFiles]) => [
          `---${group}---`,
          ...groupFiles
        ]);
    };

    const handleFileHover = async (file: string) => {
      setHoveredFile(file);
      if (files[file]?.type === 'file' && !files[file]?.isBinary) {
        setFilePreviewContent(files[file]?.content?.slice(0, 500) || '');
      }
    };

    const toggleFavorite = (filePath: string) => {
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(filePath)) {
          newFavorites.delete(filePath);
        } else {
          newFavorites.add(filePath);
        }
        return newFavorites;
      });
    };

    const toggleFileSelection = (filePath: string, event: React.MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        setSelectedFiles(prev => {
          const newSelection = new Set(prev);
          if (newSelection.has(filePath)) {
            newSelection.delete(filePath);
          } else {
            newSelection.add(filePath);
          }
          return newSelection;
        });
      } else {
        insertFileReference(filePath);
      }
    };

    const insertSelectedFiles = () => {
      if (selectedFiles.size === 0) return;
      const filesList = Array.from(selectedFiles).join(', ');
      insertFileReference(filesList);
      setSelectedFiles(new Set());
    };

    const getFileStats = () => {
      const stats = {
        total: fileSuggestions.length,
        byExtension: {} as Record<string, number>,
        byDirectory: {} as Record<string, number>,
        averageDepth: 0
      };

      fileSuggestions.forEach(file => {
        const ext = file.split('.').pop()?.toLowerCase() || 'sans extension';
        const dir = file.split('/').slice(0, -1).join('/') || '/';
        const depth = file.split('/').length - 1;

        stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
        stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1;
        stats.averageDepth += depth;
      });

      stats.averageDepth /= fileSuggestions.length || 1;
      return stats;
    };

    const handleGenerateDebugPlan = async () => {
      if (!provider || !model) {
        toast.error('Veuillez sélectionner un provider et un modèle');
        return;
      }

      const debugPrompt = `En tant que ${provider.name} utilisant le modèle ${model}, générez un plan de débogage détaillé au format Markdown qui inclut :

1. Diagnostics
   - Critical bugs & system errors
   - Performance bottlenecks
   - UX/UI issues & inconsistencies

2. Methodology
   - Strategic breakpoints placement
   - Key state monitoring
   - Test scenarios & edge cases

3. Validation
   - Functional testing
   - Regression testing
   - Performance benchmarking

4. Technical Stack
   - Chrome DevTools
   - React DevTools
   - Lighthouse metrics

5. Optimization
   - Cache & memory management
   - Response time improvement
   - Security vulnerabilities

6. Execution
   - Fix prioritization
   - Detailed timeline

Basez-vous sur l'état actuel du projet des conversations et des fichiers disponibles. crere un fichier detaillier en .md dans un dossier docs`;

      try {
        if (sendMessage) {
          const dummyElement = document.createElement('button');
          const syntheticEvent = {
            altKey: false,
            button: 0,
            buttons: 0,
            clientX: 0,
            clientY: 0,
            ctrlKey: false,
            currentTarget: dummyElement,
            detail: 0,
            eventPhase: 0,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            pageX: 0,
            pageY: 0,
            relatedTarget: null,
            screenX: 0,
            screenY: 0,
            shiftKey: false,
            target: dummyElement,
            timeStamp: Date.now(),
            type: 'click',
            view: window,
            bubbles: true,
            cancelable: true,
            defaultPrevented: false,
            isDefaultPrevented: () => false,
            isPropagationStopped: () => false,
            isTrusted: true,
            nativeEvent: new MouseEvent('click'),
            preventDefault: () => {},
            stopPropagation: () => {},
            persist: () => {},
          } as unknown as React.UIEvent;

          const response = await sendMessage(syntheticEvent, debugPrompt);
          if (response) {
            const blob = new Blob([response], { type: 'text/markdown;charset=utf-8' });
            saveAs(blob, `debug_plan_${new Date().toISOString().split('T')[0]}.md`);
            toast.success('Plan de débogage généré avec succès !');
          }
        }
      } catch (error) {
        toast.error('Erreur lors de la génération du plan de débogage');
        console.error(error);
      }
    };

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full overflow-hidden')}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex flex-col lg:flex-row overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[1vh] w-full text-center px-4">
                <h1 className="text-4xl lg:text-7xl font-extrabold text-bolt-elements-textPrimary mb-6 animate-fade-in bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                  Votre assistant IA intelligent
                </h1>
                <p className="text-lg lg:text-2xl mb-8 text-bolt-elements-textSecondary animate-fade-in animation-delay-200 w-full max-w-4xl mx-auto leading-relaxed">
                  Transformez vos idées en réalité instantanément avec notre IA avancée. De la conception à la mise en production, nous vous accompagnons dans chaque étape de votre processus créatif avec des solutions innovantes et performantes.
                </p>
                <div className="flex flex-col gap-4 items-center animate-fade-in animation-delay-400">
                  <p className="text-xl lg:text-3xl font-bold text-bolt-elements-textPrimary bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                    Imaginez. Codez. Déployez. Innovez.
                  </p>
                  <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full"></div>
                </div>
              </div>
            )}
            <div
              className={classNames('pt-6 px-2 sm:px-6', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col w-full flex-1 max-w-chat pb-6 mx-auto z-1"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames('flex flex-col gap-4 w-full max-w-chat mx-auto z-prompt mb-6', {
                  'sticky bottom-2': chatStarted,
                })}
              >
                <div className="bg-bolt-elements-background-depth-2">
                  {actionAlert && (
                    <ChatAlert
                      alert={actionAlert}
                      clearAlert={() => clearAlert?.()}
                      postMessage={(message) => {
                        sendMessage?.({} as any, message);
                        clearAlert?.();
                      }}
                    />
                  )}
                </div>
                <div
                  className={classNames(
                    'bg-bolt-elements-background-depth-2 p-3 rounded-lg border border-bolt-elements-borderColor relative w-full max-w-chat mx-auto z-prompt',

                    /*
                     * {
                     *   'sticky bottom-2': chatStarted,
                     * },
                     */
                  )}
                >
                  <svg className={classNames(styles.PromptEffectContainer)}>
                    <defs>
                      <linearGradient
                        id="line-gradient"
                        x1="20%"
                        y1="0%"
                        x2="-14%"
                        y2="10%"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="rotate(-45)"
                      >
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0%"></stop>
                        <stop offset="40%" stopColor="#8B5CF6" stopOpacity="90%"></stop>
                        <stop offset="50%" stopColor="#8B5CF6" stopOpacity="90%"></stop>
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0%"></stop>
                      </linearGradient>
                      <linearGradient 
                        id="shine-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
                        <stop offset="40%" stopColor="#ffffff" stopOpacity="90%"></stop>
                        <stop offset="50%" stopColor="#ffffff" stopOpacity="90%"></stop>
                        <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <rect 
                      className={classNames(styles.PromptEffectLine)} 
                      pathLength="100" 
                      strokeLinecap="round"
                      filter="url(#glow)"
                    ></rect>
                    <rect 
                      className={classNames(styles.PromptShine)} 
                      x="48" 
                      y="24" 
                      width="70" 
                      height="2"
                      filter="url(#glow)"
                    ></rect>
                  </svg>
                  <div>
                    <ClientOnly>
                      {() => (
                        <div className={isModelSettingsCollapsed ? 'hidden' : ''}>
                          <ModelSelector
                            key={provider?.name + ':' + modelList.length}
                            model={model}
                            setModel={setModel}
                            modelList={modelList}
                            provider={provider}
                            setProvider={setProvider}
                            providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                            apiKeys={apiKeys}
                            modelLoading={isModelLoading}
                            error={modelError}
                          />
                          {(providerList || []).length > 0 && provider && (
                            <APIKeyManager
                              provider={provider}
                              apiKey={apiKeys[provider.name] || ''}
                              setApiKey={(key) => {
                                onApiKeysChange(provider.name, key);
                              }}
                            />
                          )}
                        </div>
                      )}
                    </ClientOnly>
                  </div>
                  <FilePreview
                    files={uploadedFiles}
                    imageDataList={imageDataList}
                    onRemove={(index) => {
                      setUploadedFiles?.(uploadedFiles.filter((_, i) => i !== index));
                      setImageDataList?.(imageDataList.filter((_, i) => i !== index));
                    }}
                  />
                  <ClientOnly>
                    {() => (
                      <ScreenshotStateManager
                        setUploadedFiles={setUploadedFiles}
                        setImageDataList={setImageDataList}
                        uploadedFiles={uploadedFiles}
                        imageDataList={imageDataList}
                      />
                    )}
                  </ClientOnly>
                  <div
                    className={classNames(
                      'relative shadow-xs border border-bolt-elements-borderColor backdrop-blur rounded-lg',
                    )}
                  >
                    <textarea
                      ref={textareaRef}
                      className={classNames(
                        'w-full pl-4 pt-4 pr-16 outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm',
                        'transition-all duration-200',
                        'hover:border-bolt-elements-focus',
                      )}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.border = '2px solid #1488fc';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.border = '2px solid #1488fc';
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

                        const files = Array.from(e.dataTransfer.files);
                        files.forEach((file) => {
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();

                            reader.onload = (e) => {
                              const base64Image = e.target?.result as string;
                              setUploadedFiles?.([...uploadedFiles, file]);
                              setImageDataList?.([...imageDataList, base64Image]);
                            };
                            reader.readAsDataURL(file);
                          }
                        });
                      }}
                      onKeyDown={handleKeyDown}
                      value={input}
                      onChange={handleInputChange}
                      onPaste={handlePaste}
                      style={{
                        minHeight: TEXTAREA_MIN_HEIGHT,
                        maxHeight: TEXTAREA_MAX_HEIGHT,
                      }}
                      placeholder={chatStarted ? "Posez vos questions ou partagez vos idées... (Utilisez @ pour référencer des fichiers, Entrée pour envoyer)" : "Posez vos questions ou partagez vos idées... (Entrée pour envoyer)"}
                      translate="no"
                    />
                    {showFileSuggestions && fileSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 w-full bg-[#1a1b26] border border-[#2f3241] rounded-lg max-h-[300px] overflow-y-auto z-50 mb-2 shadow-lg backdrop-blur-xl">
                        <div className="sticky top-0 bg-[#13141f] px-4 py-2 border-b border-[#2f3241]">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-white/70">
                                {fileSuggestions.length} fichier{fileSuggestions.length > 1 ? 's' : ''} trouvé{fileSuggestions.length > 1 ? 's' : ''}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSearchMode(mode => 
                                    mode === 'simple' ? 'regex' : mode === 'regex' ? 'fuzzy' : 'simple'
                                  )}
                                  className="text-xs px-2 py-1 rounded bg-[#2f3241] text-white/70 hover:text-white transition-all duration-150"
                                  title="Changer le mode de recherche"
                                >
                                  <span className={classNames(
                                    "mr-2",
                                    searchMode === 'simple' ? "i-ph:magnifying-glass" :
                                    searchMode === 'regex' ? "i-ph:code" : "i-ph:sparkle"
                                  )} />
                                  {searchMode === 'simple' ? 'Simple' : 
                                   searchMode === 'regex' ? 'Regex' : 'Fuzzy'}
                                </button>
                                <button
                                  onClick={() => setShowFileStats(!showFileStats)}
                                  className="text-xs px-2 py-1 rounded bg-[#2f3241] text-white/70 hover:text-white transition-all duration-150"
                                >
                                  <span className="i-ph:chart-bar mr-2" />
                                  Stats
                                </button>
                                <button
                                  onClick={() => setGroupByType(!groupByType)}
                                  className={classNames(
                                    "text-xs px-2 py-1 rounded transition-all duration-150",
                                    groupByType ? "bg-purple-500 text-white" : "bg-[#2f3241] text-white/70 hover:text-white"
                                  )}
                                >
                                  <span className="i-ph:folders-duotone mr-2" />
                                  Grouper
                                </button>
                                {selectedFiles.size > 0 && (
                                  <button
                                    onClick={insertSelectedFiles}
                                    className="text-xs px-2 py-1 rounded bg-purple-500 text-white transition-all duration-150"
                                  >
                                    <span className="i-ph:check-circle mr-2" />
                                    Insérer ({selectedFiles.size})
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 text-xs text-white/50">
                              <kbd className="px-1.5 py-0.5 rounded bg-[#2f3241]">↑↓</kbd>
                              <span>naviguer</span>
                              <kbd className="px-1.5 py-0.5 rounded bg-[#2f3241]">↵</kbd>
                              <span>sélectionner</span>
                              <kbd className="px-1.5 py-0.5 rounded bg-[#2f3241]">Ctrl+Click</kbd>
                              <span>multi-sélection</span>
                              <kbd className="px-1.5 py-0.5 rounded bg-[#2f3241]">esc</kbd>
                              <span>fermer</span>
                            </div>
                          </div>
                        </div>
                        <div className="relative flex">
                          <div className="flex-1 py-1 bg-[#1a1b26]">
                            {showFileStats && (
                              <div className="px-4 py-2 bg-[#13141f] border-b border-[#2f3241] text-xs">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-purple-400 mb-1">Extensions</h4>
                                    {Object.entries(getFileStats().byExtension)
                                      .sort(([,a], [,b]) => b - a)
                                      .slice(0, 5)
                                      .map(([ext, count]) => (
                                        <div key={ext} className="flex justify-between text-white/70">
                                          <span>{ext}</span>
                                          <span>{count}</span>
                                        </div>
                                      ))
                                    }
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-purple-400 mb-1">Dossiers principaux</h4>
                                    {Object.entries(getFileStats().byDirectory)
                                      .sort(([,a], [,b]) => b - a)
                                      .slice(0, 5)
                                      .map(([dir, count]) => (
                                        <div key={dir} className="flex justify-between text-white/70">
                                          <span className="truncate flex-1 mr-2">{dir || '/'}</span>
                                          <span>{count}</span>
                                        </div>
                                      ))
                                    }
                                  </div>
                                </div>
                              </div>
                            )}
                            {getGroupedSuggestions(fileSuggestions).map((file, index) => {
                              if (file.startsWith('---') && file.endsWith('---')) {
                                return (
                                  <div key={file} className="px-4 py-2 text-xs font-medium text-purple-400 bg-[#13141f]">
                                    {file.replace(/---/g, '')}
                                  </div>
                                );
                              }

                              const segments = file.split('/');
                              const fileName = segments.pop();
                              const directory = segments.join('/');
                              const fileExtension = fileName?.split('.').pop()?.toLowerCase();
                              const iconClass = getFileTypeIcon(fileExtension);
                              const isSelected = index === selectedSuggestionIndex;
                              const isMultiSelected = selectedFiles.has(file);
                              const isFavorite = favorites.has(file);
                              
                              return (
                                <button
                                  key={file}
                                  className={classNames(
                                    "w-full px-4 py-2.5 text-left group transition-all duration-150",
                                    isSelected ? "bg-[#2f3241]" : "bg-[#1a1b26] hover:bg-[#2f3241]",
                                    { "border-l-2 border-purple-500": isMultiSelected }
                                  )}
                                  onClick={(e) => toggleFileSelection(file, e)}
                                  onMouseEnter={() => {
                                    setSelectedSuggestionIndex(index);
                                    handleFileHover(file);
                                  }}
                                  onMouseLeave={() => setHoveredFile(null)}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`${iconClass} text-xl transition-all duration-150`} />
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="text-white font-medium truncate">
                                        {fileName}
                                      </span>
                                      {directory && (
                                        <span className="text-xs text-white/50 group-hover:text-white/70 truncate transition-all duration-150">
                                          {directory}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(file);
                                      }}
                                    >
                                      <span className={classNames(
                                        "text-lg",
                                        isFavorite ? "i-ph:star-fill text-yellow-400" : "i-ph:star text-white/50 hover:text-white"
                                      )} />
                                    </button>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {hoveredFile && filePreviewContent && (
                            <div className="w-[400px] border-l border-[#2f3241] bg-[#13141f] overflow-hidden">
                              <div className="p-4">
                                <div className="text-xs font-medium text-white/70 mb-2">Aperçu du fichier</div>
                                <pre className="text-xs text-white/90 font-mono overflow-x-auto">
                                  {filePreviewContent}
                                  {filePreviewContent.length >= 500 && (
                                    <span className="text-white/50">...</span>
                                  )}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <ClientOnly>
                      {() => (
                        <SendButton
                          show={input.length > 0 || isStreaming || uploadedFiles.length > 0}
                          isStreaming={isStreaming}
                          disabled={!providerList || providerList.length === 0}
                          onClick={(event) => {
                            if (isStreaming) {
                              handleStop?.();
                              return;
                            }

                            if (input.length > 0 || uploadedFiles.length > 0) {
                              handleSendMessage?.(event);
                            }
                          }}
                        />
                      )}
                    </ClientOnly>
                    <div className="flex justify-between items-center text-sm p-4 pt-2">
                      <div className="flex gap-1 items-center">
                        <IconButton title="Upload file" className="transition-all" onClick={() => handleFileUpload()}>
                          <div className="i-ph:paperclip text-xl"></div>
                        </IconButton>
                        <IconButton
                          title="Enhance prompt"
                          disabled={input.length === 0 || enhancingPrompt}
                          className={classNames('transition-all', enhancingPrompt ? 'opacity-100' : '')}
                          onClick={() => {
                            enhancePrompt?.();
                            toast.success('Prompt amélioré !');
                          }}
                        >
                          {enhancingPrompt ? (
                            <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl animate-spin"></div>
                          ) : (
                            <div className="i-bolt:stars text-xl"></div>
                          )}
                        </IconButton>

                        {chatStarted && (
                          <>
                            <IconButton
                              title="Générer un plan de débogage"
                              className="transition-all"
                              onClick={handleGenerateDebugPlan}
                              disabled={!provider || !model}
                            >
                              <FaBug className="text-xl text-red-500 hover:text-red-600" />
                            </IconButton>
                          </>
                        )}

                        <SpeechRecognitionButton
                          isListening={isListening}
                          onStart={startListening}
                          onStop={stopListening}
                          disabled={isStreaming}
                        />
                        {chatStarted && <ClientOnly>{() => <ExportChatButton exportChat={exportChat} />}</ClientOnly>}
                        <IconButton
                          title="Model Settings"
                          className={classNames('transition-all flex items-center gap-1', {
                            'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent':
                              isModelSettingsCollapsed,
                            'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault':
                              !isModelSettingsCollapsed,
                          })}
                          onClick={() => setIsModelSettingsCollapsed(!isModelSettingsCollapsed)}
                          disabled={!providerList || providerList.length === 0}
                        >
                          <div className={`i-ph:caret-${isModelSettingsCollapsed ? 'right' : 'down'} text-lg`} />
                          {isModelSettingsCollapsed ? <span className="text-xs">{model}</span> : <span />}
                        </IconButton>
                      </div>
                      {input.length > 3 ? (
                        <div className="text-xs text-bolt-elements-textTertiary">
                          Appuyez sur <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Maj</kbd>{' '}
                          + <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Entrée</kbd>{' '}
                          pour insérer un saut de ligne
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-5">
              {!chatStarted && (
                <div className="flex justify-center gap-2">
                  {ImportButtons(importChat, sendMessage)}
                  <GitCloneButton importChat={importChat} />
                </div>
              )}
              {!chatStarted &&
                ExamplePrompts((event, messageInput) => {
                  if (isStreaming) {
                    handleStop?.();
                    return;
                  }

                  handleSendMessage?.(event, messageInput);
                })}
              {!chatStarted && <StarterTemplates />}
            </div>
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);
