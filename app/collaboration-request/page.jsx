// app/collaboration-request/page.jsx
import CTAForm from '@/components/CTAForm';
import AnimatedSection from '@/components/AnimatedSection';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';

export default function Page() {
  return (
    <main>
      <Hero
        title="Request Collaboration"
        subtitle="Work with IIC SLC"
        sec_title="Collaborate With Us"
        sec_sub="Tell us how we can work together"
        btn1="Back"
        btn2="Contact"
        image="/assets/collaborate.png"
      />
      <AnimatedSection>
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Request Collaboration</h2>
          <CTAForm type="collaboration" />
        </div>
      </AnimatedSection>
      <Footer />
    </main>
  );
}
