# bolt.diy (Previously oTToDev)
[![bolt.diy: AI-Powered Full-Stack Web Development in the Browser](./public/social_preview_index.jpg)](https://bolt.diy)

Welcome to bolt.diy, the official open source version of Bolt.new (previously known as oTToDev and bolt.new ANY LLM), which allows you to choose the LLM that you use for each prompt! Currently, you can use OpenAI, Anthropic, Ollama, OpenRouter, Gemini, LMStudio, Mistral, xAI, HuggingFace, DeepSeek, or Groq models - and it is easily extended to use any other model supported by the Vercel AI SDK! See the instructions below for running this locally and extending it to include more models.

Check the [bolt.diy Docs](https://stackblitz-labs.github.io/bolt.diy/) for more information. 

We have also launched an experimental agent called the "bolt.diy Expert" that can answer common questions about bolt.diy. Find it here on the [oTTomator Live Agent Studio](https://studio.ottomator.ai/).

bolt.diy was originally started by [Cole Medin](https://www.youtube.com/@ColeMedin) but has quickly grown into a massive community effort to build the BEST open source AI coding assistant!

## Table of Contents

- [Join the Community](#join-the-community)
- [Requested Additions](#requested-additions)
- [Features](#features)
- [Setup](#setup)
- [Run the Application](#run-the-application)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [FAQ](#faq)

## Join the community

[Join the bolt.diy community here, in the thinktank on ottomator.ai!](https://thinktank.ottomator.ai)


## Ajouts Demandés

- ✅ Intégration OpenRouter
- ✅ Intégration Gemini
- ✅ Génération automatique des modèles Ollama à partir des téléchargements
- ✅ Filtrage des modèles par fournisseur
- ✅ Téléchargement du projet en ZIP
- ✅ Améliorations du prompt principal bolt.new
- ✅ Intégration API DeepSeek
- ✅ Intégration API Mistral
- ✅ Intégration API "Open AI Like"
- ✅ Synchronisation des fichiers (unidirectionnelle) vers dossier local
- ✅ Conteneurisation de l'application avec Docker
- ✅ Publication directe des projets sur GitHub
- ✅ Saisie des clés API dans l'interface
- ✅ Intégration xAI Grok Beta
- ✅ Intégration LM Studio
- ✅ Intégration HuggingFace
- ✅ Terminal Bolt pour voir la sortie des commandes LLM
- ✅ Streaming de la sortie de code
- ✅ Retour à une version antérieure du code
- ✅ Intégration Cohere
- ✅ Longueur de token maximale dynamique
- ✅ Amélioration des prompts
- ✅ Mise en cache des prompts
- ✅ Chargement de projets locaux
- ✅ Intégration Together
- ✅ Version mobile
- ✅ Amélioration des prompts
- ✅ Ajout d'images aux prompts
- ✅ Bouton de clonage Git
- ✅ Import Git depuis URL
- ✅ Bibliothèque de prompts pour différents cas d'usage
- ✅ Détection du package.json et commandes d'installation & prévisualisation
- ✅ Outil de sélection pour cibler visuellement les changements
- ✅ Détection des erreurs terminal et correction par bolt
- ✅ Détection des erreurs de prévisualisation et correction par bolt
- ✅ Ajout d'options de modèles de démarrage
- ⬜ **HAUTE PRIORITÉ** - Éviter la réécriture fréquente des fichiers
- ⬜ **HAUTE PRIORITÉ** - Meilleurs prompts pour les petits LLMs
- ⬜ **HAUTE PRIORITÉ** - Exécution des agents en backend
- ⬜ Déploiement direct sur Vercel/Netlify/autres plateformes
- ⬜ Planification du projet par LLM dans un fichier MD
- ⬜ Intégration VSCode avec confirmations git
- ⬜ Téléchargement de documents pour la connaissance
- ⬜ Prompts vocaux
- ⬜ Intégration Azure Open AI API
- ✅ Intégration Perplexity
- ⬜ Intégration Vertex AI

## Fonctionnalités

- **Développement web full-stack assisté par IA** directement dans votre navigateur.
- **Prise en charge de plusieurs LLMs** avec une architecture extensible pour intégrer des modèles supplémentaires.
- **Ajout d'images aux prompts** pour une meilleure compréhension contextuelle.
- **Terminal intégré** pour visualiser la sortie des commandes LLM.
- **Retour aux versions précédentes du code** pour faciliter le débogage et accélérer les modifications.
- **Téléchargement des projets en ZIP** pour une portabilité facile.
- **Support Docker prêt à l'emploi** pour une configuration sans tracas.

## Setup 

If you're new to installing software from GitHub, don't worry! If you encounter any issues, feel free to submit an "issue" using the provided links or improve this documentation by forking the repository, editing the instructions, and submitting a pull request. The following instruction will help you get the stable branch up and running on your local machine in no time.  

Let's get you up and running with the stable version of Bolt.DIY!

## Quick Download

[![Download Latest Release](https://img.shields.io/github/v/release/stackblitz-labs/bolt.diy?label=Download%20Bolt&sort=semver)](https://github.com/stackblitz-labs/bolt.diy/releases/latest) ← Click here to go the the latest release version! 

- Next **click source.zip**




## Prerequisites

Before you begin, you'll need to install two important pieces of software:

### Install Node.js

Node.js is required to run the application.

1. Visit the [Node.js Download Page](https://nodejs.org/en/download/)
2. Download the "LTS" (Long Term Support) version for your operating system
3. Run the installer, accepting the default settings
4. Verify Node.js is properly installed:
   - **For Windows Users**:
     1. Press `Windows + R`
     2. Type "sysdm.cpl" and press Enter
     3. Go to "Advanced" tab → "Environment Variables"
     4. Check if `Node.js` appears in the "Path" variable
   - **For Mac/Linux Users**:
     1. Open Terminal
     2. Type this command:
        ```bash
        echo $PATH
        ```
     3. Look for `/usr/local/bin` in the output

## Running the Application

You have two options for running Bolt.DIY: directly on your machine or using Docker.

### Option 1: Direct Installation (Recommended for Beginners)

1. **Install Package Manager (pnpm)**:
   ```bash
   npm install -g pnpm
   ```

2. **Install Project Dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the Application**:
   ```bash
   pnpm run dev
   ```

   **Important Note**: If you're using Google Chrome, you'll need Chrome Canary for local development. [Download it here](https://www.google.com/chrome/canary/)

### Option 2: Using Docker

This option requires some familiarity with Docker but provides a more isolated environment.

#### Additional Prerequisite
- Install Docker: [Download Docker](https://www.docker.com/)

#### Steps:

1. **Build the Docker Image**:
   ```bash
   # Using npm script:
   npm run dockerbuild

   # OR using direct Docker command:
   docker build . --target bolt-ai-development
   ```

2. **Run the Container**:
   ```bash
   docker-compose --profile development up
   ```




## Configuring API Keys and Providers

### Adding Your API Keys

Setting up your API keys in Bolt.DIY is straightforward:

1. Open the home page (main interface)
2. Select your desired provider from the dropdown menu
3. Click the pencil (edit) icon
4. Enter your API key in the secure input field

![API Key Configuration Interface](./docs/images/api-key-ui-section.png)

### Configuring Custom Base URLs

For providers that support custom base URLs (such as Ollama or LM Studio), follow these steps:

1. Click the settings icon in the sidebar to open the settings menu
   ![Settings Button Location](./docs/images/bolt-settings-button.png)

2. Navigate to the "Providers" tab
3. Search for your provider using the search bar
4. Enter your custom base URL in the designated field
   ![Provider Base URL Configuration](./docs/images/provider-base-url.png)

> **Note**: Custom base URLs are particularly useful when running local instances of AI models or using custom API endpoints.

### Supported Providers
- Ollama
- LM Studio
- OpenAILike

## Setup Using Git (For Developers only)

This method is recommended for developers who want to:
- Contribute to the project
- Stay updated with the latest changes
- Switch between different versions
- Create custom modifications

#### Prerequisites
1. Install Git: [Download Git](https://git-scm.com/downloads)

#### Initial Setup

1. **Clone the Repository**:
   ```bash
   # Using HTTPS
   git clone https://github.com/stackblitz-labs/bolt.diy.git
   ```

2. **Navigate to Project Directory**:
   ```bash
   cd bolt.diy
   ```

3. **Switch to the Main Branch**:
   ```bash
   git checkout main
   ```
4. **Install Dependencies**:
   ```bash
   pnpm install
   ```

5. **Start the Development Server**:
   ```bash
   pnpm run dev
   ```

#### Staying Updated

To get the latest changes from the repository:

1. **Save Your Local Changes** (if any):
   ```bash
   git stash
   ```

2. **Pull Latest Updates**:
   ```bash
   git pull origin main
   ```

3. **Update Dependencies**:
   ```bash
   pnpm install
   ```

4. **Restore Your Local Changes** (if any):
   ```bash
   git stash pop
   ```

#### Troubleshooting Git Setup

If you encounter issues:

1. **Clean Installation**:
   ```bash
   # Remove node modules and lock files
   rm -rf node_modules pnpm-lock.yaml

   # Clear pnpm cache
   pnpm store prune

   # Reinstall dependencies
   pnpm install
   ```

2. **Reset Local Changes**:
   ```bash
   # Discard all local changes
   git reset --hard origin/main
   ```

Remember to always commit your local changes or stash them before pulling updates to avoid conflicts.

---

## Available Scripts

- **`pnpm run dev`**: Starts the development server.
- **`pnpm run build`**: Builds the project.
- **`pnpm run start`**: Runs the built application locally using Wrangler Pages.
- **`pnpm run preview`**: Builds and runs the production build locally.
- **`pnpm test`**: Runs the test suite using Vitest.
- **`pnpm run typecheck`**: Runs TypeScript type checking.
- **`pnpm run typegen`**: Generates TypeScript types using Wrangler.
- **`pnpm run deploy`**: Deploys the project to Cloudflare Pages.
- **`pnpm run lint:fix`**: Automatically fixes linting issues.

---

## Contributing

We welcome contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## Roadmap

Explore upcoming features and priorities on our [Roadmap](https://roadmap.sh/r/ottodev-roadmap-2ovzo).

---

## FAQ

For answers to common questions, issues, and to see a list of recommended models, visit our [FAQ Page](FAQ.md).
