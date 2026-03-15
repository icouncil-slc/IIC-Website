import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/mongodb";
import EventRegistration from "@/models/EventRegistration";
import { authOptions } from "../../auth/[...nextauth]/route";

function canAccessRegistrations(session) {
  if (!session?.user?.email) return false;

  const authorizedRoles = ["Admin", "Moderator"];
  return (
    authorizedRoles.includes(session.user.role) ||
    Boolean(session.user.permissions?.registration_form)
  );
}

function buildRegistrationRows(registrations) {
  return registrations.map((registration) => {
    const extra = registration.extra || {};
    const row = {
      Name: registration.name || "",
      Email: registration.email || "",
      "Mobile No.": extra.mobile || "",
      Course: extra.course || "",
      Year: extra.year || "",
      College: extra.college || "",
      Event: extra.eventTitle || "",
      "Community Joined": extra.communityJoined ? "Yes" : "No",
      Message: registration.message || "",
      Type: registration.type || "registration",
      SubmittedAt: registration.createdAt
        ? new Date(registration.createdAt).toISOString()
        : "",
    };

    if (Array.isArray(extra.additionalResponses)) {
      for (const response of extra.additionalResponses) {
        const label =
          typeof response?.label === "string" && response.label.trim()
            ? response.label.trim()
            : typeof response?.id === "string" && response.id.trim()
              ? response.id.trim()
              : "Additional Response";

        row[label] = typeof response?.value === "string" ? response.value : "";
      }
    }

    return row;
  });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!canAccessRegistrations(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await dbConnect();

    const registrations = await EventRegistration.find({})
      .sort({ createdAt: -1 })
      .lean();

    const { searchParams } = new URL(req.url);
    const shouldExport = searchParams.get("export") === "xlsx";

    if (shouldExport) {
      const rows = buildRegistrationRows(registrations);
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(rows);

      XLSX.utils.book_append_sheet(workbook, sheet, "Registrations");

      const workbookBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      return new NextResponse(workbookBuffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition":
            'attachment; filename="registration-submissions.xlsx"',
        },
      });
    }

    return NextResponse.json(
      {
        registrations: registrations.map((registration) => ({
          _id: registration._id,
          name: registration.name || "",
          email: registration.email || "",
          message: registration.message || "",
          createdAt: registration.createdAt,
          extra: registration.extra || {},
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration admin API error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
