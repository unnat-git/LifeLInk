'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, User, QrCode } from 'lucide-react';
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

  const handleScanResult = useCallback(async (result: string) => {
    try {
      let urlStr = result.trim();
      toast.info(`Scanned: ${urlStr}`); // Show what was read

      // Fallback for raw parsing if protocol is missing
      if (!urlStr.toLowerCase().startsWith('http')) {
        urlStr = 'https://' + urlStr;
      }
      
      const url = new URL(urlStr);
      const token = url.searchParams.get('token');
      
      if (token) {
        await fetchPatientData(token, 'QR');
      } else if (url.pathname.includes('/emergency/')) {
        const parts = url.pathname.split('/').filter(Boolean);
        const id = parts[parts.length - 1];
        if (id) {
          await fetchPatientData(`patientId:${id}`, 'QR');
        } else {
          toast.error('Invalid QR code format: missing patient ID');
          setScannerState('READY');
        }
      } else {
        toast.error('Invalid QR code format: missing token or ID');
        setScannerState('READY');
      }
    } catch (e) {
      toast.error('Invalid QR code data');
      setScannerState('READY');
    }
  }, []);

  const {
    videoRef,
    isScanning,
    startScan,
    stopScan,
    hasCameraPermission
  } = useQrScanner(handleScanResult);

  const fetchPatientData = async (tokenOrId: string, method: 'QR' | 'MANUAL') => {
    setIsFetching(true);
    try {
      // 1. Fetch Profile
      let url = `/api/patient/qr-profile?token=${tokenOrId}`;
      if (method === 'MANUAL') {
        url = `/api/patient/qr-profile?shortId=${tokenOrId}`;
      } else if (tokenOrId.startsWith('patientId:')) {
        url = `/api/patient/qr-profile?patientId=${tokenOrId.replace('patientId:', '')}`;
      }

      const res = await fetch(url);
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch patient data');
      }
      
      const data = await res.json();
      setPatientData(data);
      setScannerState('RESULT');

      // 2. Log the scan
      await fetch('/api/hospital/scan-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: data.patient.id, method })
      });
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error: any) {
      toast.error(error.message);
      setScannerState('READY');
    } finally {
      setIsFetching(false);
    }
  };

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

  // ── Layout Components ──
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6 pb-24">
      {/* Header - hide when printing */}
      <div className="no-print">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Patient Scanner</h1>
        <p className="text-muted-foreground mt-1">Scan a patient's QR card to instantly view their medical records</p>
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
                  <QrScanner videoRef={videoRef} isScanning={isScanning} isFetching={isFetching} />
                  
                  <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    {scannerState === 'READY' ? (
                      <Button onClick={handleStartScan} className="flex-1 gap-2" size="lg" disabled={isFetching}>
                        <Camera className="h-5 w-5" /> Start Camera
                      </Button>
                    ) : (
                      <Button onClick={handleStopScan} variant="destructive" className="flex-1 gap-2" size="lg">
                        Stop Scan
                      </Button>
                    )}
                  </div>

                  {hasCameraPermission === false && (
                    <p className="text-sm text-red-500 mt-4">
                      Camera permission denied. Please enable it in your browser settings or use manual entry.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Manual Entry Fallback */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" /> Enter ID Manually
                  </h3>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <Input
                      placeholder="e.g. A1B2C3"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value.toUpperCase())}
                      disabled={isFetching || isScanning}
                      maxLength={6}
                    />
                    <Button type="submit" disabled={!manualId.trim() || isFetching || isScanning}>
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
                onSelectPatient={(id) => fetchPatientData(id, 'MANUAL')}
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
