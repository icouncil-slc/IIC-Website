import AnimatedSection from '@/components/AnimatedSection';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import RegistrationExperience from '@/components/RegistrationExperience';

export const metadata = {
  title: 'Register | IIC Shyam Lal College',
  description: 'Register with IIC Shyam Lal College using the student registration form.',
};

export default function RegisterPage() {
  return (
    <main>
      <Hero
        title="Join The IIC Network"
        subtitle="Student Registration"
        sec_title="Register With Us"
        sec_sub="Share your academic details and become part of upcoming opportunities"
        image="/assets/hero2.png"
      />

      <AnimatedSection>
        <RegistrationExperience />
      </AnimatedSection>

      <Footer />
    </main>
  );
}
