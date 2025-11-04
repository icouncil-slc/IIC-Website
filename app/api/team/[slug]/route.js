import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";

// GET (Public): Ek specific department ke saare members ko fetch karega
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: "Department slug is required." }, { status: 400 });
    }

    // Pehle department head ko dhoondhenge
    const head = await TeamMember.findOne({ departmentSlug: slug });

    if (!head) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    // Us department ke saare members ko dhoondhenge (head ko chhodkar)
    const members = await TeamMember.find({ 
      departmentSlug: slug, 
      _id: { $ne: head._id } // Exclude the head from the members list
    }).sort({ createdAt: 1 }); // Sort by joining date

    return NextResponse.json({ head, members });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch department members." }, { status: 500 });
  }
}
