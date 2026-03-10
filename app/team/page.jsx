import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import TeamSection from "@/components/TeamSection";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getRoleSorter(roleOrder) {
  const roleIndex = (role) => {
    const index = roleOrder.indexOf(role);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  return (a, b) => {
    const roleDiff = roleIndex(a.role) - roleIndex(b.role);
    if (roleDiff !== 0) return roleDiff;

    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;

    return (a.name || "").localeCompare(b.name || "");
  };
}

async function getTeamData() {
  try {
    noStore();
    await dbConnect();

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

    const members = await TeamMember.find({
      $or: [{ isDepartmentHead: true }, { birthdayActive: true }],
    }).lean();

    const faculty = members
      .filter((member) => member.category === "Faculty")
      .sort(getRoleSorter(facultyRoleOrder));

    const students = members
      .filter((member) => member.category === "Student")
      .sort(getRoleSorter(studentRoleOrder));

    return {
      faculty: JSON.parse(JSON.stringify(faculty)),
      students: JSON.parse(JSON.stringify(students)),
    };
  } catch (error) {
    console.error("Error fetching team data:", error);
    return { faculty: [], students: [] };
  }
}

const TeamPage = async () => {
  const teamData = await getTeamData();

  return (
    <main>
      <Hero
        title="Meet Our"
        subtitle="Driving innovation with leadership, passion, and collaboration"
        sec_title="Team Council"
        sec_sub="Shyam Lal College : University of Delhi"
        btn1=""
        btn2=""
        image="/assets/teams.png"
      />

      <AnimatedSection delay={0.2}>
        <TeamSection teamData={teamData} />
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <Footer />
      </AnimatedSection>
    </main>
  );
};

export default TeamPage;
