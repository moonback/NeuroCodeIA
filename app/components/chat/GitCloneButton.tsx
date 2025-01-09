import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import * as RadixDialog from '@radix-ui/react-dialog';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yaml',
];

const ig = ignore().add(IGNORE_PATTERNS);

interface GitCloneButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export default function GitCloneButton({ importChat }: GitCloneButtonProps) {
  const { ready, gitClone } = useGit();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [progress, setProgress] = useState(0);

  const validateGitUrl = (url: string): boolean => {
    const gitUrlPattern = /^(https?:\/\/)?([\w.-]+@)?([\w.-]+\.[a-z]{2,})(:\d+)?\/?([\w.-]+\/[\w.-]+)(\.git)?$/;
    return gitUrlPattern.test(url);
  };

  const handleClone = async () => {
    if (!ready || !repoUrl) {
      return;
    }

    if (!validateGitUrl(repoUrl)) {
      toast.error('URL du dépôt Git invalide. Veuillez vérifier le format.');
      return;
    }

    setIsOpen(false);
    setLoading(true);
    setProgress(10);

    try {
      const { workdir, data } = await gitClone(repoUrl);
      setProgress(30);

      if (importChat) {
        const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
        const textDecoder = new TextDecoder('utf-8');
        setProgress(50);

        const fileContents = filePaths
          .map((filePath) => {
            const { data: content, encoding } = data[filePath];
            return {
              path: filePath,
              content: encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
            };
          })
          .filter((f) => f.content);

        setProgress(70);
        const commands = await detectProjectCommands(fileContents);
        const commandsMessage = createCommandsMessage(commands);
        setProgress(85);

        const filesMessage: Message = {
          role: 'assistant',
          content: `Clonage du dépôt ${repoUrl} dans ${workdir}
<boltArtifact id="imported-files" title="Fichiers Git Clonés" type="bundled">
${fileContents
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`,
          id: generateId(),
          createdAt: new Date(),
        };

        const messages = [filesMessage];

        if (commandsMessage) {
          messages.push(commandsMessage);
        }

        setProgress(95);
        await importChat(`Projet Git: ${repoUrl.split('/').slice(-1)[0]}`, messages);
        toast.success('Dépôt cloné avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error('Échec du clonage du dépôt. Veuillez vérifier l\'URL et réessayer.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <RadixDialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <RadixDialog.Trigger asChild>
          <button
            title="Cloner un dépôt Git"
            className="px-4 py-2 rounded-lg border border-[#4A4A4A] bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-all flex items-center gap-2"
            aria-label="Ouvrir la boîte de dialogue de clonage Git"
          >
            <span className="i-ph:git-branch text-[#9C7DFF]" aria-hidden="true" />
            Cloner un dépôt Git
          </button>
        </RadixDialog.Trigger>

        <RadixDialog.Portal>
          <div className="fixed inset-0 z-50">
            <RadixDialog.Overlay className="fixed inset-0 bg-black/70">
              <div className="absolute inset-0 backdrop-blur-md" />
            </RadixDialog.Overlay>

            <RadixDialog.Content 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[370px] bg-[#1A1A1A] rounded-xl shadow-2xl overflow-hidden border border-[#333333]"
              aria-labelledby="dialog-title"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[328px] h-[87px] bg-[#9C7DFF] rounded-full blur-[160px] opacity-30" />
              <div className="absolute -left-[46px] -top-[45px] w-[178px] h-[158px] rounded-full bg-gradient-to-br from-[#DF52DF] to-[#480876] blur-[100px] opacity-30" />

              <div className="relative h-full flex flex-col p-8">
                <div className="flex flex-col items-center mb-8">
                  <h2 id="dialog-title" className="text-xl font-semibold text-white mb-6">Cloner un dépôt Git</h2>
                  <div className="w-[90px] h-[90px] bg-[#2A2A2A] rounded-full p-4">
                    <img src="/github-mark.svg" alt="Logo GitHub" className="w-full h-full invert" />
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="Entrez l'URL du dépôt Git"
                    aria-label="URL du dépôt Git"
                    className="mt-4 w-full h-12 px-4 rounded-md border border-[#333333] bg-[#2A2A2A] text-white placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#9C7DFF] focus:border-transparent transition-all"
                  />
                  {repoUrl && !validateGitUrl(repoUrl) && (
                    <p className="text-[#FF6B6B] text-sm mt-1">Format d'URL invalide</p>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleClone}
                    disabled={!repoUrl || !validateGitUrl(repoUrl)}
                    className="w-full h-12 rounded-md bg-[#9C7DFF] text-white font-medium hover:bg-[#8A6AE3] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    aria-label="Cloner le dépôt"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin i-ph:spinner text-white" aria-hidden="true" />
                        Clonage en cours...
                      </>
                    ) : (
                      'Cloner'
                    )}
                  </button>
                </div>

                <RadixDialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#888888] hover:text-white hover:bg-[#333333] transition-all focus:outline-none"
                    aria-label="Fermer"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </RadixDialog.Close>
              </div>
            </RadixDialog.Content>
          </div>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      {loading && (
        <LoadingOverlay 
          message={`Veuillez patienter pendant le clonage du dépôt... ${progress}%`}
        />
      )}
    </>
  );
}