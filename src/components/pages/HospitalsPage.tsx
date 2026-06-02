'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  MapPin,
  Phone,
  BedDouble,
  ArrowUpDown,
  Building2,
  Filter,
  Map,
  List,
  Clock,
  Navigation,
  Zap,
  Eye,
  LocateFixed,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { haversineDistance } from '@/lib/constants';
import type { Hospital, HospitalWithDistance } from '@/types';
import { useToast } from '@/hooks/use-toast';
import MapWrapper from '@/components/ui/MapWrapper';

// ÔöÇÔöÇÔöÇ Types ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
type GeoStatus = 'idle' | 'loading' | 'success' | 'error' | 'denied';
type FetchStatus = 'idle' | 'fetching' | 'done' | 'failed';

// ÔöÇÔöÇÔöÇ Animation variants ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ÔöÇÔöÇÔöÇ Fallback reference point (Delhi) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const REFERENCE_LAT = 28.6139;
const REFERENCE_LNG = 77.209;

// ÔöÇÔöÇÔöÇ Visual helpers (same as before) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const HOSPITAL_GRADIENTS = [
  'from-rose-600 via-rose-500 to-orange-400',
  'from-emerald-700 via-emerald-500 to-teal-400',
  'from-red-700 via-red-500 to-amber-500',
  'from-violet-600 via-purple-500 to-fuchsia-400',
  'from-teal-600 via-cyan-500 to-emerald-400',
  'from-orange-600 via-amber-500 to-yellow-400',
  'from-emerald-600 via-green-500 to-lime-400',
  'from-red-600 via-rose-500 to-pink-400',
];

const HOSPITAL_TYPE_CLASSES = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
];

function getGradient(id: string) {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % HOSPITAL_GRADIENTS.length;
  return HOSPITAL_GRADIENTS[idx];
}

function getReviews(id: string) {
  const base = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 800 + (base % 3500);
}
function getWait(id: string) {
  const base = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `~${7 + (base % 18)} min`;
}

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full
              ? 'text-amber-400 fill-amber-400'
              : i === full && hasHalf
                ? 'text-amber-400 fill-amber-200'
                : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}




