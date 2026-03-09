import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { read, utils, SSF } from "xlsx";

// Note: Using the model recommended for Grounding (RAG-lite)
const MODEL_NAME = "gemini-2.5-flash"; 

// Initialize with the SECURE, server-side environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const IIC_SYSTEM_INSTRUCTION = `You are a professional and concise chatbot assistant for the Institution's Innovation Council (IIC) at Shyam Lal College, University of Delhi. Your tone is helpful and direct. You must follow these rules strictly:
1. Keep all responses very short, maximum 1-3 sentences.
2. Do not use markdown (no bolding or lists).
3. Directly answer the user's question. Do not introduce yourself or list example questions.
4. In this chat, "IIC" ALWAYS refers to the Institution's Innovation Council at Shyam Lal College. Never interpret it as electronics terms like "I2C".
5. Only answer questions related to the Institution's Innovation Council at Shyam Lal College. If asked about something else (general knowledge, other colleges, non-IIC topics), clearly state that you can only help with IIC Shyam Lal College related queries.
6. If you are not sure about a factual detail, say you are not sure and ask the user to check the official IIC website (https://iic-slc.live) rather than guessing.`;

const OFFICIAL_IIC_CONTEXT = `Official website context (use this as primary reference):
- IIC at Shyam Lal College aims to nurture creative young minds by providing platforms and guidance to help them transform innovative ideas into prototypes, and eventually contribute to the startup ecosystem of India.`;

const EVENT_QUERY_KEYWORDS = [
  "upcoming event",
  "next event",
  "event",
  "events",
  "schedule",
  "date",
  "time",
  "timing",
  "venue",
  "location",
  "workshop",
  "webinar",
  "hackathon",
  "competition",
];

const DEFAULT_EXCEL_PATH = "public/data/upcoming-events.xlsx";

function resolveExcelFilePath() {
  const configuredPath = process.env.UPCOMING_EVENTS_EXCEL_PATH || DEFAULT_EXCEL_PATH;
  const cwd = process.cwd();
  const initCwd = process.env.INIT_CWD;
  const parent = path.resolve(cwd, "..");
  const grandParent = path.resolve(cwd, "..", "..");

  const candidatePaths = [
    path.isAbsolute(configuredPath) ? configuredPath : path.resolve(cwd, configuredPath),
    path.resolve(cwd, DEFAULT_EXCEL_PATH),
    initCwd
      ? path.isAbsolute(configuredPath)
        ? configuredPath
        : path.resolve(initCwd, configuredPath)
      : null,
    initCwd ? path.resolve(initCwd, DEFAULT_EXCEL_PATH) : null,
    path.resolve(parent, "IIC-Website-main", DEFAULT_EXCEL_PATH),
    path.resolve(grandParent, "IIC-Website-main", DEFAULT_EXCEL_PATH),
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [String(key || "").trim().toLowerCase(), value])
  );
}

