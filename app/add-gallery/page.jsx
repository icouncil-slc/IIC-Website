"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GalleryForm from "@/components/GalleryForm";

export default function GalleryPage() {
  return (
    <div className="min-h-screen py-10 bg-gray-50">
      <h1 className="text-center text-4xl font-bold text-[#003566] mb-8">Manage Gallery</h1>
      <GalleryForm />
    </div>
  );
}
