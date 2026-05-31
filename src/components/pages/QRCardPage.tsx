'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Heart,
  Phone,
  AlertTriangle,
  Download,
  Printer,
  Share2,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  User,
  Pill,
  Bug,
  ArrowRight,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { BLOOD_GROUP_LABELS } from '@/lib/constants';
import { toast } from 'sonner';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const CARD_VARIANTS = {
  blue: {
    front: 'from-sky-600 to-blue-800',
    accent: 'bg-sky-500',
    text: 'text-sky-100',
    qrFg: '#1e3a5f',
  },
  red: {
    front: 'from-red-600 to-rose-800',
    accent: 'bg-red-500',
    text: 'text-red-100',
    qrFg: '#5f1e1e',
  },
  dark: {
    front: 'from-slate-700 to-slate-900',
    accent: 'bg-slate-600',
    text: 'text-slate-300',
    qrFg: '#1e293b',
  },
};

type CardVariant = keyof typeof CARD_VARIANTS;

// LifeLink Shield SVG for QR center overlay
function LifeLinkShieldIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M12 6l-2 2h-3v3l-2 2 2 2v3h3l2 2 2-2h3v-3l2-2-2-2V8h-3L12 6z"
        fill="none"
        stroke={color === '#fff' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'}
        strokeWidth="0.8"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke={color === '#fff' ? 'rgba(0,0,0,0.5)' : '#fff'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QRCardPage() {
  const { setCurrentPage } = useNavigationStore();
  const { data: session } = useSession();
  const user = session?.user;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/users/${user.id}`)
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user?.id]);

  const patient = {
    ...profile,
    name: profile?.name || user?.name || 'Patient',
    id: profile?.id || user?.id || '000000',
    bloodGroup: profile?.patientProfile?.bloodGroup || 'O_POS',
    allergies: profile?.patientProfile?.allergies ? JSON.parse(profile.patientProfile.allergies) : [],
    currentMedications: profile?.patientProfile?.currentMedications ? JSON.parse(profile.patientProfile.currentMedications) : [],
    emergencyContacts: profile?.emergencyContacts || [],
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardVariant, setCardVariant] = useState<CardVariant>('blue');
  const [showQRData, setShowQRData] = useState(true);

  const variant = CARD_VARIANTS[cardVariant];

  const allergyData: any[] = []; // Removed dummy allergies

  // QR Code data as a URL for phone scanning
  // Force deployed link to ensure QR codes are always scannable from external devices
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lifelink-beta-seven.vercel.app';
  const qrData = patient.id !== '000000' ? `${baseUrl}/emergency/${patient.id}` : '';

  const handleDownload = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Canvas not supported');
        return;
      }

      const width = 800;
      const height = 500;
      canvas.width = width;
      canvas.height = height;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      if (cardVariant === 'blue') {
        gradient.addColorStop(0, '#0284c7');
        gradient.addColorStop(1, '#1e3a8a');
      } else if (cardVariant === 'red') {
        gradient.addColorStop(0, '#dc2626');
        gradient.addColorStop(1, '#881337');
      } else {
        gradient.addColorStop(0, '#475569');
        gradient.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Decorative circles
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width - 80, 80, 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(80, height - 80, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Header
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.fillText('🛡 LifeLink', 40, 50);
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('EMERGENCY ID', width - 160, 50);

      // Patient name
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText('Patient Name', 40, 100);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillText(patient.name, 40, 135);

      // Blood group
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText('Blood Group', 40, 180);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(40, 190, 140, 50);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Inter, system-ui, sans-serif';
      ctx.fillText(BLOOD_GROUP_LABELS[patient.bloodGroup || 'O_POS'], 60, 225);

      // Draw QR code from SVG
      const svgElement = document.querySelector('#qr-download-source');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, width - 260, 140, 220, 220);
          URL.revokeObjectURL(url);

          // Footer
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.font = '11px Inter, system-ui, sans-serif';
          const shortId = `ID: ${patient.id.slice(0, 4)}••••••••${patient.id.slice(-4)}`;
          ctx.fillText(shortId, 40, height - 30);
          ctx.fillText('LifeLink Emergency Card', width - 200, height - 30);

          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement('a');
              link.download = `lifelink-qr-${patient.id}.png`;
              link.href = URL.createObjectURL(blob);
              link.click();
              URL.revokeObjectURL(link.href);
              toast.success('QR Card downloaded!');
            }
          });
        };
        img.src = url;
      } else {
        toast.error('QR code element not found');
      }
    } catch {
      toast.error('Failed to download QR card');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareLink = () => {
    const mockUrl = qrData;
    navigator.clipboard.writeText(mockUrl).then(
      () => toast.success('Link copied!'),
      () => toast.info('Link: ' + mockUrl)
    );
  };

  const handleCopyShortId = () => {
    const shortId = profile?.patientProfile?.qrCodeId;
    if (shortId) {
      navigator.clipboard.writeText(shortId).then(
        () => toast.success('Unique ID copied to clipboard!'),
        () => toast.error('Failed to copy ID')
      );
    } else {
      toast.error('Unique ID is still pending. Try refreshing the page.');
    }
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Hidden QR for download */}
      <div className="fixed left-[-9999px] top-[-9999px]" aria-hidden="true">
        <div id="qr-download-source">
          <QRCodeSVG
            value={qrData}
            size={220}
            fgColor={CARD_VARIANTS[cardVariant].qrFg}
            bgColor="#ffffff"
            level="H"
            imageSettings={{
              src: `data:image/svg+xml;base64,${btoa(
                `<svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="${variant.accent === 'bg-sky-500' ? '#0284c7' : variant.accent === 'bg-red-500' ? '#dc2626' : '#475569'}" /><path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
              )}`,
              height: 44,
              width: 44,
              excavate: true,
            }}
          />
        </div>
      </div>

      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">QR Emergency Card</h1>
        <p className="text-muted-foreground mt-1">Your digital emergency ID — scan for critical medical info</p>
      </motion.div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Card Preview */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4">
          <div
            ref={cardRef}
            className="relative w-full max-w-sm cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipped ? 'back' : 'front'}
                initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl"
              >
                {!isFlipped ? (
                  /* FRONT */
                  <div className={`w-full h-full bg-linear-to-br ${variant.front} p-5 flex flex-col justify-between text-white relative`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 right-0 w-40 h-40 rounded-full border-2 border-white" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full border-2 border-white" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          <span className="font-bold text-sm tracking-wide">LifeLink</span>
                        </div>
                        <span className="text-[10px] opacity-60">EMERGENCY ID</span>
                      </div>
                    </div>

                    <div className="relative z-10 space-y-3">
                      <div>
                        <p className="text-xs opacity-60">Patient Name</p>
                        <p className="text-lg font-bold">{patient.name}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs opacity-60 mb-1">Blood Group</p>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <p className="text-2xl font-bold">{BLOOD_GROUP_LABELS[patient.bloodGroup || 'O_POS']}</p>
                          </div>
                        </div>
                        {/* Real QR Code */}
                        <div className="bg-white rounded-lg p-1.5 relative">
                          <QRCodeSVG
                            value={qrData}
                            size={96}
                            fgColor={variant.qrFg}
                            bgColor="#ffffff"
                            level="H"
                            imageSettings={{
                              src: `data:image/svg+xml;base64,${btoa(
                                `<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="${variant.accent === 'bg-sky-500' ? '#0284c7' : variant.accent === 'bg-red-500' ? '#dc2626' : '#475569'}" opacity="0.9"/><path d="M9 12l2 2 4-4" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
                              )}`,
                              height: 22,
                              width: 22,
                              excavate: true,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      <p className="text-[10px] opacity-70 font-mono tracking-widest">
                        ID: {profile?.patientProfile?.qrCodeId || 'PENDING'}
                      </p>
                      <p className="text-[10px] opacity-50">Tap to flip</p>
                    </div>
                  </div>
                ) : (
                  /* BACK */
                  <div className={`w-full h-full bg-linear-to-br ${variant.front} p-5 flex flex-col justify-between text-white relative`}>
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-4 left-4 right-4 bottom-4 rounded-xl border border-white" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <span className="font-bold text-sm tracking-wide">LifeLink</span>
                      </div>
                    </div>

                    <div className="relative z-10 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">Emergency Contacts</p>
                      {patient.emergencyContacts.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 opacity-70" />
                          <div>
                            <span className="font-medium">{c.name}</span>
                            <span className="opacity-60 ml-1">({c.relationship})</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <p className="text-[10px]">In case of emergency, scan the QR code on the front</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Color variant selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Card Color:</span>
            {(['blue', 'red', 'dark'] as CardVariant[]).map((v) => (
              <button
                key={v}
                onClick={() => setCardVariant(v)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  cardVariant === v ? 'border-foreground scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                } ${CARD_VARIANTS[v].accent}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Right - Card Contents */}
        <motion.div variants={fadeUp} className="space-y-4">
          {/* QR Encoded Data */}
          <Card className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  QR Code Data
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowQRData(!showQRData)}
                >
                  {showQRData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {showQRData && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Patient ID</span>
                    <span className="font-mono text-xs">{patient.id.slice(0, 4)}••••••••{patient.id.slice(-4)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Full Name</span>
                    <span className="font-medium">{patient.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Blood Group</span>
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      {BLOOD_GROUP_LABELS[patient.bloodGroup || 'O_POS']}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Bug className="h-3 w-3" /> Allergies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {allergyData.map((a) => (
                        <Badge key={a.name} variant="outline" className="text-xs">
                          {a.name}
                          <span className="text-[10px] opacity-50 ml-1">({a.severity})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Pill className="h-3 w-3" /> Medications
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.currentMedications.map((m) => (
                        <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Emergency Contacts
                    </p>
                    <div className="space-y-1">
                      {patient.emergencyContacts.map((c) => (
                        <div key={c.id} className="text-xs flex items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground">({c.relationship})</span>
                          <span className="text-muted-foreground ml-auto font-mono">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning Banner */}
          <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Keep this card updated</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Ensure your medical information is always current. Outdated info could affect emergency treatment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="outline" className="gap-2 text-xs" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" className="gap-2 text-xs" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" className="gap-2 text-xs" onClick={handleShareLink}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" className="gap-2 text-xs" onClick={handleCopyShortId}>
              <Copy className="h-4 w-4" />
              Copy ID
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full gap-2 text-sm"
            onClick={() => setCurrentPage('medical-records')}
          >
            <RefreshCw className="h-4 w-4" />
            Update Medical Info
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
