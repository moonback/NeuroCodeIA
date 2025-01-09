import { useStore } from '@nanostores/react';
import { memo, useMemo, useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  CodeMirrorEditor,
  type EditorDocument,
  type EditorSettings,
  type OnChangeCallback as OnEditorChange,
  type OnSaveCallback as OnEditorSave,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { PanelHeader } from '~/components/ui/PanelHeader';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import type { FileMap } from '~/lib/stores/files';
import { themeStore } from '~/lib/stores/theme';
import { WORK_DIR } from '~/utils/constants';
import { renderLogger } from '~/utils/logger';
import { isMobile } from '~/utils/mobile';
import { FileBreadcrumb } from './FileBreadcrumb';
import { FileTree } from './FileTree';
import { DEFAULT_TERMINAL_SIZE, TerminalTabs } from './terminal/TerminalTabs';
import { workbenchStore } from '~/lib/stores/workbench';
import { EditorTabs } from './EditorTabs';

interface EditorPanelProps {
  files?: FileMap;
  unsavedFiles?: Set<string>;
  editorDocument?: EditorDocument;
  selectedFile?: string | undefined;
  isStreaming?: boolean;
  onEditorChange?: OnEditorChange;
  onEditorScroll?: OnEditorScroll;
  onFileSelect?: (value?: string) => void;
  onFileSave?: OnEditorSave;
  onFileReset?: () => void;
}

const DEFAULT_EDITOR_SIZE = 100 - DEFAULT_TERMINAL_SIZE;

const editorSettings: EditorSettings = { tabSize: 2 };

export const EditorPanel = memo(
  ({
    files,
    unsavedFiles,
    editorDocument,
    selectedFile,
    isStreaming,
    onFileSelect,
    onEditorChange,
    onEditorScroll,
    onFileSave,
    onFileReset,
  }: EditorPanelProps) => {
    renderLogger.trace('EditorPanel');

    const theme = useStore(themeStore);
    const showTerminal = useStore(workbenchStore.showTerminal);
    const [openTabs, setOpenTabs] = useState<string[]>([]);

    const activeFileSegments = useMemo(() => {
      if (!editorDocument) {
        return undefined;
      }

      return editorDocument.filePath.split('/');
    }, [editorDocument]);

    const activeFileUnsaved = useMemo(() => {
      return editorDocument !== undefined && unsavedFiles?.has(editorDocument.filePath);
    }, [editorDocument, unsavedFiles]);

    // Gérer les onglets
    const handleTabSelect = (filePath: string) => {
      onFileSelect?.(filePath);
    };

    const handleTabClose = (filePath: string) => {
      setOpenTabs((tabs) => tabs.filter((tab) => tab !== filePath));
      if (selectedFile === filePath) {
        const remainingTabs = openTabs.filter((tab) => tab !== filePath);
        if (remainingTabs.length > 0) {
          onFileSelect?.(remainingTabs[remainingTabs.length - 1]);
        } else {
          onFileSelect?.(undefined);
        }
      }
    };

    // Ajouter le fichier sélectionné aux onglets s'il n'y est pas déjà
    useEffect(() => {
      if (selectedFile && !openTabs.includes(selectedFile)) {
        setOpenTabs((tabs) => [...tabs, selectedFile]);
      }
    }, [selectedFile]);

    const tabs = useMemo(() => {
      return openTabs.map((filePath) => ({
        filePath,
        isUnsaved: unsavedFiles?.has(filePath) || false,
      }));
    }, [openTabs, unsavedFiles]);

    return (
      <PanelGroup direction="vertical">
        <Panel defaultSize={showTerminal ? DEFAULT_EDITOR_SIZE : 100} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={20} minSize={10} collapsible>
              <div className="flex flex-col border-r border-bolt-elements-borderColor h-full">
                <PanelHeader>
                  <div className="i-ph:tree-structure-duotone shrink-0" />
                  Fichiers
                  <PanelHeaderButton onClick={() => setOpenTabs([])}>
                    <div className="i-ph:x-circle-duotone" />
                    Fermer tout
                  </PanelHeaderButton>
                </PanelHeader>
                <FileTree
                  className="h-full"
                  files={files}
                  hideRoot
                  unsavedFiles={unsavedFiles}
                  rootFolder={WORK_DIR}
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                />
              </div>
            </Panel>
            <PanelResizeHandle />
            <Panel className="flex flex-col" defaultSize={80} minSize={20}>
              <EditorTabs
                tabs={tabs}
                activeTab={selectedFile}
                onTabSelect={handleTabSelect}
                onTabClose={handleTabClose}
              />
              <PanelHeader className="overflow-x-auto">
                {activeFileSegments?.length && (
                  <div className="flex items-center flex-1 text-sm">
                    <FileBreadcrumb pathSegments={activeFileSegments} files={files} onFileSelect={onFileSelect} />
                    {activeFileUnsaved && (
                      <div className="flex gap-1 ml-auto -mr-1.5">
                        <PanelHeaderButton onClick={onFileSave}>
                          <div className="i-ph:floppy-disk-duotone" />
                          Enregistrer
                        </PanelHeaderButton>
                        <PanelHeaderButton onClick={onFileReset}>
                          <div className="i-ph:clock-counter-clockwise-duotone" />
                          Réinitialiser
                        </PanelHeaderButton>
                      </div>
                    )}
                  </div>
                )}
              </PanelHeader>
              <div className="h-full flex-1 overflow-hidden">
                <CodeMirrorEditor
                  theme={theme}
                  editable={!isStreaming && editorDocument !== undefined}
                  settings={editorSettings}
                  doc={editorDocument}
                  autoFocusOnDocumentChange={!isMobile()}
                  onScroll={onEditorScroll}
                  onChange={onEditorChange}
                  onSave={onFileSave}
                />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle />
        <TerminalTabs />
      </PanelGroup>
    );
  },
);
