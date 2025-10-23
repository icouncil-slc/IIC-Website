"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

const events = [
  { year: 2018, title: "Launch Year", description: "Ideation, Problem-Solving, Design Thinking, IP Awareness" },
  { year: 2019, title: "Design Thinking, Pitch-a-Thon, National Startup Policy", description: "Workshops: Group discussions, design thinking, business model canvas,Social entrepreneurship and frugal innovations events,National Innovation and Start-up Policy workshops" },
  { year: 2020, title: "Community Building", description: "Competitions, IP Workshops, Mentoring, PoC, Business Plan" },
  { year: 2021, title: "Collaborations", description: "Incubation, Innovation Fairs, Outreach, Startup Policy" },
  { year: 2022, title: "Expanding Impact", description: "IP Rights, Patents, B-Plan Competitions, Innovation Day" },
  { year: 2023, title: "Innovation Drive", description: "Incubation Sessions, Innovation Fair, Outreach, National Startup Day, Viksit Bharat @2047" },
  { year: 2024, title: "Advancing Innovation Skills", description: "Innovate X Hackathon, Field Visits, BMC Workshop, Ambassador Training, IIC Orientation" },
  { year: 2025 , title: "From Patent to Product", description: "Shyam Lal College has evolved from fostering ideation and design thinking to driving innovation, incubation, IP awareness, and startup development through hackathons, workshops, and national-level competitions." },
];

const Timeline = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev < events.length - 1 ? prev + 1 : 0));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    controls.start({
      left: `${(activeIndex / (events.length - 1)) * 100}%`,
      transition: { duration: 0.8 }
    });
  }, [activeIndex, controls]);

  return (
    <section className="px-4 sm:px-6 lg:px-20 py-8 sm:py-12">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-14 text-center">Our Journey</h2>

      <div className="relative w-full">
        {/* Timeline Line */}
        <div className="relative h-[4rem] sm:h-[5rem]">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#012356] transform -translate-y-1/2 z-0" />

          {/* Flag */}
          <motion.div
            animate={controls}
            className="absolute z-10"
            style={{
              top: 'calc(1% - 2rem)', // align the bottom of the flag to the timeline line
              left: `${(activeIndex / (events.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <img
              src="/assets/icons/flag.png"
              alt="flag"
              className="w-6 sm:w-8 md:w-10 object-contain"
            />
          </motion.div>

          {/* Milestones */}
          <div className="absolute top-1/2 left-0 w-full flex justify-between transform -translate-y-1/2 z-10">
            {events.map((event, index) => (
              <div
                key={event.year}
                onClick={() => setActiveIndex(index)}
                className="text-center w-1/6 cursor-pointer"
              >
                <div className={`w-3 h-3 mx-auto rounded-full ${index === activeIndex ? 'bg-orange-500 scale-125' : 'bg-[#012356]'} transition-all`} />
                <p className="mt-2 text-xs sm:text-sm md:text-base font-medium">{event.year}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Event Card */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4 flex justify-center"
        >
          <div className="bg-white shadow-md border border-gray-200 rounded-lg px-4 py-3 sm:px-6 sm:py-4 w-full max-w-md text-center">
            <h3 className="font-bold text-base sm:text-lg md:text-xl text-orange-600 mb-1">
              {events[activeIndex].title}
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {events[activeIndex].description}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Timeline;
