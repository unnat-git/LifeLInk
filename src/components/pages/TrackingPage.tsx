'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Navigation,
  Phone,
  Clock,
  MapPin,
  Truck,
  Building2,
  Ban,
  Share2,
  AlertTriangle,
  CheckCircle2,
  User,
  ArrowRight,
  Siren,
  Activity,
  Heart,
  Route,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useNavigationStore, useEmergencyStore } from '@/store';
import { DEMO_AMBULANCES, DEMO_HOSPITALS } from '@/lib/mock-data';
import { getRelativeTime, STATUS_COLORS } from '@/lib/constants';
import MapWrapper from '@/components/ui/MapWrapper';
import { useSosStatus } from '@/hooks/useSosStatus';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// Build route waypoints dynamically from a given patient location
function buildRouteWaypoints(patLat: number, patLng: number) {
  // 10 waypoints heading northeast from the patient position
  const offsets = [
    [0, 0],
    [0.004, 0.003],
    [0.008, 0.007],
    [0.012, 0.010],
    [0.015, 0.014],
    [0.019, 0.018],
    [0.023, 0.022],
    [0.026, 0.025],
    [0.028, 0.028],
    [0.030, 0.030],
  ];
  return offsets.map(([dLat, dLng]) => ({ lat: patLat + dLat, lng: patLng + dLng }));
}

