import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// GET (Public): Fetches leadership team members, sorted by a specific role hierarchy
export async function GET() {
  try {
    await dbConnect();

    // Define the preferred leadership role order (used for sorting, not filtering)
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
      "Graphics Head",
      "Technical Head",
    ];

    const roleIndex = (roleOrder, role) => {
      const index = roleOrder.indexOf(role);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    const sortByRoleAndOrder = (roleOrder) => (a, b) => {
      const roleDiff = roleIndex(roleOrder, a.role) - roleIndex(roleOrder, b.role);
      if (roleDiff !== 0) return roleDiff;
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return (a.name || "").localeCompare(b.name || "");
    };

    // Show department heads in the council sections, and also include
    // birthday spotlight members even if they are not department heads.
    const members = await TeamMember.find({
      $or: [{ isDepartmentHead: true }, { birthdayActive: true }],
    });

    const faculty = members
      .filter((m) => m.category === "Faculty")
      .sort(sortByRoleAndOrder(facultyRoleOrder));
    const students = members
      .filter((m) => m.category === "Student")
      .sort(sortByRoleAndOrder(studentRoleOrder));
    
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
      isDepartmentHead: body.isDepartmentHead === true,
      linkedin: body.linkedin,
      instagram: body.instagram,
      birthdayActive: body.birthdayActive === true,
      birthdayDate: body.birthdayDate || null,
      order: body.order,
    });

    revalidatePath("/team");

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team member." }, { status: 400 });
  }
}

