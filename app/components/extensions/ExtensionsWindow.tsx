import React, { useEffect, useState } from 'react';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '../ui/Dialog';
import { toast } from 'react-toastify';
import { STARTER_TEMPLATES } from '~/utils/constants';
import { useSettings } from '~/lib/hooks/useSettings';
import { LOCAL_PROVIDERS, URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
import type { IProviderConfig } from '~/types/model';

interface Feature {
  name: string;
  description: string;
}

interface Technology {
  name: string;
  icon: string;
}

interface ExtensionItem {
  id: string;
  name: string;
  description: string;
  keyFeatures: string[];
  technologies: Technology[];
  author: string;
  updatedAt: string;
  category: string;
  demoUrl?: string;
  promptContent?: string;
  enableSteps?: {
    title: string;
    steps: string[];
  };
}

const DefaultIcon = '/icons/Default.svg';

const getProviderDescription = (name: string): string => {
  const descriptions: { [key: string]: string } = {
    'OpenAI': 'GPT-3.5, GPT-4',
    'Anthropic': 'Claude 2, Claude Instant',
    'Ollama': 'Modèles locaux',
    'LMStudio': 'Interface locale',
    'OpenAILike': 'Compatible OpenAI',
  };
  return descriptions[name] || 'Service IA';
};

const DEMO_TEMPLATES: ExtensionItem[] = [
  ...STARTER_TEMPLATES.map(template => ({
    id: template.githubRepo,
    name: template.name,
    description: `Template de démarrage pour ${template.name}`,
    keyFeatures: [
      'Configuration optimisée',
      'Structure de projet moderne',
      'Bonnes pratiques intégrées',
      'Prêt pour le développement',
      'Outils de développement configurés',
      'Documentation complète'
    ],
    technologies: [
      { name: template.name, icon: template.icon || 'i-ph:code-bold' },
      { name: 'Git', icon: 'i-ph:git-branch-bold' }
    ],
    author: 'Neurocode',
    updatedAt: new Date().toLocaleDateString(),
    category: 'starters',
    demoUrl: `https://github.com/${template.githubRepo}`
  })),
  {
    id: 'debug-features',
    name: 'Fonctionnalités de débogage',
    description: 'Activez des outils de débogage avancés et un système de journalisation pour le développement et le dépannage.',
    keyFeatures: [
      'Outils de débogage avancés',
      'Système de logs détaillé', 
      'Traçage des performances',
      'Inspection en temps réel',
      'Points d\'arrêt intelligents',
      'Analyse de mémoire'
    ],
    technologies: [
      { name: 'Outils de débogage', icon: 'i-ph:bug-bold' },
      { name: 'Journal', icon: 'i-ph:list-bullets-bold' },
      { name: 'Performance', icon: 'i-ph:chart-line-up-bold' }
    ],
    author: 'Neurocode',
    updatedAt: '01/01/2024',
    category: 'features',
    enableSteps: {
      title: 'Activer les fonctionnalités de débogage',
      steps: [
        'Aller dans les Paramètres',
        'Naviguer vers Fonctionnalités',
        'Activer les fonctionnalités de débogage'
      ]
    }
  },
  {
    id: 'auto-select-template',
    name: 'Sélection automatique de modèle de code',
    description: 'Laissez Bolt sélectionner automatiquement le meilleur modèle de démarrage pour votre projet.',
    keyFeatures: [
      'Analyse de projet intelligente',
      'Recommandations contextuelles',
      'Sélection automatique',
      'Personnalisation facile',
      'Intégration continue',
      'Support multi-frameworks'
    ],
    technologies: [
      { name: 'Sélection IA', icon: 'i-ph:brain-bold' },
      { name: 'Modèles', icon: 'i-ph:squares-four-bold' },
      { name: 'Analyse intelligente', icon: 'i-ph:magic-wand-bold' }
    ],
    author: 'Neurocode',
    updatedAt: '01/01/2024',
    category: 'features',
    enableSteps: {
      title: 'Activer la sélection automatique de modèle',
      steps: [
        'Aller dans les Paramètres',
        'Naviguer vers Fonctionnalités',
        'Activer la sélection automatique de modèle'
      ]
    }
  },
  {
    id: 'context-optimization',
    name: 'Optimisation du contexte',
    description: 'Optimisez le contexte en retirant le contenu des fichiers du chat et en plaçant le contenu le plus récent dans le prompt système.',
    keyFeatures: [
      'Optimisation du contexte',
      'Gestion intelligente des fichiers',
      'Mise à jour automatique',
      'Réduction de la charge mémoire',
      'Performance améliorée',
      'Historique intelligent'
    ],
    technologies: [
      { name: 'Gestionnaire de contexte', icon: 'i-ph:tree-structure-bold' },
      { name: 'Gestionnaire de fichiers', icon: 'i-ph:file-text-bold' },
      { name: 'Optimiseur de mémoire', icon: 'i-ph:rocket-launch-bold' }
    ],
    author: 'Neurocode',
    updatedAt: '01/01/2024',
    category: 'features',
    enableSteps: {
      title: 'Activer l\'optimisation du contexte',
      steps: [
        'Aller dans les Paramètres',
        'Naviguer vers Fonctionnalités',
        'Activer l\'optimisation du contexte'
      ]
    }
  }
];

interface ExtensionsWindowProps {
  open: boolean;
  onClose: () => void;
}

// Clé pour le stockage local
const CUSTOM_TEMPLATES_KEY = 'neurocode_custom_templates';

// Fonction pour charger les templates personnalisés
const loadCustomTemplates = (): ExtensionItem[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Erreur lors du chargement des templates:', error);
    return [];
  }
};

