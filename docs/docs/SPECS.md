Documentation Technique et de Conception
Spécifications Techniques (Specs)
Frameworks utilisés :
Remix (React) : Framework full-stack assurant à la fois le rendu côté serveur et l’hydratation côté client.
Vite : Outil de build rapide et léger pour une expérience de développement fluide.
UnoCSS : Moteur CSS atomique pour un style performant et modulable.
CodeMirror 6 : Éditeur de code intégré offrant coloration syntaxique, autocomplétion et autres fonctionnalités avancées.
WebContainers : Conteneur d’exécution Node.js côté client, permettant d’exécuter du code sans serveur distant.
Radix UI : Bibliothèque de composants UI accessibles et modulaires pour React.
Framer Motion : Bibliothèque pour des animations fluides et performantes.
React Toastify : Gestion des notifications utilisateur de manière intuitive.
Configuration du système :
Node.js : Environnement d’exécution JavaScript côté serveur (version LTS recommandée).
pnpm : Gestionnaire de packages rapide et efficace (alternative à npm/yarn).
Cloudflare Workers : Plateforme serverless utilisée pour le déploiement en production.
IndexedDB : Base de données côté client, utilisée pour persister l’historique des conversations et divers paramètres.
APIs intégrées :
Fournisseurs de LLMs : OpenAI, Anthropic, Cohere, Google, Groq, HuggingFace, Hyper, LM Studio, Mistral, Ollama, OpenRouter, OpenAI, Perplexity, xAI, Together, etc.
API GitHub : Pour le clonage de dépôts, la création et la gestion de repos directement depuis l’application.
API Web Speech : Permet l’intégration de la reconnaissance vocale et de la synthèse vocale dans l’interface (selon compatibilité navigateur).
Architecture et Conception Globale :
Point d’entrée API :

neu/api/chat communique avec les différents fournisseurs de LLMs.
Les données sont persistées dans IndexedDB côté client (historique, préférences, etc.).
Schéma de la Base de Données IndexedDB (boltHistory)

Table : chats
Colonne	Type	Description
id	TEXT	Identifiant unique de la conversation (auto-généré)
urlId	TEXT	Identifiant unique pour l’URL de la conversation (auto-généré)
description	TEXT	Brève description de la conversation
messages	JSON	Tableau d’objets Messages (format Vercel AI SDK)
timestamp	TEXT	Date et heure de la dernière mise à jour (ISO 8601)
Interactions entre les composants :

Chat.client.tsx :
Composant principal de l’interface de chat (envoi/réception de messages, sélection du modèle, import/export de discussions, etc.).
BaseChat.tsx :
Structure de base pour l’interface de chat. Gère zone de saisie, envoi de messages et gestion de fichiers.
Messages.client.tsx :
Affiche la liste des messages (utilisateur/assistant) avec fonctionnalités de retour et duplication.
AssistantMessage.tsx / UserMessage.tsx :
Gèrent respectivement l’affichage des réponses de l’IA (voix, contenu, jetons) et des messages utilisateur (texte, images).
APIKeyManager.tsx :
Interface de gestion et de validation des clés API pour chaque fournisseur.
Artifact.tsx :
Affiche les “artefacts” générés par l’IA (fichiers, commandes, actions).
Workbench.client.tsx :
Gère l’affichage de l’éditeur de code, de l’arborescence des fichiers, du terminal et de l’aperçu (preview).
EditorPanel.tsx, FileTree.tsx, EditorTabs.tsx :
Gèrent respectivement la zone d’édition, l’affichage des fichiers et les onglets de fichiers ouverts.
Terminal.tsx / Preview.tsx :
Gèrent l’interface console et le rendu de l’application en temps réel.
Menu.client.tsx, SettingsWindow.tsx, HelpWindow.tsx :
Gèrent les fonctionnalités du menu latéral, les paramètres, et l’aide.
GitUrlImport.client.tsx :
Gère l’importation d’un projet depuis une URL Git.
Choix architecturaux :

Remix : Pour une expérience full-stack (SSR + hydratation côté client).
Vite : Pour un démarrage et un build rapides.
WebContainers : Alternative légère aux environnements traditionnels (exécutions Node dans le navigateur).
IndexedDB : Pour stocker localement l’historique et réduire la dépendance serveur.
UnoCSS : Style atomique pour de meilleures performances CSS.
Radix UI + Framer Motion : Composants modulaires, animations fluides, et accessibilité renforcée.
Document de Conception (Design Document)
Algorithmes et Logique :
Gestion des Fichiers :

Utilisation d’une structure FileMap (JS) pour stocker fichiers et dossiers.
Les modifications sont traquées dans modifiedFiles en comparant contenu actuel et initial.
Parcours récursif de l’arborescence pour gérer fichiers et dossiers.
Algorithme de Diff :

