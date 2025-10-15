"use client";
import { useState,useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddWebinarPage() {
  const router = useRouter();
  const params = useParams();

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    thumbnail: "",
    webinarLink: "",
    youtubeLink: "",
    speakers: [{ name: "", designation: "" }],
  });

  const handleChange = (e, idx, field) => {
    if (field === "speakers") {
      const newSpeakers = [...formData.speakers];
      newSpeakers[idx][e.target.name] = e.target.value;
      setFormData({ ...formData, speakers: newSpeakers });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const addSpeaker = () => {
    setFormData({
      ...formData,
      speakers: [...formData.speakers, { name: "", designation: "" }],
    });
  };

  const removeSpeaker = (idx) => {
    const newSpeakers = formData.speakers.filter((_, i) => i !== idx);
    setFormData({ ...formData, speakers: newSpeakers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/webinar", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Submission failed");

      toast.success("Webinar added!");
      router.push("/webinar");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">
          Add Webinar
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="title"
            placeholder="Webinar Title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-md"
          />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-md"
          />
          <input
            type="text"
            name="time"
            placeholder="Time (e.g., 6:00 PM)"
            value={formData.time}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-md"
          />
          <input
            type="url"
            name="thumbnail"
            placeholder="Thumbnail Image URL"
            value={formData.thumbnail}
            onChange={handleChange}
            className="w-full p-3 border rounded-md"
          />
          <input
            type="url"
            name="webinarLink"
            placeholder="Webinar Join Link"
            value={formData.webinarLink}
            onChange={handleChange}
            className="w-full p-3 border rounded-md"
          />
          <input
            type="url"
            name="youtubeLink"
            placeholder="YouTube Recording Link"
            value={formData.youtubeLink}
            onChange={handleChange}
            className="w-full p-3 border rounded-md"
          />

          <div>
            <h2 className="text-lg font-semibold mb-2">Speakers</h2>
            {formData.speakers.map((speaker, idx) => (
              <div key={idx} className="space-y-2 mb-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Speaker Name"
                  value={speaker.name}
                  onChange={(e) => handleChange(e, idx, "speakers")}
                  required
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="text"
                  name="designation"
                  placeholder="Designation"
                  value={speaker.designation}
                  onChange={(e) => handleChange(e, idx, "speakers")}
                  required
                  className="w-full p-2 border rounded-md"
                />
                {formData.speakers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpeaker(idx)}
                    className="text-red-600 text-sm"
                  >
                    Remove Speaker
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSpeaker}
              className="text-blue-700 underline"
            >
              + Add Speaker
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-3 rounded-md hover:bg-blue-800 transition"
          >
            Submit Webinar
          </button>
        </form>
      </div>
    </div>
  );
}