// Fonction pour sauvegarder les templates personnalisés
const saveCustomTemplates = (templates: ExtensionItem[]) => {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des templates:', error);
  }
};

export function ExtensionsWindow({ open, onClose }: ExtensionsWindowProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customTemplates, setCustomTemplates] = useState<ExtensionItem[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ExtensionItem[]>([...DEMO_TEMPLATES]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplateUrl, setNewTemplateUrl] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ExtensionItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [newPromptContent, setNewPromptContent] = useState('');
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [showEnableSteps, setShowEnableSteps] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<ExtensionItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExtensionItem | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const { providers, updateProviderSettings, isLocalModel } = useSettings();
  const [filteredProviders, setFilteredProviders] = useState<IProviderConfig[]>([]);

  // Charger les templates personnalisés au démarrage
  useEffect(() => {
    const loaded = loadCustomTemplates();
    setCustomTemplates(loaded);
  }, []);

  // Gérer le filtrage des providers
  useEffect(() => {
    if (activeCategory === 'providers') {
      let newFilteredProviders: IProviderConfig[] = Object.entries(providers).map(([key, value]) => ({
        ...value,
        name: key,
      }));

      if (searchTerm && searchTerm.length > 0) {
        newFilteredProviders = newFilteredProviders.filter((provider) =>
          provider.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      if (!isLocalModel) {
        newFilteredProviders = newFilteredProviders.filter((provider) => !LOCAL_PROVIDERS.includes(provider.name));
      }

      newFilteredProviders.sort((a, b) => a.name.localeCompare(b.name));
      const regular = newFilteredProviders.filter((p) => !URL_CONFIGURABLE_PROVIDERS.includes(p.name));
      const urlConfigurable = newFilteredProviders.filter((p) => URL_CONFIGURABLE_PROVIDERS.includes(p.name));
      setFilteredProviders([...regular, ...urlConfigurable]);
    }
  }, [providers, searchTerm, isLocalModel, activeCategory]);

  // Mettre à jour les templates filtrés
  useEffect(() => {
    const allTemplates = [...DEMO_TEMPLATES, ...customTemplates];
    let filtered = allTemplates;

    if (activeCategory !== 'all' && activeCategory !== 'providers') {
      filtered = filtered.filter(template => template.category === activeCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.keyFeatures.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [searchTerm, activeCategory, sortBy, customTemplates]);

  const renderProviderCard = (provider: IProviderConfig) => {
    const isUrlConfigurable = URL_CONFIGURABLE_PROVIDERS.includes(provider.name);
    const isExpanded = expandedProvider === provider.name;

    const models = {
      'OpenAI': ['GPT-4', 'GPT-3.5 Turbo', 'GPT-3.5', 'DALL-E 3'],
      'Anthropic': ['Claude 2', 'Claude Instant', 'Claude 1.2'],
      'Ollama': ['Llama 2', 'CodeLlama', 'Mistral', 'Mixtral'],
      'LMStudio': ['Modèles locaux'],
      'OpenAILike': ['Compatible OpenAI API'],
    };

    const providerModels = models[provider.name as keyof typeof models] || [];

    return (
      <div
        key={provider.name}
        className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
          isExpanded ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800 hover:border-blue-500' 
          : 'bg-gradient-to-br from-gray-50/80 to-blue-50/50 dark:from-gray-900/20 dark:to-blue-900/10 border-gray-200 dark:border-gray-800 hover:border-blue-500'
        }`}
      >
        <div className="flex items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 transition-all duration-300 group-hover:scale-110">
              <img
                src={`/icons/${provider.name}.svg`}
                onError={(e) => {
                  e.currentTarget.src = DefaultIcon;
                }}
                alt={`${provider.name} icon`}
                className="w-10 h-10 dark:invert"
              />
            </div>
            {provider.settings.enabled && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 animate-pulse" />
            )}
          </div>

          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-bolt-elements-textPrimary">{provider.name}</h3>
              <div className="flex items-center gap-2">
                {isUrlConfigurable && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-medium border border-amber-200 dark:border-amber-800">
                    Beta
                  </span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                  provider.settings.enabled 
                    ? 'bg-green-500/10 text-green-500 border-green-200 dark:border-green-800' 
                    : 'bg-gray-500/10 text-gray-500 border-gray-200 dark:border-gray-800'
                }`}>
                  {provider.settings.enabled ? 'En ligne' : 'Hors ligne'}
                </span>
                {provider.settings.enabled && provider.settings.baseUrl && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                    <span className="i-ph:link-bold text-sm" />
                    URL personnalisée
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-bolt-elements-textSecondary mb-4">
              {getProviderDescription(provider.name)}
            </p>

            <div className="flex flex-wrap gap-2">
              {providerModels.map((model, index) => (
                <span 
                  key={index}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                    provider.settings.enabled
                      ? 'bg-white/80 dark:bg-gray-800/80 text-bolt-elements-textPrimary'
                      : 'bg-gray-100 dark:bg-gray-800/50 text-bolt-elements-textTertiary'
                  }`}
                >
                  {model}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandedProvider(isExpanded ? null : provider.name)}
              className={`p-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 text-bolt-elements-textTertiary transition-all duration-300 hover:text-bolt-elements-textPrimary hover:scale-110 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              <span className="i-ph:caret-right-bold text-xl" />
            </button>
            <button
              onClick={() => {
                updateProviderSettings(provider.name, { 
                  ...provider.settings, 
                  enabled: !provider.settings.enabled 
                });
                toast.success(`${provider.name} ${provider.settings.enabled ? 'désactivé' : 'activé'}`);
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                provider.settings.enabled
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span className={provider.settings.enabled ? "i-ph:power-bold" : "i-ph:power"} />
              {provider.settings.enabled ? 'Actif' : 'Inactif'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-bolt-elements-borderColor">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <span className="text-sm text-bolt-elements-textSecondary block mb-1">Type</span>
                  <span className="text-sm font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                    <span className={isUrlConfigurable ? "i-ph:cloud-slash-bold" : "i-ph:cloud-bold"} />
                    {isUrlConfigurable ? 'Auto-hébergé' : 'Cloud'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <span className="text-sm text-bolt-elements-textSecondary block mb-1">État</span>
                  <span className={`text-sm font-medium flex items-center gap-2 ${
                    provider.settings.enabled ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    <span className={provider.settings.enabled ? "i-ph:check-circle-bold" : "i-ph:x-circle-bold"} />
                    {provider.settings.enabled ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div>
                  <span className="text-sm text-bolt-elements-textSecondary block mb-1">Modèles</span>
                  <span className="text-sm font-medium text-bolt-elements-textPrimary flex items-center gap-2">
                    <span className="i-ph:brain-bold" />
                    {providerModels.length} disponibles
                  </span>
                </div>
              </div>
            </div>

            {isUrlConfigurable && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-bolt-elements-textSecondary">
                      URL de base
                    </label>
                    {provider.settings.enabled && (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <span className="i-ph:check-circle-bold" />
                        Connecté
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={provider.settings.baseUrl || ''}
                      onChange={(e) => {
                        const newBaseUrl = e.target.value.trim() || undefined;
                        updateProviderSettings(provider.name, { ...provider.settings, baseUrl: newBaseUrl });
                        toast.success(`URL mise à jour pour ${provider.name}`);
                      }}
                      placeholder={`URL pour ${provider.name} (ex: http://localhost:1234)`}
                      className="w-full px-4 py-3 bg-white dark:bg-bolt-elements-background-depth-4 rounded-lg border border-bolt-elements-borderColor focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 i-ph:link-bold text-lg text-bolt-elements-textTertiary" />
                  </div>
                  <p className="mt-2 text-xs text-bolt-elements-textTertiary flex items-center gap-1">
                    <span className="i-ph:info-bold" />
                    L'URL doit pointer vers une API compatible avec le format {provider.name}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={() => {
                      // TODO: Implémenter le test de connexion
                      toast.success(`Test de connexion réussi pour ${provider.name}`);
                    }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300 flex items-center gap-2"
                  >
                    <span className="i-ph:pulse-bold" />
                    Tester la connexion
                  </button>
                  <button
                    onClick={() => {
                      updateProviderSettings(provider.name, { 
                        ...provider.settings, 
                        baseUrl: undefined 
                      });
                      toast.success(`URL réinitialisée pour ${provider.name}`);
                    }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300 flex items-center gap-2"
                  >
                    <span className="i-ph:arrow-counter-clockwise-bold" />
                    Réinitialiser
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleImport = (template: ExtensionItem) => {
    const baseUrl = 'http://localhost:5173/git';
    const githubUrl = template.demoUrl || `https://github.com/${template.id}`;
    const importUrl = `${baseUrl}?url=${encodeURIComponent(githubUrl)}`;
    window.location.href = importUrl;
  };

  const handleEditPrompt = (template: ExtensionItem) => {
    setIsEditMode(true);
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateDescription(template.description);
    setNewPromptContent(template.promptContent || '');
    setIsPromptMode(true);
    setShowAddTemplate(true);
  };

  const handleAddTemplate = () => {
    if (isPromptMode) {
      if (!newTemplateName || !newTemplateDescription || !newPromptContent) {
        alert('Veuillez remplir tous les champs');
        return;
      }

      if (isEditMode && editingTemplate) {
        // Mode édition
        const updatedTemplates = customTemplates.map(template => 
          template.id === editingTemplate.id 
            ? {
                ...template,
                name: newTemplateName,
                description: newTemplateDescription,
                promptContent: newPromptContent,
                updatedAt: new Date().toLocaleDateString()
              }
            : template
        );
        setCustomTemplates(updatedTemplates);
        saveCustomTemplates(updatedTemplates);
        toast.success('Prompt modifié avec succès');
      } else {
        // Mode création
        const newPrompt: ExtensionItem = {
          id: `prompt-${Date.now()}`,
          name: newTemplateName,
          description: newTemplateDescription,
          keyFeatures: ['Prompt personnalisé'],
          technologies: [{ name: 'Prompt', icon: 'i-ph:chat-centered-text' }],
          author: 'Vous',
          updatedAt: new Date().toLocaleDateString(),
          category: 'prompts',
          enableSteps: {
            title: 'Activer les fonctionnalités de débogage',
            steps: [
              'Aller dans les Paramètres',
              'Naviguer vers Fonctionnalités',
              'Activer les fonctionnalités de débogage'
            ]
          }
        };

        const updatedTemplates = [...customTemplates, newPrompt];
        setCustomTemplates(updatedTemplates);
        saveCustomTemplates(updatedTemplates);
        toast.success('Prompt ajouté avec succès');
      }

      // Réinitialiser le formulaire
      setNewTemplateName('');
      setNewTemplateDescription('');
      setNewPromptContent('');
      setShowAddTemplate(false);
      setIsEditMode(false);
      setEditingTemplate(null);
    } else {
      if (!newTemplateUrl || !newTemplateName || !newTemplateDescription) {
        alert('Veuillez remplir tous les champs');
        return;
      }

      // Extraire le nom du repo et le propriétaire depuis l'URL GitHub
      const match = newTemplateUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        alert('URL GitHub invalide');
        return;
      }

      const [, owner, repo] = match;
      
      // Créer le nouveau template
      const newTemplate: ExtensionItem = {
        id: repo,
        name: newTemplateName,
        description: newTemplateDescription,
        keyFeatures: [],
        technologies: [{ name: 'GitHub', icon: 'i-ph:github-logo' }],
        author: owner,
        updatedAt: new Date().toLocaleDateString(),
        category: 'custom',
        demoUrl: newTemplateUrl
      };

      // Ajouter le template à la liste personnalisée
      const updatedTemplates = [...customTemplates, newTemplate];
      setCustomTemplates(updatedTemplates);
      saveCustomTemplates(updatedTemplates);

      // Réinitialiser le formulaire
      setNewTemplateUrl('');
      setNewTemplateName('');
      setNewTemplateDescription('');
      setShowAddTemplate(false);

      // Importer le template
      const baseUrl = 'http://localhost:5173/git';
      const importUrl = `${baseUrl}?url=${encodeURIComponent(newTemplateUrl)}`;
      window.location.href = importUrl;
    }
  };

  const handleDelete = (template: ExtensionItem) => {
    if (template.category === 'prompts') {
      const updatedTemplates = customTemplates.filter(t => t.id !== template.id);
      setCustomTemplates(updatedTemplates);
      saveCustomTemplates(updatedTemplates);
      
      // Si le template en cours d'édition est supprimé, fermer la modal d'édition
      if (editingTemplate?.id === template.id) {
        setShowAddTemplate(false);
        setIsEditMode(false);
        setEditingTemplate(null);
      }
    }
  };

  const handleViewDetails = (template: ExtensionItem) => {
    setSelectedTemplate(template);
    setShowDetails(true);
  };

  const handleUseFeature = (template: ExtensionItem) => {
    setSelectedFeature(template);
    setShowEnableSteps(true);
  };

  const categories = [
    { id: 'all', name: 'Tous les Templates', icon: 'i-ph:squares-four-bold' },
    { id: 'starters', name: 'Starters', icon: 'i-ph:rocket-launch-bold' },
    { id: 'prompts', name: 'Prompts', icon: 'i-ph:chat-centered-text-bold' },
    { id: 'features', name: 'Fonctionnalités', icon: 'i-ph:puzzle-piece-bold' },
    { id: 'providers', name: 'Fournisseurs', icon: 'i-ph:cloud-bold' },
  ];

  const sortOptions = [
    { id: 'recent', name: 'Plus récents', icon: 'i-ph:clock' },
  ];

  const handleGotIt = () => {
    setShowEnableSteps(false);
    // Ouvrir l'onglet Features
    window.dispatchEvent(new CustomEvent('open-settings', { 
      detail: { tab: 'features' } 
    }));
  };

  return (
    <DialogRoot open={open}>
      <Dialog 
        onClose={onClose} 
        onBackdrop={onClose} 
        className="w-[95vw] h-[95vh] max-w-[1800px] min-w-[1000px] m-auto rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20"
      >
        <div className="flex h-full">
          {/* Sidebar gauche avec les catégories */}
          <div className="w-80 border-r border-bolt-elements-borderColor bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-y-auto">
            <div className="p-6 border-b border-bolt-elements-borderColor bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text animate-gradient">
                    {activeCategory === 'providers' ? 'Providers' : 'Extensions'}
                  </h2>
                  <p className="text-sm text-bolt-elements-textTertiary mt-1">
                    {activeCategory === 'providers' 
                      ? 'Gérez vos fournisseurs de modèles IA'
                      : 'Découvrez et importez des templates'
                    }
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:rotate-90 hover:scale-110"
                >
                  <span className="i-ph:x-bold text-xl" />
                </button>
              </div>

              <div className="relative group">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-4 py-3 pl-11 text-sm bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 group-hover:shadow-lg"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 i-ph:magnifying-glass-bold text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300 ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 scale-105 hover:scale-105'
                        : 'text-bolt-elements-textSecondary hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:scale-102'
                    }`}
                  >
                    <span className={`${category.icon} text-xl ${
                      activeCategory === category.id
                        ? 'animate-bounce-subtle'
                        : ''
                    }`} />
                    <span>{category.name}</span>
                    <span className={`ml-auto text-sm px-2.5 py-0.5 rounded-md transition-all duration-300 ${
                      activeCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'
                    }`}>
                      {category.id === 'providers' 
                        ? filteredProviders.length
                        : category.id === 'all'
                        ? filteredTemplates.length
                        : filteredTemplates.filter(t => t.category === category.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 mt-auto">
              <button
                onClick={() => setShowAddTemplate(true)}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 text-base font-medium group"
              >
                <span className="i-ph:plus-bold text-xl group-hover:rotate-180 transition-transform duration-300" />
                Ajouter un template
              </button>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* En-tête */}
            <div className="px-8 py-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-bolt-elements-borderColor flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {activeCategory === 'all' ? 'Tous les templates' : categories.find(c => c.id === activeCategory)?.name}
                  </h3>
                  <p className="text-sm text-bolt-elements-textTertiary mt-1">
                    {activeCategory === 'providers' 
                      ? `${filteredProviders.length} ${filteredProviders.length > 1 ? 'fournisseurs disponibles' : 'fournisseur disponible'}`
                      : `${filteredTemplates.length} ${filteredTemplates.length > 1 ? 'templates disponibles' : 'template disponible'}`
                    }
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 group-hover:shadow-lg"
                    >
                      {sortOptions.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 i-ph:caret-down-bold text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Zone de contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-transparent via-white/50 to-blue-50/30 dark:via-gray-900/50 dark:to-blue-950/20">
              {activeCategory === 'providers' ? (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {filteredProviders.filter(p => !URL_CONFIGURABLE_PROVIDERS.includes(p.name)).map(renderProviderCard)}
                  </div>

                  {filteredProviders.some(p => URL_CONFIGURABLE_PROVIDERS.includes(p.name)) && (
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="i-ph:beaker-bold text-xl text-amber-500" />
                        <div>
                          <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Expérimental</h3>
                          <p className="text-xs text-amber-500">Configuration avancée requise</p>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {filteredProviders.filter(p => URL_CONFIGURABLE_PROVIDERS.includes(p.name)).map(renderProviderCard)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 pb-8">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`group rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] p-6 ${
                        template.category === 'prompts'
                          ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/10 border-purple-200 dark:border-purple-800 hover:border-purple-500'
                          : template.category === 'features'
                          ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800 hover:border-green-500'
                          : 'bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800 hover:border-blue-500'
                      }`}
                    >
                      {/* En-tête de la carte */}
                      <div className="flex items-start justify-between gap-4 mb-6 group">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                            template.category === 'prompts'
                              ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/30'
                              : template.category === 'features'
                              ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/30'
                              : 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/30'
                          }`}>
                            <span className={`text-2xl transition-all duration-300 group-hover:rotate-12 ${
                              template.category === 'prompts'
                                ? 'i-ph:chat-centered-text-bold text-purple-500 dark:text-purple-400'
                                : template.category === 'features'
                                ? 'i-ph:puzzle-piece-bold text-green-500 dark:text-green-400'
                                : 'i-ph:code-bold text-blue-500 dark:text-blue-400'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              {template.category === 'prompts' ? (
                                <span className="px-3 py-1 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-lg shadow-purple-500/20 transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-2px]">
                                  PROMPT
                                </span>
                              ) : template.category === 'features' ? (
                                <span className="px-3 py-1 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg shadow-green-500/20 transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-2px]">
                                  FEATURE
                                </span>
                              ) : (
                                <span className="px-3 py-1 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:shadow-xl group-hover:translate-y-[-2px]">
                                  TEMPLATE
                                </span>
                              )}
                            </div>
                            <h3 className="text-2xl font-bold text-bolt-elements-textPrimary transition-all duration-300 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-purple-600">{template.name}</h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {template.category === 'starters' && (
                            <button
                              onClick={() => handleViewDetails(template)}
                              className="p-2.5 rounded-xl transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 hover:scale-110 hover:rotate-12"
                              title="Voir les détails"
                            >
                              <span className="i-ph:info-bold text-xl" />
                            </button>
                          )}
                          {template.category === 'prompts' ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditPrompt(template)}
                                className="px-4 py-2.5 rounded-xl text-base font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                              >
                                <span className="i-ph:pencil-simple-bold text-xl group-hover:rotate-12" />
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(template.promptContent || '');
                                  toast.success('Prompt copié dans le presse-papiers');
                                }}
                                className="px-4 py-2.5 rounded-xl text-base font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:scale-105 flex items-center gap-2"
                              >
                                <span className="i-ph:copy-bold text-xl group-hover:rotate-12" />
                                Copier
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer ce prompt ?')) {
                                    handleDelete(template);
                                    toast.success('Prompt supprimé avec succès');
                                  }
                                }}
                                className="px-4 py-2.5 rounded-xl text-base font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                              >
                                <span className="i-ph:trash-bold text-xl group-hover:rotate-12" />
                                Supprimer
                              </button>
                            </div>
                          ) : template.category === 'features' ? (
                            <button
                              onClick={() => handleUseFeature(template)}
                              className="px-4 py-2.5 rounded-xl text-base font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-xl hover:scale-105 flex items-center gap-2"
                            >
                              <span className="i-ph:toggle-right text-xl group-hover:rotate-12" />
                              Activer
                            </button>
                          ) : (
                            <button
                              onClick={() => handleImport(template)}
                              className="px-4 py-2.5 rounded-xl text-base font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105 flex items-center gap-2"
                            >
                              <span className="i-ph:download-simple text-xl group-hover:rotate-12" />
                              Importer
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-base text-bolt-elements-textSecondary mb-6 transition-all duration-300 group-hover:text-bolt-elements-textPrimary">{template.description}</p>

                      {/* Technologies */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {template.technologies.map((tech, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 hover:scale-105 ${
                              template.category === 'prompts'
                                ? 'bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/30 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-500'
                                : template.category === 'features'
                                ? 'bg-gradient-to-br from-green-100/50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:border-green-500'
                                : 'bg-gradient-to-br from-blue-100/50 to-indigo-100/50 dark:from-blue-900/30 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-500'
                            }`}
                            title={tech.name}
                          >
                            <span className={`${tech.icon} text-lg transition-all duration-300 group-hover:rotate-12 ${
                              template.category === 'prompts'
                                ? 'text-purple-500 dark:text-purple-400'
                                : template.category === 'features'
                                ? 'text-green-500 dark:text-green-400'
                                : 'text-blue-500 dark:text-blue-400'
                            }`} />
                            <span>{tech.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Fonctionnalités clés */}
                      {template.category !== 'features' && template.category !== 'prompts' && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium uppercase tracking-wider mb-3 text-bolt-elements-textTertiary">
                            {template.category === 'prompts' 
                              ? 'Capacités du Prompt'
                              : 'Caractéristiques'
                            }
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            {template.keyFeatures.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2.5 text-sm text-bolt-elements-textSecondary transition-all duration-300 hover:text-bolt-elements-textPrimary group">
                                <span className={`text-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
                                  template.category === 'prompts'
                                    ? 'i-ph:check-circle text-purple-500 dark:text-purple-400'
                                    : 'i-ph:check-circle text-blue-500 dark:text-blue-400'
                                }`} />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Métriques et informations */}
                      {template.category !== 'features' && template.category !== 'prompts' && (
                        <div className="flex items-center gap-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                          <div className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 transition-all duration-300 group-hover:scale-110">
                              <span className="i-ph:user-bold text-lg transition-all duration-300 group-hover:rotate-12" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-bolt-elements-textPrimary transition-all duration-300 group-hover:text-blue-500">
                                {template.author}
                              </div>
                              <div className="text-xs text-bolt-elements-textTertiary">
                                Auteur
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 transition-all duration-300 group-hover:scale-110">
                              <span className="i-ph:clock-bold text-lg transition-all duration-300 group-hover:rotate-12" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-bolt-elements-textPrimary transition-all duration-300 group-hover:text-blue-500">
                                {template.updatedAt}
                              </div>
                              <div className="text-xs text-bolt-elements-textTertiary">
                                Dernière mise à jour
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal d'ajout de template/prompt */}
        <DialogRoot open={showAddTemplate}>
          <Dialog 
            onClose={() => setShowAddTemplate(false)} 
            onBackdrop={() => setShowAddTemplate(false)}
            className="w-[80vw] h-[90vh] max-w-[1600px] min-w-[1000px] m-auto rounded-2xl bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 p-8 border-b border-bolt-elements-borderColor bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <DialogTitle className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                      {isPromptMode ? 'Ajouter un Prompt' : 'Ajouter un Template GitHub'}
                    </DialogTitle>
                    <DialogDescription className="text-bolt-elements-textSecondary text-lg">
                      {isPromptMode 
                        ? 'Créez un nouveau prompt personnalisé pour améliorer les capacités de l\'assistant'
                        : 'Importez un template depuis GitHub pour démarrer rapidement un nouveau projet'
                      }
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setIsPromptMode(false);
                        setNewTemplateName('');
                        setNewTemplateDescription('');
                        setNewTemplateUrl('');
                        setNewPromptContent('');
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                        !isPromptMode 
                          ? 'bg-white dark:bg-gray-700 shadow text-blue-500 scale-105' 
                          : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:scale-105'
                      }`}
                    >
                      <span className="i-ph:git-branch-bold text-lg" />
                      Template
                    </button>
                    <button
                      onClick={() => {
                        setIsPromptMode(true);
                        setNewTemplateName('');
                        setNewTemplateDescription('');
                        setNewTemplateUrl('');
                        setNewPromptContent('');
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                        isPromptMode 
                          ? 'bg-white dark:bg-gray-700 shadow text-blue-500 scale-105' 
                          : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:scale-105'
                      }`}
                    >
                      <span className="i-ph:chat-centered-text-bold text-lg" />
                      Prompt
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
                        {isPromptMode ? 'Nom du prompt' : 'Nom du template'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder={isPromptMode ? "Ex: Assistant React Expert" : "Ex: Mon Template E-commerce"}
                        className={`w-full px-4 py-2.5 bg-white dark:bg-bolt-elements-background-depth-4 rounded-lg border transition-colors ${
                          newTemplateName ? 'border-green-500' : 'border-bolt-elements-borderColor'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                      />
                      <p className="mt-1.5 text-xs text-bolt-elements-textTertiary">
                        {isPromptMode 
                          ? "Donnez un nom descriptif à votre prompt pour le retrouver facilement"
                          : "Choisissez un nom clair qui décrit bien votre template"
                        }
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                        placeholder={isPromptMode 
                          ? "Ex: Un prompt spécialisé pour le développement React avec des bonnes pratiques..." 
                          : "Ex: Template complet pour créer une boutique en ligne avec panier et paiement..."
                        }
                        rows={3}
                        className={`w-full px-4 py-2.5 bg-white dark:bg-bolt-elements-background-depth-4 rounded-lg border transition-colors ${
                          newTemplateDescription ? 'border-green-500' : 'border-bolt-elements-borderColor'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                      />
                      <p className="mt-1.5 text-xs text-bolt-elements-textTertiary">
                        {isPromptMode
                          ? "Décrivez les capacités et l'utilisation prévue de ce prompt"
                          : "Expliquez les fonctionnalités principales et l'objectif de votre template"
                        }
                      </p>
                    </div>

                    {isPromptMode ? (
                      <div>
                        <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
                          Contenu du prompt <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <textarea
                            value={newPromptContent}
                            onChange={(e) => setNewPromptContent(e.target.value)}
                            placeholder="Entrez les instructions détaillées pour l'assistant..."
                            rows={12}
                            className={`w-full px-4 py-2.5 bg-white dark:bg-bolt-elements-background-depth-4 rounded-lg border transition-colors ${
                              newPromptContent ? 'border-green-500' : 'border-bolt-elements-borderColor'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono`}
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.readText().then(text => setNewPromptContent(text));
                              }}
                              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary transition-colors"
                              title="Coller depuis le presse-papiers"
                            >
                              <span className="i-ph:clipboard-text-bold text-lg" />
                            </button>
                            {newPromptContent && (
                              <button
                                onClick={() => setNewPromptContent('')}
                                className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
                                title="Effacer le contenu"
                              >
                                <span className="i-ph:eraser-bold text-lg" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs text-bolt-elements-textTertiary">
                          Écrivez ou collez les instructions détaillées que l'assistant devra suivre
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
                          URL du dépôt GitHub <span className="text-red-500">*</span>
                        </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={newTemplateUrl}
                          onChange={(e) => setNewTemplateUrl(e.target.value)}
                          placeholder="https://github.com/utilisateur/repo"
                          className={`w-full px-4 py-2.5 pl-10 bg-white dark:bg-bolt-elements-background-depth-4 rounded-lg border transition-colors ${
                            newTemplateUrl ? 'border-green-500' : 'border-bolt-elements-borderColor'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 i-ph:github-logo-bold text-lg text-bolt-elements-textTertiary" />
                      </div>
                      <p className="mt-1.5 text-xs text-bolt-elements-textTertiary">
                        Collez l'URL du dépôt GitHub contenant votre template
                      </p>
                    </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-bolt-elements-borderColor">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                  <div className="text-sm text-bolt-elements-textTertiary flex items-center gap-2">
                    <span className="i-ph:info-bold text-lg" />
                    {isPromptMode 
                      ? isEditMode
                        ? "Modifiez votre prompt personnalisé"
                        : "Le prompt sera disponible dans les paramètres système"
                      : "Le template sera importé dans votre espace de travail"
                    }
                  </div>
                  <div className="flex justify-end gap-3">
                    <DialogButton 
                      type="secondary"
                      onClick={() => {
                        setShowAddTemplate(false);
                        setNewTemplateName('');
                        setNewTemplateDescription('');
                        setNewTemplateUrl('');
                        setNewPromptContent('');
                        setIsEditMode(false);
                        setEditingTemplate(null);
                      }}
                    >
                      Annuler
                    </DialogButton>
                    <button 
                      type="button"
                      onClick={handleAddTemplate}
                      disabled={isPromptMode 
                        ? !newTemplateName || !newTemplateDescription || !newPromptContent
                        : !newTemplateName || !newTemplateDescription || !newTemplateUrl
                      }
                      className={`px-4 py-2 rounded-xl text-base font-medium transition-colors flex items-center gap-2 ${
                        isPromptMode 
                          ? (!newTemplateName || !newTemplateDescription || !newPromptContent)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                          : (!newTemplateName || !newTemplateDescription || !newTemplateUrl)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      <span className={isPromptMode ? (isEditMode ? "i-ph:check-bold" : "i-ph:plus-bold") : "i-ph:download-simple-bold"} />
                      {isPromptMode 
                        ? isEditMode
                          ? 'Enregistrer les modifications'
                          : 'Ajouter le prompt'
                        : 'Importer le template'
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Dialog>
        </DialogRoot>

        {/* Modal de détails du template */}
        <DialogRoot open={showDetails}>
          <Dialog 
            onClose={() => setShowDetails(false)} 
            onBackdrop={() => setShowDetails(false)}
            className="w-[800px] p-6 rounded-xl bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 shadow-2xl"
          >
            {selectedTemplate && (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <DialogTitle className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                      {selectedTemplate.name}
                    </DialogTitle>
                    <DialogDescription className="text-bolt-elements-textSecondary">
                      {selectedTemplate.description}
                    </DialogDescription>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:rotate-90 hover:scale-110"
                  >
                    <span className="i-ph:x-bold text-xl" />
                  </button>
                </div>

                <div className="space-y-6">
                  {selectedTemplate.category === 'prompts' ? (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-bolt-elements-textPrimary uppercase tracking-wider mb-3">
                          Comment utiliser ce prompt
                        </h4>
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-lg p-4 space-y-4">
                          <div className="flex items-start gap-3 group">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 transition-all duration-300 group-hover:scale-110">1</div>
                            <div>
                              <h5 className="font-medium mb-1 transition-all duration-300 group-hover:text-blue-500">Ouvrir les Paramètres</h5>
                              <p className="text-sm text-bolt-elements-textSecondary">Cliquez sur l'icône des paramètres dans votre éditeur</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 group">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 transition-all duration-300 group-hover:scale-110">2</div>
                            <div>
                              <h5 className="font-medium mb-1 transition-all duration-300 group-hover:text-blue-500">Accéder aux Fonctionnalités</h5>
                              <p className="text-sm text-bolt-elements-textSecondary">Trouvez et sélectionnez la section "Features"</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 group">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 transition-all duration-300 group-hover:scale-110">3</div>
                            <div>
                              <h5 className="font-medium mb-1 transition-all duration-300 group-hover:text-blue-500">Changer le Prompt Système</h5>
                              <p className="text-sm text-bolt-elements-textSecondary">Localisez le menu déroulant "System Prompt" en bas et sélectionnez ce prompt</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-bolt-elements-textPrimary uppercase tracking-wider mb-3">
                          Contenu du Prompt
                        </h4>
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-lg p-4 group">
                          <pre className="whitespace-pre-wrap text-sm font-mono text-bolt-elements-textSecondary transition-all duration-300 group-hover:text-bolt-elements-textPrimary">
                            {selectedTemplate.promptContent}
                          </pre>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                    <div>
                      <h4 className="text-sm font-medium text-bolt-elements-textPrimary uppercase tracking-wider mb-3">Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.technologies.map((tech, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900/30 text-sm transition-all duration-300 hover:scale-105 group"
                          >
                            <span className={`${tech.icon} text-lg text-blue-500 dark:text-blue-400 transition-all duration-300 group-hover:rotate-12`} />
                            <span className="transition-all duration-300 group-hover:text-blue-500">{tech.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-bolt-elements-textPrimary uppercase tracking-wider mb-3">Fonctionnalités</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedTemplate.keyFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary transition-all duration-300 hover:text-bolt-elements-textPrimary group">
                            <span className="i-ph:check-circle text-green-500 dark:text-green-400 text-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    </>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-bolt-elements-borderColor">
                    <div className="flex items-center gap-4 text-sm text-bolt-elements-textTertiary">
                      <div className="flex items-center gap-1.5 group">
                        <span className="i-ph:user-bold text-lg transition-all duration-300 group-hover:rotate-12 text-blue-500" />
                        <span className="transition-all duration-300 group-hover:text-blue-500">{selectedTemplate.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5 group">
                        <span className="i-ph:clock-bold text-lg transition-all duration-300 group-hover:rotate-12 text-blue-500" />
                        <span className="transition-all duration-300 group-hover:text-blue-500">Mis à jour le {selectedTemplate.updatedAt}</span>
                      </div>
                    </div>

                    {selectedTemplate.category === 'prompts' ? (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTemplate.promptContent || '');
                          toast.success('Prompt copié dans le presse-papiers');
                        }}
                        className="px-4 py-2 rounded-xl text-base font-medium bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105 flex items-center gap-2 group"
                      >
                        <span className="i-ph:copy text-xl transition-all duration-300 group-hover:rotate-12" />
                        Copier le prompt
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleImport(selectedTemplate);
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 rounded-xl text-base font-medium bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105 flex items-center gap-2 group"
                      >
                        <span className="i-ph:download-simple text-xl transition-all duration-300 group-hover:rotate-12" />
                        Import
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </Dialog>
        </DialogRoot>

        {/* Modal d'activation des fonctionnalités */}
        <DialogRoot open={showEnableSteps}>
          <Dialog 
            onClose={() => setShowEnableSteps(false)} 
            onBackdrop={() => setShowEnableSteps(false)}
            className="w-[500px] p-6 rounded-xl bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 shadow-2xl"
          >
            {selectedFeature && selectedFeature.enableSteps && (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <DialogTitle className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                      {selectedFeature.enableSteps.title}
                    </DialogTitle>
                  </div>
                  <button
                    onClick={() => setShowEnableSteps(false)}
                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:rotate-90 hover:scale-110"
                  >
                    <span className="i-ph:x-bold text-xl" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    {selectedFeature.enableSteps.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium transition-all duration-300 group-hover:scale-110">
                          {index + 1}
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className="text-bolt-elements-textPrimary transition-all duration-300 group-hover:text-blue-500">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button
                      onClick={handleGotIt}
                      className="px-6 py-2.5 rounded-xl text-base font-medium bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-xl hover:scale-105 flex items-center gap-2 group"
                    >
                      <span className="i-ph:check-bold text-xl transition-all duration-300 group-hover:rotate-12" />
                      Got it
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog>
        </DialogRoot>
      </Dialog>
    </DialogRoot>
  );
} 