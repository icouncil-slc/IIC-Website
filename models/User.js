import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true, // Removes whitespace from the beginning and end of the email
    match: [/.+@.+\..+/, 'Please enter a valid email address.'], // Basic email format validation
  },
  role: {
    type: String,
    enum: ['Admin', 'Moderator', 'Editor','Member'], // Using PascalCase for readability
    default: 'Member',
  },
  members: [{ type: String }],
  permissions: {
    event: { type: Boolean, default: false },
    collaboration: { type: Boolean, default: false },
    sponsor: { type: Boolean, default: false },
    webinars: { type: Boolean, default: false },
    past_events: { type: Boolean, default: false },
    gallery: { type: Boolean, default: false },
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);