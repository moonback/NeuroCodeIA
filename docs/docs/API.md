Documentation API de NeuroCode-ia
NeuroCode-ia interagit avec plusieurs APIs, principalement pour la communication avec les LLMs et pour certaines fonctionnalités comme le clonage de projets Git. Voici une description détaillée des endpoints utilisés :

1. API de Chat (/api/chat)
Cette API est le point d'entrée principal pour l'interaction avec les LLMs.

Endpoint: /api/chat

Méthode: POST

Requête:

{
  "messages": [
    {
      "role": "user" | "assistant",
      "content": "string | array", // Le contenu du message. Peut être un tableau pour inclure des images.
      "id": "string", // L'identifiant unique du message
      "annotations": [] // Optionnel, informations supplémentaires sur le message.
    }
    // ... autres messages
  ],
  "files": {
    // Mappage des chemins de fichiers vers leur contenu et type (facultatif)
    "/path/to/file.js": {
      "type": "file",
      "content": "string", // Contenu du fichier
      "isBinary": false
    }
  },
  "promptId": "string", // Identifiant du prompt, si utilisé (optionnel)
  "contextOptimization": boolean, // Indique si l'optimisation de contexte est activée (optionnel)
  "model": "string", // Modèle de LLM à utiliser (ex: "gpt-4-turbo")
  "provider": { // Information sur le fournisseur de LLM
    "name": "string", // Nom du fournisseur (ex: "OpenAI")
    "icon": "string", // Icône du fournisseur (optionnel)
    "getApiKeyLink": "string", // Lien vers la page pour obtenir une clé API (optionnel)
    "labelForGetApiKey": "string" // Texte à afficher pour le lien vers la clé API (optionnel)
  },
  "apiKeys": {
    // Clés API pour les différents fournisseurs (optionnel)
    "OpenAI": "sk-...",
    "Anthropic": "sk-ant-..."
    // ... autres clés API
  },
  "providerSettings": {
    // Paramètres de configuration pour chaque fournisseur (optionnel)
    "OpenAI": {
      "enabled": true,
      "baseUrl": "https://api.openai.com/v1"
    },
    "Anthropic": {
      "enabled": true,
      "baseUrl": "https://api.anthropic.com/v1"
    }
    // ... autres paramètres
  }
}
Use code with caution.
Json
Réponse: Un flux de texte (text/event-stream) contenant les réponses du LLM, potentiellement entrecoupé de données JSON encodées en data: { ... }. La réponse peut inclure :

Du texte généré par le LLM.

Des métadonnées sur l'utilisation des tokens :

data: {"type":"usage","value":{"completionTokens":10,"promptTokens":20,"totalTokens":30}}
Use code with caution.
Json
Des balises <boltArtifact> et <boltAction> pour les actions à exécuter côté client.

Exemple d'utilisation:

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Créer un fichier "hello.js" avec le contenu "console.log(\'Hello, world!\');"',
        id: 'msg1',
      },
    ],
    model: 'gpt-4',
    provider: { name: 'OpenAI' },
  }),
});

const reader = response.body.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Traiter le flux de texte (value est un Uint8Array)
  const text = new TextDecoder().decode(value);
  console.log(text);
}
Use code with caution.
JavaScript
2. API d'Amélioration de Prompt (/api/enhancer)
Cette API est utilisée pour améliorer les prompts fournis par l'utilisateur.

Endpoint: /api/enhancer

Méthode: POST

Requête:

{
  "message": "string", // Le prompt original de l'utilisateur
  "model": "string", // Le modèle de LLM à utiliser pour l'amélioration
  "provider": { // Information sur le fournisseur de LLM
    "name": "string" // Nom du fournisseur (ex: "OpenAI")
  },
  "apiKeys": {
    // Clés API pour les différents fournisseurs (optionnel)
    "OpenAI": "sk-...",
    "Anthropic": "sk-ant-..."
    // ... autres clés API
  }
}
Use code with caution.
Json
Réponse: Un flux de texte (text/plain; charset=utf-8) contenant le prompt amélioré.

Exemple d'utilisation:

const response = await fetch('/api/enhancer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Fais un jeu de snake',
    model: 'claude-3-5-sonnet-latest',
    provider: { name: 'Anthropic' },
  }),
});

const reader = response.body.getReader();
let enhancedPrompt = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  enhancedPrompt += new TextDecoder().decode(value);
}

