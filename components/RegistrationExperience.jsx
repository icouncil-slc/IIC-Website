'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import RegistrationForm from '@/components/RegistrationForm';
import { defaultRegistrationFormConfig } from '@/lib/registrationFormDefaults';

export default function RegistrationExperience() {
  const [config, setConfig] = useState(defaultRegistrationFormConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/registration-form');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load registration settings');
        }
        if (!cancelled) {
          setConfig({ ...defaultRegistrationFormConfig, ...data });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Could not load registration settings.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_30%,#f8fbff_100%)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-[32px] bg-white p-12 shadow-[0_24px_80px_rgba(1,35,86,0.08)]">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#012356]" />
          <span className="text-sm font-medium text-slate-600">Loading registration form...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_30%,#f8fbff_100%)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="absolute left-0 top-10 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="absolute right-0 top-32 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="rounded-[32px] bg-[#012356] p-8 text-white shadow-[0_24px_80px_rgba(1,35,86,0.24)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">IIC SLC</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">{config.eventTitle}</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-orange-200">{config.eventSubtitle}</p>
          <div className="mt-8 space-y-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <span className="font-semibold text-white">Date:</span> {config.eventDate}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <span className="font-semibold text-white">Time:</span> {config.eventTime}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <span className="font-semibold text-white">Mode:</span> {config.eventMode}
            </div>
          </div>
        </div>

        <RegistrationForm config={config} />
      </div>
    </section>
  );
}
