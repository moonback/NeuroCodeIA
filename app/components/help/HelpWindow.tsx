import * as RadixDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { dialogBackdropVariants, dialogVariants } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import { useState, useEffect, useCallback, useRef } from 'react';

interface HelpWindowProps {
  open: boolean;
  onClose: () => void;
}

interface TabProps {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
}

interface ShortcutConfig {
  id: string;
  category: string;
  description: string;
  defaultKey: string;
  currentKey: string;
  isEditing?: boolean;
}

const tabs: TabProps[] = [
  { id: 'guide', label: 'Guide', icon: '📚', shortcut: '1' },
  { id: 'features', label: 'Fonctionnalités', icon: '⚡', shortcut: '2' },
  { id: 'advanced', label: 'Avancé', icon: '🔧', shortcut: '3' },
  { id: 'examples', label: 'Exemples', icon: '💡', shortcut: '4' },
  { id: 'shortcuts', label: 'Raccourcis', icon: '⌨️', shortcut: '5' },
];

const codeExamples = {
  webApp: `// Exemple de création d'une application web
NeuroCode, crée une application web moderne avec :
- React et TypeScript
- Authentification utilisateur
- Base de données PostgreSQL
- API RESTful
- Interface utilisateur élégante`,

  debugging: `// Exemple de débogage assisté
NeuroCode, aide-moi à déboguer cette erreur :
TypeError: Cannot read property 'data' of undefined
at UserProfile.render (UserProfile.tsx:25)`,

  analysis: `// Exemple d'analyse de code
NeuroCode, analyse ce projet React et suggère :
- Optimisations de performance
- Meilleures pratiques
- Refactoring potentiel
- Tests unitaires manquants`,

  aiPrompt: `// Exemple de prompt IA avancé
NeuroCode, je veux créer :
- Une API GraphQL
- Avec authentification JWT
- Base de données MongoDB
- Tests d'intégration
- Documentation OpenAPI`,

  deployment: `// Exemple de déploiement
NeuroCode, configure :
- Pipeline CI/CD avec GitHub Actions
- Déploiement sur AWS
- Monitoring avec Prometheus
- Logging avec ELK Stack
- Backup automatisé`,
};

const defaultShortcuts: ShortcutConfig[] = [
  // Navigation
  { id: 'nav_tabs', category: 'Navigation', description: 'Changer d\'onglet', defaultKey: '1-5', currentKey: '1-5' },
  { id: 'nav_search', category: 'Navigation', description: 'Rechercher', defaultKey: 'Ctrl + F', currentKey: 'Ctrl + F' },
  { id: 'nav_close', category: 'Navigation', description: 'Fermer la fenêtre', defaultKey: 'Esc', currentKey: 'Esc' },
  
  // Éditeur
  { id: 'editor_suggest', category: 'Éditeur', description: 'Suggestions de code', defaultKey: 'Ctrl + Space', currentKey: 'Ctrl + Space' },
  { id: 'editor_actions', category: 'Éditeur', description: 'Actions rapides', defaultKey: 'Alt + Enter', currentKey: 'Alt + Enter' },
  { id: 'editor_comment', category: 'Éditeur', description: 'Commenter/Décommenter', defaultKey: 'Ctrl + /', currentKey: 'Ctrl + /' },
  { id: 'editor_format', category: 'Éditeur', description: 'Formater le code', defaultKey: 'Ctrl + Alt + L', currentKey: 'Ctrl + Alt + L' },
  { id: 'editor_refactor', category: 'Éditeur', description: 'Refactoring', defaultKey: 'Ctrl + Alt + R', currentKey: 'Ctrl + Alt + R' },
  
  // IA Assistant
  { id: 'ai_enhance', category: 'IA Assistant', description: 'Améliorer le prompt', defaultKey: 'Ctrl + E', currentKey: 'Ctrl + E' },
  { id: 'ai_explain', category: 'IA Assistant', description: 'Expliquer le code', defaultKey: 'Ctrl + Q', currentKey: 'Ctrl + Q' },
  { id: 'ai_test', category: 'IA Assistant', description: 'Générer des tests', defaultKey: 'Ctrl + T', currentKey: 'Ctrl + T' },
  { id: 'ai_docs', category: 'IA Assistant', description: 'Générer la documentation', defaultKey: 'Ctrl + D', currentKey: 'Ctrl + D' },
  
  // Gestion de Projet
  { id: 'proj_new', category: 'Projet', description: 'Nouvelle discussion', defaultKey: 'Ctrl + N', currentKey: 'Ctrl + N' },
  { id: 'proj_save', category: 'Projet', description: 'Sauvegarder', defaultKey: 'Ctrl + S', currentKey: 'Ctrl + S' },
  { id: 'proj_export', category: 'Projet', description: 'Exporter', defaultKey: 'Ctrl + E', currentKey: 'Ctrl + E' },
  { id: 'proj_settings', category: 'Projet', description: 'Paramètres', defaultKey: 'Ctrl + ,', currentKey: 'Ctrl + ,' },
];

