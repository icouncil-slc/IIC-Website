// app/submit-proposal/page.jsx
import CTAForm from '@/components/CTAForm';
import AnimatedSection from '@/components/AnimatedSection';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';

export default function Page() {
  return (
    <main>
      <Hero
        title="Submit Event Proposal"
        subtitle="Propose an event or workshop"
        sec_title="Event Proposal"
        sec_sub="We will review and get back to you"
        btn1="Back"
        btn2="Events"
        image="/assets/submit-proposal.png"
      />
      <AnimatedSection>
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Submit Event Proposal</h2>
          <CTAForm type="proposal" />
        </div>
      </AnimatedSection>
      <Footer />
    </main>
  );
}
