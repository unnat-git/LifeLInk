'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Heart,
  Droplets,
  CalendarDays,
  AlertTriangle,
  Pill,
  Phone,
  User,
  ShieldAlert,
  Printer,
  ArrowLeft,
  Ruler,
  Weight,
  Clock,
  QrCode,
  CreditCard,
  CircleAlert,
  Stethoscope,
  Activity,
  Cross,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useNavigationStore } from '@/store';
import { BLOOD_GROUP_LABELS } from '@/lib/constants';

// Extended mock data for fields not on the User type
const MOCK_PATIENT_EXTENDED = {
  height: '175 cm',
  weight: '72 kg',
  insurance: {
    provider: 'Star Health Insurance',
    policyNumber: 'SHI-2024-78542-AX',
    validUntil: '2025-12-31',
    coverageType: 'Comprehensive Health Plan',
  },
};

// Calculate age from DOB
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Severity config for medical conditions
const CONDITION_SEVERITY: Record<string, { color: string; bg: string; darkBg: string; label: string }> = {
  'Type 2 Diabetes': { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', label: 'MODERATE' },
  'Type 1 Diabetes': { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', label: 'HIGH' },
  'Hypertension': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', label: 'MODERATE' },
  'Hypothyroidism': { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100', darkBg: 'dark:bg-yellow-900/30', label: 'LOW' },
  'Asthma': { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', label: 'HIGH' },
  'Heart Disease': { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-200', darkBg: 'dark:bg-red-900/40', label: 'CRITICAL' },
};

// Medication parsing
function parseMedication(med: string): { name: string; dosage: string; frequency: string } {
  const parts = med.split(/\s+/);
  const dosage = parts.find(p => /\d+\s*(mg|mcg|ml|g|IU|%)/i.test(p)) || '';
  const name = dosage ? med.replace(dosage, '').trim() : med;
  return { name, dosage, frequency: 'Daily' };
}

// Note: qrData logic moved inside the component to handle dynamic window.location

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function EmergencyProfilePage() {
  const { setCurrentPage } = useNavigationStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // In a real scenario, this page is just a preview.
  // The actual public URL uses /emergency/[id]/page.tsx
  // We'll fetch the current user's profile for preview.
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.id) {
          return fetch(`/api/users/${session.user.id}`);
        }
        throw new Error('No user');
      })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const patient = profile ? {
    ...profile,
    bloodGroup: profile?.patientProfile?.bloodGroup || 'O_POS',
    allergies: profile?.patientProfile?.allergies ? JSON.parse(profile.patientProfile.allergies) : [],
    chronicConditions: profile?.patientProfile?.chronicConditions ? JSON.parse(profile.patientProfile.chronicConditions) : [],
    currentMedications: profile?.patientProfile?.currentMedications ? JSON.parse(profile.patientProfile.currentMedications) : [],
    emergencyContacts: profile?.emergencyContacts || [],
  } : {
    id: '0000', name: 'Loading...', gender: 'N/A', dateOfBirth: '1990-01-01', bloodGroup: 'O_POS',
    allergies: [], chronicConditions: [], currentMedications: [], emergencyContacts: [], address: '', createdAt: new Date()
  };

  const age = calculateAge(patient.dateOfBirth || '1990-01-01');
  const bloodLabel = BLOOD_GROUP_LABELS[patient.bloodGroup || 'O_POS'];

  const [qrData, setQrData] = useState(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://lifelink-beta-seven.vercel.app'}/emergency/${patient.id}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lifelink-beta-seven.vercel.app';
      setQrData(`${baseUrl}/emergency/${patient.id}`);
    }
  }, [patient.id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background print:bg-white print:min-h-auto">
      {/* ============ EMERGENCY HEADER BANNER ============ */}
      <div className="relative bg-linear-to-r from-red-700 via-red-600 to-rose-600 text-white print:bg-red-600 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10 print:hidden" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center gap-3">
          {/* LifeLink Logo + Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center print:bg-white/30">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-shadow">LifeLink</h1>
              <p className="text-[10px] sm:text-xs text-red-100 tracking-widest uppercase font-medium">Every Second Matters</p>
            </div>
          </div>

          {/* MEDICAL EMERGENCY ID Badge */}
          <div className="flex items-center gap-2 mt-1">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
              <span className="relative block w-3 h-3 rounded-full bg-white" />
            </div>
            <Badge className="bg-white/20 text-white border-2 border-white/40 text-xs sm:text-sm font-bold tracking-widest uppercase px-4 py-1.5 print:bg-white/30 print:border-white/50">
              Medical Emergency ID
            </Badge>
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
              <span className="relative block w-3 h-3 rounded-full bg-white" />
            </div>
          </div>

          {/* Scanned info */}
          <p className="text-[10px] sm:text-xs text-red-100 font-medium text-center print:hidden">
            <ShieldAlert className="w-3 h-3 inline mr-1" />
            Emergency Medical Information — Scan verified
          </p>
        </div>
      </div>

      {/* ============ BACK BUTTON (non-print) ============ */}
      <div className="max-w-2xl mx-auto px-4 pt-4 print:hidden">
        <button
          onClick={() => setCurrentPage('landing')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-4 pb-8 pt-2 space-y-5"
      >
        {/* ============ PATIENT INFO CARD ============ */}
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden border-2 border-red-200 dark:border-red-900/50 shadow-lg print:border-red-300 print:shadow-none print:break-inside-avoid">
            <div className="bg-linear-to-r from-red-600 to-rose-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-white/80" />
                <span className="text-white font-semibold text-sm">Patient Information</span>
              </div>
              <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold tracking-wider uppercase">
                Verified
              </Badge>
            </div>

            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Avatar + Core Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-2 border-red-100 dark:border-red-900/40 flex items-center justify-center">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
                    </div>
                    {/* Online/verified indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-card flex items-center justify-center">
                      <Cross className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                      {patient.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                      <span>{patient.gender}</span>
                      <span className="text-border">•</span>
                      <span>{age} years old</span>
                      <span className="text-border">•</span>
                      <span className="truncate max-w-[200px]">{patient.address}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>
                        DOB: {new Date(patient.dateOfBirth || '').toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Blood Group Badge — Prominent */}
                <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2">
                  <div className="bg-linear-to-br from-red-600 to-red-700 text-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg hover-glow-red print:shadow-none">
                    <Droplets className="w-7 h-7 sm:w-8 sm:h-8" />
                    <div>
                      <p className="text-[10px] text-red-200 font-semibold tracking-wider uppercase">Blood Type</p>
                      <p className="text-4xl sm:text-5xl font-black leading-none">{bloodLabel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  { icon: Ruler, label: 'Height', value: MOCK_PATIENT_EXTENDED.height },
                  { icon: Weight, label: 'Weight', value: MOCK_PATIENT_EXTENDED.weight },
                  { icon: Heart, label: 'Gender', value: patient.gender || 'N/A' },
                  { icon: CalendarDays, label: 'Age', value: `${age} years` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50">
                    <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-bold text-foreground truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ============ ALLERGIES ALERT SECTION ============ */}
        {patient.allergies.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden border-2 border-red-300 dark:border-red-800/60 print:border-red-400 print:break-inside-avoid">
              <div className="bg-linear-to-r from-red-100 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50 px-5 py-3 flex items-center gap-2 print:bg-red-50">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                  <CircleAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-300 text-sm">Allergies Alert</h3>
                  <p className="text-[11px] text-red-600 dark:text-red-400">Critical — Avoid these substances</p>
                </div>
              </div>
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-2">
                  {patient.allergies.map((allergy, index) => (
                    <div
                      key={allergy}
                      className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 text-xs font-black">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-red-800 dark:text-red-300 text-sm">{allergy}</p>
                        <p className="text-[11px] text-red-600/70 dark:text-red-400/70">Known severe allergic reaction</p>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2.5 rounded-lg bg-red-100/60 dark:bg-red-950/30 text-center">
                  <p className="text-[11px] font-semibold text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Cross-contamination risk — Inform all medical staff
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ============ MEDICAL CONDITIONS GRID ============ */}
        {patient.chronicConditions.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden print:break-inside-avoid">
              <div className="px-5 py-3 flex items-center gap-2 border-b">
                <Stethoscope className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm">Medical Conditions</h3>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {patient.chronicConditions.length} active
                </Badge>
              </div>
              <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patient.chronicConditions.map((condition) => {
                    const severity = CONDITION_SEVERITY[condition] || {
                      color: 'text-gray-600 dark:text-gray-400',
                      bg: 'bg-gray-100',
                      darkBg: 'dark:bg-gray-800/30',
                      label: 'UNKNOWN',
                    };
                    return (
                      <div
                        key={condition}
                        className={`p-3.5 rounded-xl border ${severity.bg} ${severity.darkBg} border-transparent transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{
                              backgroundColor: severity.label === 'CRITICAL' ? '#dc2626'
                                : severity.label === 'HIGH' ? '#ea580c'
                                : severity.label === 'MODERATE' ? '#d97706'
                                : '#ca8a04',
                            }} />
                            <div>
                              <p className="font-bold text-sm text-foreground">{condition}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">Chronic — Ongoing management</p>
                            </div>
                          </div>
                          <Badge className={`text-[9px] font-bold tracking-wider ${severity.color} ${severity.bg} ${severity.darkBg} border-0 shrink-0`}>
                            {severity.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ============ CURRENT MEDICATIONS ============ */}
        {patient.currentMedications.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="overflow-hidden print:break-inside-avoid">
              <div className="px-5 py-3 flex items-center gap-2 border-b">
                <Pill className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm">Current Medications</h3>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  {patient.currentMedications.length} active
                </Badge>
              </div>
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
                  <div className="col-span-5">Drug Name</div>
                  <div className="col-span-3">Dosage</div>
                  <div className="col-span-4">Frequency</div>
                </div>
                {/* Table Rows */}
                {patient.currentMedications.map((med, index) => {
                  const parsed = parseMedication(med);
                  return (
                    <div
                      key={med}
                      className={`grid grid-cols-12 gap-2 px-5 py-3 items-center text-sm ${index < patient.currentMedications.length - 1 ? 'border-b' : ''}`}
                    >
                      <div className="col-span-5 flex items-center gap-2">
                        <Pill className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-semibold text-foreground truncate">{parsed.name}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                          {parsed.dosage}
                        </span>
                      </div>
                      <div className="col-span-4 text-muted-foreground text-xs">{parsed.frequency}</div>
                    </div>
                  );
                })}
                {/* Footer note */}
                <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-t">
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Do not discontinue medications without consulting physician
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ============ EMERGENCY CONTACTS ============ */}
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden print:break-inside-avoid">
            <div className="px-5 py-3 flex items-center gap-2 border-b">
              <Phone className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-sm">Emergency Contacts</h3>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {patient.emergencyContacts.length} contacts
              </Badge>
            </div>
            <CardContent className="p-4 sm:p-5 space-y-3">
              {patient.emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card card-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-linear-to-br from-red-100 to-rose-100 dark:from-red-950/40 dark:to-rose-950/40 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{contact.name}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {contact.relationship}
                      </Badge>
                    </div>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors print:text-black"
                  >
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </a>
                </div>
              ))}
              {/* Call all button */}
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold gap-2 print:hidden"
                size="lg"
              >
                <Phone className="w-4 h-4" />
                Call First Contact
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ============ INSURANCE INFO ============ */}
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden print:break-inside-avoid">
            <div className="bg-linear-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 px-5 py-3 flex items-center gap-2 print:bg-slate-200 print:text-slate-800">
              <CreditCard className="w-4 h-4 text-amber-400 print:text-slate-600" />
              <span className="text-white font-semibold text-sm print:text-slate-800">Insurance Information</span>
            </div>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Provider</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{MOCK_PATIENT_EXTENDED.insurance.provider}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Policy Number</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 font-mono tracking-wider">
                    {MOCK_PATIENT_EXTENDED.insurance.policyNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Coverage Type</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{MOCK_PATIENT_EXTENDED.insurance.coverageType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Valid Until</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {new Date(MOCK_PATIENT_EXTENDED.insurance.validUntil).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ============ QR CODE SECTION ============ */}
        <motion.div variants={fadeUp}>
          <Card className="overflow-hidden print:break-inside-avoid">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <QrCode className="w-5 h-5 text-muted-foreground mb-3" />
              <h3 className="font-bold text-sm mb-1">Emergency QR Code</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Scan this QR code to access this patient&apos;s emergency medical profile from any device
              </p>
              <div className="bg-white p-4 rounded-2xl shadow-md border print:shadow-none">
                <QRCodeSVG
                  value={qrData}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#18181b"
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: '',
                    height: 0,
                    width: 0,
                    excavate: false,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-3 font-mono">
                ID: {patient.id}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ============ LAST UPDATED + ACTIONS ============ */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-3 print:hidden">
          <Button
            variant="outline"
            className="flex-1 w-full gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Print Emergency Card
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Updated {new Date(patient.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </motion.div>

        {/* Print-only last updated */}
        <div className="hidden print:block text-center pt-2 pb-4">
          <p className="text-xs text-gray-500">
            Last Updated: {new Date(patient.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })} — Generated via LifeLink Emergency Medical ID System
          </p>
        </div>

        {/* ============ FOOTER BRANDING ============ */}
        <motion.div variants={fadeUp} className="text-center pt-2 pb-4 print:pt-0">
          <Separator className="mb-4 gradient-divider print:bg-gray-300" />
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
            <span className="font-bold text-sm">LifeLink</span>
          </div>
          <p className="text-xs text-muted-foreground">Every Second Matters</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Emergency Medical ID &middot; lifelink.app
          </p>
        </motion.div>
      </motion.div>

      {/* ============ PRINT STYLES ============ */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
