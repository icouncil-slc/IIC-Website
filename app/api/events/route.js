// app/api/events/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import RegistrationFormConfig from "@/models/RegistrationFormConfig";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import {
  buildRegistrationFormConfigFromEvent,
  normalizeRegistrationFormConfig,
} from "@/lib/registrationFormDefaults";

// This GET function remains public for anyone to see the list of events.
export async function GET(req) {
  await dbConnect();
  const events = await Event.find().sort({ date: 1 }).lean();
  const { searchParams } = new URL(req.url);
  const includeAll = searchParams.get("all") === "1";
  const now = new Date();
  const upcoming = [];
  const past = [];

  for (const event of events) {
    const eventDate = new Date(event.date);
    const registrationType =
      event.registrationType || (event.googleFormLink ? "external" : "none");
    (eventDate < now ? past : upcoming).push({
      ...event,
      _id: event._id.toString(),
      registrationType,
    });
  }

  const sortedPast = past.sort((a, b) => new Date(b.date) - new Date(a.date));
  return NextResponse.json({ upcoming, past: includeAll ? sortedPast : sortedPast.slice(0, 4) });
}

// This POST function is now protected.
export async function POST(req) {
  // v-- THIS IS THE SECURITY CHECK --v
  const session = await getServerSession(authOptions);
  // For now, we just check if a user is logged in.
  // Later, we can check for specific permissions like `session.user.permissions.event`
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  // ^-- END OF SECURITY CHECK --^

  try {
    await dbConnect();
    const body = await req.json();
    const registrationType =
      body.registrationType === "internal" ||
      body.registrationType === "external" ||
      body.registrationType === "none"
        ? body.registrationType
        : body.googleFormLink
          ? "external"
          : "none";

    const eventPayload = {
      ...body,
      registrationType,
      googleFormLink: registrationType === "external" ? body.googleFormLink || "" : "",
    };

    const formConfig = body.formConfig || null;
    delete eventPayload.formConfig;

    const newEvent = await Event.create(eventPayload);

    if (registrationType === "internal") {
      const eventDefaults = buildRegistrationFormConfigFromEvent(newEvent);
      const normalizedFormConfig = normalizeRegistrationFormConfig(
        formConfig || {},
        eventDefaults
      );

      await RegistrationFormConfig.findOneAndUpdate(
        { eventId: newEvent._id },
        {
          key: `event:${newEvent._id.toString()}`,
          eventId: newEvent._id,
          ...normalizedFormConfig,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    // Return a more specific error if validation fails
    return NextResponse.json({ error: error.message || "Failed to add event" }, { status: 400 });
  }
}
