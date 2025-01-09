Diagrammes UML pour NeuroCode-ia
Voici quelques diagrammes UML pour illustrer la structure et les interactions clés de NeuroCode-ia.

1. Diagramme de Classes (Simplifié)
Ce diagramme montre les classes principales et leurs relations.

@startuml
class Chat {
  -initialMessages: Message[]
  -storeMessageHistory(messages: Message[]): Promise<void>
  -importChat(description: string, messages: Message[]): Promise<void>
  -exportChat(): void
}

class Workbench {
  -files: FileMap
  -unsavedFiles: Set<string>
  -selectedFile: string
  -currentDocument: EditorDocument
  -showWorkbench: boolean
  -currentView: WorkbenchViewType
  -previews: PreviewInfo[]
  -actionAlert: ActionAlert
  -boltTerminal: ITerminal
  +addAction(data: ActionCallbackData)
  +runAction(data: ActionCallbackData, isStreaming: boolean)
  +setSelectedFile(filePath: string)
  +saveFile(filePath: string, content: string)
  +saveAllFiles()
  +resetCurrentDocument()
  +downloadZip()
  +pushToGitHub(repoName: string, username: string, token: string)
  +toggleTerminal(value?: boolean)
}

class EditorPanel {
  -files: FileMap
  -unsavedFiles: Set<string>
  -editorDocument: EditorDocument
  -selectedFile: string
  -isStreaming: boolean
  +onEditorChange(update: EditorUpdate)
  +onEditorScroll(position: ScrollPosition)
  +onFileSelect(value?: string)
  +onFileSave()
  +onFileReset()
}

class FileTree {
  -files: FileMap
  -selectedFile: string
  -rootFolder: string
  -hideRoot: boolean
  -collapsed: boolean
  +onFileSelect(filePath: string)
}

class Terminal {
  -terminal: ITerminal
  +write(data: string)
  +onData(callback: (data: string) => void)
}

class API {
  +POST /api/chat
  +POST /api/enhancer
  +GET /api/models
  +ANY /api/git-proxy/*
}

class ActionRunner {
  -webcontainer: Promise<WebContainer>
  -currentExecutionPromise: Promise<void>
  -shellTerminal: () => BoltShell
  +actions: ActionsMap
  +runnerId: WritableAtom<string>
  +onAlert: (alert: ActionAlert) => void
  +addAction(data: ActionCallbackData)
  +runAction(data: ActionCallbackData, isStreaming: boolean)
  -executeAction(actionId: string, isStreaming: boolean)
  -runShellAction(action: ActionState)
  -runStartAction(action: ActionState)
  -runFileAction(action: ActionState)
  -updateAction(id: string, newState: ActionStateUpdate)
  +abortAllActions()
  +setReloadedMessages(messages: string[])
}

Chat --* Workbench : uses
Workbench o-- EditorPanel : has
Workbench "1" o-- "0..*" Terminal : has
EditorPanel o-- FileTree : has
API -- Chat : interacts with
@enduml
Use code with caution.
Plantuml
Explication du diagramme de classes :

Chat: Composant principal de l'interface de chat.

Workbench: Gère l'état global de l'atelier (fichiers, éditeur, terminal, aperçu).

EditorPanel: Gère l'affichage de l'éditeur de code et de l'arborescence des fichiers.

FileTree: Affiche l'arborescence des fichiers.

Terminal: Gère un terminal unique.

API: Représente les endpoints de l'API REST.

ActionRunner: Gère l'exécution des actions suggérées par le LLM.

2. Diagramme de Séquence (Création d'un fichier)
Ce diagramme illustre la séquence d'actions lors de la création d'un fichier par le LLM.

@startuml
participant User as U
participant Chat as C
participant API as A
participant LLM
participant ActionRunner as AR
participant Workbench as W
participant FilesStore as FS
participant WebContainer as WC

U -> C: Envoie un prompt "Crée un fichier index.html"
activate C
C -> A: POST /api/chat {messages: [...]}
activate A
A -> LLM: Envoie le prompt au LLM
activate LLM
LLM --> A: Réponse en streaming avec `<boltArtifact>` et `<boltAction type="file">`
deactivate LLM
A -> AR: onArtifactOpen(...)
activate AR
AR -> W: addArtifact(...)
activate W
W -> W: set showWorkbench = true
deactivate W
A -> AR: onActionOpen({type: "file", filePath: "index.html", content: "..."})
AR -> AR: addAction(...)
A -> C: Envoie le flux de texte
deactivate A
C -> U: Affiche le texte
loop pour chaque chunk de texte
  A -> C: Envoie le chunk de texte
  C -> C: parseMessages(...)
  C -> U: Met à jour l'affichage
end
A -> AR: onActionClose(...)
AR -> AR: runAction(...)
activate AR
AR -> FS: saveFile("index.html", "...")
activate FS
FS -> WC: writeFile("index.html", "...")
activate WC
WC --> FS: Succès
deactivate WC
FS -> W: met à jour files
deactivate FS
W -> W: met à jour l'état (unsavedFiles)
deactivate W
AR --> A: Succès
deactivate AR
A -> C: Envoie "usage" data
C --> U: Affiche la réponse complète
deactivate C

@enduml
Use code with caution.
Plantuml
Explication du diagramme de séquence :

L'utilisateur envoie un prompt pour créer un fichier.

Le composant Chat envoie la requête à l'API /api/chat.

L'API communique avec le LLM.

Le LLM renvoie une réponse en streaming.

StreamingMessageParser parse la réponse et appelle les callbacks onArtifactOpen et onActionOpen pour ActionRunner.

ActionRunner ajoute l'artefact et l'action à son état interne.

ActionRunner exécute l'action de type "file".

FilesStore écrit le contenu du fichier dans le WebContainer.

Workbench met à jour l'état files et unsavedFiles.

L'API envoie les informations d'utilisation des jetons au frontend.

3. Diagramme d'Activité (Amélioration de Prompt)
Ce diagramme illustre le processus d'amélioration d'un prompt utilisateur.

@startuml
start
:Utilisateur saisit un prompt;
:Clic sur "Améliorer le prompt";
:Composant Chat appelle usePromptEnhancer.enhancePrompt();
:Affichage de l'indicateur de chargement;
:Requête POST vers /api/enhancer;
fork
    :API appelle le LLM avec le prompt système d'amélioration;
fork again
    :Réception du flux de texte amélioré;
    :Mise à jour progressive du prompt dans la zone de texte;
end fork
:Fin du streaming;
:Masquage de l'indicateur de chargement;
:Utilisateur peut modifier le prompt amélioré;
:Utilisateur envoie le prompt;
stop
@enduml
Use code with caution.
Plantuml
Explication du diagramme d'activité :

L'utilisateur saisit un prompt dans la zone de texte.

L'utilisateur clique sur le bouton "Améliorer le prompt".

La fonction enhancePrompt du hook usePromptEnhancer est appelée.

Un indicateur de chargement est affiché.

Une requête POST est envoyée à l'API /api/enhancer.

L'API appelle le LLM avec le prompt système d'amélioration et le prompt utilisateur.

Le LLM renvoie le prompt amélioré en streaming.

La zone de texte est mise à jour progressivement avec le prompt amélioré.

L'indicateur de chargement est masqué.

L'utilisateur peut modifier le prompt amélioré avant de l'envoyer.

Ces diagrammes ne représentent qu'une partie de l'architecture et du design de NeuroCode-ia. Ils visent à donner une compréhension générale des interactions clés. Des diagrammes plus détaillés pourraient être créés pour des composants spécifiques ou des cas d'utilisation particuliers.