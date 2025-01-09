import { getSystemPrompt } from './prompts/prompts';
import optimized from './prompts/optimized';

export interface PromptOptions {
  cwd: string;
  allowedHtmlElements: string[];
  modificationTagName: string;
}

export class PromptLibrary {
  static library: Record<
    string,
    {
      label: string;
      description: string;
      get: (options: PromptOptions) => string;
    }
  > = {
    default: {
      label: 'Prompt par défaut',
      description: 'Ceci est le prompt système éprouvé par défaut',
      get: (options) => getSystemPrompt(options.cwd),
    },
    optimized: {
      label: 'Prompt Optimisé (expérimental)',
      description: 'Une version expérimentale du prompt pour une utilisation réduite des tokens',
      get: (options) => optimized(options),
    },
    minimal: {
      label: 'Prompt React',
      description: 'Prompt pour une application React',
      get: (options) => getSystemPrompt(options.cwd),
    },
  };
  static getList() {
    return Object.entries(this.library).map(([key, value]) => {
      const { label, description } = value;
      return {
        id: key,
        label,
        description,
      };
    });
  }
  static getPropmtFromLibrary(promptId: string, options: PromptOptions) {
    const prompt = this.library[promptId];

    if (!prompt) {
      throw 'Prompt Now Found';
    }

    return this.library[promptId]?.get(options);
  }
}
