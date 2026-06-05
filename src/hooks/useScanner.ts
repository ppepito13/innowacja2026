import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useScanner = (onScan: (decodedText: string) => void) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasFlashlight, setHasFlashlight] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        // eslint-disable-next-line no-console
        scannerRef.current.stop().catch(console.error);
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

  const toggleScanner = async () => {
    if (isScanning) {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
        scannerRef.current = null;
      }
      setIsScanning(false);
      setHasFlashlight(false);
      setFlashlightOn(false);
    } else {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => onScan(decodedText),
          // eslint-disable-next-line no-console
          (error) => { /* ignore */ }
        );
        setIsScanning(true);

        // Capability checking has to happen shortly after camera initializes
        setTimeout(() => {
          try {
            if (scannerRef.current) {
              const capabilities = scannerRef.current.getRunningTrackCapabilities();
              if (capabilities && (capabilities as any).torch) {
                setHasFlashlight(true);
              }
            }
          } catch (e) {
            // ignore capability failures
          }
        }, 500);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Camera start failed:", err);
      }
    }
  };

  const toggleFlashlight = async () => {
    if (!scannerRef.current || !hasFlashlight) return;
    try {
      const nextState = !flashlightOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any]
      });
      setFlashlightOn(nextState);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to toggle flashlight", e);
    }
  };

  return {
    isScanning,
    hasFlashlight,
    flashlightOn,
    toggleScanner,
    toggleFlashlight,
    pauseScanner,
    resumeScanner,
  };
};
