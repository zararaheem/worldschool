export interface ReminderTemplateDef {
  key: string
  label: string
  subject: string
  body: string
  builtin?: boolean
}

// Placeholders supported in subject/body: {first_name}, {resume_link}
export const DEFAULT_REMINDER_TEMPLATES: ReminderTemplateDef[] = [
  {
    key: 'general',
    label: 'General reminder',
    builtin: true,
    subject: 'A quick nudge on your Alpha World School guide application',
    body: [
      'Hi {first_name},',
      '',
      "We noticed you started your Alpha World School guide application but haven't finished it yet. Your builds are the heart of the application — we'd love to see what you make.",
      '',
      'Pick up where you left off: {resume_link}',
      '',
      "Applications are reviewed on a rolling basis — we'd love yours by June 1, 2026.",
      '',
      'Questions? Just reply to this email, or write us at worldschool@alpha.school.',
      '',
      '— The Alpha World School team',
    ].join('\n'),
  },
  {
    key: 'builds',
    label: 'Submit your builds',
    builtin: true,
    subject: 'Submit any one build — Alpha World School guide application',
    body: [
      'Hi {first_name},',
      '',
      "You've started your Alpha World School guide application — thank you. The builds are the most important part: they're how we see how you think and what you'd create for our students.",
      '',
      "You don't need to finish everything — submitting any ONE build is enough to move your application forward.",
      '',
      'Submit your build here: {resume_link}',
      '',
      'Each build takes 90 minutes to 2 hours, and AI tools (Claude, ChatGPT, Cursor) are expected — we look at your judgment and taste, not whether you wrote everything from scratch.',
      '',
      "Applications are reviewed on a rolling basis — we'd love yours by June 1, 2026.",
      '',
      'Questions? Just reply to this email, or write us at worldschool@alpha.school.',
      '',
      '— The Alpha World School team',
    ].join('\n'),
  },
]

export function renderTemplate(
  template: { subject: string; body: string },
  vars: { name: string; resumeUrl: string }
): { subject: string; body: string } {
  const firstName = (vars.name || '').trim().split(/\s+/)[0] || 'there'
  const fill = (s: string) =>
    s.replace(/\{first_name\}/g, firstName).replace(/\{resume_link\}/g, vars.resumeUrl)
  return { subject: fill(template.subject), body: fill(template.body) }
}
