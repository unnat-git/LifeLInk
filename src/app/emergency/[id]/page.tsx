'use client';

import {
  Heart, Droplets, Phone, User, ShieldAlert, AlertTriangle,
  Pill, Activity, CreditCard,
} from 'lucide-react';
import { BLOOD_GROUP_LABELS } from '@/lib/constants';

const MOCK_EXTENDED = {
  height: '175 cm',
  weight: '72 kg',
  insurance: {
    provider: 'Star Health Insurance',
    policyNumber: 'SHI-2024-78542-AX',
    validUntil: '2025-12-31',
    coverageType: 'Comprehensive Health Plan',
  },
};

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

import { use, useEffect, useState } from 'react';

export default function EmergencyProfileRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${resolvedParams.id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.id]);


  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Loading emergency data...</div>;
  }

  if (!profile || profile.error) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Profile not found or access denied.</div>;
  }

  const patient = {
    ...profile,
    bloodGroup: profile?.patientProfile?.bloodGroup || 'O_POS',
    allergies: profile?.patientProfile?.allergies ? JSON.parse(profile.patientProfile.allergies) : [],
    chronicConditions: profile?.patientProfile?.chronicConditions ? JSON.parse(profile.patientProfile.chronicConditions) : [],
    currentMedications: profile?.patientProfile?.currentMedications ? JSON.parse(profile.patientProfile.currentMedications) : [],
    emergencyContacts: profile?.emergencyContacts || [],
  };

  const bloodLabel = BLOOD_GROUP_LABELS[patient.bloodGroup || 'O_POS'];
  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#f3f4f6',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      WebkitTextSizeAdjust: '100%',
      fontSize: '16px',
    }}>

      {/* ══ HEADER ══ */}
      <div style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', padding: '20px 20px 24px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 10px', display: 'flex', alignItems: 'center' }}>
              <Heart style={{ width: 22, height: 22, color: '#fff', fill: '#fff' }} />
            </div>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: '-0.5px' }}>LifeLink</span>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 1, padding: '7px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.35)' }}>
            EMERGENCY
          </span>
        </div>

        {/* Blood type + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 20,
            width: 112,
            height: 112,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '2.5px solid rgba(255,255,255,0.35)',
          }}>
            <Droplets style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }} />
            <span style={{ color: '#fff', fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{bloodLabel}</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, marginTop: 3, letterSpacing: 0.5 }}>BLOOD TYPE</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900, lineHeight: 1.2, marginBottom: 8, wordBreak: 'break-word' }}>
              {patient.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, marginBottom: 12 }}>
              {patient.gender || 'N/A'} &nbsp;·&nbsp; {age ? `${age} yrs` : 'N/A'}
            </p>
            {patient.phone && (
              <a href={`tel:${patient.phone}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 17, fontWeight: 700,
                padding: '8px 16px', borderRadius: 24, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
              }}>
                <Phone style={{ width: 16, height: 16 }} />
                {patient.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ══ QUICK STATS ══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: '#fff', borderBottom: '1px solid #e5e7eb',
      }}>
        {[
          { label: 'Age', value: age ? `${age}y` : 'N/A' },
          { label: 'Height', value: MOCK_EXTENDED.height },
          { label: 'Weight', value: MOCK_EXTENDED.weight },
          { label: 'Gender', value: patient.gender || 'N/A' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center', padding: '14px 8px', borderRight: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>{s.label}</p>
            <p style={{ fontSize: 19, fontWeight: 800, color: '#111827' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ══ CONTENT SECTIONS ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 14px 32px' }}>

        {/* Allergies */}
        {patient.allergies.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '2px solid #fca5a5' }}>
            <div style={{ background: '#fef2f2', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #fecaca' }}>
              <AlertTriangle style={{ width: 20, height: 20, color: '#dc2626', flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5 }}>⚠ Allergies — Critical</span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {patient.allergies.map((a) => (
                <span key={a} style={{ background: '#fee2e2', color: '#b91c1c', fontSize: 18, fontWeight: 700, padding: '10px 20px', borderRadius: 24, border: '1px solid #fca5a5' }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chronic Conditions */}
        {patient.chronicConditions && patient.chronicConditions.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <div style={{ background: '#fff7ed', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #fed7aa' }}>
              <Activity style={{ width: 19, height: 19, color: '#ea580c', flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: 0.5 }}>Chronic Conditions</span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {patient.chronicConditions.map((c) => (
                <span key={c} style={{ background: '#fff7ed', color: '#c2410c', fontSize: 18, fontWeight: 600, padding: '10px 20px', borderRadius: 24, border: '1px solid #fed7aa' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {patient.currentMedications && patient.currentMedications.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <div style={{ background: '#eff6ff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #bfdbfe' }}>
              <Pill style={{ width: 19, height: 19, color: '#2563eb', flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Medications</span>
            </div>
            <div style={{ padding: '6px 18px 10px' }}>
              {patient.currentMedications.map((m, i) => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < patient.currentMedications.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  <span style={{ fontSize: 19, color: '#1f2937', fontWeight: 500 }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        {patient.emergencyContacts.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <div style={{ background: '#f0fdf4', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #bbf7d0' }}>
              <Phone style={{ width: 19, height: 19, color: '#16a34a', flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#14532d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Emergency Contacts</span>
            </div>
            <div>
              {patient.emergencyContacts.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px', gap: 14,
                  borderBottom: i < patient.emergencyContacts.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User style={{ width: 22, height: 22, color: '#6b7280' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{c.name}</p>
                      <p style={{ fontSize: 16, color: '#6b7280' }}>{c.relationship}</p>
                      <p style={{ fontSize: 16, color: '#6b7280' }}>{c.phone}</p>
                    </div>
                  </div>
                  <a
                    href={c.phone ? `tel:${c.phone}` : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      background: '#16a34a', color: '#fff', fontSize: 17, fontWeight: 700,
                      padding: '12px 20px', borderRadius: 28, textDecoration: 'none',
                      flexShrink: 0, minWidth: 90, minHeight: 48,
                    }}
                  >
                    <Phone style={{ width: 16, height: 16 }} />
                    Call
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Details */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ background: '#f9fafb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e5e7eb' }}>
            <User style={{ width: 19, height: 19, color: '#6b7280', flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Patient Details</span>
          </div>
          <div style={{ padding: '4px 18px 10px' }}>
            {[
              { label: 'Full Name', value: patient.name },
              { label: 'Date of Birth', value: patient.dateOfBirth || 'N/A' },
              { label: 'Email', value: patient.email },
              { label: 'Address', value: patient.address || 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                <span style={{ fontSize: 19, fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insurance */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ background: '#1e293b', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard style={{ width: 19, height: 19, color: '#fbbf24', flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>Insurance</span>
          </div>
          <div style={{ padding: '4px 18px 10px' }}>
            {[
              { label: 'Provider', value: MOCK_EXTENDED.insurance.provider },
              { label: 'Policy No.', value: MOCK_EXTENDED.insurance.policyNumber },
              { label: 'Valid Until', value: MOCK_EXTENDED.insurance.validUntil },
              { label: 'Coverage', value: MOCK_EXTENDED.insurance.coverageType },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                <span style={{ fontSize: 19, fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 16, fontWeight: 700, padding: '10px 22px', borderRadius: 24, marginBottom: 14 }}>
            <ShieldAlert style={{ width: 16, height: 16 }} />
            For Emergency Responders Only
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: '#dc2626' }}>
            <Heart style={{ width: 16, height: 16, fill: '#dc2626' }} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>Powered by LifeLink</span>
          </div>
          <p style={{ color: '#9ca3af', fontSize: 15, marginTop: 6 }}>Emergency Medical Response System</p>
        </div>

      </div>
    </div>
  );
}
