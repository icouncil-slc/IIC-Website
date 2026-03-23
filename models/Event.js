import mongoose from "mongoose";
// models/Event.js
const EventSchema = new mongoose.Schema({
  title: String,
  primaryImage: String,
  secondaryImage: String,
  date: Date,
  time: String,
  prize: String,
  googleFormLink: String,
  registrationType: {
    type: String,
    enum: ["internal", "external", "none"],
    default: "none",
  },
  category:String,
  description: String,
  timeline: String,
  contacts: String,
  pdf: String, // 🆕 stores the PDF link
}, {
  timestamps: true,
});


export default mongoose.models.Event || mongoose.model("Event", EventSchema);
