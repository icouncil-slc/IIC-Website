import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import AnimatedSection from "@/components/AnimatedSection";
import MissionVision from "@/components/MissionVision";
import Timeline from "@/components/Timeline";
import SuccessStories from "@/components/SucessStories";

const page = () => {
  return (
    <main>
      <Hero
        title="About Institution's"
        subtitle="Nurturing Creativity, Empowering Innovation"
        sec_title="Institution's Council"
        sec_sub="Shyam Lal College : University of Delhi"
        btn1="Join the Movement"
        btn2="Explore Events"
        image="/assets/hero2.png"
      />

      <AnimatedSection delay={0.2}>
        <MissionVision />
      </AnimatedSection>
      <AnimatedSection delay={0.3}>
        <Timeline />
      </AnimatedSection>

      {/* <AnimatedSection delay={0.35}>
        <SuccessStories />
      </AnimatedSection> */}

      <AnimatedSection delay={0.4}>
        <CTA
          heading_1="Join us in building the future of innovation"
          heading_2="Have an Idea? Let's Turn it Into a Startup!"
          btn_1="Get Involved"
          btn_2="Submit"
          img_1="https://lottie.host/9d6cf24a-f6fd-4161-8e00-5fe38c976b9b/Px9Fb3j4l0.lottie"
          img_2="https://lottie.host/3bb1c7f4-9bab-4d16-84f8-343de72d9e4a/BSeDubxkFw.lottie"
        />
      </AnimatedSection>

      <Footer />
    </main>
  );
};

export default page;
