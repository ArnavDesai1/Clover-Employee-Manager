export const BLOCKED_EMAILS = [
  'arundange1612@gmail.com',
];

export const isBlockedEmail = (email) => {
  const normalized = (email || '').trim().toLowerCase();
  return BLOCKED_EMAILS.includes(normalized);
};

