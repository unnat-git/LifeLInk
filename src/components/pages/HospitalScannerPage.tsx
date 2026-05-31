'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { useQrScanner } from '@/hooks/useQrScanner';
import { QrScanner } from '@/components/hospital/QrScanner';
import { PatientRecordCard } from '@/components/hospital/PatientRecordCard';
import { RecentScans } from '@/components/hospital/RecentScans';

type ScannerState = 'READY' | 'SCANNING' | 'RESULT';

export default function HospitalScannerPage() {
  const [scannerState, setScannerState] = useState<ScannerState>('READY');
  const [manualId, setManualId] = useState('');
  const [patientData, setPatientData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // Use a ref to avoid stale closure in QR callback
  const isFetchingRef = useRef(false);

  // ── fetchPatientData must be defined BEFORE handleScanResult ──
  const fetchPatientData = useCallback(async (tokenOrId: string, method: 'QR' | 'MANUAL') => {
    // Prevent double-fetch if already fetching
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);

    try {
      let url = `/api/patient/qr-profile?token=${encodeURIComponent(tokenOrId)}`;
      if (method === 'MANUAL') {
        url = `/api/patient/qr-profile?shortId=${encodeURIComponent(tokenOrId)}`;
      } else if (tokenOrId.startsWith('patientId:')) {
        const id = tokenOrId.replace('patientId:', '');
        url = `/api/patient/qr-profile?patientId=${encodeURIComponent(id)}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || 'Failed to fetch patient data');
      }

      const data = await res.json();

      if (!data?.patient) {
        throw new Error('No patient data in response');
      }

      setPatientData(data);
      setScannerState('RESULT');

      // Log the scan (non-blocking, ignore errors)
      fetch('/api/hospital/scan-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: data.patient.id, method }),
      }).catch(() => {});

      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      console.error('[fetchPatientData]', error);
      toast.error(error.message || 'Failed to load patient data');
      setScannerState('READY');
    } finally {
      setIsFetching(false);
      isFetchingRef.current = false;
    }
  }, []);

  // ── handleScanResult is defined AFTER fetchPatientData ──
  const handleScanResult = useCallback(
    async (result: string) => {
      // Don't process if already fetching
      if (isFetchingRef.current) return;

      try {
        let urlStr = result.trim();
        console.log('[Scanner] Scanned raw text:', urlStr);

        // Ensure protocol exists for URL parsing
        if (!urlStr.toLowerCase().startsWith('http')) {
          urlStr = 'https://' + urlStr;
        }

        const url = new URL(urlStr);
        const token = url.searchParams.get('token');

        if (token) {
          toast.info('QR code recognized — fetching patient…');
          await fetchPatientData(token, 'QR');
        } else if (url.pathname.includes('/emergency/')) {
          const parts = url.pathname.split('/').filter(Boolean);
          const id = parts[parts.length - 1];
          if (id && id.length > 5) {
            toast.info('QR code recognized — fetching patient…');
            await fetchPatientData(`patientId:${id}`, 'QR');
          } else {
            toast.error('QR code scanned but patient ID is missing');
            setScannerState('READY');
          }
        } else {
          toast.error(`Unrecognized QR format: ${urlStr.substring(0, 60)}`);
          setScannerState('READY');
        }
      } catch (e: any) {
        console.error('[handleScanResult] Parse error:', e);
        toast.error('Could not parse QR code');
        setScannerState('READY');
      }
    },
    [fetchPatientData]
  );

  const {
    videoRef,
    isScanning,
    startScan,
    stopScan,
    hasCameraPermission,
  } = useQrScanner(handleScanResult);

  const handleStartScan = () => {
    setScannerState('SCANNING');
    startScan();
  };

  const handleStopScan = () => {
    stopScan();
    setScannerState('READY');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    fetchPatientData(manualId.trim(), 'MANUAL');
  };

  const handleDone = () => {
    setPatientData(null);
    setScannerState('READY');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="no-print">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Patient Scanner</h1>
        <p className="text-muted-foreground mt-1">
          Scan a patient's QR card to instantly view their medical records
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* STATE 1 & 2: READY or SCANNING */}
        {(scannerState === 'READY' || scannerState === 'SCANNING') && (
          <motion.div
            key="scanner-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Col: Scanner & Controls */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 flex flex-col items-center">
                  <QrScanner
                    videoRef={videoRef}
                    isScanning={isScanning}
                    isFetching={isFetching}
                  />

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    {scannerState === 'READY' ? (
                      <Button
                        onClick={handleStartScan}
                        className="flex-1 gap-2"
                        size="lg"
                        disabled={isFetching}
                      >
                        <Camera className="h-5 w-5" /> Start Camera
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopScan}
                        variant="destructive"
                        className="flex-1 gap-2"
                        size="lg"
                      >
                        Stop Scan
                      </Button>
                    )}
                  </div>

                  {hasCameraPermission === false && (
                    <p className="text-sm text-red-500 mt-4">
                      Camera permission denied. Please enable it in your browser settings or use manual
                      entry below.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Manual Entry Fallback */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" /> Enter Patient Short ID Manually
                  </h3>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <Input
                      placeholder="e.g. A1B2C3"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value.toUpperCase())}
                      disabled={isFetching || isScanning}
                      maxLength={6}
                    />
                    <Button
                      type="submit"
                      disabled={!manualId.trim() || isFetching || isScanning}
                    >
                      {isFetching ? 'Fetching...' : 'Lookup'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Recent Scans */}
            <div className="lg:col-span-1">
              <RecentScans
                refreshTrigger={refreshTrigger}
                onSelectPatient={(id) => fetchPatientData(`patientId:${id}`, 'QR')}
              />
            </div>
          </motion.div>
        )}

        {/* STATE 3: RESULT */}
        {scannerState === 'RESULT' && patientData && (
          <motion.div
            key="result-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl mx-auto"
          >
            <PatientRecordCard data={patientData} onDone={handleDone} />

            <div className="mt-6 flex justify-center no-print">
              <Button onClick={handleDone} size="lg" variant="secondary" className="gap-2">
                <QrCode className="h-5 w-5" /> Scan Another Patient
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
