"use client";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Linkedin, Instagram, ChevronRight } from "lucide-react";
import Link from "next/link";

// Animation variants remain the same
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const iconHover = { scale: 1.2, transition: { duration: 0.2 } };

// A new, reusable card component to keep the code clean
const TeamMemberCard = ({ member, isStudent = false }) => (
  <motion.div variants={item} className="w-full max-w-sm">
    <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="relative h-44 w-44 rounded-full border-4 border-gray-100 overflow-hidden mb-4">
          <Image
            src={member.image}
            alt={member.name}
            fill
            sizes="176px"
            className="object-cover"
          />
        </div>
        <h4 className="font-semibold text-xl text-gray-800">{member.name}</h4>
        <p className="text-md text-gray-600">{member.role}</p>

        {/* Link to department page if it exists */}
        {member.departmentSlug && (
          <Link href={`/team/${member.departmentSlug}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2">
            View Department <ChevronRight className="w-4 h-4" />
          </Link>
        )}
        
        {/* Social Links for students */}
        {isStudent && (
          <div className="flex gap-4 mt-4">
            {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="w-6 h-6 text-gray-500 hover:text-[#0077b5]" /></a>}
            {member.instagram && <a href={member.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="w-6 h-6 text-gray-500 hover:text-[#E1306C]" /></a>}
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// The main component now receives teamData as a prop
export default function TeamSection({ teamData }) {
  const { faculty = [], students = [] } = teamData || {};

  return (
    <section className="py-16 px-4 md:px-10 bg-gray-50">
      {/* Faculty Coordinators */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={container}
      >
        <h2 className="text-center text-4xl font-bold mb-12 text-[#003566]">
          Faculty <span className="text-orange-600">Council</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center max-w-5xl mx-auto">
          {faculty.map((member) => (
            <TeamMemberCard key={member._id} member={member} />
          ))}
        </div>
      </motion.div>

      {/* Student Coordinators */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2, delay: 0.5 }}
        variants={container}
        className="mt-20"
      >
        <h2 className="text-center text-4xl font-bold mb-12 text-[#003566]">
          Student <span className="text-orange-600">Council</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {students.map((member) => (
            <TeamMemberCard key={member._id} member={member} isStudent={true} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