Utilise la bibliothèque diff pour comparer deux versions d’un fichier.
Génère un “unified diff” pour refléter les changements.
Si le diff est plus grand que le fichier lui-même, on inclut directement le contenu complet.
Recherche dans l’Historique des Chats :

useSearchFilter pour filtrer les conversations en fonction de mots-clés.
Recherche insensible à la casse sur les champs spécifiés (ex.: description).
Sélection de Template :

Un prompt dédié starterTemplateSelectionPrompt demande au LLM de choisir un template en fonction des besoins du projet.
Parse la réponse pour extraire le nom du template et le titre du projet.
Clonage de Projet Git :

Utilise isomorphic-git pour cloner le dépôt dans WebContainer.
Ignore les fichiers définis dans IGNORE_PATTERNS.
Extrait le contenu et détecte les commandes potentielles pour l’assistant.
Gestion des Onglets :

Liste d’onglets ouverts dans EditorPanel.
Permet d’ajouter, supprimer et basculer entre les onglets.
Affiche le fichier actif dans l’éditeur.
Flux de Données :
Interaction Utilisateur : Chat, éditeur, terminal, etc.
Stores (Nano-stores) : chatStore, workbenchStore, themeStore, settingsStore, logStore.
Composants React : Mise à jour des composants abonnées aux stores.
API LLM : Envoi des requêtes à /api/chat pour obtenir des réponses selon le fournisseur choisi.
WebContainer : Exécution de commandes shell, gestion de fichiers côté client.
IndexedDB : Persistance de l’historique et des configurations.
GitHub API : Clonage et publication du code sur GitHub.
Décisions de Conception Spécifiques :
WebContainers : Évite le recours à un serveur distant pour exécuter du code Node.js.
API Streams : Diffuse le contenu généré par le LLM (améliore l’expérience utilisateur).
Structure modulaire : Favorise la maintenance et l’extensibilité.
Framer Motion et Radix UI : Animations fluides et composants accessibles.
IndexedDB : Permet de conserver l’historique localement (mode hors connexion possible).
UnoCSS : Approche “utility-first” pour des performances élevées.
Gestion des Erreurs :
try...catch : Enveloppe les appels aux APIs et aux stores.
react-toastify : Affiche des messages d’erreur contextuels à l’utilisateur.
unreachable : Gère les cas qui ne devraient jamais se produire (assertions).
Sécurité :
Clés API : Stockées dans un cookie JSON, configurables via l’UI ou des variables d’environnement.
Validation des URLs Git : Avant clonage pour éviter les sources non autorisées.
Nettoyage du Contenu : Évite les injections HTML/CSS.
Échappement des Entrées Utilisateur : Empêche les failles XSS.
Performances :
memo et useCallback : Évitent les rendus et créations de fonctions inutiles.
debounce : Limite la fréquence d’appels de certaines fonctions coûteuses.
requestAnimationFrame : Optimise les animations.
Promise.all : Exécute plusieurs tâches en parallèle.
Pagination : Gère les longs historiques de conversations.
Nano-stores : Légers et réactifs pour la gestion de l’état global.
Accessibilité :
Radix UI : Composants prêts pour l’accessibilité.
Attributs ARIA : Meilleure navigation clavier et lecture d’écran.
Contrastes Couleurs : Respecte les normes WCAG.
Internationalisation :
date-fns : Gère la locale pour le formatage des dates et heures.
Possibilité de traductions : La structure peut prendre en charge des fichiers de ressources (non implémenté à ce stade).
Tests :
Vitest : Tests unitaires.
@testing-library/react : Tests de composants et hooks.
nanostores : Teste le comportement des stores.
Documentation :
MKDocs + Material for MkDocs : Génération de la documentation à partir de fichiers Markdown.
Documentation technique : Présente dans ce document, décrivant l’architecture, la logique et les choix de conception.
Conclusion :
NeuroCode-ia est une application web modulaire et extensible qui combine de nombreuses technologies (Remix, Vite, WebContainers, CodeMirror 6, etc.) pour offrir une expérience de développement assistée par IA, directement dans le navigateur. La conception privilégie la maintenabilité, l’évolutivité et la simplicité d’usage, tout en assurant la persistance des données (IndexedDB), la sécurité (clés API, validation d’URL Git) et des performances optimales (memo, useCallback, etc.).

Cette documentation technique et de conception donne une vue d’ensemble des spécifications, de l’architecture, des algorithmes clés et des décisions de conception, permettant à tout nouveau développeur de prendre en main le projet rapidement et efficacement.