/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { Message } from 'ai';
import React, { type RefCallback, useEffect, useState, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { MODEL_LIST, PROVIDER_LIST, initializeModelList } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { APIKeyManager } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';

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
import type { ActionAlert } from '~/types/actions';
import ChatAlert from './ChatAlert';
import { v4 as uuidv4 } from 'uuid';

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
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
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
}

interface CustomPrompt {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
  color: string;
}

interface Prompts {
  custom: CustomPrompt[];
  development: CustomPrompt[];
  design: CustomPrompt[];
  features: CustomPrompt[];
  documentation: CustomPrompt[];
  tests: CustomPrompt[];
  security: CustomPrompt[];
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
      handleInputChange,

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
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
      const savedKeys = Cookies.get('apiKeys');

      if (savedKeys) {
        try {
          return JSON.parse(savedKeys);
        } catch (error) {
          console.error('Failed to parse API keys from cookies:', error);
          return {};
        }
      }

      return {};
    });
    const [modelList, setModelList] = useState(MODEL_LIST);
    const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
    const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [customPrompts, setCustomPrompts] = useState(() => {
      const savedPrompts = Cookies.get('customPrompts');
      if (savedPrompts) {
        try {
          return JSON.parse(savedPrompts);
        } catch (error) {
          console.error('Failed to parse custom prompts from cookies:', error);
          return [];
        }
      }
      return [];
    });
    const [isCustomPromptModalOpen, setIsCustomPromptModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
    const [activeTab, setActiveTab] = useState('predefined'); // 'predefined' ou 'custom'

    const [prompts, setPrompts] = useState<Prompts>({
      custom: [],
      development: [
        {
          id: 'dev-1',
          icon: 'i-ph:code',
          title: 'Refactorisation',
          description: 'Améliorer la maintenabilité du code',
          prompt: 'Peux-tu refactoriser ce code pour le rendre plus maintenable ?',
          color: 'from-blue-400 to-cyan-500',
        },
        {
          id: 'dev-2',
          icon: 'i-ph:bug',
          title: 'Débogage',
          description: 'Identifier et corriger les bugs',
          prompt: 'Peux-tu m\'aider à déboguer ce code et identifier les problèmes potentiels ?',
          color: 'from-blue-400 to-cyan-500',
        },
        {
          id: 'dev-3',
          icon: 'i-ph:arrows-clockwise',
          title: 'Optimisation',
          description: 'Améliorer les performances',
          prompt: 'Comment puis-je optimiser ce code pour de meilleures performances ?',
          color: 'from-blue-400 to-cyan-500',
        },
        {
          id: 'dev-4',
          icon: 'i-ph:git-branch',
          title: 'Architecture',
          description: 'Conseils sur la structure du code',
          prompt: 'Peux-tu me conseiller sur la meilleure architecture pour ce projet ?',
          color: 'from-blue-400 to-cyan-500',
        },
        {
          id: 'dev-5',
          icon: 'i-ph:brain',
          title: 'Patterns & Best Practices',
          description: 'Suggestions de design patterns',
          prompt: 'Quels design patterns et meilleures pratiques recommandes-tu pour ce code ?',
          color: 'from-blue-400 to-cyan-500',
        },
        {
          id: 'dev-6',
          icon: 'i-ph:code-block',
          title: 'Clean Code',
          description: 'Améliorer la lisibilité',
          prompt: 'Comment puis-je rendre ce code plus propre et plus lisible selon les principes SOLID ?',
          color: 'from-blue-400 to-cyan-500',
        }
      ],
      design: [
        {
          id: 'design-1',
          icon: 'i-ph:paint-brush',
          title: 'UI Design',
          description: 'Amélioration de l\'interface',
          prompt: 'Peux-tu suggérer des améliorations pour rendre cette interface plus attrayante et moderne ?',
          color: 'from-pink-400 to-rose-500',
        },
        {
          id: 'design-2',
          icon: 'i-ph:user-focus',
          title: 'UX Design',
          description: 'Expérience utilisateur',
          prompt: 'Comment puis-je am��liorer l\'expérience utilisateur de cette interface ?',
          color: 'from-pink-400 to-rose-500',
        },
        {
          id: 'design-3',
          icon: 'i-ph:devices',
          title: 'Responsive Design',
          description: 'Adaptation multi-écrans',
          prompt: 'Peux-tu m\'aider à rendre cette interface responsive et adaptative ?',
          color: 'from-pink-400 to-rose-500',
        },
        {
          id: 'design-4',
          icon: 'i-ph:accessibility',
          title: 'Accessibilité',
          description: 'Standards WCAG',
          prompt: 'Comment puis-je améliorer l\'accessibilité de cette interface selon les normes WCAG ?',
          color: 'from-pink-400 to-rose-500',
        },
        {
          id: 'design-5',
          icon: 'i-ph:sparkle',
          title: 'Animations',
          description: 'Animations et transitions',
          prompt: "Peux-tu suggérer des animations et transitions pour enrichir l'expérience utilisateur ?",
          color: 'from-pink-400 to-rose-500',
        },
        {
          id: 'design-6',
          icon: 'i-ph:image-square',
          title: 'Images Placeholder',
          description: 'Ajout d\'images via placeholder',
          prompt: "Peux-tu intégrer des images via un service de placeholder Placeholder.com dans mon projet ? Je voudrais pouvoir facilement ajouter des images temporaires sans texte juste en couleur .",
          color: 'from-pink-400 to-rose-500',
        },
      ],
      features: [
        {
          id: 'feat-1',
          icon: 'i-ph:plus-circle',
          title: 'Nouvelle Fonctionnalité',
          description: 'Ajout de fonctionnalité',
          prompt: "Peux-tu me suggérer et implémenter de nouvelles fonctionnalités additionnelles pour mon projet, sans modifier les fonctionnalités existantes ? Je souhaiterais également que tu crées un fichier README.md détaillé contenant :\n\nUne présentation complète du projet et de son architecture\nLes instructions détaillées pour l'installation et la configuration\nDes exemples concrets d'utilisation avec des cas pratiques\nUne section sur la contribution pour les développeurs externes (conventions de code, process de PR, etc.)\nUne documentation des nouvelles fonctionnalités ajoutées\n\nMerci de préserver l'intégralité des fonctionnalités actuelles et de n'ajouter que des améliorations complémentaires.",
          color: 'from-green-400 to-emerald-500',
        },
        {
          id: 'feat-3',
          icon: 'i-ph:cloud-arrow-up',
          title: 'Cloud Integration',
          description: 'Services cloud',
          prompt: "Peux-tu m'aider à intégrer ce service cloud dans mon application ?",
          color: 'from-green-400 to-emerald-500',
        },
        {
          id: 'feat-4',
          icon: 'i-ph:database',
          title: 'Base de données',
          description: 'Modélisation des données',
          prompt: 'Comment puis-je optimiser la structure de ma base de données pour cette fonctionnalité ?',
          color: 'from-green-400 to-emerald-500',
        },
        {
          id: 'feat-5',
          icon: 'i-ph:api',
          title: 'API Integration',
          description: "Intégration d\'APIs",
          prompt: "Peux-tu m\'aider à intégrer cette API dans mon application ?",
          color: 'from-green-400 to-emerald-500',
        },
      ],
      documentation: [
        {
          id: 'doc-1',
          icon: 'i-ph:book-open',
          title: 'Documentation',
          description: 'Générer une documentation complète',
          prompt: 'Peux-tu générer une documentation complète pour ce code ?',
          color: 'from-green-400 to-emerald-500',
        },
        {
          id: 'doc-2',
          icon: 'i-ph:file-text',
          title: 'README',
          description: 'Créer un fichier README',
          prompt: 'Peux-tu m\'aider à créer un fichier README complet pour ce projet ?',
          color: 'from-green-400 to-emerald-500',
        },
        {
          id: 'doc-3',
          icon: 'i-ph:translate',
          title: 'Commentaires',
          description: 'Ajouter des commentaires explicatifs',
          prompt: 'Peux-tu ajouter des commentaires pertinents pour expliquer ce code ?',
          color: 'from-green-400 to-emerald-500',
        },
        {
          id: 'doc-4',
          icon: 'i-ph:flow-arrow',
          title: 'Diagrammes',
          description: 'Générer des diagrammes explicatifs',
          prompt: 'Peux-tu créer des diagrammes pour expliquer le flux de données de ce code ?',
          color: 'from-green-400 to-emerald-500',
        },
      ],
      tests: [
        {
          id: 'test-1',
          icon: 'i-ph:test-tube',
          title: 'Tests unitaires',
          description: 'Générer des tests unitaires',
          prompt: 'Peux-tu générer des tests unitaires pour ce code ?',
          color: 'from-purple-400 to-indigo-500',
        },
        {
          id: 'test-2',
          icon: 'i-ph:cube',
          title: 'Tests d\'intégration',
          description: 'Créer des tests d\'intégration',
          prompt: 'Peux-tu créer des tests d\'intégration pour vérifier les interactions entre les composants ?',
          color: 'from-purple-400 to-indigo-500',
        },
      ],
      security: [
        {
          id: 'sec-1',
          icon: 'i-ph:shield-check',
          title: 'Analyse de sécurité',
          description: 'Détecter les vulnérabilités',
          prompt: 'Peux-tu analyser ce code pour détecter des vulnérabilités de sécurité ?',
          color: 'from-red-400 to-rose-500',
        },
        {
          id: 'sec-2',
          icon: 'i-ph:lock',
          title: 'Authentification',
          description: 'Sécuriser l\'authentification',
          prompt: 'Peux-tu vérifier et améliorer la sécurité de l\'authentification ?',
          color: 'from-red-400 to-rose-500',
        },
        {
          id: 'sec-3',
          icon: 'i-ph:encryption',
          title: 'Chiffrement',
          description: 'Implémenter le chiffrement',
          prompt: 'Comment puis-je implémenter correctement le chiffrement des données sensibles ?',
          color: 'from-red-400 to-rose-500',
        },
        {
          id: 'sec-4',
          icon: 'i-ph:shield-warning',
          title: 'OWASP Top 10',
          description: 'Vérifier les risques OWASP',
          prompt: 'Peux-tu vérifier si ce code est vulnérable aux risques du Top 10 OWASP ?',
          color: 'from-red-400 to-rose-500',
        },
      ],
    });

    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      // Load API keys from cookies on component mount

      let parsedApiKeys: Record<string, string> | undefined = {};

      try {
        const storedApiKeys = Cookies.get('apiKeys');

        if (storedApiKeys) {
          const parsedKeys = JSON.parse(storedApiKeys);

          if (typeof parsedKeys === 'object' && parsedKeys !== null) {
            setApiKeys(parsedKeys);
            parsedApiKeys = parsedKeys;
          }
        }
      } catch (error) {
        console.error('Error loading API keys from cookies:', error);

        // Clear invalid cookie data
        Cookies.remove('apiKeys');
      }

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

      initializeModelList({ apiKeys: parsedApiKeys, providerSettings }).then((modelList) => {
        console.log('Model List: ', modelList);
        setModelList(modelList);
      });

      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          setTranscript(transcript);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: transcript },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, []);

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
          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
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

    // Fonction pour sauvegarder les prompts personnalisés
    const saveCustomPrompts = (_prompts: Prompts) => {
      setCustomPrompts(_prompts);
      Cookies.set('customPrompts', JSON.stringify(_prompts));
    };

    // Fonction pour ajouter/modifier un prompt personnalisé
    const handleSaveCustomPrompt = (promptData: {
      title: string;
      description: string;
      prompt: string;
      icon: string;
      color: string;
    }) => {
      if (editingPrompt) {
        // Mode modification : mettre à jour le prompt existant
        setPrompts((prevPrompts: Prompts) => ({
          ...prevPrompts,
          custom: prevPrompts.custom.map((p: CustomPrompt) =>
            p.id === editingPrompt.id
              ? { ...p, ...promptData }
              : p
          ),
        }));
      } else {
        // Mode création : ajouter un nouveau prompt
        const newPrompt = {
          ...promptData,
          id: uuidv4(),
        };

        setPrompts((prevPrompts: Prompts) => ({
          ...prevPrompts,
          custom: [...prevPrompts.custom, newPrompt],
        }));
      }

      setIsCustomPromptModalOpen(false);
      setEditingPrompt(null);
    };

    // Fonction pour supprimer un prompt personnalisé
    const handleDeletePrompt = (promptId: string) => {
      setPrompts((prevPrompts: Prompts) => ({
        ...prevPrompts,
        custom: prevPrompts.custom.filter((p: CustomPrompt) => p.id !== promptId),
      }));
    };

    // Combiner les prompts prédéfinis et personnalisés
    const allPrompts = useMemo(() => {
      return {
        ...prompts,
        custom: customPrompts
      };
    }, [customPrompts]);

    // Mettre à jour le filtrage pour inclure les prompts personnalisés
    const filteredPrompts = useMemo(() => {
      if (!searchQuery) {
        return prompts;
      }

      const filtered: Prompts = {
        custom: [],
        development: [],
        design: [],
        features: [],
        documentation: [],
        tests: [],
        security: [],
      };

      Object.entries(prompts).forEach(([category, items]) => {
        filtered[category as keyof Prompts] = items.filter((item: CustomPrompt) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      });

      return filtered;
    }, [prompts, searchQuery]);

    // Fonction pour générer le composant de prompt
    const PromptButton = ({ item, _category }: { item: CustomPrompt; _category: string }) => (
      <button
        className="text-left p-4 rounded-xl border border-bolt-elements-borderColor/30 hover:bg-bolt-elements-background-depth-2/50 hover:border-bolt-elements-borderColor/50 transition-all group relative overflow-hidden"
        onClick={() => {
          handleInputChange?.({ target: { value: item.prompt }} as any);
          setIsPromptsModalOpen(false);
        }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-5`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] backdrop-blur-[1px]" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className={`${item.icon} text-xl bg-gradient-to-br ${item.color} group-hover:scale-110 transition-transform`} />
            <div className="text-sm font-medium text-bolt-elements-textPrimary group-hover:text-transparent group-hover:bg-gradient-to-br group-hover:bg-clip-text ${item.color} transition-all">
              {item.title}
            </div>
          </div>
          <div className="text-xs text-bolt-elements-textTertiary mt-2 ml-8 group-hover:text-bolt-elements-textSecondary transition-colors">
            {item.description}
          </div>
        </div>
      </button>
    );

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const prompt = formData.get('prompt') as string;
      const icon = (formData.get('icon') as string) || 'i-ph:star';
      const color = (formData.get('color') as string) || 'from-purple-400 to-indigo-500';

      if (!title || !description || !prompt) {
        return;
      }

      handleSaveCustomPrompt({
        title,
        description,
        prompt,
        icon,
        color,
      });
    };

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full overflow-hidden')}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex flex-col lg:flex-row overflow-y-auto w-full h-full">
          <div className={classNames(
            styles.Chat,
            'flex flex-col flex-grow h-full transition-all duration-300',
            {
              'lg:min-w-[var(--chat-min-width)]': chatStarted,
              'lg:w-full': !chatStarted,
            }
          )}>
            {!chatStarted && (
              <div id="intro" className="mt-[10vh] max-w-[800px] mx-auto text-center px-4 lg:px-0">
                <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-purple-700 via-purple-600 to-violet-700 bg-clip-text text-transparent mb-8 animate-[fade-in-up_0.5s_ease-out] tracking-tight hover:scale-102 transition-transform rounded-lg p-3 shadow-lg hover:shadow-xl">
                  Votre Assistant
                </h1>
                <p className="text-xl lg:text-2xl mb-12 text-bolt-elements-textSecondary/80 animate-[fade-in-up_0.7s_ease-out] animation-delay-200 font-light tracking-wide hover:text-bolt-elements-textPrimary transition-colors">
                  L'intelligence artificielle au service de votre développement
                </p>
                <div className="w-32 h-1 bg-gradient-to-r from-indigo-600/20 via-blue-500/20 to-violet-600/20 mx-auto rounded-full animate-pulse hover:w-48 transition-all duration-300"></div>
              </div>
            )}
            <div
              className={classNames('pt-6 px-2 sm:px-6',
              {
                'h-full flex flex-col': chatStarted,
                'max-w-[800px] mx-auto w-full': !chatStarted,
              }
            )}>
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
              <div className={classNames(
                'bg-bolt-elements-background-depth-2 p-3 rounded-lg border border-bolt-elements-borderColor relative w-full mx-auto z-prompt mb-6',
                {
                  'sticky bottom-2': chatStarted,
                  'max-w-[800px]': !chatStarted,
                }
              )}>
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
                      <stop offset="0%" stopColor="#b44aff" stopOpacity="0%"></stop>
                      <stop offset="40%" stopColor="#b44aff" stopOpacity="80%"></stop>
                      <stop offset="50%" stopColor="#b44aff" stopOpacity="80%"></stop>
                      <stop offset="100%" stopColor="#b44aff" stopOpacity="0%"></stop>
                    </linearGradient>
                    <linearGradient id="shine-gradient">
                      <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
                      <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
                      <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
                    </linearGradient>
                  </defs>
                  <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
                  <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
                </svg>
                <div>
                  <div className="w-full flex justify-center gap-3 mb-4">
                    <Dialog.Root open={isModelSettingsOpen} onOpenChange={setIsModelSettingsOpen}>
                      <Dialog.Trigger asChild>
                        <IconButton
                          title="Paramètres du modèle"
                          className={classNames(
                            styles.ModelSettingsButton,
                            'transition-all flex items-center justify-between w-[280px] px-4 py-2.5 rounded-xl',
                            'hover:bg-bolt-elements-item-backgroundAccent/10',
                            'border border-bolt-elements-borderColor/40',
                            'backdrop-blur-md shadow-sm',
                            {
                              'bg-bolt-elements-background-depth-1/60 text-bolt-elements-textSecondary': !isModelSettingsOpen,
                              'bg-bolt-elements-background-depth-2/60 text-bolt-elements-textPrimary': isModelSettingsOpen,
                            }
                          )}
                          disabled={!providerList || providerList.length === 0}
                        >
                          <div className="flex items-center gap-3">
                            <div className="i-ph:gear-duotone text-xl opacity-70" />
                            <div className="flex flex-col items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium whitespace-nowrap">
                                  {provider?.name || 'Sélectionner un provider'}
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-borderColor/50" />
                              </div>
                              <span className="text-[11px] text-bolt-elements-textTertiary whitespace-nowrap">
                                {model || 'Choisir un modèle'}
                              </span>
                            </div>
                          </div>
                          <div className="i-ph:caret-right text-base opacity-50 transition-transform duration-200" />
                        </IconButton>
                      </Dialog.Trigger>

                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] overflow-y-auto z-50">
                          <div className="bg-bolt-elements-background-depth-3 rounded-xl shadow-xl border border-bolt-elements-borderColor/30">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-bolt-elements-borderColor">
                              <div className="flex items-center gap-3">
                                <div className="i-ph:gear-duotone text-xl text-bolt-elements-textSecondary" />
                                <div>
                                  <h3 className="text-base font-semibold text-bolt-elements-textPrimary">
                                    Configuration du Modèle
                                  </h3>
                                  <p className="text-xs text-bolt-elements-textTertiary mt-0.5">
                                    Personnalisez les paramètres de votre assistant
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor/40">
                                  <div className="i-ph:cube text-sm text-bolt-elements-textTertiary" />
                                  <span className="text-sm text-bolt-elements-textTertiary">
                                    {provider?.name || 'Aucun provider'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor/40">
                                  <div className="i-ph:robot text-sm text-bolt-elements-textTertiary" />
                                  <span className="text-sm text-bolt-elements-textTertiary">
                                    {model || 'Aucun modèle'}
                                  </span>
                                </div>
                                <Dialog.Close asChild>
                                  <IconButton className="ml-2 hover:bg-bolt-elements-background-depth-1" title="Fermer">
                                    <div className="i-ph:x text-xl" />
                                  </IconButton>
                                </Dialog.Close>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                              <div className="flex flex-col space-y-6">
                                <div className="flex flex-col gap-5">
                                  <ModelSelector
                                    key={provider?.name + ':' + modelList.length}
                                    model={model}
                                    setModel={setModel}
                                    modelList={modelList}
                                    provider={provider}
                                    setProvider={setProvider}
                                    providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                                    apiKeys={apiKeys}
                                    isProjectOpen={chatStarted}
                                  />
                                </div>

                                {/* Section API Key */}
                                {(providerList || []).length > 0 && provider && (
                                  <div className="pt-4 border-t border-bolt-elements-borderColor">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="i-ph:key-duotone text-xl text-bolt-elements-textSecondary" />
                                      <div>
                                        <h3 className="text-base font-semibold text-bolt-elements-textSecondary">
                                          Configuration de l'API
                                        </h3>
                                        <p className="text-xs text-bolt-elements-textTertiary mt-0.5">
                                          Gérez vos clés d'API pour accéder aux services
                                        </p>
                                      </div>
                                    </div>
                                    <APIKeyManager
                                      provider={provider}
                                      apiKey={apiKeys[provider.name] || ''}
                                      setApiKey={(key) => {
                                        const newApiKeys = { ...apiKeys, [provider.name]: key };
                                        setApiKeys(newApiKeys);
                                        Cookies.set('apiKeys', JSON.stringify(newApiKeys));
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>

                    <Dialog.Root open={isPromptsModalOpen} onOpenChange={setIsPromptsModalOpen}>
                      <Dialog.Trigger asChild>
                        <IconButton
                          title="Sélection de prompts"
                          className={classNames(
                            styles.ModelSettingsButton,
                            'transition-all flex items-center justify-between w-[280px] px-4 py-2.5 rounded-xl',
                            'hover:bg-bolt-elements-item-backgroundAccent/10',
                            'border border-bolt-elements-borderColor/40',
                            'backdrop-blur-md shadow-sm',
                            'bg-bolt-elements-background-depth-1/60 text-bolt-elements-textSecondary'
                          )}
                          disabled={!chatStarted}
                        >
                          <div className="flex items-center gap-3">
                            <div className="i-ph:list-bullets text-xl opacity-70" />
                            <div className="flex flex-col items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium whitespace-nowrap">
                                  Actions prédéfinis
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-bolt-elements-borderColor/50" />
                              </div>
                              <span className="text-[11px] text-bolt-elements-textTertiary whitespace-nowrap">
                                {!chatStarted ? "Ouvrez un projet pour accéder aux actions" : "Sélectionner une action"}
                              </span>
                            </div>
                          </div>
                          <div className="i-ph:caret-right text-base opacity-50" />
                        </IconButton>
                      </Dialog.Trigger>

                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[85vh] overflow-hidden z-50">
                          <div className="bg-bolt-elements-background-depth-3 rounded-xl shadow-xl border border-bolt-elements-borderColor/30 flex flex-col h-[85vh]">
                            {/* Header avec onglets */}
                            <div className="flex flex-col border-b border-bolt-elements-borderColor">
                              <div className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-3">
                                  <div className="i-ph:list-bullets text-xl text-bolt-elements-textSecondary" />
                                  <div>
                                    <h3 className="text-base font-semibold text-bolt-elements-textPrimary">
                                      Bibliothèque d'actions
                                    </h3>
                                    <p className="text-xs text-bolt-elements-textTertiary mt-0.5">
                                      {activeTab === 'predefined' ? 'Actions prédéfinies' : 'Actions personnalisées'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {activeTab === 'custom' && (
                                    <button
                                      onClick={() => {
                                        setEditingPrompt(null);
                                        setIsCustomPromptModalOpen(true);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-bolt-elements-borderColor/40 bg-bolt-elements-background-depth-1/60 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-2/60 transition-all"
                                    >
                                      <div className="i-ph:plus text-xl" />
                                      <span className="text-sm">Nouvelle action</span>
                                    </button>
                                  )}
                                  <div className="relative">
                                    <div className="i-ph:magnifying-glass text-xl absolute left-3 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary" />
                                    <input
                                      type="text"
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                      placeholder="Rechercher une action..."
                                      className="w-72 pl-10 pr-4 py-2 text-sm rounded-xl border border-bolt-elements-borderColor/40 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:border-bolt-elements-borderColor focus:ring-1 focus:ring-bolt-elements-borderColor/50 transition-all"
                                    />
                                  </div>
                                  <Dialog.Close asChild>
                                    <IconButton className="ml-2 hover:bg-bolt-elements-background-depth-1" title="Fermer">
                                      <div className="i-ph:x text-xl" />
                                    </IconButton>
                                  </Dialog.Close>
                                </div>
                              </div>

                              {/* Onglets */}
                              <div className="flex px-5 gap-6">
                                <button
                                  onClick={() => setActiveTab('predefined')}
                                  className={classNames(
                                    'px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2',
                                    activeTab === 'predefined'
                                      ? 'border-indigo-500 text-indigo-500'
                                      : 'border-transparent text-bolt-elements-text hover:text-bolt-elements-textSecondary',
                                  )}
                                >
                                  <div className="i-ph:question text-xl" />
                                  Actions prédéfinies
                                </button>
                                <button
                                  onClick={() => setActiveTab('custom')}
                                  className={classNames(
                                    'px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2',
                                    activeTab === 'custom'
                                      ? 'border-purple-500 text-purple-500'
                                      : 'border-transparent text-bolt-elements-text hover:text-bolt-elements-textSecondary',
                                  )}
                                >
                                  <div className="i-ph:star text-xl" />
                                  Mes Actions
                                </button>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                              {activeTab === 'predefined' ? (
                                <div className="grid grid-cols-2 gap-6">
                                  {Object.entries(filteredPrompts)
                                    .filter(([category]) => category !== 'custom')
                                    .map(([category, items]) => (
                                    <div key={category} className="mb-6">
                                      <div className="flex items-center gap-3 mb-4">
                                        <div
                                          className={classNames(
                                            'text-xl',
                                            category === 'development'
                                              ? 'i-ph:code'
                                              : category === 'documentation'
                                              ? 'i-ph:book-open'
                                              : category === 'tests'
                                              ? 'i-ph:test-tube'
                                              : category === 'security'
                                              ? 'i-ph:shield-check'
                                              : category === 'design'
                                              ? 'i-ph:paint-brush'
                                              : category === 'features'
                                              ? 'i-ph:plus-circle'
                                              : 'i-ph:star'
                                          )}
                                        />
                                        <h3 className="text-base font-semibold text-bolt-elements-textPrimary">
                                          {category === 'development'
                                            ? 'Développement'
                                            : category === 'documentation'
                                            ? 'Documentation'
                                            : category === 'tests'
                                            ? 'Tests'
                                            : category === 'security'
                                            ? 'Sécurité'
                                            : category === 'design'
                                            ? 'Design'
                                            : category === 'features'
                                            ? 'Fonctionnalités'
                                            : category}
                                        </h3>
                                      </div>

                                      <div className="grid grid-cols-1 gap-3">
                                        {items.map((item: CustomPrompt) => (
                                          <button
                                            key={item.id}
                                            className="group flex items-center gap-4 p-4 rounded-xl border border-bolt-elements-borderColor/40 bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-2/60 transition-all"
                                            onClick={() => {
                                              handleInputChange?.({ target: { value: item.prompt }} as any);
                                              setIsPromptsModalOpen(false);
                                            }}
                                          >
                                            <div
                                              className={classNames(
                                                item.icon,
                                                'text-2xl bg-gradient-to-br',
                                                item.color,
                                                'group-hover:scale-110 transition-transform'
                                              )}
                                            />
                                            <div className="flex-grow text-left">
                                              <div className="text-sm font-medium text-bolt-elements-textPrimary mb-1">
                                                {item.title}
                                              </div>
                                              <div className="text-xs text-bolt-elements-textSecondary">
                                                {item.description}
                                              </div>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {filteredPrompts.custom.length > 0 ? (
                                    filteredPrompts.custom.map((item: CustomPrompt) => (
                                      <div
                                        key={item.id}
                                        className="group flex items-center gap-4 p-5 rounded-xl border border-bolt-elements-borderColor/40 bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-2/60 transition-all"
                                      >
                                        <div
                                          className={classNames(
                                            item.icon,
                                            'text-2xl bg-gradient-to-br',
                                            item.color,
                                            'group-hover:scale-110 transition-transform'
                                          )}
                                        />
                                        <div className="flex-grow">
                                          <div className="text-sm font-medium text-bolt-elements-textPrimary mb-1">
                                            {item.title}
                                          </div>
                                          <div className="text-xs text-bolt-elements-textSecondary mb-2">
                                            {item.description}
                                          </div>
                                          <div className="text-xs text-bolt-elements-textTertiary">
                                            {item.prompt}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <IconButton
                                            title="Utiliser"
                                            className="p-2.5 hover:bg-bolt-elements-background-depth-2"
                                            onClick={() => {
                                              handleInputChange?.({ target: { value: item.prompt }} as any);
                                              setIsPromptsModalOpen(false);
                                            }}
                                          >
                                            <div className="i-ph:arrow-right text-base text-bolt-elements-textTertiary" />
                                          </IconButton>
                                          <IconButton
                                            title="Modifier"
                                            className="p-2.5 hover:bg-bolt-elements-background-depth-2"
                                            onClick={() => {
                                              setEditingPrompt(item);
                                              setIsCustomPromptModalOpen(true);
                                            }}
                                          >
                                            <div className="i-ph:pencil text-base text-bolt-elements-textTertiary" />
                                          </IconButton>
                                          <IconButton
                                            title="Supprimer"
                                            className="p-2.5 hover:bg-bolt-elements-background-depth-2"
                                            onClick={() => handleDeletePrompt(item.id)}
                                          >
                                            <div className="i-ph:trash text-base text-bolt-elements-textTertiary" />
                                          </IconButton>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-16">
                                      <div className="i-ph:note-pencil text-5xl mx-auto mb-6 text-bolt-elements-textTertiary" />
                                      <h3 className="text-base font-semibold text-bolt-elements-textSecondary mb-3">
                                        Aucune action personnalisée
                                      </h3>
                                      <p className="text-sm text-bolt-elements-textTertiary mb-8">
                                        Créez votre première action personnalisée pour commencer
                                      </p>
                                      <button
                                        onClick={() => {
                                          setEditingPrompt(null);
                                          setIsCustomPromptModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-bolt-elements-borderColor/40 bg-bolt-elements-background-depth-1/60 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-2/60 transition-all"
                                      >
                                        <div className="i-ph:plus text-xl" />
                                        <span className="text-sm">Créer une action</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
                              <div className="text-xs text-bolt-elements-textTertiary">
                                {activeTab === 'predefined'
                                  ? 'Astuce : Utilisez la recherche pour trouver rapidement une action spécifique'
                                  : 'Astuce : Créez des actions personnalisées pour vos besoins spécifiques'}
                              </div>
                            </div>
                          </div>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
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
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          if (event.shiftKey) {
                            return;
                          }

                          event.preventDefault();

                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          // ignore if using input method engine
                          if (event.nativeEvent.isComposing) {
                            return;
                          }

                          handleSendMessage?.(event);
                        }
                      }}
                      value={input}
                      onChange={(event) => {
                        handleInputChange?.(event);
                      }}
                      onPaste={handlePaste}
                      style={{
                        minHeight: TEXTAREA_MIN_HEIGHT,
                        maxHeight: TEXTAREA_MAX_HEIGHT,
                      }}
                      placeholder="Par exemple : Aide-moi à créer une application de gestion de tâches avec React et TypeScript. Je souhaite implémenter l'authentification, une base de données, et des fonctionnalités de collaboration en temps réel. Guide-moi étape par étape dans ce projet."
                      translate="no"
                    />
                    <ClientOnly>
                      {() => (
                        <>
                          {input.length > 0 && (
                            <IconButton
                              title="Effacer"
                              className="absolute flex justify-center items-center top-[18px] right-[64px] p-1 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary rounded-md w-[34px] h-[34px] transition-theme"
                              onClick={() => {
                                if (handleInputChange) {
                                  const syntheticEvent = {
                                    target: { value: '' },
                                  } as React.ChangeEvent<HTMLTextAreaElement>;
                                  handleInputChange(syntheticEvent);
                                }
                              }}
                            >
                              <div className="i-ph:eraser text-lg" />
                            </IconButton>
                          )}
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
                        </>
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
                            toast.success('Prompt enhanced!');
                          }}
                        >
                          {enhancingPrompt ? (
                            <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl animate-spin"></div>
                          ) : (
                            <div className="i-bolt:stars text-xl"></div>
                          )}
                        </IconButton>

                        <SpeechRecognitionButton
                          isListening={isListening}
                          onStart={startListening}
                          onStop={stopListening}
                          disabled={isStreaming}
                        />
                        {chatStarted && <ClientOnly>{() => <ExportChatButton exportChat={exportChat} />}</ClientOnly>}
                      </div>
                      {input.length > 3 ? (
                        <div className="text-xs text-bolt-elements-textTertiary">
                          Use <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd> +{' '}
                          <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Return</kbd> a
                          new line
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {!chatStarted && (
              <div className="flex flex-col items-center gap-6 max-w-[800px] mx-auto">
                <div className="flex justify-center gap-2">
                  {ImportButtons(importChat)}
                  <GitCloneButton importChat={importChat} />
                </div>
                {ExamplePrompts((event, messageInput) => {
                  if (isStreaming) {
                    handleStop?.();
                    return;
                  }

                  handleSendMessage?.(event, messageInput);
                })}
              </div>
            )}
          </div>
          <ClientOnly>
            {() => chatStarted && <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}
          </ClientOnly>
        </div>
        {actionAlert && (
          <Dialog.Root open={true}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
              <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50">
                <ChatAlert
                  alert={actionAlert}
                  clearAlert={() => clearAlert?.()}
                  postMessage={(message) => {
                    sendMessage?.({} as any, message);
                    clearAlert?.();
                  }}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Modal de création/modification de prompt personnalisé */}
        <Dialog.Root open={isCustomPromptModalOpen} onOpenChange={setIsCustomPromptModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] overflow-hidden z-50">
              <div className="bg-bolt-elements-background-depth-3 rounded-lg shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor">
                  <div className="flex items-center gap-3">
                    <div className="i-ph:star text-lg text-bolt-elements-textSecondary" />
                    <h3 className="text-sm font-medium text-bolt-elements-textPrimary">
                      {editingPrompt ? 'Modifier le prompt' : 'Nouveau prompt'}
                    </h3>
                  </div>
                  <Dialog.Close asChild>
                    <IconButton className="ml-2" title="Fermer">
                      <div className="i-ph:x text-lg" />
                    </IconButton>
                  </Dialog.Close>
                </div>

                {/* Content */}
                <form
                  className="p-4"
                  onSubmit={handleFormSubmit}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                        Titre
                      </label>
                      <input
                        type="text"
                        name="title"
                        defaultValue={editingPrompt?.title}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-bolt-elements-borderColor/30 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:border-bolt-elements-borderColor focus:ring-1 focus:ring-bolt-elements-borderColor/50 transition-all"
                        placeholder="Titre du prompt"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        defaultValue={editingPrompt?.description}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-bolt-elements-borderColor/30 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:border-bolt-elements-borderColor focus:ring-1 focus:ring-bolt-elements-borderColor/50 transition-all"
                        placeholder="Description du prompt"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                        Prompt
                      </label>
                      <textarea
                        name="prompt"
                        defaultValue={editingPrompt?.prompt}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-bolt-elements-borderColor/30 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary focus:outline-none focus:border-bolt-elements-borderColor focus:ring-1 focus:ring-bolt-elements-borderColor/50 transition-all resize-none h-24"
                        placeholder="Entrez votre prompt ici..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                          Icône
                        </label>
                        <select
                          name="icon"
                          defaultValue={editingPrompt?.icon || 'i-ph:star'}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-bolt-elements-borderColor/30 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-borderColor focus:ring-1 focus:ring-bolt-elements-borderColor/50 transition-all"
                        >
                          <option value="i-ph:star">Étoile</option>
                          <option value="i-ph:code">Code</option>
                          <option value="i-ph:file-text">Document</option>
                          <option value="i-ph:lightbulb">Idée</option>
                          <option value="i-ph:rocket">Fusée</option>
                          <option value="i-ph:gear">Engrenage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">
                          Couleur
                        </label>
                        <select
                          name="color"
                          defaultValue={editingPrompt?.color || 'from-purple-400 to-indigo-500'}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-bolt-elements-borderColor/30 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary focus:outline-none focus:border-bolt-elements-borderColor focus:ring-1 focus:ring-bolt-elements-borderColor/50 transition-all"
                        >
                          <option value="from-purple-400 to-indigo-500">Violet</option>
                          <option value="from-blue-400 to-cyan-500">Bleu</option>
                          <option value="from-green-400 to-emerald-500">Vert</option>
                          <option value="from-red-400 to-rose-500">Rouge</option>
                          <option value="from-orange-400 to-amber-500">Orange</option>
                          <option value="from-pink-400 to-fuchsia-500">Rose</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-3 mt-6">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="px-4 py-2 text-xs rounded-lg border border-bolt-elements-borderColor/30 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-2/50 transition-all"
                      >
                        Annuler
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-600 transition-all"
                    >
                      {editingPrompt ? 'Mettre à jour' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);
