// app/api/forms/route.js
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
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

      if (extra?.eventTitle) {
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

    if (type === 'registration') {
      await appendRegistrationToWorkbook({
        name,
        email: trimmedEmail,
        message,
        extra: extra || {},
        createdAt: submission.createdAt,
      });
    }

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
        <h2>Thanks for contacting IIC SLC</h2>
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

async function appendRegistrationToWorkbook({ name, email, message, extra, createdAt }) {
  const workbookPath = path.join(process.cwd(), 'public', 'data', 'registration-submissions.xlsx');
  const sheetName = 'Registrations';

  await fs.mkdir(path.dirname(workbookPath), { recursive: true });

  let workbook;

  try {
    await fs.access(workbookPath);
    workbook = XLSX.readFile(workbookPath);
  } catch {
    workbook = XLSX.utils.book_new();
  }

  const row = {
    Name: name,
    Email: email,
    'Mobile No.': extra.mobile || '',
    Course: extra.course || '',
    Year: extra.year || '',
    College: extra.college || '',
    Event: extra.eventTitle || '',
    'Community Joined': extra.communityJoined ? 'Yes' : 'No',
    Message: message,
    Type: 'registration',
    SubmittedAt: new Date(createdAt || Date.now()).toISOString(),
  };

  if (Array.isArray(extra.additionalResponses)) {
    for (const response of extra.additionalResponses) {
      const label =
        typeof response?.label === 'string' && response.label.trim()
          ? response.label.trim()
          : typeof response?.id === 'string' && response.id.trim()
            ? response.id.trim()
            : 'Additional Response';
      row[label] = typeof response?.value === 'string' ? response.value : '';
    }
  }

  const headerOrder = [
    'Name',
    'Email',
    'Mobile No.',
    'Course',
    'Year',
    'College',
    'Event',
    'Community Joined',
    'Message',
    'Type',
    'SubmittedAt',
    ...Object.keys(row).filter(
      (key) =>
        ![
          'Name',
          'Email',
          'Mobile No.',
          'Course',
          'Year',
          'College',
          'Event',
          'Community Joined',
          'Message',
          'Type',
          'SubmittedAt',
        ].includes(key)
    ),
  ];

  const existingSheet = workbook.Sheets[sheetName];
  if (existingSheet) {
    XLSX.utils.sheet_add_json(existingSheet, [row], {
      header: headerOrder,
      skipHeader: true,
      origin: -1,
    });
  } else {
    const newSheet = XLSX.utils.json_to_sheet([row], {
      header: headerOrder,
    });
    workbook.Sheets[sheetName] = newSheet;
    workbook.SheetNames.push(sheetName);
  }

  try {
    const workbookBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    await fs.writeFile(workbookPath, workbookBuffer);
  } catch (error) {
    if (error?.code === 'EBUSY' || error?.code === 'EPERM') {
      throw new Error(
        'Could not save the Excel file. Please close registration-submissions.xlsx if it is open and try again.'
      );
    }

    throw new Error(`Could not save the Excel file: ${error?.message || 'Unknown error'}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
