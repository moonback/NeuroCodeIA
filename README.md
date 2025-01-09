# Neurocode


Bienvenue sur **Neurocode**, la version open source officielle de Neurocode, permettant de choisir le modèle d'IA (LLM) utilisé pour chaque prompt ! Actuellement, Neurocode prend en charge OpenAI, Anthropic, Ollama, OpenRouter, Gemini, LMStudio, Mistral, xAI, HuggingFace, DeepSeek, et Groq, avec la possibilité d'ajouter facilement d'autres modèles grâce au Vercel AI SDK. Consultez les instructions ci-dessous pour exécuter l'application localement et ajouter des modèles supplémentaires.

Consultez la [documentation Neurocode](https://stackblitz-labs.github.io/bolt.diy/) pour plus d'informations.

## Table des matières

- [Ajouts demandés](#ajouts-demandés)
- [Fonctionnalités](#fonctionnalités)
- [Configuration](#configuration)
- [Lancer l'application](#lancer-lapplication)
- [Scripts disponibles](#scripts-disponibles)
- [Contribution](#contribution)
- [Feuille de route](#feuille-de-route)
- [FAQ](#faq)

---

## Ajouts demandés

- ✅ Intégration OpenRouter  
- ✅ Intégration Gemini  
- ✅ Génération automatique des modèles Ollama à partir des téléchargements  
- ✅ Filtrage des modèles par fournisseur  
- ✅ Téléchargement du projet en ZIP  
- ✅ Améliorations des prompts principaux Neurocode  
- ✅ Intégration API DeepSeek  
- ✅ Intégration API Mistral  
- ✅ Intégration API "Open AI Like"  
- ✅ Synchronisation des fichiers (unidirectionnelle) vers dossier local  
- ✅ Conteneurisation avec Docker  
- ✅ Publication directe sur GitHub  
- ✅ Saisie des clés API dans l'interface  
- ✅ Intégration xAI Grok Beta  
- ✅ Intégration LM Studio  
- ✅ Intégration HuggingFace  
- ✅ Terminal intégré pour afficher les sorties des commandes IA  
- ✅ Streaming des résultats de code  
- ✅ Revenir à une version antérieure du code  
- ✅ Intégration Cohere  
- ✅ Longueur de tokens maximale dynamique  
- ✅ Mise en cache des prompts  
- ✅ Chargement de projets locaux  
- ✅ Intégration Together  
- ✅ Version mobile  
- ✅ Ajout d'images aux prompts  
- ✅ Bouton de clonage Git  
- ✅ Import Git depuis une URL  
- ✅ Bibliothèque de prompts pour différents cas d'usage  
- ✅ Détection du package.json avec commandes d'installation et prévisualisation  
- ✅ Outil de sélection visuelle des changements  
- ✅ Détection et correction des erreurs terminal  
- ✅ Détection et correction des erreurs de prévisualisation  
- ✅ Modèles de démarrage pour les projets
- ✅ Systeme appel d'un fichier via le chat avec @
- ✅ modification manuel des fichier enrengistrer
- ✅ Amelioration du design
- ✅ Mise a jours des provider et model  
- ⬜ **HAUTE PRIORITÉ** - Éviter la réécriture fréquente des fichiers  
- ⬜ **HAUTE PRIORITÉ** - Optimisation des prompts pour les petits modèles  
- ⬜ **HAUTE PRIORITÉ** - Exécution des agents en backend  
- ⬜ Déploiement direct sur Vercel/Netlify  
- ⬜ Génération de plans de projets au format Markdown  
- ⬜ Intégration à VSCode avec gestion Git  
- ⬜ Téléchargement de documents pour la connaissance contextuelle  
- ⬜ Prompts vocaux  
- ⬜ Intégration Azure OpenAI API  
- ✅ Intégration Perplexity  
- ⬜ Intégration Vertex AI  

---

## Fonctionnalités

- **Développement web full-stack assisté par IA**, directement dans le navigateur.  
- **Support multi-modèles IA**, avec une architecture extensible.  
- **Ajout d'images aux prompts** pour une meilleure compréhension contextuelle.  
- **Terminal intégré**, pour visualiser les commandes IA.  
- **Revenir aux versions précédentes du code**, simplifiant le débogage.  
- **Téléchargement des projets en ZIP**, pour une portabilité facile.  
- **Conteneurisation avec Docker**, pour un déploiement simplifié.

---

## Configuration

### Pré-requis

1. **Installer Node.js** : [Télécharger Node.js](https://nodejs.org/en/download/)  
2. **Installer un gestionnaire de paquets** :  
   ```bash
   npm install -g pnpm
   ```

---

## Lancer l'application

### Option 1 : Installation directe

1. **Installer les dépendances** :  
   ```bash
   pnpm install
   ```
2. **Démarrer l'application** :  
   ```bash
   pnpm run dev
   ```

### Option 2 : Utiliser Docker

1. **Construire l'image Docker** :  
   ```bash
   docker build . --target neurocode-development
   ```
2. **Lancer le conteneur** :  
   ```bash
   docker-compose --profile development up
   ```

---

## Scripts disponibles

- **`pnpm run dev`** : Lancer le serveur de développement.  
- **`pnpm run build`** : Compiler l'application.  
- **`pnpm run start`** : Exécuter l'application compilée.  
- **`pnpm run lint:fix`** : Corriger automatiquement les erreurs de linting.

---

## Contribution

Nous acceptons les contributions avec plaisir ! Consultez notre [Guide de Contribution](CONTRIBUTING.md) pour plus de détails.

---

## Feuille de route

Découvrez les fonctionnalités à venir et les priorités dans notre [Feuille de Route](https://roadmap.sh/r/neurocode-roadmap).

---

## FAQ

Consultez notre [FAQ](FAQ.md) pour les questions fréquentes et conseils.

---
