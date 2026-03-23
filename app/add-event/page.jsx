"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useEdgeStore } from "@/lib/edgestore";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { defaultRegistrationFormConfig } from "@/lib/registrationFormDefaults";
import { toast } from "sonner";

const registrationModes = [
  { value: "internal", label: "Website registration form" },
  { value: "external", label: "External Google Form link" },
  { value: "none", label: "No registration button" },
];

export default function AddEventPage() {
  const router = useRouter();
  const { edgestore } = useEdgeStore();

  const [form, setForm] = useState({
    title: "",
    primaryImage: "",
    secondaryImage: "",
    date: null,
    time: "",
    prize: "",
    googleFormLink: "",
    registrationType: "internal",
    category: "",
    description: "",
    timeline: [""],
    contacts: [""],
    pdf: "",
    formConfig: {
      eventSubtitle: "",
      eventMode: defaultRegistrationFormConfig.eventMode,
      communityLink: defaultRegistrationFormConfig.communityLink,
      communityButtonLabel: defaultRegistrationFormConfig.communityButtonLabel,
      communityHelperText: defaultRegistrationFormConfig.communityHelperText,
      submitHelperText: defaultRegistrationFormConfig.submitHelperText,
    },
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [deletingEventId, setDeletingEventId] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const res = await fetch("/api/events?all=1");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load events");
      }

      const allEvents = [...(data.upcoming || []), ...(data.past || [])].sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
      );
      setEvents(allEvents);
    } catch (error) {
      toast.error(error.message || "Could not load events.");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormConfigChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      formConfig: {
        ...prev.formConfig,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.date) {
        throw new Error("Please select an event date.");
      }

      const parsedTime = parseEventTime(form.time);
      if (!parsedTime) {
        throw new Error("Time is invalid. Please use a valid time.");
      }

      const localDateTime = new Date(form.date);
      localDateTime.setHours(parsedTime.hours);
      localDateTime.setMinutes(parsedTime.minutes);
      localDateTime.setSeconds(0);
      localDateTime.setMilliseconds(0);

      const payload = {
        ...form,
        date: localDateTime.toISOString(),
        timeline: form.timeline.join("\n"),
        contacts: form.contacts.join("\n"),
        googleFormLink: form.registrationType === "external" ? form.googleFormLink : "",
      };

      if (form.registrationType === "internal") {
        payload.formConfig = {
          ...form.formConfig,
          eventTitle: form.title,
          eventDate: form.date ? format(form.date, "dd/MM/yyyy") : "",
          eventTime: form.time,
        };
      } else {
        delete payload.formConfig;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to add event");
      }

      toast.success("Event added successfully.");
      await fetchEvents();
      router.push("/admin");
    } catch (error) {
      toast.error(error.message || "Failed to add event");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    const confirmed = window.confirm(`Delete "${eventTitle}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingEventId(eventId);
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete event");
      }

      setEvents((prev) => prev.filter((event) => event._id !== eventId));
      toast.success("Event deleted successfully.");
    } catch (error) {
      toast.error(error.message || "Could not delete event.");
    } finally {
      setDeletingEventId("");
    }
  };

  const handlePDFUpload = async (file) => {
    const res = await edgestore.pdfs.upload({
      file,
      onProgressChange: (progress) => {
        console.log("Progress:", progress);
      },
    });

    setForm((prev) => ({
      ...prev,
      pdf: res.url,
      pdfFilename: file.name,
    }));
  };

  const handleImageUpload = async (file, fieldName) => {
    const res = await edgestore.publicFiles.upload({
      file,
      onProgressChange: (progress) => {
        console.log("Progress:", progress);
      },
    });

    setForm((prev) => ({
      ...prev,
      [fieldName]: res.url,
    }));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Add New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {["title", "prize", "description", "category"].map((field) => (
          <div key={field} className="space-y-1">
            <label className="text-sm font-medium text-gray-700 capitalize">{field}</label>
            <textarea
              name={field}
              placeholder={`Enter ${field}`}
              value={form[field]}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              rows={field === "description" ? 4 : 2}
              required
            />
          </div>
        ))}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Time</label>
          <input
            name="time"
            type="time"
            value={form.time}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            required
          />
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Registration Setup</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose how users should register for this event.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Registration Type</label>
            <select
              name="registrationType"
              value={form.registrationType}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            >
              {registrationModes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {form.registrationType === "external" ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Google Form Link</label>
              <input
                name="googleFormLink"
                type="url"
                placeholder="https://forms.google.com/..."
                value={form.googleFormLink}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                required
              />
            </div>
          ) : null}

          {form.registrationType === "internal" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Form Subtitle</label>
                <textarea
                  name="eventSubtitle"
                  value={form.formConfig.eventSubtitle}
                  onChange={handleFormConfigChange}
                  placeholder="Add a short subtitle for the registration page"
                  rows={3}
                  className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Event Mode</label>
                <input
                  name="eventMode"
                  value={form.formConfig.eventMode}
                  onChange={handleFormConfigChange}
                  placeholder="Online / Offline / Hybrid"
                  className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Community Link</label>
                <input
                  name="communityLink"
                  type="url"
                  value={form.formConfig.communityLink}
                  onChange={handleFormConfigChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Community Button Label</label>
                <input
                  name="communityButtonLabel"
                  value={form.formConfig.communityButtonLabel}
                  onChange={handleFormConfigChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Community Helper Text</label>
                <textarea
                  name="communityHelperText"
                  value={form.formConfig.communityHelperText}
                  onChange={handleFormConfigChange}
                  rows={3}
                  className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Submit Helper Text</label>
                <textarea
                  name="submitHelperText"
                  value={form.formConfig.submitHelperText}
                  onChange={handleFormConfigChange}
                  rows={3}
                  className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Primary Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "primaryImage");
            }}
            className="block w-full border border-gray-300 px-4 py-2 rounded-md"
            required={!form.primaryImage}
          />
          {form.primaryImage ? (
            <p className="text-xs text-green-600 mt-1">
              Image uploaded:{" "}
              <a href={form.primaryImage} target="_blank" rel="noopener noreferrer" className="underline">
                View primary image
              </a>
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Secondary Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "secondaryImage");
            }}
            className="block w-full border border-gray-300 px-4 py-2 rounded-md"
          />
          {form.secondaryImage ? (
            <p className="text-xs text-green-600 mt-1">
              Image uploaded:{" "}
              <a href={form.secondaryImage} target="_blank" rel="noopener noreferrer" className="underline">
                View secondary image
              </a>
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Timeline</label>
          {form.timeline.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...form.timeline];
                  updated[index] = e.target.value;
                  setForm((prev) => ({ ...prev, timeline: updated }));
                }}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder={`Timeline stage ${index + 1}`}
                required
              />
              {form.timeline.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.timeline.filter((_, i) => i !== index);
                    setForm((prev) => ({ ...prev, timeline: updated }));
                  }}
                  className="p-2 text-red-500 hover:text-red-700 transition"
                >
                  x
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, timeline: [...prev.timeline, ""] }))}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center mt-2"
          >
            <span className="mr-1">+</span> Add Timeline Stage
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Contacts</label>
          {form.contacts.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const updated = [...form.contacts];
                  updated[index] = e.target.value;
                  setForm((prev) => ({ ...prev, contacts: updated }));
                }}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder={`Contact ${index + 1}`}
                required
              />
              {form.contacts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.contacts.filter((_, i) => i !== index);
                    setForm((prev) => ({ ...prev, contacts: updated }));
                  }}
                  className="p-2 text-red-500 hover:text-red-700 transition"
                >
                  x
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, contacts: [...prev.contacts, ""] }))}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center mt-2"
          >
            <span className="mr-1">+</span> Add Contact
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Event Date</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50",
                  !form.date && "text-gray-400"
                )}
              >
                {form.date ? format(form.date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white text-black shadow-lg rounded-md border border-gray-200"
              align="start"
            >
              <Calendar
                mode="single"
                selected={form.date}
                onSelect={(date) => {
                  setForm((prev) => ({ ...prev, date }));
                  setOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Upload PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePDFUpload(file);
            }}
            className="block w-full border border-gray-300 px-4 py-2 rounded-md"
          />

          {form.pdf ? (
            <p className="text-xs text-green-600 mt-1">
              PDF uploaded:{" "}
              <a href={form.pdf} target="_blank" rel="noopener noreferrer" className="underline">
                {form.pdfFilename || "View PDF"}
              </a>
            </p>
          ) : null}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition flex justify-center items-center disabled:bg-orange-300"
          >
            {loading ? "Submitting..." : "Submit Event"}
          </button>
        </div>
      </form>
      </div>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Manage Existing Events</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review events already added and delete any event you no longer need.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={fetchEvents} disabled={eventsLoading}>
            {eventsLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {eventsLoading ? (
          <p className="text-sm text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-500">No events found yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event._id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{event.title || "Untitled Event"}</h3>
                  <p className="text-sm text-gray-600">
                    {event.date ? format(new Date(event.date), "PPP") : "No date"} at {event.time || "No time"}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">
                    {event.registrationType || (event.googleFormLink ? "external" : "none")} registration
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteEvent(event._id, event.title || "this event")}
                  disabled={deletingEventId === event._id}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {deletingEventId === event._id ? "Deleting..." : "Delete Event"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function parseEventTime(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const normalized = value.trim();
  const twelveHourMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (twelveHourMatch) {
    const rawHours = parseInt(twelveHourMatch[1], 10);
    const minutes = parseInt(twelveHourMatch[2], 10);
    const meridiem = twelveHourMatch[3].toLowerCase();

    if (rawHours < 1 || rawHours > 12 || minutes < 0 || minutes > 59) return null;

    return {
      hours: meridiem === "pm" ? (rawHours % 12) + 12 : rawHours % 12,
      minutes,
    };
  }

  const twentyFourHourMatch = normalized.match(/^(\d{2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = parseInt(twentyFourHourMatch[1], 10);
    const minutes = parseInt(twentyFourHourMatch[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return { hours, minutes };
  }

  return null;
}
