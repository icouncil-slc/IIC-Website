"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/lib/edgestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";

const DEFAULT_IMAGE = "/assets/hero.png";

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

export default function ManageHeroPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { edgestore } = useEdgeStore();

  const canEdit = useMemo(() => {
    const role = session?.user?.role;
    return role === "Admin" || role === "Moderator";
  }, [session]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [autoplayMs, setAutoplayMs] = useState(4500);
  const [images, setImages] = useState([]); // extra images only

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin");
  }, [status, router]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/homepage/hero");
        const data = await res.json();
        if (cancelled) return;
        setEnabled(Boolean(data?.enabled));
        setAutoplayMs(typeof data?.autoplayMs === "number" ? data.autoplayMs : 4500);
        setImages(Array.isArray(data?.images) ? data.images : []);
      } catch {
        toast.error("Failed to load hero settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const moveImage = (from, to) => {
    setImages((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;

    const remainingSlots = 4 - images.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 slides reached (default + 4). Remove an image first.");
      return;
    }

    const toUpload = list.slice(0, remainingSlots);
    if (toUpload.length < list.length) {
      toast.message(`Only ${remainingSlots} more image(s) can be added.`);
    }

    try {
      setUploading(true);
      const uploadedUrls = [];
      for (const file of toUpload) {
        const res = await edgestore.publicFiles.upload({ file });
        uploadedUrls.push(res.url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast.success("Hero image(s) uploaded.");
    } catch (e) {
      console.error(e);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!canEdit) return toast.error("You don't have permission to update hero settings.");
    const extraCount = images.length;
    if (enabled && extraCount < 2) {
      return toast.error("When slider is enabled, add at least 2 extra images (3 total with default).");
    }

    try {
      setSaving(true);
      const res = await fetch("/api/homepage/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          autoplayMs: clamp(Number(autoplayMs) || 4500, 2000, 10000),
          images,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      setEnabled(Boolean(data?.enabled));
      setAutoplayMs(data?.autoplayMs ?? 4500);
      setImages(Array.isArray(data?.images) ? data.images : []);
      toast.success("Hero settings saved.");
    } catch (e) {
      toast.error(e?.message || "Could not save hero settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#08246A]">Homepage Hero Slider</h1>
            <p className="text-sm text-gray-600 mt-1">
              Default hero image stays. Add 2–4 extra images to make 3–5 slides.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              Back
            </Button>
            <Button onClick={save} disabled={saving || uploading || !canEdit}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Settings</h2>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                Enable slider
              </label>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Autoplay (ms)</label>
              <input
                type="number"
                min={2000}
                max={10000}
                value={autoplayMs}
                onChange={(e) => setAutoplayMs(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 3500–5500ms</p>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">Add extra hero images</label>
              <div className="mt-2 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                  <ImagePlus className="h-4 w-4" />
                  <span className="text-sm">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <span className="text-sm text-gray-600 inline-flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Max: 4 extra images (total 5 slides including default).
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-900">Image size guide (best fit)</p>
              <div className="mt-2 space-y-1 text-xs text-blue-900/90">
                <p>
                  Aspect ratio: <span className="font-semibold">2:1 (landscape)</span>
                </p>
                <p>
                  Recommended: <span className="font-semibold">2000 x 1000 px</span>
                </p>
                <p>
                  Minimum for clarity: <span className="font-semibold">1600 x 800 px</span>
                </p>
                <p>Portrait uploads may leave empty side space in the hero section.</p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-4">
            <h2 className="font-semibold text-gray-800">Slides order</h2>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50">
                <div className="h-14 w-20 rounded-lg overflow-hidden bg-white border">
                  <img src={DEFAULT_IMAGE} alt="Default hero" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Default hero image</p>
                  <p className="text-xs text-gray-500">{DEFAULT_IMAGE}</p>
                </div>
                <span className="text-xs text-gray-600">Always included</span>
              </div>

              {images.length === 0 ? (
                <div className="text-sm text-gray-600 p-4 border rounded-xl">
                  No extra images yet. Upload 2–4 images to enable a 3–5 image slider.
                </div>
              ) : (
                images.map((url, idx) => (
                  <div key={url} className="flex items-center gap-3 p-3 rounded-xl border">
                    <div className="h-14 w-20 rounded-lg overflow-hidden bg-gray-100 border">
                      <img src={url} alt={`Hero ${idx + 2}`} className="h-full w-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">Slide {idx + 2}</p>
                      <p className="text-xs text-gray-500 truncate">{url}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveImage(idx, idx - 1)}
                        disabled={idx === 0}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveImage(idx, idx + 1)}
                        disabled={idx === images.length - 1}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(idx)}
                        aria-label="Delete slide"
                        title="Delete slide"
                        className="px-3 border-red-600 bg-red-600 text-white hover:bg-red-700 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 text-xs text-gray-600">
              Total slides on homepage: <span className="font-semibold">{1 + images.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
