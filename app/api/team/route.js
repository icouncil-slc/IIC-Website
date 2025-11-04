import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// GET (Public): Fetches leadership team members, sorted by a specific role hierarchy
export async function GET() {
  try {
    await dbConnect();

    // Define the specific leadership roles we want to display on the main team page
    const facultyRoleOrder = ["IIC, SLC Principal", "Convener"];
    const studentRoleOrder = [
      "President",
      "Coordinator",
      "Secretary",
      "Treasurer",
      "Marketing Head",
      "PR Head",
      "Content Head",
      "Event Manegement Head", 
      "Graphic Head", 
      "Technical Head"];

    const leadershipRoles = [...facultyRoleOrder, ...studentRoleOrder];

    // Fetch only the members who have one of the leadership roles
    const members = await TeamMember.find({ 'role': { $in: leadershipRoles } });

    // Custom sort logic based on the predefined order
    const customSort = (roleOrder) => (a, b) => {
      const indexA = roleOrder.indexOf(a.role);
      const indexB = roleOrder.indexOf(b.role);
      return indexA - indexB;
    };

    const faculty = members.filter(m => m.category === 'Faculty').sort(customSort(facultyRoleOrder));
    const students = members.filter(m => m.category === 'Student').sort(customSort(studentRoleOrder));
    
    return NextResponse.json({ faculty, students });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team members." }, { status: 500 });
  }
}

// POST (Protected): Creates a new team member
export async function POST(req) {
  const session = await getServerSession(authOptions);
  const authorizedRoles = ['Admin', 'Moderator'];
  if (!session || !authorizedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    const newMember = await TeamMember.create({
      name: body.name,
      role: body.role,
      image: body.image,
      category: body.category,
      departmentSlug: body.departmentSlug,
      linkedin: body.linkedin,
      instagram: body.instagram,
      order: body.order,
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team member." }, { status: 400 });
  }
}

