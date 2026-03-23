// app/api/forms/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import EventRegistration from '@/models/EventRegistration';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, name, email, message, extra } = body;
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';

    if (!type || !name || !trimmedEmail || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save to DB
    await dbConnect();
    if (type === 'registration') {
      const duplicateQuery = {
        email: new RegExp(`^${escapeRegExp(trimmedEmail)}$`, 'i'),
      };

      if (extra?.eventId) {
        duplicateQuery['extra.eventId'] = extra.eventId;
      } else if (extra?.eventTitle) {
        duplicateQuery['extra.eventTitle'] = extra.eventTitle;
      }

      const existingRegistration = await EventRegistration.findOne(duplicateQuery).lean();
      if (existingRegistration) {
        return NextResponse.json(
          { error: 'This email has already been used to register for this event.' },
          { status: 409 }
        );
      }
    }

    const submission =
      type === 'registration'
        ? await EventRegistration.create({
            type,
            name,
            email: trimmedEmail,
            message,
            extra: extra || {},
          })
        : await FormSubmission.create({
            type,
            name,
            email: trimmedEmail,
            message,
            extra: extra || {},
          });

    // Admin notification email
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width:700px;">
        <h2>New ${type} submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space:pre-wrap; border-left:2px solid #eee; padding-left:10px;">${message}</div>
        <p style="margin-top:12px;"><strong>Extra:</strong> ${JSON.stringify(extra || {})}</p>
        <p style="font-size:12px;color:#666;margin-top:16px;">View submissions in admin panel.</p>
      </div>
    `;

    await sendEmail(process.env.ADMIN_EMAIL, `New ${type} submission from ${name}`, adminHtml);

    // Thank you email to user
    const userHtml = `
      <div style="font-family: Arial, sans-serif; max-width:700px;">
        <h2>Registration Confirmation</h2>
        <p>Hi ${name},</p>
        <p>Thanks for your ${
          type === 'idea'
            ? 'idea submission'
            : type === 'proposal'
              ? 'proposal'
              : type === 'registration'
                ? 'registration'
                : 'request for collaboration'
        }.</p>
        <p>We've received your submission and our team will get back to you shortly.</p>
        <p style="margin-top:10px;">— IIC SLC Team</p>
      </div>
    `;

    await sendEmail(trimmedEmail, `Thanks for your ${type} submission — IIC SLC`, userHtml);

    return NextResponse.json({ success: true, id: submission._id }, { status: 201 });
  } catch (err) {
    console.error('Form API error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
