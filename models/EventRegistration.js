import mongoose from 'mongoose';

const EventRegistrationSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'registration' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    extra: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'eventregistration',
  }
);

export default mongoose.models.EventRegistration ||
  mongoose.model('EventRegistration', EventRegistrationSchema);
