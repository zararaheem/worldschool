export type ReminderTemplate = 'general' | 'builds'

export function buildReminderEmail({ name, resumeUrl, template }: {
  name: string; resumeUrl: string; template: ReminderTemplate
}): { subject: string; body: string } {
  const firstName = (name || '').trim().split(/\s+/)[0] || 'there'

  if (template === 'builds') {
    return {
      subject: "Don't forget to submit your builds — Alpha World School guide application",
      body: [
        `Hi ${firstName},`,
        '',
        "You've started your Alpha World School guide application — thank you. The builds are the most important part: they're how we see how you think and what you'd create for our students.",
        '',
        `Submit your builds here: ${resumeUrl}`,
        '',
        'Each build takes 90 minutes to 2 hours. AI tools (Claude, ChatGPT, Cursor) are expected — we look at your judgment and taste, not whether you wrote everything from scratch.',
        '',
        "Applications are reviewed on a rolling basis — we'd love yours by June 1, 2026.",
        '',
        'Questions? Just reply to this email, or write us at worldschool@alpha.school.',
        '',
        '— The Alpha World School team',
      ].join('\n'),
    }
  }

  return {
    subject: 'A quick nudge on your Alpha World School guide application',
    body: [
      `Hi ${firstName},`,
      '',
      "We noticed you started your Alpha World School guide application but haven't finished it yet. Your builds are the heart of the application — we'd love to see what you make.",
      '',
      `Pick up where you left off: ${resumeUrl}`,
      '',
      "Applications are reviewed on a rolling basis — we'd love yours by June 1, 2026.",
      '',
      'Questions? Just reply to this email, or write us at worldschool@alpha.school.',
      '',
      '— The Alpha World School team',
    ].join('\n'),
  }
}
