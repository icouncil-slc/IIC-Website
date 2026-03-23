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

export function formatEventDateForRegistration(value) {
  if (!value) return defaultRegistrationFormConfig.eventDate;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return defaultRegistrationFormConfig.eventDate;

  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function buildRegistrationFormConfigFromEvent(event = {}) {
  return {
    ...defaultRegistrationFormConfig,
    eventTitle:
      typeof event?.title === 'string' && event.title.trim()
        ? event.title.trim()
        : defaultRegistrationFormConfig.eventTitle,
    eventSubtitle:
      typeof event?.description === 'string' && event.description.trim()
        ? event.description.trim()
        : defaultRegistrationFormConfig.eventSubtitle,
    eventDate: formatEventDateForRegistration(event?.date),
    eventTime:
      typeof event?.time === 'string' && event.time.trim()
        ? event.time.trim()
        : defaultRegistrationFormConfig.eventTime,
  };
}

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

export function normalizeRegistrationFormConfig(input = {}, fallbackConfig = defaultRegistrationFormConfig) {
  const extraQuestions = Array.isArray(input?.extraQuestions)
    ? input.extraQuestions.map(normalizeRegistrationQuestion).slice(0, 20)
    : [];

  return {
    eventTitle:
      typeof input?.eventTitle === 'string' && input.eventTitle.trim()
        ? input.eventTitle.trim()
        : fallbackConfig.eventTitle,
    eventSubtitle:
      typeof input?.eventSubtitle === 'string' && input.eventSubtitle.trim()
        ? input.eventSubtitle.trim()
        : fallbackConfig.eventSubtitle,
    eventDate:
      typeof input?.eventDate === 'string' && input.eventDate.trim()
        ? input.eventDate.trim()
        : fallbackConfig.eventDate,
    eventTime:
      typeof input?.eventTime === 'string' && input.eventTime.trim()
        ? input.eventTime.trim()
        : fallbackConfig.eventTime,
    eventMode:
      typeof input?.eventMode === 'string' && input.eventMode.trim()
        ? input.eventMode.trim()
        : fallbackConfig.eventMode,
    communityLink:
      typeof input?.communityLink === 'string' && input.communityLink.trim()
        ? input.communityLink.trim()
        : fallbackConfig.communityLink,
    communityButtonLabel:
      typeof input?.communityButtonLabel === 'string' && input.communityButtonLabel.trim()
        ? input.communityButtonLabel.trim()
        : fallbackConfig.communityButtonLabel,
    communityHelperText:
      typeof input?.communityHelperText === 'string' && input.communityHelperText.trim()
        ? input.communityHelperText.trim()
        : fallbackConfig.communityHelperText,
    submitHelperText:
      typeof input?.submitHelperText === 'string' && input.submitHelperText.trim()
        ? input.submitHelperText.trim()
        : fallbackConfig.submitHelperText,
    extraQuestions,
  };
}
