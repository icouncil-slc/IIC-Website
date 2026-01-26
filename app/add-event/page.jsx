"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEdgeStore } from "@/lib/edgestore";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AddEventPage() {
  const params = useParams();

  const [form, setForm] = useState({
    title: "",
    primaryImage: "",
    secondaryImage:"",
    date: null,
    time: "",
    prize: "",
    googleFormLink: "",
    category: "",
    description: "",
    timeline: [""],
    contacts: [""],
    pdf: "",
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [hour, minutePart] = form.time.split(":");
      const minute = minutePart.slice(0, 2);
      const isPM = form.time.toLowerCase().includes("pm");

      const localDateTime = new Date(form.date);
      localDateTime.setHours(isPM ? parseInt(hour) + 12 : parseInt(hour));
      localDateTime.setMinutes(parseInt(minute));
      localDateTime.setSeconds(0);
      localDateTime.setMilliseconds(0);

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: localDateTime.toISOString(), // Correct ISO time
          timeline: form.timeline.join("\n"),
          contacts: form.contacts.join("\n"),
        }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        alert("Failed to add event");
      }
    } finally {
      setLoading(false);
    }
  };

  const { edgestore } = useEdgeStore();

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
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        Add New Event
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        {["title", "time", "prize", "description","googleFormLink","category"].map((field) => (
          <div key={field} className="space-y-1">
            <label className="text-sm font-medium text-gray-700 capitalize">
              {field}
            </label>
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
          <label className="text-sm font-medium text-gray-700">
            Primary Image
          </label>
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
          {form.primaryImage && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Image uploaded:{" "}
              <a
                href={form.primaryImage}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View primary image
              </a>
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Secondary Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "secondaryImage");
            }}
            className="block w-full border border-gray-300 px-4 py-2 rounded-md"
          />
          {form.secondaryImage && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Image uploaded:{" "}
              <a
                href={form.secondaryImage}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View secondary image
              </a>
            </p>
          )}
        </div>

        {/* Timeline Dynamic Fields */}
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
                  setForm({ ...form, timeline: updated });
                }}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder={`Timeline stage ${index + 1}`}
                required
              />
              {form.timeline.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.timeline.filter((_, i) => i !== index);
                    setForm({ ...form, timeline: updated });
                  }}
                  className="p-2 text-red-500 hover:text-red-700 transition"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm({ ...form, timeline: [...form.timeline, ""] })
            }
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center mt-2"
          >
            <span className="mr-1">+</span> Add Timeline Stage
          </button>
        </div>

        {/* Contacts Dynamic Fields */}
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
                  setForm({ ...form, contacts: updated });
                }}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder={`Contact ${index + 1}`}
                required
              />
              {form.contacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.contacts.filter((_, i) => i !== index);
                    setForm({ ...form, contacts: updated });
                  }}
                  className="p-2 text-red-500 hover:text-red-700 transition"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm({ ...form, contacts: [...form.contacts, ""] })
            }
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center mt-2"
          >
            <span className="mr-1">+</span> Add Contact
          </button>
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Event Date
          </label>
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
                  setForm({ ...form, date });
                  setOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Upload PDF
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePDFUpload(file);
            }}
            className="block w-full border border-gray-300 px-4 py-2 rounded-md"
          />

          {form.pdf && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Image uploaded:{" "}
              <a
                href={form.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {form.pdfFilename || "View PDF"}
              </a>
            </p>
          )}
        </div>

        {form.pdf ? (
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition flex justify-center items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit Event"
              )}
            </button>
          </div>
        ) : (
          <button
            disabled={!form.pdf}
            className="w-full md:w-auto px-6 py-2 bg-orange-800 text-white rounded-md  focus:ring-2 focus:ring-orange-800 focus:ring-offset-2 transition flex justify-center items-center"
          >
            Loading ...
          </button>
        )}
      </form>
    </div>
  );
}
