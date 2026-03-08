import mongoose from "mongoose";

const HomepageHeroSchema = new mongoose.Schema(
  {
    key: { type: String, default: "singleton", unique: true, index: true },
    enabled: { type: Boolean, default: false },
    /**
     * Extra hero images (do NOT include the default local `/assets/hero.png`).
     * Slider will be: [defaultImage, ...images] up to 5 total.
     */
    images: { type: [String], default: [] },
    autoplayMs: { type: Number, default: 4500 },
  },
  { timestamps: true }
);

export default mongoose.models.HomepageHero ||
  mongoose.model("HomepageHero", HomepageHeroSchema);

