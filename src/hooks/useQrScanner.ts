import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Result } from '@zxing/library';
import { toast } from 'sonner';

export function useQrScanner(onResult: (result: string) => void) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  
  // Use a ref so the callback is always fresh — avoids stale closure bug
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Initialize devices
  useEffect(() => {
    async function initDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop()); // request permission then close

        setHasCameraPermission(true);
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((device) => device.kind === 'videoinput');

        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          // Prefer back/environment camera for phones
          const backCamera = videoDevices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('environment') ||
              d.label.toLowerCase().includes('rear')
          );
          setSelectedDeviceId(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Camera permission denied', err);
        setHasCameraPermission(false);
      }
    }
    initDevices();
  }, []);

  const stopScan = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        // ignore stop errors
      }
      controlsRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    if (!videoRef.current) {
      toast.error('Camera element not ready');
      return;
    }

    // Stop any existing scan first
    if (controlsRef.current) {
      stopScan();
    }

    try {
      const hints = new Map();
      // @zxing/library DecodeHintType.TRY_HARDER = 3
      hints.set(3, true);

      const codeReader = new BrowserQRCodeReader(hints);
      setIsScanning(true);

      // If no device selected, try without specifying device (lets browser pick)
      const deviceId = selectedDeviceId || undefined;

      const controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | undefined, error: Error | undefined) => {
          if (result) {
            const text = result.getText();
            // Use ref so we always get the latest callback — fixes stale closure
            onResultRef.current(text);
            stopScan();
          }
          // Silently ignore NotFoundException (no QR in current frame)
        }
      );

      controlsRef.current = controls;
    } catch (err: any) {
      console.error('Failed to start scanner', err);
      toast.error(`Failed to start camera: ${err?.message || 'Unknown error'}`);
      setIsScanning(false);
    }
  }, [selectedDeviceId, stopScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  return {
    videoRef,
    isScanning,
    startScan,
    stopScan,
    hasCameraPermission,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
  };
}