export function HelpWindow({ open, onClose }: HelpWindowProps) {
  const [activeTab, setActiveTab] = useState('guide');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(defaultShortcuts);
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<{ new: ShortcutConfig; existing: ShortcutConfig } | null>(null);
  const keyListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Implémentation de la recherche en direct
    if (query.trim()) {
      const results = Object.values(codeExamples)
        .filter(example => example.toLowerCase().includes(query.toLowerCase()))
        .map(example => example.split('\n')[0]);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, []);

  const handleShortcutEdit = (shortcutId: string) => {
    setEditingShortcut(shortcutId);
    
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      if (editingShortcut) {
        const keys: string[] = [];
        if (e.ctrlKey) keys.push('Ctrl');
        if (e.altKey) keys.push('Alt');
        if (e.shiftKey) keys.push('Shift');
        if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift') {
          keys.push(e.key.toUpperCase());
        }
        
        const newKey = keys.join(' + ');
        
        // Vérifier les conflits
        const conflict = shortcuts.find(s => 
          s.currentKey === newKey && s.id !== shortcutId
        );
        
        if (conflict) {
          setConflictInfo({
            new: shortcuts.find(s => s.id === shortcutId)!,
            existing: conflict
          });
          setShowConflictModal(true);
        } else {
          setShortcuts(prev => prev.map(s => 
            s.id === shortcutId ? { ...s, currentKey: newKey } : s
          ));
        }
        
        setEditingShortcut(null);
      }
    };

    keyListenerRef.current = handleKeyPress;
    window.addEventListener('keydown', handleKeyPress);
  };

  const resetToDefault = (shortcutId: string) => {
    setShortcuts(prev => prev.map(s => 
      s.id === shortcutId ? { ...s, currentKey: s.defaultKey } : s
    ));
  };

  const resetAllToDefault = () => {
    setShortcuts(defaultShortcuts);
  };

  useEffect(() => {
    return () => {
      if (keyListenerRef.current) {
        window.removeEventListener('keydown', keyListenerRef.current);
      }
    };
  }, [editingShortcut]);

  const renderCodeExample = (code: string) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-bolt-elements-background-depth-4 rounded-lg p-4 font-mono text-sm text-bolt-elements-textSecondary overflow-x-auto"
    >
      {code.split('\n').map((line, i) => (
        <div key={i} className="whitespace-pre">{line}</div>
      ))}
    </motion.div>
  );

  const renderSearchBar = () => (
    <div className="sticky top-0 z-10 bg-bolt-elements-background-depth-2 pb-4">
      <div className="relative">
        <input
          id="help-search"
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Rechercher dans la documentation... (Ctrl + F)"
          className="w-full px-4 py-2 pl-10 bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary">
          🔍
        </span>
      </div>
      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute w-full mt-2 bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded-lg shadow-lg"
        >
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-bolt-elements-background-depth-4 cursor-pointer text-bolt-elements-textSecondary"
            >
              {result}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );

  const renderShortcutConfig = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">⌨️ Configuration des Raccourcis</h2>
        <button
          onClick={resetAllToDefault}
          className="px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-lg hover:bg-bolt-elements-button-secondary-backgroundHover transition-colors"
        >
          Réinitialiser Tout
        </button>
      </div>

      {Object.entries(groupBy(shortcuts, 'category')).map(([category, categoryShortcuts]: [string, ShortcutConfig[]]) => (
        <div key={category} className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
          <h3 className="font-medium mb-4 text-bolt-elements-textPrimary flex items-center gap-2">
            {category === 'Navigation' && '🎯'}
            {category === 'Éditeur' && '✏️'}
            {category === 'IA Assistant' && '🤖'}
            {category === 'Projet' && '📁'}
            {category}
          </h3>
          <div className="space-y-3">
            {categoryShortcuts.map((shortcut: ShortcutConfig) => (
              <div
                key={shortcut.id}
                className="flex items-center justify-between p-2 rounded hover:bg-bolt-elements-background-depth-4 transition-colors"
              >
                <span className="text-bolt-elements-textSecondary">{shortcut.description}</span>
                <div className="flex items-center gap-2">
                  {editingShortcut === shortcut.id ? (
                    <div className="px-3 py-1 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded animate-pulse">
                      Appuyez sur une touche...
                    </div>
                  ) : (
                    <>
                      <kbd
                        onClick={() => handleShortcutEdit(shortcut.id)}
                        className="px-2 py-1 bg-bolt-elements-background-depth-4 rounded text-sm text-bolt-elements-textPrimary cursor-pointer hover:ring-2 hover:ring-bolt-elements-focus transition-all"
                      >
                        {shortcut.currentKey}
                      </kbd>
                      {shortcut.currentKey !== shortcut.defaultKey && (
                        <button
                          onClick={() => resetToDefault(shortcut.id)}
                          className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary"
                          title="Réinitialiser"
                        >
                          ↺
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showConflictModal && conflictInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bolt-elements-background-depth-2 p-6 rounded-lg max-w-md">
            <h4 className="text-lg font-semibold mb-4 text-bolt-elements-textPrimary">
              Conflit de Raccourci
            </h4>
            <p className="text-bolt-elements-textSecondary mb-4">
              Ce raccourci est déjà utilisé pour "{conflictInfo.existing.description}".
              Voulez-vous le remplacer ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-lg hover:bg-bolt-elements-button-secondary-backgroundHover"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShortcuts(prev => prev.map(s => 
                    s.id === conflictInfo.new.id ? 
                      { ...s, currentKey: conflictInfo.existing.currentKey } : 
                    s.id === conflictInfo.existing.id ?
                      { ...s, currentKey: s.defaultKey } :
                      s
                  ));
                  setShowConflictModal(false);
                }}
                className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover"
              >
                Remplacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Fonction utilitaire pour grouper les raccourcis par catégorie
  function groupBy(array: ShortcutConfig[], key: keyof ShortcutConfig): Record<string, ShortcutConfig[]> {
    return array.reduce((result: Record<string, ShortcutConfig[]>, item) => {
      const keyValue = item[key] as string;
      (result[keyValue] = result[keyValue] || []).push(item);
      return result;
    }, {});
  }

  const renderShortcutsTab = () => (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">⌨️ Raccourcis Clavier</h2>
        <button
          onClick={() => setActiveTab('shortcutConfig')}
          className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover transition-colors"
        >
          Configurer les Raccourcis
        </button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
          <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">🎯 Navigation</h3>
          <div className="space-y-2">
            {shortcuts.filter(s => s.category === 'Navigation').map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-bolt-elements-textSecondary">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-bolt-elements-background-depth-4 rounded text-sm text-bolt-elements-textPrimary">
                  {shortcut.currentKey}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
          <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">⚡ Fonctionnalités</h3>
          <div className="space-y-2">
            {shortcuts.filter(s => s.category === 'Éditeur').map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-bolt-elements-textSecondary">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-bolt-elements-background-depth-4 rounded text-sm text-bolt-elements-textPrimary">
                  {shortcut.currentKey}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
          <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">✏️ Éditeur</h3>
          <div className="space-y-2">
            {shortcuts.filter(s => s.category === 'IA Assistant').map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-bolt-elements-textSecondary">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-bolt-elements-background-depth-4 rounded text-sm text-bolt-elements-textPrimary">
                  {shortcut.currentKey}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
          <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">🎨 Personnalisation</h3>
          <p className="text-bolt-elements-textSecondary mb-2">
            Configurez vos propres raccourcis dans les paramètres de l'application.
          </p>
          <button className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover transition-colors">
            Configurer les Raccourcis
          </button>
        </div>
      </div>
    </section>
  );

  const renderTabContent = () => {
    return (
      <div className="space-y-6">
        {renderSearchBar()}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'shortcuts' ? renderShortcutsTab() :
             activeTab === 'shortcutConfig' ? renderShortcutConfig() :
             renderMainContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'guide':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-bolt-elements-textPrimary">🚀 Démarrage Rapide</h2>
              <p className="mb-4 text-bolt-elements-textSecondary">
                NeuroCode est votre assistant de développement alimenté par l'IA. Voici comment commencer :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                <li>Créez une nouvelle discussion en cliquant sur "Nouvelle discussion" dans le menu latéral</li>
                <li>Décrivez votre projet ou posez vos questions en langage naturel</li>
                <li>L'IA vous guidera à travers le développement de votre projet</li>
              </ul>
              <div className="mt-4">
                {renderCodeExample(codeExamples.webApp)}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-bolt-elements-textPrimary">🎯 Bonnes Pratiques</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-bolt-elements-textPrimary">✅ À Faire</h3>
                  <ul className="space-y-2 text-bolt-elements-textSecondary">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">•</span>
                      Soyez précis dans vos descriptions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">•</span>
                      Fournissez le contexte nécessaire
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">•</span>
                      Utilisez des exemples concrets
                    </li>
                  </ul>
                </div>
                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-bolt-elements-textPrimary">❌ À Éviter</h3>
                  <ul className="space-y-2 text-bolt-elements-textSecondary">
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">•</span>
                      Questions trop vagues
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">•</span>
                      Demandes sans contexte
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">•</span>
                      Instructions contradictoires
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        );

      case 'features':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-bolt-elements-textPrimary">💫 Fonctionnalités Avancées</h2>
              <div className="space-y-4">
                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('codeGen')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">🎨 Génération de Code Intelligente</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('codeGen') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('codeGen') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Générez du code sophistiqué avec une IA qui comprend vos besoins :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>Architectures complètes d'applications</li>
                        <li>Patterns de conception optimaux</li>
                        <li>Tests automatisés</li>
                        <li>Documentation technique</li>
                      </ul>
                      <div className="mt-2">
                        {renderCodeExample(codeExamples.webApp)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('debug')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">🔍 Débogage Avancé</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('debug') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('debug') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Outils de débogage sophistiqués pour résoudre les problèmes complexes :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>Analyse de stack trace</li>
                        <li>Suggestions de correction intelligentes</li>
                        <li>Détection de fuites mémoire</li>
                        <li>Profilage de performance</li>
                      </ul>
                      <div className="mt-2">
                        {renderCodeExample(codeExamples.debugging)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('analysis')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">📊 Analyse de Projet</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('analysis') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('analysis') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Analyse approfondie de votre code et suggestions d'amélioration :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>Métriques de qualité du code</li>
                        <li>Détection de code dupliqué</li>
                        <li>Analyse de dépendances</li>
                        <li>Suggestions d'architecture</li>
                      </ul>
                      <div className="mt-2">
                        {renderCodeExample(codeExamples.analysis)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('ai')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">🤖 Intelligence Artificielle Avancée</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('ai') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('ai') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Fonctionnalités avancées basées sur l'IA :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>Génération de code contextuelle</li>
                        <li>Refactoring intelligent</li>
                        <li>Suggestions de patterns de conception</li>
                        <li>Optimisation automatique du code</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('models')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">🧠 Intégrations IA</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('models') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('models') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Modèles et intégrations d'IA disponibles :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>OpenRouter et Gemini</li>
                        <li>DeepSeek et Mistral API</li>
                        <li>xAI Grok Beta et LM Studio</li>
                        <li>HuggingFace et Cohere</li>
                        <li>Together AI et OpenAI</li>
                        <li>Modèles Ollama auto-générés</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('git')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">📂 Gestion de Projets</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('git') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('git') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Fonctionnalités de gestion de projets :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>Import Git et clonage de projets</li>
                        <li>Publication directe sur GitHub</li>
                        <li>Export de projets en ZIP</li>
                        <li>Synchronisation avec dossier local</li>
                        <li>Gestion des versions de code</li>
                        <li>Templates de démarrage</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('prompt')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">💡 Gestion des Prompts</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('prompt') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('prompt') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Fonctionnalités avancées des prompts :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>Bibliothèque de prompts personnalisés</li>
                        <li>Amélioration automatique des prompts</li>
                        <li>Mise en cache des prompts</li>
                        <li>Support des images dans les prompts</li>
                        <li>Longueur dynamique des tokens</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('dev')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">🛠️ Outils de Développement</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('dev') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('dev') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Outils pour les développeurs :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>Terminal Bolt intégré</li>
                        <li>Streaming du code en temps réel</li>
                        <li>Détection et correction d'erreurs</li>
                        <li>Sélection visuelle des changements</li>
                        <li>Installation automatique des dépendances</li>
                        <li>Conteneurisation Docker</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg cursor-pointer hover:bg-bolt-elements-background-depth-4 transition-colors"
                     onClick={() => toggleSection('ui')}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-bolt-elements-textPrimary">📱 Interface Utilisateur</h3>
                    <span className="text-bolt-elements-textTertiary">{expandedSections.includes('ui') ? '▼' : '▶'}</span>
                  </div>
                  {expandedSections.includes('ui') && (
                    <div className="mt-4 space-y-4">
                      <p className="text-bolt-elements-textSecondary">
                        Fonctionnalités d'interface :
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-bolt-elements-textSecondary">
                        <li>Design responsive et mobile-friendly</li>
                        <li>Gestion des clés API via l'interface</li>
                        <li>Filtrage des modèles par fournisseur</li>
                        <li>Prévisualisation en temps réel</li>
                        <li>Interface de sélection visuelle</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        );

      case 'advanced':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-bolt-elements-textPrimary">⚙️ Configuration Avancée</h2>
              <div className="space-y-6">
                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">🔐 Sécurité et Confidentialité</h3>
                  <div className="space-y-2 text-bolt-elements-textSecondary">
                    <p>Configuration des niveaux de sécurité :</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Chiffrement des données sensibles</li>
                      <li>Gestion sécurisée des clés API</li>
                      <li>Isolation des environnements</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">🔧 Personnalisation des Modèles</h3>
                  <div className="space-y-2 text-bolt-elements-textSecondary">
                    <p>Options de configuration avancées :</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Paramètres de température et de tokens</li>
                      <li>Prompts système personnalisés</li>
                      <li>Filtres de contenu</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">🔄 Intégration Continue</h3>
                  <div className="space-y-2 text-bolt-elements-textSecondary">
                    <p>Automatisation du workflow :</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Hooks de pré-commit</li>
                      <li>Actions automatisées</li>
                      <li>Pipelines CI/CD</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </>
        );

      case 'examples':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-bolt-elements-textPrimary">💡 Exemples Pratiques</h2>
              <div className="space-y-6">
                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">🎯 Cas d'Utilisation</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-bolt-elements-background-depth-4 rounded">
                      <h4 className="font-medium text-bolt-elements-textPrimary mb-2">1. Développement Web Full-Stack</h4>
                      <p className="text-bolt-elements-textSecondary text-sm">
                        "Crée une application web de gestion de tâches avec authentification, 
                        base de données, et interface responsive"
                      </p>
                    </div>
                    <div className="p-3 bg-bolt-elements-background-depth-4 rounded">
                      <h4 className="font-medium text-bolt-elements-textPrimary mb-2">2. Optimisation de Performance</h4>
                      <p className="text-bolt-elements-textSecondary text-sm">
                        "Analyse cette application React et suggère des optimisations 
                        pour améliorer les performances"
                      </p>
                    </div>
                    <div className="p-3 bg-bolt-elements-background-depth-4 rounded">
                      <h4 className="font-medium text-bolt-elements-textPrimary mb-2">3. Migration de Code</h4>
                      <p className="text-bolt-elements-textSecondary text-sm">
                        "Aide-moi à migrer cette application de JavaScript vers TypeScript 
                        avec les meilleures pratiques"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 text-bolt-elements-textPrimary">🛠️ Techniques Avancées</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-bolt-elements-background-depth-4 rounded">
                      <h4 className="font-medium text-bolt-elements-textPrimary mb-2">1. Tests Automatisés</h4>
                      <p className="text-bolt-elements-textSecondary text-sm">
                        "Génère une suite de tests complète pour ce service d'authentification"
                      </p>
                    </div>
                    <div className="p-3 bg-bolt-elements-background-depth-4 rounded">
                      <h4 className="font-medium text-bolt-elements-textPrimary mb-2">2. Architecture Microservices</h4>
                      <p className="text-bolt-elements-textSecondary text-sm">
                        "Aide-moi à décomposer cette application monolithique en microservices"
                      </p>
                    </div>
                    <div className="p-3 bg-bolt-elements-background-depth-4 rounded">
                      <h4 className="font-medium text-bolt-elements-textPrimary mb-2">3. Sécurité Applicative</h4>
                      <p className="text-bolt-elements-textSecondary text-sm">
                        "Analyse la sécurité de cette API et suggère des améliorations"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        );

      default:
        return null;
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
        <RadixDialog.Content aria-describedby={undefined} asChild>
          <motion.div
            className="fixed top-[50%] left-[50%] z-max h-[85vh] w-[90vw] max-w-[1000px] translate-x-[-50%] translate-y-[-50%] border border-bolt-elements-borderColor rounded-lg shadow-lg focus:outline-none overflow-hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={dialogVariants}
          >
            <div className="flex h-full">
              <div className="w-48 border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4">
                <h1 className="text-lg font-bold mb-6 text-bolt-elements-textPrimary">NeuroCode</h1>
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-bolt-elements-button-primary-background text-bolt-elements-textPrimary'
                          : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </div>
                      {tab.shortcut && (
                        <kbd className="text-xs px-1.5 py-0.5 bg-bolt-elements-background-depth-4 rounded">
                          {tab.shortcut}
                        </kbd>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-bolt-elements-background-depth-2">
                {renderTabContent()}
              </div>
            </div>
            <RadixDialog.Close asChild onClick={onClose}>
              <IconButton icon="i-ph:x" className="absolute top-[10px] right-[10px]" />
            </RadixDialog.Close>
          </motion.div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
} 