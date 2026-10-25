export const presetQuestions = {
  'negative-projection': {
    question: 'Why might my projected balance become negative?',
    fallback: 'The projected balance is below zero because planned future expenses and the estimated remaining day-to-day spending are greater than the money currently available plus income still expected. Check the flexible expenses first.',
  },
  'reduce-category': {
    question: 'Which spending category could I reduce?',
    fallback: 'Start by reviewing your largest recorded flexible spending category. Compare its recent purchases with what you still need for the month, then choose one optional expense to delay or lower.',
  },
  'reduce-dining-10': {
    question: 'What happens if I reduce dining expenses by 10%?',
    fallback: 'If your future dining spending follows the same mix as the recorded discretionary spending, reducing it by ten percent would improve the projected balance by the calculated amount shown beside this explanation. This change is only a scenario.',
  },
  'practical-savings': {
    question: 'What practical steps could help me save more?',
    fallback: 'Protect your planned essentials first. Then choose one flexible category, set a realistic limit for the remaining days, and direct any amount left above your safety buffer toward your goal.',
  },
};

export function isAllowedPresetBody(body) {
  return Boolean(body && typeof body === 'object' && !Array.isArray(body)
    && Object.keys(body).length === 1 && typeof body.presetId === 'string' && presetQuestions[body.presetId]);
}
