"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Linkedin, Instagram } from "lucide-react";
import Link from "next/link";

export default function TeamMemberClientPage({ departmentData }) {
  const { head, members } = departmentData;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const iconHover = {
    scale: 1.2,
    transition: { duration: 0.2 }
  };

  return (
    <motion.section 
      initial="hidden"
      animate="show"
      variants={container}
      className="min-h-screen bg-gradient-to-b from-[#003566]/5 to-white py-12 px-4 md:px-10"
    >
      <div className="max-w-7xl mx-auto">
        <Link href="/team" className="inline-flex items-center gap-2 mb-8 text-[#003566] hover:text-[#003566]/80 transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Team</span>
        </Link>

        {/* Department Head */}
        <motion.div 
          variants={item}
          className="flex flex-col items-center mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative w-48 h-48 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-[#003566]/20 shadow-xl mb-6"
          >
            <Image
              src={head.image}
              alt={head.name}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
          
          <motion.h1 
            variants={item}
            className="text-3xl md:text-4xl font-bold text-center text-[#003566] mb-2"
          >
            {head.role}
          </motion.h1>
          
          <motion.p 
            variants={item}
            className="text-xl md:text-2xl text-gray-700 font-medium mb-4"
          >
            {head.name}
          </motion.p>

          <motion.div className="flex gap-4">
            {head.linkedin && (
              <motion.a 
                href={head.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={iconHover}
              >
                <Linkedin className="w-7 h-7 text-[#0077b5]" />
              </motion.a>
            )}
            {head.instagram && (
              <motion.a 
                href={head.instagram}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={iconHover}
              >
                <Instagram className="w-7 h-7 text-[#E1306C]" />
              </motion.a>
            )}
          </motion.div>
        </motion.div>

        {/* Team Members */}
        {members.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-2xl md:text-3xl font-semibold text-center text-[#003566] mb-12">
              Meet the Team
            </h2>
            
            <motion.div 
              variants={container}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
            >
              {members.map((member) => (
                <motion.div 
                  key={member._id}
                  variants={item}
                  whileHover={{ y: -5 }}
                  className="w-full max-w-xs"
                >
                  <Card className="shadow-md hover:shadow-xl transition-shadow h-full w-full">
                    <CardContent className="p-6 flex flex-col items-center">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-[#003566]/20 mb-4">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-center text-[#003566]">
                        {member.name}
                      </h3>
                      <p className="text-gray-600 text-center mt-1">
                        {member.role}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
