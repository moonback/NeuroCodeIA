# Questions Fréquemment Posées (FAQ)

## Quels sont les meilleurs modèles pour bolt.diy ?

Pour la meilleure expérience avec bolt.diy, nous recommandons d'utiliser les modèles suivants :

- **Claude 3.5 Sonnet (ancien)** : Meilleur codeur global, fournissant d'excellents résultats dans tous les cas d'utilisation
- **Gemini 2.0 Flash** : Vitesse exceptionnelle tout en maintenant de bonnes performances
- **GPT-4o** : Solide alternative à Claude 3.5 Sonnet avec des capacités comparables
- **DeepSeekCoder V2 236b** : Meilleur modèle open source (disponible via OpenRouter, DeepSeek API, ou auto-hébergé)
- **Qwen 2.5 Coder 32b** : Meilleur modèle pour l'auto-hébergement avec des exigences matérielles raisonnables

**Note** : Les modèles avec moins de 7b paramètres manquent généralement de la capacité d'interagir correctement avec bolt !

## Comment obtenir les meilleurs résultats avec bolt.diy ?

- **Soyez précis sur votre stack** :  
  Mentionnez les frameworks ou bibliothèques que vous souhaitez utiliser (ex : Astro, Tailwind, ShadCN) dans votre prompt initial. Cela garantit que bolt.diy structure le projet selon vos préférences.

- **Utilisez l'icône d'amélioration du prompt** :  
  Avant d'envoyer votre prompt, cliquez sur l'icône *améliorer* pour laisser l'IA affiner votre prompt. Vous pouvez modifier les améliorations suggérées avant de les soumettre.

- **Construisez d'abord les bases, puis ajoutez les fonctionnalités** :  
  Assurez-vous que la structure fondamentale de votre application est en place avant d'introduire des fonctionnalités avancées. Cela aide bolt.diy à établir une base solide sur laquelle construire.

- **Regroupez les instructions simples** :  
  Combinez les tâches simples en un seul prompt pour gagner du temps et réduire la consommation de crédits API. Par exemple :  
  *"Changez le schéma de couleurs, ajoutez la réactivité mobile et redémarrez le serveur de développement."*

## Comment contribuer à bolt.diy ?

Consultez notre [Guide de Contribution](CONTRIBUTING.md) pour plus de détails sur la façon de participer !

## Quels sont les plans futurs pour bolt.diy ?

Visitez notre [Feuille de route](https://roadmap.sh/r/ottodev-roadmap-2ovzo) pour les dernières mises à jour.  
De nouvelles fonctionnalités et améliorations sont en cours !

## Pourquoi y a-t-il tant de problèmes/pull requests ouverts ?

bolt.diy a commencé comme un petit projet de démonstration sur la chaîne YouTube de @ColeMedin pour explorer l'édition de projets open-source avec des LLMs locaux. Cependant, il s'est rapidement transformé en un effort communautaire massif !

Nous formons une équipe de mainteneurs pour gérer la demande et rationaliser la résolution des problèmes. Les mainteneurs sont des stars, et nous explorons également des partenariats pour aider le projet à prospérer.

## Comment les LLMs locaux se comparent-ils aux modèles plus grands comme Claude 3.5 Sonnet pour bolt.diy ?

Bien que les LLMs locaux s'améliorent rapidement, les modèles plus grands comme GPT-4o, Claude 3.5 Sonnet et DeepSeek Coder V2 236b offrent toujours les meilleurs résultats pour les applications complexes. Notre objectif continu est d'améliorer les prompts, les agents et la plateforme pour mieux supporter les LLMs locaux plus petits.

## Erreurs Courantes et Dépannage

### "Une erreur s'est produite lors du traitement de cette requête"
Ce message d'erreur générique signifie que quelque chose s'est mal passé. Vérifiez :
- Le terminal (si vous avez démarré l'application avec Docker ou `pnpm`).
- La console développeur de votre navigateur (appuyez sur `F12` ou clic droit > *Inspecter*, puis allez dans l'onglet *Console*).

### "En-tête x-api-key manquant"
Cette erreur est parfois résolue en redémarrant le conteneur Docker.  
Si cela ne fonctionne pas, essayez de passer de Docker à `pnpm` ou vice versa. Nous enquêtons activement sur ce problème.

### Aperçu vide lors de l'exécution de l'application
Un aperçu vide survient souvent en raison de code halluciné ou de commandes incorrectes.  
Pour dépanner :
- Vérifiez la console développeur pour les erreurs.
- Rappelez-vous, les aperçus sont une fonctionnalité centrale, donc l'application n'est pas cassée ! Nous travaillons à rendre ces erreurs plus transparentes.

### "Tout fonctionne, mais les résultats sont mauvais"
Les LLMs locaux comme Qwen-2.5-Coder sont puissants pour les petites applications mais encore expérimentaux pour les projets plus importants. Pour de meilleurs résultats, envisagez d'utiliser des modèles plus grands comme GPT-4o, Claude 3.5 Sonnet, ou DeepSeek Coder V2 236b.

### "Exception structurée reçue #0xc0000005 : violation d'accès"
Si vous obtenez ceci, vous êtes probablement sous Windows. La solution consiste généralement à mettre à jour le [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)

### "Erreurs Miniflare ou Wrangler sous Windows"
Vous devrez vous assurer d'avoir la dernière version de Visual Studio C++ installée (14.40.33816), plus d'informations ici https://github.com/stackblitz-labs/bolt.diy/issues/19.

---

Vous avez d'autres questions ? N'hésitez pas à nous contacter ou à ouvrir une issue sur notre repo GitHub !