// Fetch real hospitals via our server-side proxy (avoids CORS)
async function fetchNearbyHospitals(lat: number, lng: number, radiusM = 10000): Promise<Hospital[]> {
  const url = `/api/hospitals/nearby?lat=${lat}&lng=${lng}&radius=${radiusM}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.hospitals as Hospital[];
}

// ÔöÇÔöÇÔöÇ Main Component ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
export default function HospitalsPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'beds'>('distance');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const { toast } = useToast();

  // Geo & fetch state
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string>('');
  const [realHospitals, setRealHospitals] = useState<Hospital[] | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoStatus('loading');
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        setGeoStatus('success');
        setSortBy('distance');

        // Fetch real hospitals from OpenStreetMap
        setFetchStatus('fetching');
        try {
          const hospitals = await fetchNearbyHospitals(lat, lng, 10000);
          setRealHospitals(hospitals);
          setFetchStatus('done');
        } catch {
          setFetchStatus('failed');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus('denied');
          setGeoError('Location access was denied. Please allow location access in your browser settings.');
        } else {
          setGeoStatus('error');
          setGeoError('Unable to retrieve your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setGeoStatus('idle');
    setGeoError('');
    setRealHospitals(null);
    setFetchStatus('idle');
  }, []);

  // Decide which hospital list to use
  const sourceHospitals = useMemo<Hospital[]>(() => {
    if (userLocation && realHospitals) return realHospitals;
    return [];
  }, [userLocation, realHospitals]);

  const hospitalsWithDistance = useMemo<HospitalWithDistance[]>(() => {
    const refLat = userLocation ? userLocation.lat : REFERENCE_LAT;
    const refLng = userLocation ? userLocation.lng : REFERENCE_LNG;
    return sourceHospitals.map((h) => ({
      ...h,
      distanceKm: +haversineDistance(refLat, refLng, h.latitude, h.longitude).toFixed(1),
    }));
  }, [sourceHospitals, userLocation]);

  const allSpecialties = useMemo(() => {
    return Array.from(new Set(hospitalsWithDistance.flatMap((h) => h.specializations))).sort();
  }, [hospitalsWithDistance]);

  const filteredHospitals = useMemo(() => {
    let list = hospitalsWithDistance;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q),
      );
    }

    if (specialtyFilter !== 'all') {
      list = list.filter((h) =>
        h.specializations.some((s) => s.toLowerCase() === specialtyFilter.toLowerCase()),
      );
    }

    switch (sortBy) {
      case 'rating': return [...list].sort((a, b) => b.emergencyRating - a.emergencyRating);
      case 'distance': return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
      case 'beds': return [...list].sort((a, b) => b.availableBeds - a.availableBeds);
      default: return list;
    }
  }, [hospitalsWithDistance, search, sortBy, specialtyFilter]);

  const isUsingRealData = userLocation && realHospitals && realHospitals.length > 0;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hospitals</h1>
          <p className="text-muted-foreground mt-1">
            {isUsingRealData
              ? `${realHospitals!.length} hospitals found within 10 km of you`
              : userLocation && fetchStatus === 'fetching'
                ? 'Searching nearby hospitals...'
                : 'Find nearby hospitals within 10km'}
          </p>
        </div>

        {/* Location button */}
        {geoStatus === 'success' ? (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {fetchStatus === 'fetching' ? 'Fetching hospitals...' : 'Location active'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
              onClick={clearLocation}
              title="Clear location"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={requestLocation}
            disabled={geoStatus === 'loading'}
            className="shrink-0 gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm"
            size="sm"
          >
            {geoStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            {geoStatus === 'loading' ? 'Locating...' : 'Use My Location'}
          </Button>
        )}
      </motion.div>

      {/* Status banners */}
      <AnimatePresence mode="wait">
        {/* Fetching real data */}
        {fetchStatus === 'fetching' && (
          <motion.div
            key="fetching"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          >
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Searching real hospitals near you...
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                Searching within 10 km radius
              </p>
            </div>
          </motion.div>
        )}

        {/* Success with real data */}
        {fetchStatus === 'done' && isUsingRealData && (
          <motion.div
            key="geo-success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Showing hospitals within 10 km of your location
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                Your location: {userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}
              </p>
            </div>
            <Badge className="bg-emerald-600 text-white border-0 text-xs shrink-0">
              {realHospitals!.length} found
            </Badge>
          </motion.div>
        )}

        {/* API fetched but 0 results */}
        {fetchStatus === 'done' && userLocation && realHospitals?.length === 0 && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
          >
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                No hospitals found within 10 km
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                Try expanding your search area or checking your location.
              </p>
            </div>
          </motion.div>
        )}

        {/* API fetch failed */}
        {fetchStatus === 'failed' && (
          <motion.div
            key="fetch-failed"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                Couldn't fetch hospital data
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                Please check your connection and try again.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-700 hover:text-amber-900 shrink-0"
              onClick={() => {
                if (userLocation) {
                  setFetchStatus('fetching');
                  fetchNearbyHospitals(userLocation.lat, userLocation.lng)
                    .then((h) => { setRealHospitals(h); setFetchStatus('done'); })
                    .catch(() => setFetchStatus('failed'));
                }
              }}
            >
              Retry
            </Button>
          </motion.div>
        )}

        {/* Geo error */}
        {(geoStatus === 'denied' || geoStatus === 'error') && (
          <motion.div
            key="geo-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300 flex-1">{geoError}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-800 shrink-0"
              onClick={clearLocation}
            >
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Bar */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hospitals by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {allSpecialties.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'rating' | 'distance' | 'beds')}>
            <SelectTrigger className="w-full sm:w-44">
              <ArrowUpDown className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Nearest First</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="beds">Most Beds Available</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Results count + view toggle */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Showing {filteredHospitals.length} hospital{filteredHospitals.length !== 1 ? 's' : ''}
          </p>
          {isUsingRealData && (
            <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Real nearby data
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1.5 px-2.5"
            onClick={() => setViewMode('list')}
          >
            <List className="h-3.5 w-3.5" />
            List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1.5 px-2.5"
            onClick={() => setViewMode('map')}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </Button>
        </div>
      </motion.div>

      {/* Map Placeholder */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          <motion.div
            key="map-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[500px] w-full rounded-xl overflow-hidden border shadow-sm relative isolate z-0"
          >
            <MapWrapper
              center={userLocation ? [userLocation.lat, userLocation.lng] : [REFERENCE_LAT, REFERENCE_LNG]}
              zoom={13}
              markers={[
                ...(userLocation ? [{
                  id: 'user-loc',
                  position: [userLocation.lat, userLocation.lng] as [number, number],
                  type: 'patient' as const,
                  label: 'You are here',
                  popup: <div className="text-sm p-1"><strong>Your Location</strong></div>
                }] : []),
                ...filteredHospitals.map(h => ({
                id: h.id,
                position: [h.latitude, h.longitude] as [number, number],
                type: 'hospital' as const,
                label: h.name,
                popup: (
                  <div className="text-sm p-1 min-w-[180px]">
                    <strong className="block mb-1 border-b pb-1">{h.name}</strong>
                    <div className="flex justify-between text-xs my-1">
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="font-semibold">{h.distanceKm} km</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Available Beds:</span>
                      <span className="font-semibold text-emerald-600">{h.availableBeds}</span>
                    </div>
                  </div>
                )
              }))]}
            />
          </motion.div>
        ) : (
          /* Hospital Grid */
          <motion.div
            key="list-view"
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filteredHospitals.map((hospital) => {
              const gradient = getGradient(hospital.id);
              const reviews = getReviews(hospital.id);
              const waitTime = getWait(hospital.id);
              const hasBeds = hospital.availableBeds > 0;
              const isEmergency247 = hospital.icuTotal > 100;

              return (
                <motion.div key={hospital.id} variants={fadeUp}>
                  <Card className="card-hover h-full flex flex-col overflow-hidden">
                    {/* Hero Gradient Area */}
                    <div className={`relative h-28 bg-gradient-to-br ${gradient} overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 left-6 w-16 h-16 rounded-full border-2 border-white" />
                        <div className="absolute bottom-2 right-4 w-24 h-24 rounded-full border border-white" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white" />
                      </div>
                      {isEmergency247 && (
                        <Badge className="absolute top-3 right-3 bg-white/20 text-white border-white/30 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider gap-1">
                          <Zap className="h-3 w-3" />
                          24/7 Emergency
                        </Badge>
                      )}
                      {isUsingRealData && (
                        <Badge className="absolute top-3 left-3 bg-emerald-500/80 text-white border-0 backdrop-blur-sm text-[10px] font-bold gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Found
                        </Badge>
                      )}
                      <div className="absolute bottom-3 left-4 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col">
                      {/* Name */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-sm leading-tight">{hospital.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            {hospital.city || hospital.address || 'Nearby'}
                          </span>
                        </div>
                      </div>

                      {/* Star rating */}
                      <div className="flex items-center gap-2 mb-3">
                        {renderStars(hospital.emergencyRating)}
                        <span className="text-xs font-semibold text-amber-500">{hospital.emergencyRating}</span>
                        <span className="text-xs text-muted-foreground">({reviews.toLocaleString()})</span>
                      </div>

                      {/* Specialization Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {hospital.specializations.slice(0, 4).map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-[10px] px-2 py-0">
                            {spec}
                          </Badge>
                        ))}
                        {hospital.specializations.length > 4 && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0">
                            +{hospital.specializations.length - 4} more
                          </Badge>
                        )}
                      </div>

                      {/* Key Metrics Row */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <BedDouble className="h-4 w-4 mx-auto text-emerald-500 mb-0.5" />
                          <p className={`text-sm font-bold ${hasBeds ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {hospital.availableBeds}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Beds Free</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <Clock className="h-4 w-4 mx-auto text-amber-500 mb-0.5" />
                          <p className="text-sm font-bold">{waitTime}</p>
                          <p className="text-[10px] text-muted-foreground">Avg Wait</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <Navigation className="h-4 w-4 mx-auto text-primary mb-0.5" />
                          <p className="text-sm font-bold">{hospital.distanceKm}</p>
                          <p className="text-[10px] text-muted-foreground">km Away</p>
                        </div>
                      </div>

                      {/* Emergency Helpline */}
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground">Emergency Helpline</p>
                          <p className="text-sm font-semibold tracking-wide">
                            {hospital.phone || '108 (National Emergency)'}
                          </p>
                        </div>
                        {hospital.phone && (
                          <a href={`tel:${hospital.phone}`}>
                            <Button size="sm" className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white">
                              <Phone className="h-3 w-3" />
                              Call
                            </Button>
                          </a>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-auto flex gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5">
                            <Navigation className="h-3.5 w-3.5" />
                            Get Directions
                          </Button>
                        </a>
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => toast({ title: 'Hospital Details', description: `Loading details for ${hospital.name}...` })}>
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {viewMode === 'list' && filteredHospitals.length === 0 && fetchStatus !== 'fetching' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            {isUsingRealData ? 'No hospitals match your filters' : 'No hospitals found'}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your search or specialty filter
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => { setSearch(''); setSpecialtyFilter('all'); }}
          >
            Clear filters
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
