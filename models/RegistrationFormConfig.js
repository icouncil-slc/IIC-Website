import mongoose from 'mongoose';

const RegistrationQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'textarea', 'select', 'radio'], default: 'text' },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    allowOther: { type: Boolean, default: false },
    options: [{ type: String, trim: true }],
  },
  { _id: false }
);

const RegistrationFormConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'singleton' },
    eventTitle: { type: String, required: true },
    eventSubtitle: { type: String, required: true },
    eventDate: { type: String, required: true },
    eventTime: { type: String, required: true },
    eventMode: { type: String, required: true },
    communityLink: { type: String, required: true },
    communityButtonLabel: { type: String, required: true },
    communityHelperText: { type: String, required: true },
    submitHelperText: { type: String, required: true },
    extraQuestions: { type: [RegistrationQuestionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.RegistrationFormConfig ||
  mongoose.model('RegistrationFormConfig', RegistrationFormConfigSchema);
