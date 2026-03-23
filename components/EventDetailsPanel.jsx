"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = ["DESCRIPTION", "STAGES AND TIMELINES", "CONTACTS"];

const EventDetailsPanel = ({ event, onClose }) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const router = useRouter();
  const registrationType =
    event.registrationType || (event.googleFormLink ? "external" : "none");
  const hasRegistration = registrationType === "internal" || Boolean(event.googleFormLink);

  const handleRegister = () => {
    if (registrationType === "internal" && event._id) {
      router.push(`/register?eventId=${event._id}`);
      return;
    }

    if (event.googleFormLink) {
      window.open(`${event.googleFormLink}`, "_blank");
    }
  };

  const contentMap = {
    DESCRIPTION:
      event.description ||
      "Where fashion meets innovation! Walk the ramp with tech-inspired outfits and futuristic flair – as an individual or a group.",
    "STAGES AND TIMELINES":
      event.timeline || "Stage-wise timelines to be announced soon.",
    CONTACTS:
      event.contacts || "Reach us at example@email.com or +91 1234567890",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div className="relative w-full max-w-5xl h-[90vh] rounded-2xl bg-[#130F19] text-white overflow-hidden animate-slide-in-left z-50 shadow-2xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Image - Now visible on mobile */}
          {event.secondaryImage && (
            <div className="w-full h-72 md:h-full md:w-1/2">
              <img
                src={event.secondaryImage}
                alt={event.title}
                className="w-full h-full object-cover object-top"
              />
            </div>
          )}

          {/* Content Panel */}
          <div className="w-full md:w-1/2 flex flex-col p-6 md:p-8 overflow-y-auto">
            {/* Close Button */}
            <div className="absolute right-6 top-6 z-10">
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors duration-200 cursor-pointer"
                aria-label="Close panel"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white font-serif tracking-tight">
              {event.title}
            </h2>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === tab
                      ? "bg-orange-500 text-black shadow-md"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              <div className="text-lg text-white/90 leading-relaxed whitespace-pre-wrap space-y-4">
                {activeTab === "DESCRIPTION" ? (
                  <p>{contentMap[activeTab]}</p>
                ) : (
                  contentMap[activeTab]
                    .replace(/\\n/g, "\n")
                    .split("\n")
                    .map((line, idx) => (
                      <p key={idx} className="last:mb-0">
                        {line}
                      </p>
                    ))
                )}
              </div>
            </div>

            {/* Prize Section */}
            <div className="mt-8 mb-6 p-4 bg-gradient-to-r from-[#895f22]/20 to-[#d4a017]/10 rounded-xl border border-[#895f22]/30">
              <h3 className="text-sm font-medium text-white/80 tracking-wider">
                PRIZES WORTH
              </h3>
              <p className="text-3xl md:text-4xl text-orange-500 font-bold mt-1">
                RS. {event.prize || "10,000/-"}
              </p>
            </div>

            {/* Buttons - Fixed at bottom */}
            <div className="mt-auto pt-4 grid grid-cols-2 md:grid-cols-2 gap-4">
              <Button
                size="lg"
                onClick={handleRegister}
                disabled={!hasRegistration}
                className="bg-orange-600 hover:bg-orange-800 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {hasRegistration ? "REGISTER NOW" : "REGISTRATION CLOSED"}
              </Button>
              {event.pdf ? (
                <a
                  href={event.pdf}
                  download={`${event.title.replace(/\s+/g, "_")}_Details.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all"
                  >
                    DOWNLOAD DETAILS
                  </Button>
                </a>
              ) : (
                <Button
                  disabled
                  className="w-full border-white/30 text-white opacity-50"
                >
                  PDF Not Uploaded
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPanel;
