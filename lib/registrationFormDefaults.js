export const defaultRegistrationFormConfig = {
  eventTitle: 'AI-Powered Solution Expo: Demo Days for AI/I4.0 Prototypes',
  eventSubtitle: 'Workshop on AI-Powered Solution Expo: Demo Days for AI/I4.0 Prototypes',
  eventDate: '18/03/2026',
  eventTime: '03:00 PM',
  eventMode: 'Online (Google Meet)',
  communityLink: 'https://chat.whatsapp.com/',
  communityButtonLabel: 'Join WhatsApp Community',
  communityHelperText: 'Please join the WhatsApp community first, then return here and submit the registration form.',
  submitHelperText: 'After joining the community, fill out the form below to complete your registration.',
  extraQuestions: [],
};

export function normalizeRegistrationQuestion(question, index = 0) {
  const type = ['text', 'textarea', 'select', 'radio'].includes(question?.type)
    ? question.type
    : 'text';
  const options = Array.isArray(question?.options)
    ? question.options
        .map((option) => (typeof option === 'string' ? option.trim() : ''))
        .filter(Boolean)
    : [];

  return {
    id:
      typeof question?.id === 'string' && question.id.trim()
        ? question.id.trim()
        : `question_${index + 1}`,
    label:
      typeof question?.label === 'string' && question.label.trim()
        ? question.label.trim()
        : `Question ${index + 1}`,
    type,
    required: Boolean(question?.required),
    placeholder: typeof question?.placeholder === 'string' ? question.placeholder.trim() : '',
    allowOther: Boolean(question?.allowOther),
    options: type === 'select' || type === 'radio' ? options : [],
  };
}

export function normalizeRegistrationFormConfig(input = {}) {
  const extraQuestions = Array.isArray(input?.extraQuestions)
    ? input.extraQuestions.map(normalizeRegistrationQuestion).slice(0, 20)
    : [];

  return {
    eventTitle:
      typeof input?.eventTitle === 'string' && input.eventTitle.trim()
        ? input.eventTitle.trim()
        : defaultRegistrationFormConfig.eventTitle,
    eventSubtitle:
      typeof input?.eventSubtitle === 'string' && input.eventSubtitle.trim()
        ? input.eventSubtitle.trim()
        : defaultRegistrationFormConfig.eventSubtitle,
    eventDate:
      typeof input?.eventDate === 'string' && input.eventDate.trim()
        ? input.eventDate.trim()
        : defaultRegistrationFormConfig.eventDate,
    eventTime:
      typeof input?.eventTime === 'string' && input.eventTime.trim()
        ? input.eventTime.trim()
        : defaultRegistrationFormConfig.eventTime,
    eventMode:
      typeof input?.eventMode === 'string' && input.eventMode.trim()
        ? input.eventMode.trim()
        : defaultRegistrationFormConfig.eventMode,
    communityLink:
      typeof input?.communityLink === 'string' && input.communityLink.trim()
        ? input.communityLink.trim()
        : defaultRegistrationFormConfig.communityLink,
    communityButtonLabel:
      typeof input?.communityButtonLabel === 'string' && input.communityButtonLabel.trim()
        ? input.communityButtonLabel.trim()
        : defaultRegistrationFormConfig.communityButtonLabel,
    communityHelperText:
      typeof input?.communityHelperText === 'string' && input.communityHelperText.trim()
        ? input.communityHelperText.trim()
        : defaultRegistrationFormConfig.communityHelperText,
    submitHelperText:
      typeof input?.submitHelperText === 'string' && input.submitHelperText.trim()
        ? input.submitHelperText.trim()
        : defaultRegistrationFormConfig.submitHelperText,
    extraQuestions,
  };
}
