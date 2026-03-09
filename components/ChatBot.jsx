"use client";

import { useState, useEffect, useRef } from "react";
// import { getGeminiResponse } from "@/lib/geminiClient"; // <-- YEH HUMNE HATA DIYA HAI
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// export default function ChatBot() { // <-- BINA 'export default' KE YEH LINE THI
export default function ChatBot() { // <-- YEH 'export default' VERCEL BUILD ERROR KO FIX KAREGA
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Welcome to IIC | SLC Query Bot!", eventTable: null, eventDetails: null },
    {
      sender: "bot",
      text: "Please ask queries only related to Shyam Lal College's Innovation Council.",
      eventTable: null,
      eventDetails: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // v-- YEH FUNCTION POORA UPDATE HO GAYA HAI --v
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input; // Input ko clear karne se pehle save karein
    setInput("");
    setLoading(true);

    try {
      // Ab hum apne secure backend API ko call kar rahe hain
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!res.ok) {
        throw new Error("Server se response nahi mila.");
      }

      const data = await res.json();
      const botReply = data.response || "Sorry, I couldn't process that.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botReply,
          eventTable: Array.isArray(data?.eventTable) ? data.eventTable : null,
          eventDetails: Array.isArray(data?.eventDetails) ? data.eventDetails : null,
        },
      ]);

    } catch (error) {
      console.error("Chatbot fetch error:", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I couldn't connect. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };
  // ^-- YAHAN TAK UPDATE HUA HAI --^

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div
          ref={chatRef}
          className="w-full max-w-xs sm:max-w-md bg-white shadow-xl rounded-xl flex flex-col overflow-hidden border border-gray-200"
          style={{ maxHeight: "calc(100vh - 8rem)" }}
        >
          {/* Header */}
          <div className="bg-orange-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold text-lg">IIC AI Bot</h3>
            <button
              onClick={toggleChat}
              className="text-white hover:text-gray-200 border-0 hover:border rounded-full hover:border-gray-200 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs sm:max-w-md rounded-lg px-4 py-2 ${
                    msg.sender === "bot"
                      ? "bg-gray-100 text-gray-800 rounded-tl-none"
                      : "bg-orange-600 text-white rounded-tr-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.sender === "bot" &&
                    Array.isArray(msg.eventDetails) &&
                    msg.eventDetails.length > 0 && (
                      <div className="mt-3 rounded-md border border-gray-200 bg-white p-2 text-xs space-y-1">
                        {msg.eventDetails.map((item, itemIdx) => (
                          <div key={`${item.label}-${itemIdx}`} className="text-gray-800">
                            <span className="font-bold">{item.label}: </span>
                            <span>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  {msg.sender === "bot" && Array.isArray(msg.eventTable) && msg.eventTable.length > 0 && (
                    <div className="mt-3 overflow-x-auto rounded-md border border-gray-200 bg-white">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-100 text-gray-700">
                          <tr>
                            <th className="px-2 py-1 text-left font-bold">Event Name</th>
                            <th className="px-2 py-1 text-left font-bold">Date</th>
                            <th className="px-2 py-1 text-left font-bold">Time</th>
                            <th className="px-2 py-1 text-left font-bold">Venue</th>
                            <th className="px-2 py-1 text-left font-bold">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msg.eventTable.map((row, rowIdx) => (
                            <tr key={`${row.title}-${rowIdx}`} className="border-t border-gray-100">
                              <td className="px-2 py-1 align-top">{row.title || "Event"}</td>
                              <td className="px-2 py-1 align-top">{row.date || "TBA"}</td>
                              <td className="px-2 py-1 align-top">{row.time || "TBA"}</td>
                              <td className="px-2 py-1 align-top">{row.venue || "TBA"}</td>
                              <td className="px-2 py-1 align-top">{row.description || "TBA"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg rounded-tl-none px-4 py-2 max-w-xs">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-float will-change-transform">
          <button
            onClick={toggleChat}
            className="rounded-full transition-all focus:outline-none focus:ring-2focus:ring-offset-2"
            aria-label="Open chatbot"
          >
            <DotLottieReact
              src="https://lottie.host/6a32f311-2b33-4423-ab38-1b96546ae297/Ft702URpxi.lottie"
              loop
              autoplay
              style={{ width: "90px", height: "90px" }}
            />
          </button>
        </div>
      )}
    </div>
  );
}
