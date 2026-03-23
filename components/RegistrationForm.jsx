'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { defaultRegistrationFormConfig } from '@/lib/registrationFormDefaults';

const yearOptions = ['1', '2', '3', '4'];
const collegeOptions = [
  {
    value: 'Shyam Lal College (University of Delhi)',
    label: 'Shyam Lal College (University of Delhi)',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

const initialForm = {
  name: '',
  email: '',
  mobile: '',
  course: '',
  year: '',
  college: 'Shyam Lal College (University of Delhi)',
  otherCollege: '',
};

export default function RegistrationForm({ config = defaultRegistrationFormConfig, eventId = '' }) {
  const [form, setForm] = useState(initialForm);
  const [customAnswers, setCustomAnswers] = useState(() => buildInitialAnswers(config.extraQuestions));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [communityJoined, setCommunityJoined] = useState(false);

  useEffect(() => {
    setCustomAnswers(buildInitialAnswers(config.extraQuestions));
  }, [config]);

  const selectedCollege = useMemo(() => {
    return form.college === 'other' ? form.otherCollege.trim() : form.college;
  }, [form.college, form.otherCollege]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomAnswerChange = (questionId, value) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { value: '', otherValue: '' }),
        value,
      },
    }));
  };

  const handleCustomOtherChange = (questionId, value) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { value: '', otherValue: '' }),
        otherValue: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!communityJoined) {
      toast.error('Please join the WhatsApp community before submitting the form.');
      return;
    }

    if (form.college === 'other' && !form.otherCollege.trim()) {
      toast.error('Please enter your college name.');
      return;
    }

    for (const question of config.extraQuestions || []) {
      const answer = customAnswers[question.id];
      const selectedValue = answer?.value || '';
      const usesOther = question.allowOther && selectedValue === '__other__';
      const resolvedValue = usesOther ? (answer?.otherValue || '').trim() : selectedValue.trim();

      if (question.required && !resolvedValue) {
        toast.error(`Please complete "${question.label}".`);
        return;
      }
    }

    setLoading(true);

    try {
      const additionalResponses = (config.extraQuestions || []).map((question) => {
        const answer = customAnswers[question.id] || { value: '', otherValue: '' };
        const usesOther = question.allowOther && answer.value === '__other__';

        return {
          id: question.id,
          label: question.label,
          value: usesOther ? answer.otherValue.trim() : answer.value.trim(),
        };
      });

      const payload = {
        type: 'registration',
        name: form.name.trim(),
        email: form.email.trim(),
        message: `Registration for ${config.eventTitle}`,
        extra: {
          eventId,
          mobile: form.mobile.trim(),
          course: form.course.trim(),
          year: form.year,
          college: selectedCollege,
          communityJoined,
          eventTitle: config.eventTitle,
          additionalResponses,
        },
      };

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to submit registration');
      }

      setDone(true);
      setForm(initialForm);
      setCustomAnswers(buildInitialAnswers(config.extraQuestions));
      setCommunityJoined(false);
      toast.success('Registration submitted successfully.');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-[28px] border border-orange-100 bg-white p-8 shadow-[0_24px_80px_rgba(1,35,86,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">Registration Complete</p>
        <h3 className="mt-3 text-2xl font-bold text-[#012356]">Your details have been recorded.</h3>
        <p className="mt-3 text-base leading-7 text-slate-600">
          We have saved your registration and added it to the submissions sheet. Our team will contact you if any
          follow-up is needed.
        </p>
        <Button
          type="button"
          onClick={() => {
            setDone(false);
            setCustomAnswers(buildInitialAnswers(config.extraQuestions));
          }}
          className="mt-6 bg-[#012356] px-6 py-5 text-white hover:bg-[#0a2f73]"
        >
          Submit another response
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-[0_24px_80px_rgba(1,35,86,0.08)] sm:p-8"
    >
      <div className="mb-8 flex flex-col gap-3 border-b border-orange-100 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">Student Registration</p>
        <h2 className="text-3xl font-bold text-[#012356]">Fill in your details</h2>
        <p className="max-w-2xl text-sm leading-7 text-slate-600">{config.submitHelperText}</p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-base font-semibold text-[#012356]">Step 1: Join the community</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{config.communityHelperText}</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={config.communityLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1fb85a]"
            >
              {config.communityButtonLabel}
            </Link>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={communityJoined}
                onChange={(event) => setCommunityJoined(event.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
              I have joined the WhatsApp community
            </label>
          </div>
        </div>

        <Field label="Name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
            className={inputClassName}
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Enter your email address"
            className={inputClassName}
          />
        </Field>

        <Field label="Mobile No." htmlFor="mobile">
          <input
            id="mobile"
            name="mobile"
            type="tel"
            value={form.mobile}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            inputMode="numeric"
            placeholder="Enter your 10-digit mobile number"
            className={inputClassName}
          />
        </Field>

        <Field label="Course" htmlFor="course">
          <input
            id="course"
            name="course"
            type="text"
            value={form.course}
            onChange={handleChange}
            required
            placeholder="Enter your course"
            className={inputClassName}
          />
        </Field>

        <fieldset className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <legend className="px-2 text-base font-semibold text-[#012356]">Year *</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {yearOptions.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  form.year === option
                    ? 'border-orange-400 bg-orange-50 text-[#012356]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'
                }`}
              >
                <input
                  type="radio"
                  name="year"
                  value={option}
                  checked={form.year === option}
                  onChange={handleChange}
                  required
                  className="h-4 w-4 accent-orange-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <legend className="px-2 text-base font-semibold text-[#012356]">College *</legend>
          <div className="mt-2 space-y-4">
            {collegeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                  form.college === option.value
                    ? 'border-orange-400 bg-orange-50 text-[#012356]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'
                }`}
              >
                <input
                  type="radio"
                  name="college"
                  value={option.value}
                  checked={form.college === option.value}
                  onChange={handleChange}
                  required
                  className="mt-0.5 h-4 w-4 accent-orange-500"
                />
                <div className="w-full">
                  <span className="font-medium">{option.label}</span>
                  {option.value === 'other' && form.college === 'other' ? (
                    <input
                      id="otherCollege"
                      name="otherCollege"
                      type="text"
                      value={form.otherCollege}
                      onChange={handleChange}
                      placeholder="Enter your college name"
                      className={`${inputClassName} mt-3`}
                    />
                  ) : null}
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {(config.extraQuestions || []).map((question) => {
          const answer = customAnswers[question.id] || { value: '', otherValue: '' };
          const usesOther = question.allowOther && answer.value === '__other__';

          if (question.type === 'textarea') {
            return (
              <Field key={question.id} label={question.label} htmlFor={question.id} required={question.required}>
                <textarea
                  id={question.id}
                  value={answer.value}
                  onChange={(event) => handleCustomAnswerChange(question.id, event.target.value)}
                  rows={4}
                  placeholder={question.placeholder || 'Write your answer'}
                  className={`${inputClassName} resize-y`}
                />
              </Field>
            );
          }

          if (question.type === 'select') {
            return (
              <Field key={question.id} label={question.label} htmlFor={question.id} required={question.required}>
                <div className="space-y-3">
                  <select
                    id={question.id}
                    value={answer.value}
                    onChange={(event) => handleCustomAnswerChange(question.id, event.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Select an option</option>
                    {question.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    {question.allowOther ? <option value="__other__">Other</option> : null}
                  </select>
                  {usesOther ? (
                    <input
                      type="text"
                      value={answer.otherValue}
                      onChange={(event) => handleCustomOtherChange(question.id, event.target.value)}
                      placeholder="Enter your answer"
                      className={inputClassName}
                    />
                  ) : null}
                </div>
              </Field>
            );
          }

          if (question.type === 'radio') {
            return (
              <fieldset key={question.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <legend className="px-2 text-base font-semibold text-[#012356]">
                  {question.label}
                  {question.required ? ' *' : ''}
                </legend>
                <div className="mt-2 space-y-3">
                  {question.options.map((option) => (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                        answer.value === option
                          ? 'border-orange-400 bg-orange-50 text-[#012356]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answer.value === option}
                        onChange={(event) => handleCustomAnswerChange(question.id, event.target.value)}
                        className="h-4 w-4 accent-orange-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {question.allowOther ? (
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                        answer.value === '__other__'
                          ? 'border-orange-400 bg-orange-50 text-[#012356]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value="__other__"
                        checked={answer.value === '__other__'}
                        onChange={(event) => handleCustomAnswerChange(question.id, event.target.value)}
                        className="mt-1 h-4 w-4 accent-orange-500"
                      />
                      <div className="w-full">
                        <span>Other</span>
                        {usesOther ? (
                          <input
                            type="text"
                            value={answer.otherValue}
                            onChange={(event) => handleCustomOtherChange(question.id, event.target.value)}
                            placeholder="Enter your answer"
                            className={`${inputClassName} mt-3`}
                          />
                        ) : null}
                      </div>
                    </label>
                  ) : null}
                </div>
              </fieldset>
            );
          }

          return (
            <Field key={question.id} label={question.label} htmlFor={question.id} required={question.required}>
              <input
                id={question.id}
                type="text"
                value={answer.value}
                onChange={(event) => handleCustomAnswerChange(question.id, event.target.value)}
                placeholder={question.placeholder || 'Enter your answer'}
                className={inputClassName}
              />
            </Field>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-orange-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Your response will be stored for internal registration records.</p>
        <Button
          type="submit"
          disabled={loading}
          className="bg-orange-500 px-8 py-6 text-white hover:bg-orange-600 sm:min-w-[190px]"
        >
          {loading ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children, required = true }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
      <label htmlFor={htmlFor} className="mb-3 block text-base font-semibold text-[#012356]">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100';

function buildInitialAnswers(questions = []) {
  return questions.reduce((acc, question) => {
    acc[question.id] = { value: '', otherValue: '' };
    return acc;
  }, {});
}
