import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import TeamSection from "@/components/TeamSection";

// This function fetches the team data on the server before the page loads.
async function getTeamData() {
  try {
    // We use an absolute URL for server-side fetching.
    // Ensure NEXT_PUBLIC_BASE_URL is set in your .env.local
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/team`, {
      next: { revalidate: 3600 }, // Re-fetch data every hour
    });
    if (!res.ok) {
      throw new Error("Failed to fetch team data");
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching team data:", error);
    // Return empty arrays so the page doesn't crash on an error
    return { faculty: [], students: [] };
  }
}

// The page is now an async Server Component
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
        {/* We pass the fetched data down to the client component as a prop */}
        <TeamSection teamData={teamData} />
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <Footer />
      </AnimatedSection>
    </main>
  );
};

export default TeamPage;
