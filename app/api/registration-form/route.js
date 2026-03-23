import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import RegistrationFormConfig from '@/models/RegistrationFormConfig';
import Event from '@/models/Event';
import { authOptions } from '../auth/[...nextauth]/route';
import {
  buildRegistrationFormConfigFromEvent,
  defaultRegistrationFormConfig,
  normalizeRegistrationFormConfig,
} from '@/lib/registrationFormDefaults';

function canManageRegistrationForm(session) {
  const role = session?.user?.role;
  if (role === 'Admin' || role === 'Moderator') return true;
  return Boolean(session?.user?.permissions?.registration_form);
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');

  if (eventId) {
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventDefaults = buildRegistrationFormConfigFromEvent(event);
    const config = await RegistrationFormConfig.findOne({
      $or: [{ eventId }, { key: `event:${eventId}` }],
    }).lean();
    return NextResponse.json({
      eventId,
      ...normalizeRegistrationFormConfig(config || {}, eventDefaults),
    });
  }

  const config = await RegistrationFormConfig.findOne({
    key: { $in: ['global-default', 'singleton'] },
  }).lean();
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
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  const body = await req.json();

  if (eventId) {
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const normalized = normalizeRegistrationFormConfig(body, buildRegistrationFormConfigFromEvent(event));
    const updated = await RegistrationFormConfig.findOneAndUpdate(
      { eventId },
      { key: `event:${eventId}`, eventId, ...normalized },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      eventId,
      ...normalizeRegistrationFormConfig(updated, buildRegistrationFormConfigFromEvent(event)),
    });
  }

  const normalized = normalizeRegistrationFormConfig(body);
  const updated = await RegistrationFormConfig.findOneAndUpdate(
    { key: { $in: ['global-default', 'singleton'] } },
    { key: 'global-default', eventId: null, ...normalized },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json(normalizeRegistrationFormConfig(updated));
}
