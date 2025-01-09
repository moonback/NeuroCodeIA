import { useStore } from '@nanostores/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { workbenchStore } from '~/lib/stores/workbench';
import { PortDropdown } from './PortDropdown';
import { ScreenshotSelector } from './ScreenshotSelector';

type ResizeSide = 'left' | 'right' | null;

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  icon: string;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { name: 'Mobile S', width: 320, height: 568, icon: 'i-ph:device-mobile' },
  { name: 'Mobile M', width: 375, height: 667, icon: 'i-ph:device-mobile' },
  { name: 'Mobile L', width: 425, height: 812, icon: 'i-ph:device-mobile' },
  { name: 'Tablet', width: 768, height: 1024, icon: 'i-ph:device-tablet' },
  { name: 'Laptop', width: 1024, height: 768, icon: 'i-ph:laptop' },
  { name: 'Desktop', width: 1440, height: 900, icon: 'i-ph:desktop' },
];

export const Preview = memo(() => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [customWidth, setCustomWidth] = useState('100%');
  const [customHeight, setCustomHeight] = useState('100%');
  
  const hasSelectedPreview = useRef(false);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const SCALING_FACTOR = 2;

  const [url, setUrl] = useState('');
  const [iframeUrl, setIframeUrl] = useState<string | undefined>();
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Toggle between responsive mode and device mode
  const [isDeviceModeOn, setIsDeviceModeOn] = useState(false);

  // Use percentage for width
  const [widthPercent, setWidthPercent] = useState<number>(37.5);

  const resizingState = useRef({
    isResizing: false,
    side: null as ResizeSide,
    startX: 0,
    startWidthPercent: 37.5,
    windowWidth: window.innerWidth,
  });

  useEffect(() => {
    if (!activePreview) {
      setUrl('');
      setIframeUrl(undefined);
      return;
    }

    const { baseUrl } = activePreview;
    setUrl(baseUrl);
    setIframeUrl(baseUrl);
  }, [activePreview]);

  const validateUrl = useCallback(
    (value: string) => {
      if (!activePreview) {
        return false;
      }

      const { baseUrl } = activePreview;

      if (value === baseUrl) {
        return true;
      } else if (value.startsWith(baseUrl)) {
        return ['/', '?', '#'].includes(value.charAt(baseUrl.length));
      }

      return false;
    },
    [activePreview],
  );

  const findMinPortIndex = useCallback(
    (minIndex: number, preview: { port: number }, index: number, array: { port: number }[]) => {
      return preview.port < array[minIndex].port ? index : minIndex;
    },
    [],
  );

  useEffect(() => {
    if (previews.length > 1 && !hasSelectedPreview.current) {
      const minPortIndex = previews.reduce(findMinPortIndex, 0);
      setActivePreviewIndex(minPortIndex);
    }
  }, [previews, findMinPortIndex]);

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen && containerRef.current) {
      await containerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const selectDevice = (device: DevicePreset | null) => {
    setSelectedDevice(device);
    if (device) {
      setCustomWidth(`${device.width}px`);
      setCustomHeight(`${device.height}px`);
      setIsDeviceModeOn(true);
    } else {
      setCustomWidth('100%');
      setCustomHeight('100%');
      setIsDeviceModeOn(false);
    }
  };

  const toggleDeviceMode = () => {
    setIsDeviceModeOn((prev) => !prev);
    if (!isDeviceModeOn) {
      setSelectedDevice(DEVICE_PRESETS[0]);
      setCustomWidth(`${DEVICE_PRESETS[0].width}px`);
      setCustomHeight(`${DEVICE_PRESETS[0].height}px`);
    } else {
      setSelectedDevice(null);
      setCustomWidth('100%');
      setCustomHeight('100%');
    }
  };

  const startResizing = (e: React.MouseEvent, side: ResizeSide) => {
    if (!isDeviceModeOn) {
      return;
    }

    document.body.style.userSelect = 'none';
    resizingState.current.isResizing = true;
    resizingState.current.side = side;
    resizingState.current.startX = e.clientX;
    resizingState.current.startWidthPercent = widthPercent;
    resizingState.current.windowWidth = window.innerWidth;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!resizingState.current.isResizing) {
      return;
    }

    const dx = e.clientX - resizingState.current.startX;
    const windowWidth = resizingState.current.windowWidth;
    const dxPercent = (dx / windowWidth) * 100 * SCALING_FACTOR;
    let newWidthPercent = resizingState.current.startWidthPercent;

    if (resizingState.current.side === 'right') {
      newWidthPercent = resizingState.current.startWidthPercent + dxPercent;
    } else if (resizingState.current.side === 'left') {
      newWidthPercent = resizingState.current.startWidthPercent - dxPercent;
    }

    newWidthPercent = Math.max(10, Math.min(newWidthPercent, 90));
    setWidthPercent(newWidthPercent);
  };

  const onMouseUp = () => {
    resizingState.current.isResizing = false;
    resizingState.current.side = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    const handleWindowResize = () => {
      // Ajuster si nécessaire
    };

    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const GripIcon = () => (
    <div className="flex justify-center items-center h-full pointer-events-none">
      <div className="text-gray-500 text-xs leading-[5px] select-none ml-[1px]">••• •••</div>
    </div>
  );

  // Ajout de l'effet pour le mode debug
  useEffect(() => {
    if (!debugMode || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const debugOverlay = document.createElement('div');
    debugOverlay.id = 'preview-debug-overlay';
    debugOverlay.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      z-index: 9999;
      pointer-events: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
      max-width: 300px;
      backdrop-filter: blur(4px);
    `;

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getConnectionInfo = (): string => {
      const connection = (navigator as any).connection;
      if (!connection) return 'Non disponible';
      return `${connection.effectiveType || 'inconnu'} (${connection.downlink}Mbps)`;
    };

    const updateDebugInfo = () => {
      if (!iframe.parentElement) return;
      
      const width = iframe.offsetWidth;
      const height = iframe.offsetHeight;
      const scale = window.devicePixelRatio;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const aspectRatio = (width / height).toFixed(2);
      const orientation = width > height ? 'Paysage' : 'Portrait';
      const memory = (performance as any).memory?.usedJSHeapSize;
      
      // Nouvelles informations
      const browserLanguage = navigator.language;
      const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Sombre' : 'Clair';
      const touchDevice = 'ontouchstart' in window ? 'Oui' : 'Non';
      const batteryInfo = (navigator as any).getBattery ? 'Disponible' : 'Non disponible';
      const webGLInfo = (() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (!gl) return 'Non disponible';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Disponible';
      })();
      
      const sections = [
        {
          title: '📱 Dimensions',
          content: `
            <div class="debug-row"><span>Largeur:</span> <span style="color: #7dd3fc">${width}px</span></div>
            <div class="debug-row"><span>Hauteur:</span> <span style="color: #7dd3fc">${height}px</span></div>
            <div class="debug-row"><span>Ratio:</span> <span style="color: #7dd3fc">${aspectRatio}</span></div>
            <div class="debug-row"><span>Mode:</span> <span style="color: #7dd3fc">${orientation}</span></div>
          `
        },
        {
          title: '🖥️ Écran',
          content: `
            <div class="debug-row"><span>Viewport:</span> <span style="color: #7dd3fc">${viewportWidth}x${viewportHeight}</span></div>
            <div class="debug-row"><span>Échelle:</span> <span style="color: #7dd3fc">${scale}x</span></div>
            <div class="debug-row"><span>DPI:</span> <span style="color: #7dd3fc">${96 * scale}</span></div>
            <div class="debug-row"><span>Thème:</span> <span style="color: #7dd3fc">${colorScheme}</span></div>
          `
        },
        {
          title: '🔧 Système',
          content: `
            <div class="debug-row"><span>OS:</span> <span style="color: #7dd3fc">${navigator.platform}</span></div>
            <div class="debug-row"><span>Navigateur:</span> <span style="color: #7dd3fc">${navigator.userAgent.split(') ')[0].split(' (')[0]}</span></div>
            <div class="debug-row"><span>Langue:</span> <span style="color: #7dd3fc">${browserLanguage}</span></div>
            <div class="debug-row"><span>Tactile:</span> <span style="color: #7dd3fc">${touchDevice}</span></div>
          `
        },
        {
          title: '🎮 Performances',
          content: `
            ${memory ? `<div class="debug-row"><span>Mémoire:</span> <span style="color: #7dd3fc">${formatBytes(memory)}</span></div>` : ''}
            <div class="debug-row"><span>WebGL:</span> <span style="color: #7dd3fc">${webGLInfo}</span></div>
            <div class="debug-row"><span>Batterie:</span> <span style="color: #7dd3fc">${batteryInfo}</span></div>
          `
        },
        {
          title: '🌐 Réseau',
          content: `
            <div class="debug-row"><span>Connexion:</span> <span style="color: #7dd3fc">${getConnectionInfo()}</span></div>
            <div class="debug-row"><span>Online:</span> <span style="color: ${navigator.onLine ? '#86efac' : '#fca5a5'}">${navigator.onLine ? 'Oui' : 'Non'}</span></div>
            <div class="debug-row"><span>Protocole:</span> <span style="color: #7dd3fc">${window.location.protocol}</span></div>
          `
        }
      ];

      debugOverlay.innerHTML = `
        <style>
          .debug-section { 
            margin-bottom: 16px;
            background: rgba(255, 255, 255, 0.05);
            padding: 12px;
            border-radius: 6px;
          }
          .debug-section:last-child { margin-bottom: 0; }
          .debug-title { 
            color: #94a3b8;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .debug-title::after {
            content: '';
            height: 1px;
            background: rgba(148, 163, 184, 0.2);
            flex-grow: 1;
          }
          .debug-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
            font-size: 11px;
          }
          .debug-row:hover {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            padding: 2px 4px;
            margin: 2px -4px;
          }
          .debug-row span:first-child {
            color: #94a3b8;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .debug-section {
            animation: fadeIn 0.3s ease-out forwards;
            animation-delay: calc(var(--index) * 0.1s);
            opacity: 0;
          }
        </style>
        ${sections.map((section, index) => `
          <div class="debug-section" style="--index: ${index}">
            <div class="debug-title">${section.title}</div>
            ${section.content}
          </div>
        `).join('')}
      `;
    };

    // Ajouter l'overlay au parent de l'iframe
    if (iframe.parentElement) {
      iframe.parentElement.appendChild(debugOverlay);
      updateDebugInfo();

      // Observer les changements de taille avec un debounce
      let resizeTimeout: NodeJS.Timeout;
      const resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateDebugInfo, 100);
      });

      resizeObserver.observe(iframe);

      // Observer les changements de DPI/échelle
      const mediaQueryList = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mediaQueryList.addEventListener('change', updateDebugInfo);

      // Observer les changements de connexion
      if ((navigator as any).connection) {
        (navigator as any).connection.addEventListener('change', updateDebugInfo);
      }

      // Observer le statut online/offline
      window.addEventListener('online', updateDebugInfo);
      window.addEventListener('offline', updateDebugInfo);

      // Nettoyer
      return () => {
        resizeObserver.disconnect();
        mediaQueryList.removeEventListener('change', updateDebugInfo);
        if ((navigator as any).connection) {
          (navigator as any).connection.removeEventListener('change', updateDebugInfo);
        }
        window.removeEventListener('online', updateDebugInfo);
        window.removeEventListener('offline', updateDebugInfo);
        clearTimeout(resizeTimeout);
        debugOverlay.remove();
      };
    }
  }, [debugMode]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col relative">
      {isPortDropdownOpen && (
        <div className="z-iframe-overlay w-full h-full absolute" onClick={() => setIsPortDropdownOpen(false)} />
      )}
      <div className="bg-bolt-elements-background-depth-2 p-2 flex items-center gap-1.5 flex-wrap">
        <IconButton icon="i-ph:arrow-clockwise" onClick={reloadPreview} />
        <IconButton
          icon="i-ph:selection"
          onClick={() => setIsSelectionMode(!isSelectionMode)}
          className={isSelectionMode ? 'bg-bolt-elements-background-depth-3' : ''}
        />
        
        {/* Debug mode toggle */}
        <IconButton
          icon="i-ph:bug"
          onClick={() => setDebugMode(!debugMode)}
          className={debugMode ? 'bg-bolt-elements-background-depth-3' : ''}
          title={debugMode ? 'Désactiver le mode debug' : 'Activer le mode debug'}
        />

        <div className="flex items-center gap-1 flex-grow bg-bolt-elements-preview-addressBar-background border border-bolt-elements-borderColor text-bolt-elements-preview-addressBar-text rounded-full px-3 py-1 text-sm hover:bg-bolt-elements-preview-addressBar-backgroundHover hover:focus-within:bg-bolt-elements-preview-addressBar-backgroundActive focus-within:bg-bolt-elements-preview-addressBar-backgroundActive focus-within-border-bolt-elements-borderColorActive focus-within:text-bolt-elements-preview-addressBar-textActive">
          <input
            title="URL"
            ref={inputRef}
            className="w-full bg-transparent outline-none"
            type="text"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && validateUrl(url)) {
                setIframeUrl(url);
                if (inputRef.current) {
                  inputRef.current.blur();
                }
              }
            }}
          />
        </div>

        {previews.length > 1 && (
          <PortDropdown
            activePreviewIndex={activePreviewIndex}
            setActivePreviewIndex={setActivePreviewIndex}
            isDropdownOpen={isPortDropdownOpen}
            setHasSelectedPreview={(value) => (hasSelectedPreview.current = value)}
            setIsDropdownOpen={setIsPortDropdownOpen}
            previews={previews}
          />
        )}

        {/* Device presets dropdown */}
        <div className="relative">
          <IconButton
            icon="i-ph:devices"
            onClick={toggleDeviceMode}
            className={isDeviceModeOn ? 'bg-bolt-elements-background-depth-3' : ''}
            title="Mode appareil"
          />
          {isDeviceModeOn && (
            <div className="absolute top-full right-0 mt-1 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-lg p-2 z-10">
              {DEVICE_PRESETS.map((device) => (
                <button
                  key={device.name}
                  className={`flex items-center gap-2 px-3 py-2 w-full rounded hover:bg-bolt-elements-background-depth-3 ${
                    selectedDevice?.name === device.name ? 'bg-bolt-elements-background-depth-3' : ''
                  }`}
                  onClick={() => selectDevice(device)}
                >
                  <div className={device.icon} />
                  <span>{device.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {device.width}x{device.height}
                  </span>
                </button>
              ))}
              <button
                className="flex items-center gap-2 px-3 py-2 w-full rounded hover:bg-bolt-elements-background-depth-3 mt-2 border-t border-bolt-elements-borderColor"
                onClick={() => selectDevice(null)}
              >
                <div className="i-ph:arrows-out" />
                <span>Mode responsive</span>
              </button>
            </div>
          )}
        </div>

        <IconButton
          icon={isFullscreen ? 'i-ph:arrows-in' : 'i-ph:arrows-out'}
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
        />
      </div>

      <div className="flex-1 border-t border-bolt-elements-borderColor flex justify-center items-center overflow-auto bg-gray-100">
        <div
          style={{
            width: isDeviceModeOn ? customWidth : '100%',
            height: isDeviceModeOn ? customHeight : '100%',
            overflow: 'visible',
            background: '#fff',
            position: 'relative',
            display: 'flex',
            transition: 'width 0.3s, height 0.3s',
            boxShadow: isDeviceModeOn ? '0 0 20px rgba(0,0,0,0.1)' : 'none',
            borderRadius: isDeviceModeOn ? '8px' : '0',
          }}
        >
          {activePreview ? (
            <>
              <iframe
                ref={iframeRef}
                title="preview"
                className="border-none w-full h-full bg-white"
                src={iframeUrl}
                allowFullScreen
              />
              <ScreenshotSelector
                isSelectionMode={isSelectionMode}
                setIsSelectionMode={setIsSelectionMode}
                containerRef={iframeRef}
              />
            </>
          ) : (
            <div className="flex w-full h-full justify-center items-center bg-white">
              Aucun aperçu disponible
            </div>
          )}

          {isDeviceModeOn && (
            <>
              <div
                onMouseDown={(e) => startResizing(e, 'left')}
                className="absolute top-0 left-0 w-4 h-full cursor-ew-resize bg-opacity-20 hover:bg-opacity-50 transition-colors -ml-4 flex items-center justify-center"
                title="Redimensionner la largeur"
              >
                <GripIcon />
              </div>
              <div
                onMouseDown={(e) => startResizing(e, 'right')}
                className="absolute top-0 right-0 w-4 h-full cursor-ew-resize bg-opacity-20 hover:bg-opacity-50 transition-colors -mr-4 flex items-center justify-center"
                title="Redimensionner la largeur"
              >
                <GripIcon />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
