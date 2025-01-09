import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

interface Position {
  x: number;
  y: number;
}

interface ScreenshotSelectorProps {
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  containerRef: React.RefObject<HTMLElement>;
}

interface ScaledDimensions {
  scaledX: number;
  scaledY: number;
  scaledWidth: number;
  scaledHeight: number;
}

const CAPTURE_CONSTANTS = {
  LEFT_OFFSET: -9,
  BOTTOM_OFFSET: -14,
  VIDEO_READY_DELAY: 300,
  LOADING_OPACITY: 0.5,
} as const;

const ERROR_MESSAGES = {
  STREAM_INIT: 'Échec de l\'initialisation de la capture d\'écran',
  CANVAS_CONTEXT: 'Échec de l\'obtention du contexte canvas',
  SCREENSHOT: 'Échec de la capture d\'écran',
  UPLOAD: 'Impossible d\'ajouter la capture à la conversation',
} as const;

const SUCCESS_MESSAGES = {
  CAPTURE: 'Capture d\'écran ajoutée à la conversation',
} as const;

const createTemporaryCanvas = (video: HTMLVideoElement) => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;

  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error(ERROR_MESSAGES.CANVAS_CONTEXT);
  }

  tempCtx.drawImage(video, 0, 0);
  return { tempCanvas, tempCtx };
};

const calculateDimensions = ({
  video,
  containerRect,
  selectionStart,
  selectionEnd,
}: {
  video: HTMLVideoElement;
  containerRect: DOMRect;
  selectionStart: Position;
  selectionEnd: Position;
}): { scaledDimensions: ScaledDimensions; croppedCanvas: HTMLCanvasElement } => {
  const scaleX = video.videoWidth / window.innerWidth;
  const scaleY = video.videoHeight / window.innerHeight;

  const scrollX = window.scrollX;
  const scrollY = window.scrollY + 40;

  const scaledX = Math.round(
    (containerRect.left + Math.min(selectionStart.x, selectionEnd.x) + scrollX + CAPTURE_CONSTANTS.LEFT_OFFSET) * scaleX,
  );
  const scaledY = Math.round(
    (containerRect.top + Math.min(selectionStart.y, selectionEnd.y) + scrollY + CAPTURE_CONSTANTS.BOTTOM_OFFSET) * scaleY,
  );
  const scaledWidth = Math.round(Math.abs(selectionEnd.x - selectionStart.x) * scaleX);
  const scaledHeight = Math.round(Math.abs(selectionEnd.y - selectionStart.y) * scaleY);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = Math.round(Math.abs(selectionEnd.x - selectionStart.x));
  croppedCanvas.height = Math.round(Math.abs(selectionEnd.y - selectionStart.y));

  return {
    scaledDimensions: { scaledX, scaledY, scaledWidth, scaledHeight },
    croppedCanvas,
  };
};

const captureScreenshot = async (
  tempCanvas: HTMLCanvasElement,
  tempCtx: CanvasRenderingContext2D,
  scaledDimensions: ScaledDimensions,
  croppedCanvas: HTMLCanvasElement,
): Promise<Blob> => {
  const ctx = croppedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error(ERROR_MESSAGES.CANVAS_CONTEXT);
  }

  const { scaledX, scaledY, scaledWidth, scaledHeight } = scaledDimensions;
  ctx.drawImage(tempCanvas, scaledX, scaledY, scaledWidth, scaledHeight, 0, 0, croppedCanvas.width, croppedCanvas.height);

  return new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/png');
  });
};

const processAndUploadScreenshot = async (blob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      const textarea = document.querySelector('textarea');

      if (textarea) {
        const setUploadedFiles = (window as any).__BOLT_SET_UPLOADED_FILES__;
        const setImageDataList = (window as any).__BOLT_SET_IMAGE_DATA_LIST__;
        const uploadedFiles = (window as any).__BOLT_UPLOADED_FILES__ || [];
        const imageDataList = (window as any).__BOLT_IMAGE_DATA_LIST__ || [];

        if (setUploadedFiles && setImageDataList) {
          const file = new File([blob], 'screenshot.png', { type: 'image/png' });
          setUploadedFiles([...uploadedFiles, file]);
          setImageDataList([...imageDataList, base64Image]);
          resolve();
        } else {
          reject(new Error(ERROR_MESSAGES.UPLOAD));
        }
      } else {
        reject(new Error(ERROR_MESSAGES.UPLOAD));
      }
    };

    reader.onerror = () => reject(new Error(ERROR_MESSAGES.UPLOAD));
    reader.readAsDataURL(blob);
  });
};

