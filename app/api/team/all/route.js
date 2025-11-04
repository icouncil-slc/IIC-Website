import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// Helper function to check for authorized roles
async function isAuthorized(session) {
  const authorizedRoles = ['Admin', 'Moderator'];
  return session && authorizedRoles.includes(session.user.role);
}

// Yeh endpoint sirf Admin aur Moderator roles ke liye hai
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!await isAuthorized(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await dbConnect();
    
    // Sabhi team members ko fetch karega
    const members = await TeamMember.find({});

    // Roles ko sort karne ke liye wahi custom order istemal karega
    const roleOrder = {
      "IIC, SLC Principal": 1, "Convener": 2, "President": 3, "Coordinator": 4,
      "Outreach Coordinator": 5, "Innovation Activity Coordinator": 6, "Secretary": 7,
      "Treasurer": 8, "Marketing And PR Head": 9, "Content Head": 10,
      "Event Management Head": 11, "Graphic's and Design Head": 12, "Technical Head": 13,
    };

    members.sort((a, b) => {
      const orderA = roleOrder[a.role] || 99;
      const orderB = roleOrder[b.role] || 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Agar role same hai, to naam se sort karega
      return a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team members." }, { status: 500 });
  }
}

// PUT (Protected): Ek team member ko ID se update karega
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!await isAuthorized(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { id, ...updateData } = body; // 'id' ko body se nikal lenge

    if (!id) {
      return NextResponse.json({ error: "Member ID is required for update." }, { status: 400 });
    }

    const updatedMember = await TeamMember.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedMember) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update member." }, { status: 400 });
  }
}

// DELETE (Protected): Ek team member ko ID se delete karega
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!await isAuthorized(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Member ID is required." }, { status: 400 });
    }

    await dbConnect();
    
    const deletedMember = await TeamMember.findByIdAndDelete(id);

    if (!deletedMember) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Member deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete member." }, { status: 500 });
  }
}

