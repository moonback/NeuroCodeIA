import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { ImportFolderButton } from '~/components/chat/ImportFolderButton';

type ChatData = {
  messages?: Message[]; // Standard Bolt format
  description?: string; // Optional description
};
const DEV_SYSTEM_PROMPT = `### **Assistant de Planification Technique**

**Rôle :**
Je suis votre Assistant de Planification Technique, conçu pour vous guider dans la définition, la structuration et la documentation de votre projet d'application. Je vais vous poser des questions ciblées, rédiger des documents détaillés et recommander des technologies modernes.

---

### **Processus de Planification**

1. **Idée & Vision**
   - Description du projet et de son objectif principal
   - Identification du problème résolu
   - Définition du public cible et de ses besoins
   - Liste des fonctionnalités essentielles
   - Choix des plateformes (web/mobile/desktop)

2. **Interface Utilisateur**
   - Choix du framework (React, Vue, Angular)
   - Système de design (Material UI, TailwindCSS)
   - Composants principaux nécessaires
   - Structure de navigation
   - Besoins en animations/transitions

3. **Architecture Backend**
   - Choix du framework serveur
   - Structure de la base de données
   - Gestion de l'authentification
   - Points d'API nécessaires
   - Intégrations tierces

4. **Aspects Techniques**
   - Gestion d'état (Redux, Zustand)
   - Stockage des données
   - Communication API
   - Tests et qualité
   - Sécurité et performance

---

### **Méthodologie**

1. **Questions Progressives**
   - Une question à la fois
   - Adaptation au niveau technique
   - Clarification si nécessaire

2. **Documentation**
   - Rédaction en Markdown
   - Schémas et diagrammes
   - Spécifications détaillées
   - Guide d'implémentation

3. **Recommandations**
   - Technologies modernes
   - Bonnes pratiques
   - Solutions éprouvées
   - Considérations de scalabilité

4. **Livrables**
   - Documentation technique
   - Architecture détaillée
   - Spécifications fonctionnelles
   - Plan d'implémentation
   - Guide de démarrage

Je vais vous guider étape par étape dans ce processus. Commençons par la description de votre projet.`;

export function ImportButtons(importChat: ((description: string, messages: Message[]) => Promise<void>) | undefined, sendMessage: ((event: React.UIEvent, messageInput?: string) => void) | undefined) {
  return (
    <div className="flex flex-col items-center justify-center w-auto">
      <input
        type="file"
        id="chat-import"
        className="hidden"
        accept=".json"
        onChange={async (e) => {
          const file = e.target.files?.[0];

          if (file && importChat) {
            try {
              const reader = new FileReader();

              reader.onload = async (e) => {
                try {
                  const content = e.target?.result as string;
                  const data = JSON.parse(content) as ChatData;

                  // Standard format
                  if (Array.isArray(data.messages)) {
                    await importChat(data.description || 'Imported Chat', data.messages);
                    toast.success('Chat imported successfully');
                    return;
                  }

                  toast.error('Invalid chat file format');
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    toast.error('Failed to parse chat file: ' + error.message);
                  } else {
                    toast.error('Failed to parse chat file');
                  }
                }
              };
              reader.onerror = () => toast.error('Failed to read chat file');
              reader.readAsText(file);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Failed to import chat');
            }
            e.target.value = ''; // Reset file input
          } else {
            toast.error('Something went wrong');
          }
        }}
      />
      <div className="flex flex-col items-center gap-4 max-w-2xl text-center">
      <div className="flex gap-2">
        <button
          onClick={(event) => {
            sendMessage?.(event, DEV_SYSTEM_PROMPT);
          }}
          className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all flex items-center gap-2"
        >
          <div className="i-ph:hammer text-blue-500" />
          Assistant Dev
        </button>
        <button
          onClick={() => {
            const input = document.getElementById('chat-import');
            input?.click();
          }}
          className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all flex items-center gap-2"
        >
          <div className="i-ph:upload-simple" />
          Import Chat
        </button>
        <ImportFolderButton
          importChat={importChat}
          className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-all flex items-center gap-2"
        />
        </div>
      </div>
    </div>
  );
}
