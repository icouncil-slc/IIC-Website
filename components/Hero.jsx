"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const swipeConfidenceThreshold = 7000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

const Hero = ({ title, subtitle, sec_title, sec_sub, btn1, btn2, image }) => {
  const router = useRouter();
  const controls = useAnimation();
  const defaultImage = image || "/assets/hero.png";
  const baseSlide = useMemo(
    () => ({
      title,
      subtitle,
      sec_title,
      sec_sub,
      btn1,
      btn2,
      image: defaultImage,
      backgroundColor: "#08246A",
      backgroundImage: "",
      backgroundOverlay: 0.76,
      hideSideImage: false,
      backgroundFit: "cover",
    }),
    [title, subtitle, sec_title, sec_sub, btn1, btn2, defaultImage]
  );

  const [heroEnabled, setHeroEnabled] = useState(false);
  const [heroAutoplayMs, setHeroAutoplayMs] = useState(4500);
  const [extraImages, setExtraImages] = useState([]);
  const [extraSlides, setExtraSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Continuous animation loop
  useEffect(() => {
    const sequence = async () => {
      while (true) {
        await controls.start({
          y: [-5, 5, -5],
          rotate: [-2, 2, -2],
          transition: {
            duration: 8,
            ease: "easeInOut",
            repeat: Infinity,
          },
        });
      }
    };
    sequence();
  }, [controls]);

  // Load hero slider config (public)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/homepage/hero");
        const data = await res.json();
        if (cancelled) return;
        setHeroEnabled(Boolean(data?.enabled));
        setHeroAutoplayMs(typeof data?.autoplayMs === "number" ? data.autoplayMs : 4500);
        setExtraImages(Array.isArray(data?.images) ? data.images : []);
        setExtraSlides(Array.isArray(data?.slides) ? data.slides : []);
      } catch {
        // keep default image silently
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(() => {
    if (!heroEnabled) return [baseSlide];

    const withImageOnly = Array.isArray(extraImages)
      ? extraImages
          .filter((src) => typeof src === "string" && src.trim())
          .map((src) => ({
            ...baseSlide,
            title: "",
            subtitle: "",
            sec_title: "",
            sec_sub: "",
            image: "",
            backgroundColor: "#000000",
            backgroundImage: src,
            backgroundOverlay: 0,
            hideSideImage: true,
            backgroundFit: "cover",
          }))
      : [];

    const withFullSlide = Array.isArray(extraSlides)
      ? extraSlides
          .map((item) => ({
            title: item?.title || baseSlide.title,
            subtitle: item?.subtitle || baseSlide.subtitle,
            sec_title: item?.sec_title || baseSlide.sec_title,
            sec_sub: item?.sec_sub || baseSlide.sec_sub,
            btn1: item?.btn1 ?? baseSlide.btn1,
            btn2: item?.btn2 ?? baseSlide.btn2,
            image:
              typeof item?.image === "string" && item.image.trim() ? item.image : baseSlide.image,
            backgroundColor:
              typeof item?.backgroundColor === "string" && item.backgroundColor.trim()
                ? item.backgroundColor
                : baseSlide.backgroundColor,
            backgroundImage:
              typeof item?.backgroundImage === "string" && item.backgroundImage.trim()
                ? item.backgroundImage
                : "",
            backgroundOverlay:
              typeof item?.backgroundOverlay === "number"
                ? Math.min(1, Math.max(0, item.backgroundOverlay))
                : baseSlide.backgroundOverlay,
            hideSideImage: Boolean(item?.hideSideImage),
            backgroundFit:
              item?.backgroundFit === "contain" || item?.backgroundFit === "cover"
                ? item.backgroundFit
                : baseSlide.backgroundFit,
          }))
          .filter((item) => item.image || item.backgroundImage)
      : [];

    const extra = withFullSlide.length > 0 ? withFullSlide : withImageOnly;
    return [baseSlide, ...extra].slice(0, 5);
  }, [baseSlide, extraImages, extraSlides, heroEnabled]);

  const activeSlide = slides[index] || baseSlide;
  const hasTitle = Boolean(activeSlide.title || activeSlide.sec_title);
  const hasSubtitle = Boolean(activeSlide.subtitle || activeSlide.sec_sub);
  const canShowButtons = Boolean(activeSlide.btn1 && activeSlide.btn2);
  const isPosterSlide = Boolean(activeSlide.hideSideImage && activeSlide.backgroundImage);

  // keep index in range when slides change
  useEffect(() => {
    setIndex((prev) => (slides.length === 0 ? 0 : ((prev % slides.length) + slides.length) % slides.length));
  }, [slides.length]);

  const paginate = (newDirection) => {
    if (slides.length <= 1) return;
    setDirection(newDirection);
    setIndex((prev) => {
      const next = prev + newDirection;
      const len = slides.length;
      return ((next % len) + len) % len;
    });
  };

  // autoplay
  useEffect(() => {
    if (!heroEnabled) return;
    if (slides.length <= 1) return;
    const ms = Math.min(10000, Math.max(2000, Number(heroAutoplayMs) || 4500));
    const id = setInterval(() => paginate(1), ms);
    return () => clearInterval(id);
  }, [heroAutoplayMs, heroEnabled, slides.length]);

  const handleBtn = (label) => {
    if (label === "View Past Events") {
      router.push("/past-events");
    } else if (label === "Explore Events") {
      router.push("/events");
    } else if (label === "Upcoming Events") {
      window.scrollBy({
        top: 500,
        left: 0,
        behavior: "smooth",
      });
    } else if (label === "Startup Policy") {
      const isMobile = window.innerWidth <= 640; 
      window.scrollBy({
        top: isMobile ? 3800 : 2400,
        left: 0,
        behavior: "smooth",
      });
    }
  };

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <section className="relative text-white py-10 md:py-12 px-6 lg:px-12 xl:px-20 overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`bg-${index}-${activeSlide.backgroundColor}-${activeSlide.backgroundImage}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="absolute inset-0"
          style={{
            backgroundColor: activeSlide.backgroundColor || "#08246A",
            backgroundImage: activeSlide.backgroundImage
              ? `linear-gradient(rgba(8, 36, 106, ${activeSlide.backgroundOverlay}), rgba(8, 36, 106, ${activeSlide.backgroundOverlay})), url(${activeSlide.backgroundImage})`
              : "none",
            backgroundSize: activeSlide.backgroundFit === "contain" ? "contain" : "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`${index}-${activeSlide.image}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: "easeOut" }}
            drag={slides.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(e, { offset, velocity }) => {
              if (slides.length <= 1) return;
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="relative flex min-h-[400px] md:min-h-[500px] flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16"
          >
            <div className="space-y-4 md:space-y-6 flex-1">
              {hasTitle && (
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  {activeSlide.title}
                  {activeSlide.title && activeSlide.sec_title ? <br /> : null}
                  {activeSlide.sec_title}
                </h1>
              )}

              {hasSubtitle && (
                <p className="text-lg md:text-2xl font-medium text-orange-400">
                  {activeSlide.subtitle}
                  {activeSlide.subtitle && activeSlide.sec_sub ? <br /> : null}
                  <span className="text-white">{activeSlide.sec_sub}</span>
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {canShowButtons && !isPosterSlide && (
                  <>
                    <Button
                      onClick={() => handleBtn(activeSlide.btn1)}
                      className="bg-orange-500 hover:bg-orange-700 text-white px-8 py-6 text-lg cursor-pointer"
                      whilehover={{ scale: 1.05 }}
                      whiletap={{ scale: 0.95 }}
                    >
                      {activeSlide.btn1}
                    </Button>
                    <Button
                      onClick={() => handleBtn(activeSlide.btn2)}
                      variant="outline"
                      className="bg-blue-500 hover:bg-blue-700 text-white px-8 py-6 text-lg cursor-pointer"
                      whilehover={{ scale: 1.05 }}
                      whiletap={{ scale: 0.95 }}
                    >
                      {activeSlide.btn2}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {!activeSlide.hideSideImage && activeSlide.image && (
              <motion.div className="flex-1 flex justify-center md:justify-end" animate={controls}>
              <motion.div
                className="relative w-full max-w-[300px] md:max-w-[350px] lg:max-w-[400px] xl:max-w-[450px]"
                whileHover={{ scale: 1.05 }}
              >
                <div className="relative rounded-lg shadow-2xl overflow-hidden">
                  <Image
                    src={activeSlide.image}
                    alt={activeSlide.title || "Hero"}
                    width={500}
                    height={500}
                    quality={100}
                    className="rounded-lg"
                    style={{
                      boxShadow: "0 25px 50px -12px rgba(255, 165, 0, 0.3)",
                    }}
                    priority
                  />
                </div>

                <motion.div
                  className="absolute -top-5 -left-5 w-20 h-20 bg-orange-400 rounded-full mix-blend-multiply opacity-20"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2],
                    transition: {
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                />
                <motion.div
                  className="absolute -bottom-5 -right-5 w-24 h-24 bg-blue-300 rounded-full mix-blend-multiply opacity-20"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                    transition: {
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    },
                  }}
                />
              </motion.div>
              </motion.div>
            )}

          </motion.div>
        </AnimatePresence>

        {canShowButtons && isPosterSlide && (
          <div className="absolute left-6 md:left-8 bottom-14 md:bottom-16 z-20 flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleBtn(activeSlide.btn1)}
              className="bg-orange-500 hover:bg-orange-700 text-white px-8 py-6 text-lg cursor-pointer"
              whilehover={{ scale: 1.05 }}
              whiletap={{ scale: 0.95 }}
            >
              {activeSlide.btn1}
            </Button>
            <Button
              onClick={() => handleBtn(activeSlide.btn2)}
              variant="outline"
              className="bg-blue-500 hover:bg-blue-700 text-white px-8 py-6 text-lg cursor-pointer"
              whilehover={{ scale: 1.05 }}
              whiletap={{ scale: 0.95 }}
            >
              {activeSlide.btn2}
            </Button>
          </div>
        )}

        <div className="mt-4 h-10 flex justify-center items-center">
          {slides.length > 1 ? (
            <div className="flex gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-full border border-white/10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === index ? "bg-orange-400" : "bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          ) : (
            <div className="invisible h-9" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
