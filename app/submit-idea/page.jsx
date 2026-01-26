// app/submit-idea/page.jsx
import CTAForm from '@/components/CTAForm';
import AnimatedSection from '@/components/AnimatedSection';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';

export default function Page() {
  return (
    <main>
      <Hero
        title="Share Your Idea"
        subtitle="We want to hear about your innovation"
        sec_title="Submit Your Idea"
        sec_sub="Our team will review and connect with you"
        btn1="Back to Home"
        btn2="View Events"
        image="/assets/submit-proposal.png"
      />
      <AnimatedSection>
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Submit Your Idea</h2>
          <CTAForm type="idea" />
        </div>
      </AnimatedSection>
      <Footer />
    </main>
  );
}