export const ScreenshotSelector = memo(
  ({ isSelectionMode, setIsSelectionMode, containerRef }: ScreenshotSelectorProps) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [selectionStart, setSelectionStart] = useState<Position | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<Position | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const cleanupStream = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      setIsSelectionMode(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setIsCapturing(false);
    };

    useEffect(() => {
      // Cleanup function to stop all tracks when component unmounts
      return () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
          videoRef.current.remove();
          videoRef.current = null;
        }

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };
    }, []);

    const initializeStream = async () => {
      if (mediaStreamRef.current) {
        return mediaStreamRef.current;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          audio: false,
          video: {
            displaySurface: 'window',
            preferCurrentTab: true,
            surfaceSwitching: 'include',
            systemAudio: 'exclude',
          },
        } as MediaStreamConstraints);

        stream.addEventListener('inactive', cleanupStream);
        mediaStreamRef.current = stream;

        if (!videoRef.current) {
          const video = document.createElement('video');
          Object.assign(video.style, {
            opacity: '0',
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: '-1',
          });
          document.body.appendChild(video);
          videoRef.current = video;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        return stream;
      } catch (error) {
        console.error('Erreur d\'initialisation du stream:', error);
        setIsSelectionMode(false);
        toast.error(ERROR_MESSAGES.STREAM_INIT);
        return null;
      }
    };

    const handleCopySelection = useCallback(async () => {
      if (!isSelectionMode || !selectionStart || !selectionEnd || !containerRef.current) {
        return;
      }

      setIsCapturing(true);

      try {
        const stream = await initializeStream();
        if (!stream || !videoRef.current) {
          throw new Error('Stream ou vidéo non initialisé');
        }

        await new Promise((resolve) => setTimeout(resolve, CAPTURE_CONSTANTS.VIDEO_READY_DELAY));

        const { tempCanvas, tempCtx } = createTemporaryCanvas(videoRef.current);
        const { scaledDimensions, croppedCanvas } = calculateDimensions({
          video: videoRef.current,
          containerRect: containerRef.current.getBoundingClientRect(),
          selectionStart,
          selectionEnd,
        });

        const blob = await captureScreenshot(tempCanvas, tempCtx, scaledDimensions, croppedCanvas);
        await processAndUploadScreenshot(blob);

        toast.success(SUCCESS_MESSAGES.CAPTURE);
      } catch (error) {
        console.error('Erreur de capture:', error);
        toast.error(ERROR_MESSAGES.SCREENSHOT);
        cleanupStream();
      } finally {
        setIsCapturing(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        setIsSelectionMode(false);
      }
    }, [isSelectionMode, selectionStart, selectionEnd, containerRef, setIsSelectionMode]);

    const handleSelectionStart = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isSelectionMode) {
          return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
      },
      [isSelectionMode],
    );

    const handleSelectionMove = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isSelectionMode || !selectionStart) {
          return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setSelectionEnd({ x, y });
      },
      [isSelectionMode, selectionStart],
    );

    if (!isSelectionMode) {
      return null;
    }

    return (
      <div
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleSelectionStart}
        onMouseMove={handleSelectionMove}
        onMouseUp={handleCopySelection}
        onMouseLeave={() => setSelectionStart(null)}
        style={{
          backgroundColor: isCapturing ? 'transparent' : 'rgba(0, 0, 0, 0.1)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          pointerEvents: 'all',
          opacity: isCapturing ? CAPTURE_CONSTANTS.LOADING_OPACITY : 1,
          zIndex: 50,
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {selectionStart && selectionEnd && !isCapturing && (
          <>
            <div
              className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20"
              style={{
                left: Math.min(selectionStart.x, selectionEnd.x),
                top: Math.min(selectionStart.y, selectionEnd.y),
                width: Math.abs(selectionEnd.x - selectionStart.x),
                height: Math.abs(selectionEnd.y - selectionStart.y),
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
            />
            <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-sm text-gray-600">
              {Math.abs(selectionEnd.x - selectionStart.x)} x {Math.abs(selectionEnd.y - selectionStart.y)}
            </div>
          </>
        )}
      </div>
    );
  },
);
