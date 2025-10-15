"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPastEventPage() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [name, setName] = useState("");
  const [link, setLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/add-past-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, name, link }),
    });

    const data = await res.json();
    alert(data.message || data.error);
    if (res.ok) {
      setName("");
      setLink("");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-6 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center text-[#003566]">
        Add Past Event
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Select Year</label>
          <select
            className="w-full p-2 border rounded"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {(() => {
              const currentDate = new Date();
              const currentYear = currentDate.getFullYear();
              const currentMonth = currentDate.getMonth(); // 0-based: Jan = 0

              const latestStartYear =
                currentMonth >= 6 ? currentYear : currentYear - 1; // July = month 6

              return Array.from(
                { length: latestStartYear - 2010 + 1 },
                (_, i) => {
                  const startYear = 2010 + i;
                  const endYear = startYear + 1;
                  const range = `${startYear}-${endYear}`;
                  return (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  );
                }
              );
            })()}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Event Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter event name"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">PDF Link</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Drive or Cloudinary PDF link"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-[#003566] text-white px-4 py-2 rounded hover:bg-blue-800 w-full"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
