"use client";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import Link from "next/link";
import { toast } from "sonner";

const Footer = () => {
  const handleBtn = () => {
    toast.success("Feature Coming Soon!", {
      style: {
        fontSize: "16px",
        background: "#22bb33",
        color: "#fff",
      },
    });
  };

  return (
    <footer className="bg-[#010C25] text-white py-10 px-6 md:px-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm md:text-base">

        {/* Logo Column */}
        <div>
          <img
            src="/assets/logo.png"
            alt="IIC Logo"
            className="h-28 sm:h-28 md:h-32 mb-4"
          />

          <div className="flex items-center gap-4 mt-2">

            <a
              target="_blank"
              rel="noopener noreferrer"
              href="#"
              className="hover:text-orange-400 transition-colors"
              aria-label="Facebook"
            >
              <FaFacebookF size={20} />
            </a>

            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.instagram.com/iic.slc?igsh=MTgwM3FncTliNXJsdg=="
              className="hover:text-orange-400 transition-colors"
              aria-label="Instagram"
            >
              <FaInstagram size={20} />
            </a>

            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.youtube.com/@iicSLC"
              className="hover:text-orange-400 transition-colors"
              aria-label="YouTube"
            >
              <FaYoutube size={20} />
            </a>

            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.linkedin.com/company/iicslc/"
              className="hover:text-orange-400 transition-colors"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn size={20} />
            </a>

          </div>
        </div>


        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-base md:text-lg mb-2">
            Quick Links
          </h4>

          <ul className="space-y-1">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About IIC</Link></li>
            <li><Link href="/events">Events</Link></li>
            <li><Link href="/webinar">Webinars</Link></li>
            <li><Link href="/gallery">Gallery</Link></li>
            <li><Link href="/team">Team Council</Link></li>
          </ul>
        </div>


        {/* Resources */}
        <div>
          <h4 className="font-bold text-base md:text-lg mb-2">
            Resources
          </h4>

          <ul className="space-y-1">

            <li>
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleBtn();
                }}
              >
                Join the Movement
              </Link>
            </li>

            <li>
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleBtn();
                }}
              >
                Submit Your Idea
              </Link>
            </li>

            <li>
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleBtn();
                }}
              >
                Start Mentorship
              </Link>
            </li>

          </ul>
        </div>


        {/* Contact */}
        <div>
          <h4 className="font-bold text-base md:text-lg mb-2">
            Contact Us
          </h4>

          <p>📍 G.T. Road, Shahdara, Delhi-110032</p>
          <p>Shyam Lal College, DU</p>
          <p>📞 8527972684</p>
          <p>📧 icouncil@shyamlal.du.ac.in</p>

        </div>

      </div>

      <hr className="border-t-4 border-orange-500 mt-10 w-full" />

      <p className="text-center text-md sm:text-lg mt-6 md:mt-8">
        © 2026 Institution’s Innovation Council – Shyam Lal College,
        University of Delhi. All rights reserved.
      </p>

    </footer>
  );
};

export default Footer;