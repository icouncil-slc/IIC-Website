import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomepageHero from "@/models/HomepageHero";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

const DEFAULTS = {
  enabled: false,
  images: [],
  autoplayMs: 4500,
};

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  const cleaned = images
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter(Boolean)
    .filter((u) => u.startsWith("https://") || u.startsWith("http://"));

  // de-dupe while preserving order
  const seen = new Set();
  const unique = [];
  for (const u of cleaned) {
    if (seen.has(u)) continue;
    seen.add(u);
    unique.push(u);
  }
  return unique;
}

export async function GET() {
  await dbConnect();
  const doc = await HomepageHero.findOne({ key: "singleton" }).lean();
  if (!doc) return NextResponse.json(DEFAULTS);

  return NextResponse.json({
    enabled: Boolean(doc.enabled),
    images: Array.isArray(doc.images) ? doc.images : [],
    autoplayMs: typeof doc.autoplayMs === "number" ? doc.autoplayMs : DEFAULTS.autoplayMs,
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const authorizedRoles = ["Admin", "Moderator"];
  if (!session || !authorizedRoles.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json();

  const enabled = Boolean(body?.enabled);
  const images = normalizeImages(body?.images).slice(0, 4); // max 4 extra images (default + 4 = 5)

  const autoplayMsRaw = Number(body?.autoplayMs);
  const autoplayMs = Number.isFinite(autoplayMsRaw)
    ? clamp(Math.round(autoplayMsRaw), 2000, 10000)
    : DEFAULTS.autoplayMs;

  if (enabled && images.length < 2) {
    return NextResponse.json(
      { error: "When slider is enabled, please add at least 2 extra images (3 total with default)." },
      { status: 400 }
    );
  }

  const updated = await HomepageHero.findOneAndUpdate(
    { key: "singleton" },
    { key: "singleton", enabled, images, autoplayMs },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({
    enabled: Boolean(updated.enabled),
    images: Array.isArray(updated.images) ? updated.images : [],
    autoplayMs: typeof updated.autoplayMs === "number" ? updated.autoplayMs : DEFAULTS.autoplayMs,
  });
}

