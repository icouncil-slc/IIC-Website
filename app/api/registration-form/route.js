import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import RegistrationFormConfig from '@/models/RegistrationFormConfig';
import { authOptions } from '../auth/[...nextauth]/route';
import {
  defaultRegistrationFormConfig,
  normalizeRegistrationFormConfig,
} from '@/lib/registrationFormDefaults';

function canManageRegistrationForm(session) {
  const role = session?.user?.role;
  if (role === 'Admin' || role === 'Moderator') return true;
  return Boolean(session?.user?.permissions?.registration_form);
}

export async function GET() {
  await dbConnect();
  const config = await RegistrationFormConfig.findOne({ key: 'singleton' }).lean();
  if (!config) {
    return NextResponse.json(defaultRegistrationFormConfig);
  }

  return NextResponse.json(normalizeRegistrationFormConfig(config));
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!canManageRegistrationForm(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json();
  const normalized = normalizeRegistrationFormConfig(body);

  const updated = await RegistrationFormConfig.findOneAndUpdate(
    { key: 'singleton' },
    { key: 'singleton', ...normalized },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json(normalizeRegistrationFormConfig(updated));
}
