import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export type ScannerError =
  | 'not_secure'
  | 'no_camera_api'
  | 'permission_denied'
  | 'no_camera'
  | 'camera_in_use'
  | 'unknown';

export const useScanner = (onScan: (decodedText: string) => void) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasFlashlight, setHasFlashlight] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [scannerError, setScannerError] = useState<ScannerError | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const pauseScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.pause();
    }
  };

  const resumeScanner = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current.resume();
    }
  };

  const classifyError = (err: unknown): ScannerError => {
    const name = (err as DOMException)?.name ?? '';
    const msg = String((err as Error)?.message ?? err).toLowerCase();

    if (name === 'NotAllowedError' || msg.includes('permission denied') || msg.includes('not allowed')) {
      return 'permission_denied';
    }
    if (name === 'NotFoundError' || msg.includes('no camera') || msg.includes('requested device not found')) {
      return 'no_camera';
    }
    if (name === 'NotReadableError' || name === 'AbortError' || msg.includes('could not start video') || msg.includes('in use')) {
      return 'camera_in_use';
    }
    return 'unknown';
  };

  const toggleScanner = useCallback(async () => {
    if (isScanning) {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore stop errors
        }
        scannerRef.current = null;
      }
      setIsScanning(false);
      setHasFlashlight(false);
      setFlashlightOn(false);
      setScannerError(null);
      return;
    }

    setScannerError(null);

    if (!window.isSecureContext) {
      setScannerError('not_secure');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('no_camera_api');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      setScannerError(classifyError(err));
      return;
    }

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('qr-reader');
    }

    try {
      const qrboxFn = (vw: number, vh: number) => {
        const size = Math.floor(Math.min(vw, vh) * 0.75);
        return { width: size, height: size };
      };
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: qrboxFn },
        (decodedText) => onScan(decodedText),
        () => {},
      );
      setIsScanning(true);

      setTimeout(() => {
        try {
          if (scannerRef.current) {
            const capabilities = scannerRef.current.getRunningTrackCapabilities();
            if (capabilities && (capabilities as any).torch) {
              setHasFlashlight(true);
            }
          }
        } catch {
          // ignore capability failures
        }
      }, 500);
    } catch (err) {
      setScannerError(classifyError(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, onScan]);

  const toggleFlashlight = async () => {
    if (!scannerRef.current || !hasFlashlight) return;
    try {
      const nextState = !flashlightOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setFlashlightOn(nextState);
    } catch {
      // ignore flashlight failures
    }
  };

  return {
    isScanning,
    hasFlashlight,
    flashlightOn,
    scannerError,
    toggleScanner,
    toggleFlashlight,
    pauseScanner,
    resumeScanner,
  };
};
