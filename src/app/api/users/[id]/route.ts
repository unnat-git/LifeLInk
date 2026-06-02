import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        emergencyContacts: true,
        patientProfile: true,
        driverProfile: true,
        staffProfile: true,
        adminProfile: true,
        ambulance: { select: { id: true, vehicleNumber: true, status: true } },
        hospital: { select: { id: true, name: true, city: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Lazy generate qrCodeId for existing patients
    if (user.patientProfile && !user.patientProfile.qrCodeId) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let generated = '';
      while (true) {
        generated = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        const existing = await prisma.patientProfile.findUnique({ where: { qrCodeId: generated } });
        if (!existing) break;
      }
      
      const updatedProfile = await prisma.patientProfile.update({
        where: { id: user.patientProfile.id },
        data: { qrCodeId: generated }
      });
      user.patientProfile = updatedProfile;
    }

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json(safeUser, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[GET /api/users/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    for (const field of ['name', 'phone', 'role', 'isVerified', 'city', 'pinCode', 'country'] as const) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        emergencyContacts: true,
        patientProfile: true,
        driverProfile: true,
        staffProfile: true,
        adminProfile: true,
        ambulance: { select: { id: true, vehicleNumber: true, status: true } },
        hospital: { select: { id: true, name: true, city: true } },
      },
    });
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json(safeUser, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e?.code === 'P2025') return NextResponse.json({ error: 'User not found' }, { status: 404 });
    console.error('[PATCH /api/users/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.update({ where: { id }, data: { isVerified: false } });
    return NextResponse.json({ message: 'User deactivated successfully', id: user.id });
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e?.code === 'P2025') return NextResponse.json({ error: 'User not found' }, { status: 404 });
    console.error('[DELETE /api/users/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
