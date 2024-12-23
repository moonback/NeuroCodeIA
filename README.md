# neurocode.fr (Précédemment bolt.diy)

Bienvenue sur neurocode.fr, la version officielle open source de Neurocode (anciennement connu sous le nom de bolt.diy et bolt.new ANY LLM). Cette plateforme vous permet de choisir le modèle LLM que vous souhaitez utiliser pour chaque prompt ! Actuellement, vous pouvez utiliser des modèles comme OpenAI, Anthropic, Ollama, OpenRouter, Gemini, LMStudio, Mistral, xAI, HuggingFace, DeepSeek ou Groq, et l'architecture est extensible pour inclure tout autre modèle compatible avec le SDK AI de Vercel. Consultez les instructions ci-dessous pour l’exécuter localement et l’étendre à d’autres modèles.


## Table des matières

- [Rejoindre la communauté](#rejoindre-la-communauté)
- [Ajouts demandés](#ajouts-demandés)
- [Fonctionnalités](#fonctionnalités)
- [Configuration](#configuration)
- [Exécution de l’application](#exécution-de-lapplication)
- [Scripts disponibles](#scripts-disponibles)
- [Contribuer](#contribuer)
- [Feuille de route](#feuille-de-route)
- [FAQ](#faq)

## Rejoindre la communauté

[Rejoignez la communauté neurocode.fr ici, dans le ThinkTank sur ottomator.ai !](https://thinktank.ottomator.ai)

## Ajouts demandés

- ✅ Intégration OpenRouter (@coleam00)  
- ✅ Intégration Gemini (@jonathands)  
- ✅ Génération automatique de modèles Ollama à partir des téléchargements (@yunatamos)  
- ✅ Filtrage des modèles par fournisseur (@jasonm23)  
- ✅ Téléchargement du projet en ZIP (@fabwaseem)  
- ✅ Améliorations du prompt principal dans `app\lib\.server\llm\prompts.ts` (@kofi-bhr)  
- ✅ Intégration API DeepSeek (@zenith110)  
- ✅ Intégration API Mistral (@ArulGandhi)  
- ✅ API similaire à OpenAI (@ZerxZ)  
- ✅ Synchronisation des fichiers en local (@muzafferkadir)  
- ✅ Conteneurisation avec Docker pour une installation simplifiée (@aaronbolton)  
- ✅ Publication de projets sur GitHub (@goncaloalves)  
- ✅ Gestion des clés API via l’interface (@ali00209)  
- ✅ Intégration de xAI Grok Beta (@milutinke)  
- ✅ Intégration LM Studio (@karrot0)  
- ✅ Intégration HuggingFace (@ahsan3219)  
- ✅ Terminal intégré pour les commandes LLM (@thecodacus)  
- ✅ Streaming des sorties de code (@thecodacus)  
- ✅ Restauration des versions de code (@wonderwhy-er)  
- ✅ Intégration Cohere (@hasanraiyan)  
- ✅ Longueur maximale dynamique pour les tokens des modèles (@hasanraiyan)  
- ✅ Amélioration des prompts (@SujalXplores)  
- ✅ Mise en cache des prompts (@SujalXplores)  
- ✅ Chargement de projets locaux dans l’application (@wonderwhy-er)  
- ✅ Intégration Together (@mouimet-infinisoft)  
- ✅ Interface adaptée aux mobiles (@qwikode)  
- ✅ Attacher des images aux prompts (@atrokhym)  
- ✅ Bouton pour cloner un dépôt Git (@thecodacus)  
- ✅ Import Git depuis une URL (@thecodacus)  
- ✅ Bibliothèque de prompts avec des variations pour divers cas d’usage (@thecodacus)  
- ✅ Détection de `package.json` pour l’installation et l’exécution automatiques (@wonderwhy-er)  
- ✅ Outil de sélection visuelle pour cibler les modifications (@emcconnell)  
- ⬜ **Priorité élevée** : Réduction des réécritures fréquentes de fichiers (verrouillage des fichiers et diff)  
- ⬜ **Priorité élevée** : Amélioration des prompts pour les LLM de petite taille  
- ⬜ **Priorité élevée** : Exécution des agents en backend plutôt que via des appels uniques  
- ⬜ Déploiement direct sur Vercel/Netlify/autres plateformes similaires  
- ⬜ Planification de projets par un LLM dans un fichier Markdown  
- ⬜ Intégration VSCode avec confirmations type Git  
- ⬜ Chargement de documents pour enrichir les connaissances : modèles de design, bases de code de référence, etc.  
- ⬜ Prompts vocaux  
- ⬜ Intégration API Azure OpenAI  
- ✅ Intégration Perplexity  
- ⬜ Intégration Vertex AI  
- ⬜ Support pour plus de types de fichiers et fichiers binaires  
- ⬜ Meilleure intégration Git avec gestion des branches  
- ⬜ Détection améliorée des changements de fichiers et visualisation des diff  
- ⬜ Support multilingue pour l’interface utilisateur  

## Fonctionnalités

- **Développement web full-stack basé sur l’IA** directement dans le navigateur  
- **Support multi-LLM** avec une architecture extensible  
- **Attachez des images aux prompts** pour un meilleur contexte  
- **Terminal intégré** pour visualiser les commandes exécutées  
- **Revenir à des versions précédentes** pour déboguer facilement  
- **Téléchargement des projets en ZIP** pour faciliter le partage  
- **Support Docker intégré** pour une installation simplifiée  
- **Intégration Git** avec import/export de dépôts GitHub  
- **Gestion sécurisée des clés API** via une interface dédiée  
- **Interface mobile-friendly** pour coder en déplacement  
- **Outil de sélection visuelle** pour des modifications ciblées  
- **Bibliothèque de prompts** adaptée à divers cas d’usage  
- **Détection automatique des dépendances** et installation automatique  

---

Pour des détails supplémentaires, voir les sections suivantes ou consultez la [documentation complète](https://stackblitz-labs.github.io/neurocode.fr/).
