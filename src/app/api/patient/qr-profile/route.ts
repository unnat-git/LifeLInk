import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory rate limiting (Note: clears on server restart)
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_MAX = 60; // Max requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function GET(req: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const now = Date.now();
    
    if (ip !== 'unknown') {
      const record = rateLimit.get(ip);
      if (record) {
        if (now - record.timestamp < RATE_LIMIT_WINDOW) {
          if (record.count >= RATE_LIMIT_MAX) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
          }
          record.count += 1;
        } else {
          rateLimit.set(ip, { count: 1, timestamp: now });
        }
      } else {
        rateLimit.set(ip, { count: 1, timestamp: now });
      }
    }

    // 2. Token decoding or shortId lookup
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const shortId = searchParams.get('shortId');
    const patientIdParam = searchParams.get('patientId');
    
    if (!token && !shortId && !patientIdParam) {
      return NextResponse.json({ error: 'Missing token, shortId, or patientId' }, { status: 400 });
    }

    let patientId: string | null = null;

    if (patientIdParam) {
      patientId = patientIdParam;
    } else if (token) {
      try {
        const decodedToken = Buffer.from(token, 'base64url').toString('utf-8');
        const payload = JSON.parse(decodedToken);
        patientId = payload.patientId;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
      }
    } else if (shortId) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { qrCodeId: shortId.toUpperCase() }
      });
      if (!patientProfile) {
        return NextResponse.json({ error: 'Patient not found by short ID' }, { status: 404 });
      }
      patientId = patientProfile.userId;
    }

    if (!patientId) {
      return NextResponse.json({ error: 'Invalid identifier' }, { status: 400 });
    }

    // 3. Fetch patient data
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      include: {
        patientProfile: true,
        emergencyContacts: true,
        emergencies: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      }
    });

    if (!patient || patient.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
    }

    // 4. Format response
    const profile = patient.patientProfile;
    
    return NextResponse.json({
      patient: {
        id: patient.id,
        name: patient.name,
        gender: profile?.gender,
        dateOfBirth: profile?.dateOfBirth,
        bloodType: profile?.bloodGroup,
        photoUrl: patient.image,
        medicalProfile: {
          allergies: profile?.allergies ? JSON.parse(profile.allergies) : [],
          currentMedications: profile?.currentMedications ? JSON.parse(profile.currentMedications) : [],
          chronicConditions: profile?.chronicConditions ? JSON.parse(profile.chronicConditions) : [],
          pastSurgeries: profile?.pastSurgeries ? JSON.parse(profile.pastSurgeries) : [],
          notes: profile?.notes || null,
        },
        emergencyContacts: patient.emergencyContacts.map(c => ({
          name: c.name,
          relationship: c.relationship,
          phone: c.phone
        })),
        recentEmergencies: patient.emergencies.map(e => ({
          date: e.createdAt,
          severity: e.severity,
          status: e.status,
          hospital: e.hospitalId
        }))
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[QR_PROFILE_API]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