export default function TrackingPage() {
  const { setCurrentPage } = useNavigationStore();
  const { activeEmergency, sosActivated, cancelEmergency } = useEmergencyStore();
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();
  const router = useRouter();

  // Poll real emergency status from DB
  const { data: realEmergency } = useSosStatus(activeEmergency?.dbEmergencyId || null);

  // Automatically reset and redirect when the trip is marked COMPLETED by the driver
  useEffect(() => {
    if (realEmergency?.status === 'COMPLETED') {
      cancelEmergency();
      toast({
        title: 'Trip Completed',
        description: 'Your emergency trip has been resolved. Returning to dashboard.',
      });
      setCurrentPage('dashboard');
      router.push('/?page=dashboard');
    }
  }, [realEmergency?.status, cancelEmergency, setCurrentPage, router, toast]);

  const [waypointIndex, setWaypointIndex] = useState(0);
  const [eta, setEta] = useState(512); // seconds
  const [speed, setSpeed] = useState(42);
  const [distance, setDistance] = useState(3.2);
  const [shareToast, setShareToast] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasActive = sosActivated || activeEmergency !== null;

  // Build route dynamically from the actual patient coordinates
  const routeWaypoints = activeEmergency
    ? buildRouteWaypoints(activeEmergency.patientLatitude, activeEmergency.patientLongitude)
    : buildRouteWaypoints(28.6139, 77.2090);

  const patientPos: [number, number] = [routeWaypoints[0].lat, routeWaypoints[0].lng];
  const hospitalPos: [number, number] = [
    routeWaypoints[routeWaypoints.length - 1].lat,
    routeWaypoints[routeWaypoints.length - 1].lng,
  ];

  const [ambulancePos, setAmbulancePos] = useState<[number, number]>(patientPos);

  // Map waypoint index to visual position
  const getMapPosition = useCallback(
    (index: number): [number, number] => [routeWaypoints[index].lat, routeWaypoints[index].lng],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEmergency?.patientLatitude, activeEmergency?.patientLongitude]
  );

  useEffect(() => {
    if (!hasActive) return;

    const waypointCount = routeWaypoints.length;
    intervalRef.current = setInterval(() => {
      setWaypointIndex((prev) => {
        if (prev >= waypointCount - 1) return prev;
        const next = prev + 1;
        setAmbulancePos(getMapPosition(next));
        setEta((e) => Math.max(0, e - 38 + Math.floor(Math.random() * 10)));
        setDistance((d) => Math.max(0, +(d - 0.35 + Math.random() * 0.1).toFixed(1)));
        setSpeed((s) => 35 + Math.floor(Math.random() * 20));
        return next;
      });
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasActive, getMapPosition]);

  const formatETA = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'LifeLink - Emergency Tracking',
        text: 'Track my emergency in real-time',
        url: window.location.href,
      });
    } else {
      // Fallback: copy URL and show toast
      navigator.clipboard?.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  }, []);

  const ambulance = DEMO_AMBULANCES[0];
  const hospital = DEMO_HOSPITALS[2]; // AIIMS

  // Timeline steps
  const timelineSteps = [
    { label: 'SOS Triggered', done: true },
    { label: 'Ambulance Assigned', done: true },
    { label: 'En Route', done: true },
    { label: 'Arriving', done: waypointIndex >= 8 },
    { label: 'Arrived', done: waypointIndex >= 9 },
  ];

  /* ---- Empty State (no active emergency) ---- */
  if (!hasActive) {
    return (
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6"
      >
        <motion.div
          className="max-w-md w-full text-center"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-8 space-y-6">
              {/* Composed illustration using Lucide icons */}
              <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                {/* Outer dashed ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-muted"
                  animate={prefersReducedMotion ? {} : { rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                {/* Inner ring */}
                <motion.div
                  className="absolute inset-3 rounded-full border border-muted/50"
                  animate={prefersReducedMotion ? {} : { rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                />
                {/* Center map icon */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-muted/80">
                  <Navigation className="h-8 w-8 text-muted-foreground" />
                </div>
                {/* Decorative dots */}
                <motion.div
                  className="absolute top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-emergency/40"
                  animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-2 right-6 h-2 w-2 rounded-full bg-emerald-500/40"
                  animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                />
                <motion.div
                  className="absolute bottom-4 left-6 h-1.5 w-1.5 rounded-full bg-amber-500/40"
                  animate={prefersReducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">No Active Emergency</h2>
                <p className="text-muted-foreground text-sm">
                  Start an emergency SOS to track your ambulance in real-time with live ETA updates and route information.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 h-12 text-base font-semibold"
                onClick={() => {
                  setCurrentPage('sos');
                  router.push('/?page=sos');
                }}
              >
                <Siren className="h-5 w-5" />
                Go to SOS
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  /* ---- Active Emergency ---- */
  return (
    <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Map Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex-1 lg:w-[65%] bg-slate-900 dark:bg-slate-950 overflow-hidden"
      >
        <MapWrapper
          center={ambulancePos}
          zoom={15}
          route={routeWaypoints.map(w => [w.lat, w.lng] as [number, number])}
          markers={[
            { id: 'patient', type: 'patient' as const, position: patientPos, label: 'Your Location' },
            { id: 'hospital', type: 'hospital' as const, position: hospitalPos, label: hospital.name },
            { id: 'ambulance', type: 'ambulance' as const, position: ambulancePos, label: ambulance.vehicleNumber }
          ]}
        />
        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1.5 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Ambulance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Patient</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Hospital</span>
          </div>
        </div>
      </motion.div>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full lg:w-[35%] bg-background border-l overflow-y-auto scrollbar-thin"
      >
        {/* Share toast notification */}
        <AnimatePresence>
          {shareToast && (
            <motion.div
              className="absolute top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Link copied to clipboard
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 space-y-4">
          {/* Emergency Status */}
          <Card className="card-hover card-shine">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Emergency Status</h3>
                <Badge className={`${STATUS_COLORS.EN_ROUTE} status-pulse`}>
                  EN ROUTE
                </Badge>
              </div>
              {/* Mini Timeline */}
              <div className="flex items-center gap-1">
                {timelineSteps.map((step, i) => (
                  <div key={step.label} className="flex-1">
                    <div
                      className={`h-1.5 rounded-full transition-colors duration-500 ${
                        step.done ? 'bg-emerald-500' : 'bg-muted'
                      }`}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">{step.label}</p>
                  </div>
                ))}
              </div>
              {activeEmergency?.requestId && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  ID: {activeEmergency.requestId}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ETA Card with ticking countdown */}
          <Card className="card-hover card-shine">
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <p className="text-xs text-muted-foreground mb-1">Estimated Arrival</p>
                <motion.p
                  className="text-4xl font-bold font-mono tracking-wider text-emergency"
                  key={eta}
                  initial={prefersReducedMotion ? {} : { scale: 1.05, color: 'rgb(239 68 68)' }}
                  animate={{ scale: 1, color: 'rgb(239 68 68)' }}
                  transition={{ duration: 0.3 }}
                >
                  {formatETA(eta)}
                </motion.p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-semibold">{distance} km</p>
                  <p className="text-[10px] text-muted-foreground">Distance</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-semibold">{speed} km/h</p>
                  <p className="text-[10px] text-muted-foreground">Speed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Info Card */}
          <Card className="card-hover card-shine">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                    P
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Patient Info</p>
                  <p className="text-xs text-muted-foreground">Blood: O+ &bull; Age: 32</p>
                </div>
                <Badge variant="outline" className="text-xs border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                  <Heart className="h-3 w-3 mr-1" />
                  Stable
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Driver Card */}
          <Card className="card-hover card-shine">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {ambulance.driverName.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{ambulance.driverName}</p>
                  <p className="text-xs text-muted-foreground">{ambulance.vehicleNumber}</p>
                </div>
                <a
                  href={`tel:${ambulance.driverPhone}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors text-xs font-medium"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Hospital Card */}
          <Card className="card-hover card-shine">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40">
                  <Building2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{hospital.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{hospital.address}, {hospital.city}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    ER Bay 4 Reserved
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share Location
            </Button>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={cancelEmergency}
            >
              <Ban className="h-4 w-4" />
              Cancel Emergency
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