console.log('Prompt amélioré :', enhancedPrompt);
Use code with caution.
JavaScript
3. API de Proxy Git (/api/git-proxy.$)
Cette API sert de proxy pour les requêtes Git vers des dépôts externes, contournant les restrictions CORS dans le navigateur.

Endpoint: /api/git-proxy/* (où * est le reste de l'URL du dépôt Git)

Méthode: Toutes les méthodes HTTP (GET, POST, etc.)

Requête: La requête est transmise telle quelle au serveur Git, avec les en-têtes CORS appropriés.

Réponse: La réponse du serveur Git est transmise au client, avec les en-têtes CORS appropriés.

Exemple d'utilisation (interne à useGit):

// La fonction `gitClone` dans `useGit` utilise cette API pour cloner un dépôt
const { workdir, data } = await gitClone('https://github.com/user/repo.git');
Use code with caution.
JavaScript
Note: Cette API n'est pas destinée à être utilisée directement par les utilisateurs, mais elle est cruciale pour le fonctionnement de la fonctionnalité de clonage de dépôts Git.

4. API de liste des modèles (/api/models)
Cette API fournit la liste des modèles disponibles, extraite de PROVIDER_LIST.

Endpoint: /api/models

Méthode: GET

Requête: Aucune

Réponse: Un objet JSON contenant la liste des modèles disponibles.

[
  {
    "name": "claude-3-5-sonnet-latest",
    "label": "Claude 3.5 Sonnet (new)",
    "provider": "Anthropic",
    "maxTokenAllowed": 8000
  },
  {
    "name": "claude-3-5-sonnet-20240620",
    "label": "Claude 3.5 Sonnet (old)",
    "provider": "Anthropic",
    "maxTokenAllowed": 8000
  },
  // ... autres modèles
]
Use code with caution.
Json
Exemple d'utilisation:

fetch('/api/models')
  .then((response) => response.json())
  .then((models) => {
    console.log('Modèles disponibles:', models);
  });
Use code with caution.
JavaScript
5. API d'appel LLM (/api/llmcall)
Cette API permet d'appeler directement un LLM avec un prompt système et un message utilisateur, et de recevoir une réponse en streaming ou en JSON.

Endpoint: /api/llmcall

Méthode: POST

Requête:

{
  "system": "string", // Prompt système optionnel
  "message": "string", // Message utilisateur
  "model": "string", // Modèle de LLM à utiliser
  "provider": { // Information sur le fournisseur de LLM
    "name": "string" // Nom du fournisseur (ex: "OpenAI")
  },
  "streamOutput": boolean // Indique si la sortie doit être streamée (optionnel, défaut: false)
}
Use code with caution.
Json
Réponse:

Si streamOutput est true: Un flux de texte (text/plain; charset=utf-8) contenant la réponse du LLM.

Si streamOutput est false: Un objet JSON avec la réponse du LLM.

{
  "text": "Réponse du LLM"
}
Use code with caution.
Json
Exemple d'utilisation (streaming):

const response = await fetch('/api/llmcall', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    system: 'Tu es un assistant serviable.',
    message: 'Écris un poème sur la nature.',
    model: 'claude-3-5-sonnet-latest',
    provider: { name: 'Anthropic' },
    streamOutput: true,
  }),
});

const reader = response.body.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = new TextDecoder().decode(value);
  console.log('Texte reçu:', text);
}
Use code with caution.
JavaScript
Exemple d'utilisation (JSON):

const response = await fetch('/api/llmcall', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    system: 'Tu es un assistant serviable.',
    message: 'Écris un poème sur la nature.',
    model: 'gpt-4',
    provider: { name: 'OpenAI' },
    streamOutput: false,
  }),
});

const result = await response.json();
console.log('Réponse du LLM:', result.text);
Use code with caution.
JavaScript
Notes:

Les clés API et les paramètres des fournisseurs sont gérés par les cookies, comme dans l'API /api/chat.

Cette API est utilisée en interne par la fonction selectStarterTemplate pour choisir un template de démarrage.

6. API non documentées
Il existe d'autres APIs non documentées dans le code source, comme celles liées à la gestion des fichiers et à la synchronisation avec le système de fichiers local. Ces APIs ne sont pas destinées à être utilisées directement par les utilisateurs finaux.