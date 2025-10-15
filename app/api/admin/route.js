import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// Helper function to check if the logged-in user is an admin
async function isAdminSession(session) {
  return session?.user?.role === 'Admin';
}

// GET: Fetch ALL users for the admin dashboard
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!await isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await dbConnect();
    // This now fetches all users so the admin can manage them
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Add or update a user with a role and permissions
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!await isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await dbConnect();
    // Now accepts 'role' from the frontend
    const { email, permissions, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Missing email or role" }, { status: 400 });
    }

    // Creates a new user or updates an existing one with the new role and permissions
    await User.findOneAndUpdate(
      { email },
      { email, role, permissions },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ message: "Member updated successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE: Remove a member from the database
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!await isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { memberEmail } = await req.json();
    if (!memberEmail) {
      return NextResponse.json({ error: "Missing memberEmail" }, { status: 400 });
    }
    
    // Safety check: Admins cannot delete their own account.
    if (memberEmail === session.user.email) {
      return NextResponse.json({ error: "Admin cannot delete their own account." }, { status: 400 });
    }

    // Deletes the user document directly from the User collection
    await User.deleteOne({ email: memberEmail });
    
    return NextResponse.json({ message: "Member deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