function getField(row, aliases) {
  for (const alias of aliases) {
    const val = row[alias];
    if (val instanceof Date && !Number.isNaN(val.getTime())) {
      const isExcelTimeOnly =
        val.getFullYear() === 1899 || val.getFullYear() === 1900;
      if (isExcelTimeOnly) {
        return val.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
      return val.toLocaleString("en-IN");
    }
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

function parseDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number") {
    const parsed = SSF.parse_date_code(value);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }

  if (typeof value === "string" && value.trim()) {
    const cleaned = value
      .trim()
      .replace(/\b(\d+)(st|nd|rd|th)\b/gi, "$1");
    const d = new Date(cleaned);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

function formatDate(dateObj, rawValue) {
  if (dateObj) {
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  const raw = String(rawValue || "").trim();
  return raw || "";
}

function readUpcomingEventsFromExcel() {
  try {
    const absolutePath = resolveExcelFilePath();
    if (!absolutePath) {
      return { events: [], missingFile: true };
    }

    const buffer = fs.readFileSync(absolutePath);
    const workbook = read(buffer, { type: "buffer", cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json(firstSheet, { defval: "" });

    const events = rows
      .map((raw) => {
        const row = normalizeRow(raw);
        const title = getField(row, ["event name", "event", "title", "name"]);
        const dateRaw = getField(row, ["date", "event date"]);
        const time = getField(row, ["time", "timing", "event time", "start time"]);
        const venue = getField(row, ["venue", "location", "place"]);
        const description = getField(row, ["description", "details", "about"]);
        const registrationLink = getField(row, [
          "registration link",
          "registration",
          "register",
          "link",
          "url",
        ]);

        const dateValue = parseDateValue(row["date"] ?? row["event date"] ?? dateRaw);

        return {
          title,
          dateValue,
          dateText: formatDate(dateValue, dateRaw),
          time,
          venue,
          description,
          registrationLink,
        };
      })
      .filter((event) => event.title || event.dateText || event.time || event.venue);

    return { events, missingFile: false };
  } catch (error) {
    console.error("Excel read error:", error);
    return { events: [], missingFile: false };
  }
}

function sortEventsWithFuturePriority(events) {
  return [...events].sort((a, b) => {
    const aTime = a.dateValue ? a.dateValue.getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.dateValue ? b.dateValue.getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

function getUpcomingCandidates(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sorted = sortEventsWithFuturePriority(events);
  const future = sorted.filter((event) => event.dateValue && event.dateValue >= today);
  return future.length ? future : sorted;
}

function parseRequestedCount(normalized) {
  const range = normalized.match(/\b(\d+)\s*(?:-|to)\s*(\d+)\s+events?\b/);
  if (range) {
    return Math.max(Number(range[1]), Number(range[2]));
  }

  const direct = normalized.match(/\b(?:next|show|give|list)\s+(\d+)\s+(?:upcoming\s+)?events?\b/);
  if (direct) return Number(direct[1]);

  const inverse = normalized.match(/\b(\d+)\s+(?:upcoming\s+)?events?\b/);
  if (inverse) return Number(inverse[1]);

  return null;
}

function parseRequestedFields(normalized) {
  const fields = [];
  const rules = [
    { key: "title", test: /\b(name|title|event name)\b/ },
    { key: "date", test: /\b(date|day)\b/ },
    { key: "time", test: /\b(time|timing|start time)\b/ },
    { key: "venue", test: /\b(venue|location|place)\b/ },
    { key: "description", test: /\b(description|details|about)\b/ },
    { key: "registrationLink", test: /\b(register|registration|link|url)\b/ },
  ];

  for (const rule of rules) {
    if (rule.test.test(normalized)) fields.push(rule.key);
  }
  return fields;
}

function toDetailRows(event, keys) {
  const mapping = {
    title: { label: "Event Name", value: event.title || "Will be released soon" },
    date: { label: "Date", value: event.dateText || "Will be released soon" },
    time: { label: "Time", value: event.time || "Will be released soon" },
    venue: { label: "Venue", value: event.venue || "Will be released soon" },
    description: { label: "Description", value: event.description || "Will be released soon" },
    registrationLink: {
      label: "Registration",
      value: event.registrationLink || "Will be released soon",
    },
  };
  return keys.map((k) => mapping[k]).filter(Boolean);
}

function buildUpcomingEventReply(normalized) {
  const { events } = readUpcomingEventsFromExcel();
  if (!events.length) {
    return {
      text: "Upcoming event details will be released soon. Please check again on iic-slc.live.",
      table: [],
      details: [],
    };
  }

  const upcoming = getUpcomingCandidates(events);
  const selected = upcoming[0];

  const requestedCount = parseRequestedCount(normalized);
  const requestedFields = parseRequestedFields(normalized);
  const asksAllDetails = /\b(all details|full details|complete details|upcoming event details)\b/.test(
    normalized
  );
  const asksMultiple = requestedCount !== null && requestedCount >= 2;

  if (asksMultiple) {
    const maxShown = 3;
    const rows = upcoming.slice(0, maxShown).map((event) => ({
      title: event.title || "Event",
      date: event.dateText || "TBA",
      time: event.time || "TBA",
      venue: event.venue || "TBA",
      description: event.description || "TBA",
    }));

    const askedMoreThanThree = requestedCount > maxShown;
    const text = askedMoreThanThree
      ? "Showing the next 3 upcoming events. More events will be released soon."
      : `Showing the next ${rows.length} upcoming event${rows.length > 1 ? "s" : ""}.`;

    return { text, table: rows, details: [] };
  }

  let detailKeys = [];
  if (asksAllDetails || requestedFields.length === 0) {
    detailKeys = ["title", "date", "time", "venue", "description"];
  } else {
    detailKeys = requestedFields;
  }

  const details = toDetailRows(selected, detailKeys);
  const text =
    detailKeys.length === 1
      ? `${details[0].label} for the next upcoming event: ${details[0].value}.`
      : "Here are the details for the next upcoming event.";

  return { text, table: [], details };
}

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // Basic topic filter to keep the bot focused strictly on IIC Shyam Lal College
    const lowerMessage = String(message).toLowerCase();
    const iicKeywords = [
      "iic",
      "innovation council",
      "institution's innovation council",
      "institutions innovation council",
      "shyam lal",
      "slc",
      "shyam lal college",
      // common IIC-related queries that users ask without saying "IIC"
      "innovation",
      "startup",
      "prototype",
      "ideathon",
      "webinar",
      "workshop",
      "event",
      "events",
      "team",
      "coordinator",
      "faculty",
      "collaboration",
      "sponsorship",
      "sponsor",
      "registration",
      "contact"
    ];

    const isIICRelated = iicKeywords.some((kw) => lowerMessage.includes(kw));

    if (!isIICRelated) {
      return NextResponse.json({
        response:
          "I can only answer questions about the Institution's Innovation Council (IIC) at Shyam Lal College, University of Delhi. Please ask an IIC-related question.",
        sources: [],
      });
    }

    const normalized = lowerMessage.replace(/\s+/g, " ").trim();
    if (
      normalized === "what is iic" ||
      normalized === "what is the iic" ||
      normalized === "iic full form" ||
      normalized === "full form of iic"
    ) {
      return NextResponse.json({
        response:
          "IIC (Institution's Innovation Council) at Shyam Lal College supports and guides students to turn innovative ideas into prototypes and contribute to India’s startup ecosystem.",
        sources: [],
      });
    }

    const isEventQuery = EVENT_QUERY_KEYWORDS.some((kw) => normalized.includes(kw));
    if (isEventQuery) {
      const eventReply = buildUpcomingEventReply(normalized);
      return NextResponse.json({
        response: eventReply.text,
        eventTable: eventReply.table,
        eventDetails: eventReply.details,
        sources: [],
      });
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: IIC_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
      },
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: OFFICIAL_IIC_CONTEXT }],
        },
        {
          role: "model",
          parts: [{ text: "Understood." }],
        },
      ],
    });

    // v-- YEH HAI FIX #1: Object ke bajaye seedha string 'message' bhej raha hai --v
    const result = await chat.sendMessage(message);
    
    // v-- YEH HAI FIX #2: response.text() ek function hai, isliye 'await' zaroori hai --v
    const responseText = await result.response.text();
    
    // Optional: Extract citations/sources from the grounding metadata
    // Grounding ke bina, 'sources' hamesha empty rahega
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
    const sources =
      groundingMetadata?.groundingChunks
        ?.map((chunk) => ({
          title: chunk.web?.title,
          uri: chunk.web?.uri,
        }))
        .filter((s) => s.uri) || [];

    // Return the response and sources
    return NextResponse.json({ 
      response: responseText, 
      sources: sources 
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
