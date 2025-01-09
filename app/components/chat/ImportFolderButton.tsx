import React, { useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { MAX_FILES, isBinaryFile, shouldIncludeFile } from '~/utils/fileUtils';
import { createChatFromFolder } from '~/utils/folderImport';
import { logStore } from '~/lib/stores/logs'; // Assuming logStore is imported from this location

interface ImportFolderButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export const ImportFolderButton: React.FC<ImportFolderButtonProps> = ({ className, importChat }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);

    const filteredFiles = allFiles.filter((file) => {
      const path = file.webkitRelativePath.split('/').slice(1).join('/');
      const include = shouldIncludeFile(path);

      return include;
    });

    if (filteredFiles.length === 0) {
      const error = new Error('Aucun fichier valide trouvé');
      logStore.logError('Échec de l\'importation - aucun fichier valide', error, { folderName: 'Dossier inconnu' });
      toast.error('Aucun fichier trouvé dans le dossier sélectionné');

      return;
    }

    if (filteredFiles.length > MAX_FILES) {
      const error = new Error(`Trop de fichiers : ${filteredFiles.length}`);
      logStore.logError('Échec de l\'importation - trop de fichiers', error, {
        fileCount: filteredFiles.length,
        maxFiles: MAX_FILES,
      });
      toast.error(
        `Ce dossier contient ${filteredFiles.length.toLocaleString()} fichiers. Ce produit n'est pas encore optimisé pour les très grands projets. Veuillez sélectionner un dossier contenant moins de ${MAX_FILES.toLocaleString()} fichiers.`,
      );

      return;
    }

    const folderName = filteredFiles[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder';
    setIsLoading(true);

    const loadingToast = toast.loading(`Importation de ${folderName}...`);

    try {
      const fileChecks = await Promise.all(
        filteredFiles.map(async (file) => ({
          file,
          isBinary: await isBinaryFile(file),
        })),
      );

      const textFiles = fileChecks.filter((f) => !f.isBinary).map((f) => f.file);
      const binaryFilePaths = fileChecks
        .filter((f) => f.isBinary)
        .map((f) => f.file.webkitRelativePath.split('/').slice(1).join('/'));

      if (textFiles.length === 0) {
        const error = new Error('Aucun fichier texte trouvé');
        logStore.logError('Échec de l\'importation - aucun fichier texte', error, { folderName });
        toast.error('Aucun fichier texte trouvé dans le dossier sélectionné');

        return;
      }

      if (binaryFilePaths.length > 0) {
        logStore.logWarning(`Fichiers binaires ignorés pendant l'importation`, {
          folderName,
          binaryCount: binaryFilePaths.length,
        });
        toast.info(`${binaryFilePaths.length} fichiers binaires ignorés`);
      }

      const messages = await createChatFromFolder(textFiles, binaryFilePaths, folderName);

      if (importChat) {
        await importChat(folderName, [...messages]);
      }

      logStore.logSystem('Dossier importé avec succès', {
        folderName,
        textFileCount: textFiles.length,
        binaryFileCount: binaryFilePaths.length,
      });
      toast.success('Dossier importé avec succès');
    } catch (error) {
      logStore.logError('Échec de l\'importation du dossier', error, { folderName });
      console.error('Échec de l\'importation du dossier:', error);
      toast.error('Échec de l\'importation du dossier');
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <>
      <input
        type="file"
        id="folder-import"
        className="hidden"
        webkitdirectory=""
        directory=""
        onChange={handleFileChange}
        {...({} as any)}
      />
      <button
        onClick={() => {
          const input = document.getElementById('folder-import');
          input?.click();
        }}
        className={className}
        disabled={isLoading}
      >
        <div className="i-ph:upload-simple" />
        {isLoading ? 'Importation...' : 'Importer un dossier'}
      </button>
    </>
  );
};
