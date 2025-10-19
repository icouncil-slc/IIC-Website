import AnimatedSection from "@/components/AnimatedSection";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import TeamSection from "@/components/TeamSection";

const page = () => {
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
        <TeamSection />
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <Footer />
      </AnimatedSection>
    </main>
  );
};

export default page;
