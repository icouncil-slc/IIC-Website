'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, PlusCircle, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import RegistrationSubmissions from '@/components/RegistrationSubmissions';
import {
  defaultRegistrationFormConfig,
  normalizeRegistrationQuestion,
} from '@/lib/registrationFormDefaults';

function createQuestion(index) {
  return normalizeRegistrationQuestion(
    {
      id: `question_${index + 1}`,
      label: `New Question ${index + 1}`,
      type: 'text',
      required: false,
      placeholder: '',
      allowOther: false,
      options: [],
    },
    index
  );
}

export default function ManageRegistrationFormPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const canEdit = useMemo(() => {
    const role = session?.user?.role;
    if (role === 'Admin' || role === 'Moderator') return true;
    return Boolean(session?.user?.permissions?.registration_form);
  }, [session]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultRegistrationFormConfig);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin');
  }, [router, status]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/registration-form');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load settings');
        if (!cancelled) setForm({ ...defaultRegistrationFormConfig, ...data });
      } catch (error) {
        if (!cancelled) toast.error(error.message || 'Could not load registration settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateQuestion = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      extraQuestions: prev.extraQuestions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      ),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      extraQuestions: [...prev.extraQuestions, createQuestion(prev.extraQuestions.length)],
    }));
  };

  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      extraQuestions: prev.extraQuestions.filter((_, questionIndex) => questionIndex !== index),
    }));
  };

  const moveQuestion = (index, direction) => {
    setForm((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.extraQuestions.length) return prev;
      const next = [...prev.extraQuestions];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return { ...prev, extraQuestions: next };
    });
  };

  const addOption = (questionIndex) => {
    setForm((prev) => ({
      ...prev,
      extraQuestions: prev.extraQuestions.map((question, index) =>
        index === questionIndex
          ? { ...question, options: [...(question.options || []), `Option ${(question.options || []).length + 1}`] }
          : question
      ),
    }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setForm((prev) => ({
      ...prev,
      extraQuestions: prev.extraQuestions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: (question.options || []).map((option, currentIndex) =>
                currentIndex === optionIndex ? value : option
              ),
            }
          : question
      ),
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    setForm((prev) => ({
      ...prev,
      extraQuestions: prev.extraQuestions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: (question.options || []).filter((_, currentIndex) => currentIndex !== optionIndex),
            }
          : question
      ),
    }));
  };

  const save = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to update the registration form.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/registration-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setForm({ ...defaultRegistrationFormConfig, ...data });
      toast.success('Registration form settings saved.');
    } catch (error) {
      toast.error(error.message || 'Could not save registration form settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (status === 'authenticated' && !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-[#08246A]">Access Restricted</h1>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            You do not currently have permission to edit the registration form.
          </p>
          <Button className="mt-6" onClick={() => router.push('/admin')}>
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#08246A]">Registration Form Manager</h1>
            <p className="mt-1 text-sm text-gray-600">
              Update event details, WhatsApp CTA, and add extra questions without editing code.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Back
            </Button>
            <Button onClick={save} disabled={saving || !canEdit}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border p-5">
            <h2 className="text-lg font-semibold text-gray-800">Event Details</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="Event Title">
                <input value={form.eventTitle} onChange={(e) => updateField('eventTitle', e.target.value)} className={editorInputClass} />
              </EditorField>
              <EditorField label="Event Subtitle">
                <textarea
                  value={form.eventSubtitle}
                  onChange={(e) => updateField('eventSubtitle', e.target.value)}
                  className={`${editorInputClass} min-h-[90px]`}
                />
              </EditorField>
              <div className="grid gap-4 sm:grid-cols-3">
                <EditorField label="Date">
                  <input value={form.eventDate} onChange={(e) => updateField('eventDate', e.target.value)} className={editorInputClass} />
                </EditorField>
                <EditorField label="Time">
                  <input value={form.eventTime} onChange={(e) => updateField('eventTime', e.target.value)} className={editorInputClass} />
                </EditorField>
                <EditorField label="Mode">
                  <input value={form.eventMode} onChange={(e) => updateField('eventMode', e.target.value)} className={editorInputClass} />
                </EditorField>
              </div>
            </div>

            <h2 className="mt-8 text-lg font-semibold text-gray-800">Community Join Step</h2>
            <div className="mt-4 grid gap-4">
              <EditorField label="WhatsApp Link">
                <input
                  value={form.communityLink}
                  onChange={(e) => updateField('communityLink', e.target.value)}
                  className={editorInputClass}
                />
              </EditorField>
              <EditorField label="Button Label">
                <input
                  value={form.communityButtonLabel}
                  onChange={(e) => updateField('communityButtonLabel', e.target.value)}
                  className={editorInputClass}
                />
              </EditorField>
              <EditorField label="Join Instructions">
                <textarea
                  value={form.communityHelperText}
                  onChange={(e) => updateField('communityHelperText', e.target.value)}
                  className={`${editorInputClass} min-h-[90px]`}
                />
              </EditorField>
              <EditorField label="Form Note">
                <textarea
                  value={form.submitHelperText}
                  onChange={(e) => updateField('submitHelperText', e.target.value)}
                  className={`${editorInputClass} min-h-[90px]`}
                />
              </EditorField>
            </div>
          </div>

          <div className="rounded-2xl border p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Extra Questions</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Core fields stay fixed. Use this section to add more questions.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addQuestion}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {form.extraQuestions.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
                  No extra questions yet. Add one to collect more registration details.
                </div>
              ) : (
                form.extraQuestions.map((question, index) => (
                  <div key={`${question.id}-${index}`} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">Question {index + 1}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => moveQuestion(index, -1)} disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => moveQuestion(index, 1)}
                          disabled={index === form.extraQuestions.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <EditorField label="Question Label">
                        <input value={question.label} onChange={(e) => updateQuestion(index, { label: e.target.value })} className={editorInputClass} />
                      </EditorField>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <EditorField label="Question ID">
                          <input value={question.id} onChange={(e) => updateQuestion(index, { id: e.target.value })} className={editorInputClass} />
                        </EditorField>
                        <EditorField label="Field Type">
                          <select
                            value={question.type}
                            onChange={(e) =>
                              updateQuestion(index, {
                                type: e.target.value,
                                options:
                                  e.target.value === 'select' || e.target.value === 'radio'
                                    ? question.options?.length
                                      ? question.options
                                      : ['Option 1', 'Option 2']
                                    : [],
                              })
                            }
                            className={editorInputClass}
                          >
                            <option value="text">Short text</option>
                            <option value="textarea">Paragraph</option>
                            <option value="select">Dropdown</option>
                            <option value="radio">Multiple choice</option>
                          </select>
                        </EditorField>
                      </div>
                      <EditorField label="Placeholder">
                        <input
                          value={question.placeholder}
                          onChange={(e) => updateQuestion(index, { placeholder: e.target.value })}
                          className={editorInputClass}
                        />
                      </EditorField>
                      {(question.type === 'select' || question.type === 'radio') && (
                        <EditorField label="Options">
                          <div className="space-y-3">
                            {(question.options || []).map((option, optionIndex) => (
                              <div key={`${question.id}-option-${optionIndex}`} className="flex gap-2">
                                <input
                                  value={option}
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                  className={editorInputClass}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeOption(index, optionIndex)}
                                  className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => addOption(index)}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add Option
                            </Button>
                          </div>
                        </EditorField>
                      )}
                      {(question.type === 'select' || question.type === 'radio') && (
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={question.allowOther}
                            onChange={(e) => updateQuestion(index, { allowOther: e.target.checked })}
                            className="h-4 w-4"
                          />
                          Allow an "Other" text input
                        </label>
                      )}
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                          className="h-4 w-4"
                        />
                        Required question
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <RegistrationSubmissions />
      </div>
    </div>
  );
}

function EditorField({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

const editorInputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200';
