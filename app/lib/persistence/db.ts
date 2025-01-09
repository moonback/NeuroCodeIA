import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';

const logger = createScopedLogger('ChatHistory');

// this is used at the top level and never rejects
export async function openDatabase(): Promise<IDBDatabase | undefined> {
  if (typeof indexedDB === 'undefined') {
    console.error('indexedDB is not available in this environment.');
    return undefined;
  }

  return new Promise((resolve) => {
    // First try to get the current version
    const checkRequest = indexedDB.open('boltHistory');
    
    checkRequest.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const currentVersion = db.version;
      db.close();

      // Now open with the correct version
      const request = indexedDB.open('boltHistory', currentVersion);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('chats')) {
          const store = db.createObjectStore('chats', { keyPath: 'id' });
          store.createIndex('id', 'id', { unique: true });
          store.createIndex('urlId', 'urlId', { unique: true });
        }
      };

      request.onsuccess = (event: Event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event: Event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        logger.error('Failed to open database:', error);
        // Try to recover by deleting and recreating the database
        if (error?.name === 'VersionError') {
          indexedDB.deleteDatabase('boltHistory').onsuccess = () => {
            const recoveryRequest = indexedDB.open('boltHistory', 1);
            
            recoveryRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
              const db = (event.target as IDBOpenDBRequest).result;
              const store = db.createObjectStore('chats', { keyPath: 'id' });
              store.createIndex('id', 'id', { unique: true });
              store.createIndex('urlId', 'urlId', { unique: true });
            };

            recoveryRequest.onsuccess = (event: Event) => {
              resolve((event.target as IDBOpenDBRequest).result);
            };

            recoveryRequest.onerror = () => {
              logger.error('Failed to recover database');
              resolve(undefined);
            };
          };
        } else {
          resolve(undefined);
        }
      };
    };

    checkRequest.onerror = () => {
      logger.error('Failed to check database version');
      resolve(undefined);
    };
  });
}

export async function getAll(db: IDBDatabase): Promise<ChatHistoryItem[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as ChatHistoryItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function setMessages(
  db: IDBDatabase,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
): Promise<void> {
  if (timestamp && isNaN(Date.parse(timestamp))) {
    throw new Error('Invalid timestamp');
  }

  // Obtenir l'urlId avant de démarrer la transaction
  const finalUrlId = urlId || await getUrlId(db, id);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');

    const request = store.put({
      id,
      messages,
      urlId: finalUrlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
    });

    request.onsuccess = () => resolve();
    request.onerror = async () => {
      // Si l'erreur est due à un urlId en double, on réessaie avec un nouveau urlId
      if (request.error?.name === 'ConstraintError') {
        try {
          const newUrlId = await getUrlId(db, `${finalUrlId}-${Date.now()}`);
          // Créer une nouvelle transaction car la précédente est terminée
          const newTransaction = db.transaction('chats', 'readwrite');
          const newStore = newTransaction.objectStore('chats');
          
          const retryRequest = newStore.put({
            id,
            messages,
            urlId: newUrlId,
            description,
            timestamp: timestamp ?? new Date().toISOString(),
          });

          retryRequest.onsuccess = () => resolve();
          retryRequest.onerror = () => reject(retryRequest.error);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(request.error);
      }
    };
  });
}

export async function getMessages(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return (await getMessagesById(db, id)) || (await getMessagesByUrlId(db, id));
}

export async function getMessagesByUrlId(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const index = store.index('urlId');
    const request = index.get(id);

    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function getMessagesById(db: IDBDatabase, id: string): Promise<ChatHistoryItem> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as ChatHistoryItem);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteById(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.delete(id);

    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function getNextId(db: IDBDatabase): Promise<string> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAllKeys();

    request.onsuccess = () => {
      const highestId = request.result.reduce((cur, acc) => Math.max(+cur, +acc), 0);
      resolve(String(+highestId + 1));
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getUrlId(db: IDBDatabase, id: string): Promise<string> {
  if (!id) {
    // Générer un ID aléatoire si aucun ID n'est fourni
    return `chat-${Math.random().toString(36).substring(2, 15)}`;
  }

  const idList = await getUrlIds(db);
  
  // Nettoyer l'ID pour éviter les caractères problématiques
  const cleanId = id.replace(/[^a-zA-Z0-9-_]/g, '-');
  
  if (!idList.includes(cleanId)) {
    return cleanId;
  } else {
    let i = 2;
    let newId = `${cleanId}-${i}`;
    
    // Utiliser un Set pour une recherche plus efficace
    const idSet = new Set(idList);
    
    while (idSet.has(newId)) {
      i++;
      newId = `${cleanId}-${i}`;
      
      // Éviter une boucle infinie
      if (i > 1000) {
        return `${cleanId}-${Date.now()}`;
      }
    }
    
    return newId;
  }
}

async function getUrlIds(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const idList: string[] = [];

    const request = store.openCursor();

    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        // Ne pas ajouter les urlId undefined ou null
        if (cursor.value.urlId) {
          idList.push(cursor.value.urlId);
        }
        cursor.continue();
      } else {
        resolve(idList);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function forkChat(db: IDBDatabase, chatId: string, messageId: string): Promise<string> {
  const chat = await getMessages(db, chatId);

  if (!chat) {
    throw new Error('Chat not found');
  }

  // Find the index of the message to fork at
  const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

  if (messageIndex === -1) {
    throw new Error('Message not found');
  }

  // Get messages up to and including the selected message
  const messages = chat.messages.slice(0, messageIndex + 1);

  return createChatFromMessages(db, chat.description ? `${chat.description} (fork)` : 'Forked chat', messages);
}

export async function duplicateChat(db: IDBDatabase, id: string): Promise<string> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  return createChatFromMessages(db, `${chat.description || 'Chat'} (copy)`, chat.messages);
}

export async function createChatFromMessages(
  db: IDBDatabase,
  description: string,
  messages: Message[],
): Promise<string> {
  const newId = await getNextId(db);
  const newUrlId = await getUrlId(db, newId); // Get a new urlId for the duplicated chat

  await setMessages(
    db,
    newId,
    messages,
    newUrlId, // Use the new urlId
    description,
  );

  return newUrlId; // Return the urlId instead of id for navigation
}

export async function updateChatDescription(db: IDBDatabase, id: string, description: string): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!description.trim()) {
    throw new Error('Description cannot be empty');
  }

  await setMessages(db, id, chat.messages, chat.urlId, description, chat.timestamp);
}
