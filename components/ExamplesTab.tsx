'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

const constraints = [
  {
    id: 'conflict',
    label: 'Conflict by Week 5',
    color: 'amber',
    examples: [
      {
        title: 'The Sunday Council',
        summary: 'Weekly structured circle where friction gets surfaced before it festers.',
        detail: `Every Sunday at 6pm, the cohort sits in a circle for 30 minutes. Each person gets 90 seconds to name one thing they appreciated about another cohort member that week, and one thing that's grating on them. Structured rules — start with appreciation, name a specific behavior (not a personality trait), no debating in the moment. Guide facilitates the first three weeks, then a rotating cohort member runs it. By week 5, friction gets surfaced in real-time before it festers into factions.`,
      },
      {
        title: 'The Repair Protocol',
        summary: 'A laminated 4-step conflict resolution process the whole cohort commits to in week 1.',
        detail: `Cohort agrees in week 1 to a written 4-step protocol for handling friction. When something happens, the protocol says you say "I need a Repair." Within 24 hours, the two students sit with a guide for 20 minutes using a specific 4-question template (what happened / how it landed / what I want / what I'll do differently). No avoidance, no triangulating through other cohort members. The protocol is laminated and lives on the wall of every common space all year.`,
      },
    ],
  },
  {
    id: 'energy',
    label: 'Energy Drop at Mid-Rotation',
    color: 'green',
    examples: [
      {
        title: 'Friday Bring-Your-Best',
        summary: 'Rotating student-led recharge sessions that distribute ownership and spotlight.',
        detail: `Every Friday afternoon, one cohort member designs and leads a 30-minute recharge activity for the group — could be a game from their hometown, a skill they want to teach, a meditation, a dance, whatever. Rotates so every kid gets two slots per rotation. Solves energy AND distributes leadership ownership AND gives every kid a recurring moment in the spotlight.`,
      },
      {
        title: 'The Midpoint Reset Day',
        summary: 'A structured retreat day built into the calendar at each rotation\'s exact midpoint.',
        detail: `Built into the calendar at the exact midpoint of each rotation (around week 4). Looks like a structured retreat day: morning is solo journaling against three specific prompts, afternoon is a cohort conversation where everyone names one behavior they want to recommit to and one they want to drop, evening is a shared meal with a gratitude rotation. Built-in reset valve before the energy crash actually compounds.`,
      },
    ],
  },
  {
    id: 'cultural',
    label: 'Cultural Missteps',
    color: 'blue',
    examples: [
      {
        title: 'The What-We-Got-Wrong Debrief',
        summary: 'Friday evening sessions in the local language, co-facilitated by local guides.',
        detail: `Friday evenings in the local language (with the local guide co-facilitating). Each cohort member shares one cultural moment from the week where they felt unsure or knew they messed up. The local guide normalizes the mistake — "that's a normal thing to get wrong, here's why" — and teaches the next-level cultural understanding. Transforms shame into curriculum.`,
      },
      {
        title: 'The Cultural Compass',
        summary: 'A pre-arrival workshop covering 20 cultural norms through scenario role-play.',
        detail: `A 60-minute pre-arrival workshop the day before each rotation begins. Covers 20 specific cultural norms, then role-plays 10 hard scenarios, then each student writes down the specific moment they expect to mess up first. By naming it ahead, when it happens it's predicted, not catastrophic.`,
      },
    ],
  },
  {
    id: 'homesick',
    label: 'Someone Wants to Go Home (Week 10)',
    color: 'rose',
    examples: [
      {
        title: 'Buddy-Up Pairs',
        summary: 'Peer accountability pairs with daily check-ins who rotate every rotation.',
        detail: `Every cohort member is paired with one specific peer they're responsible for. Daily 5-minute check-ins built into the schedule, weekly 30-minute deeper conversation on Sundays. Pairs rotate every rotation. So when someone starts to spiral, their buddy notices it the day it starts, and there's already a structure for that conversation. Distributes the emotional load.`,
      },
      {
        title: 'The Sunday Letter Home',
        summary: 'Weekly letters/voice memos home that channel homesickness into connection.',
        detail: `Every Sunday at 4pm, every cohort member writes a letter or records a voice memo to a parent, grandparent, sibling, or friend back home. Then each shares one sentence from theirs with the cohort. Channels homesickness into connection (and into a written record they'll have forever) rather than avoidance.`,
      },
    ],
  },
]

const colorMap: Record<string, { badge: string; border: string; dot: string; title: string }> = {
  amber: { badge: 'bg-amber-900/40 text-amber-300 border-amber-700/50', border: 'border-amber-700/30', dot: 'bg-amber-400', title: 'text-amber-300' },
  green: { badge: 'bg-green-900/40 text-green-300 border-green-700/50', border: 'border-green-700/30', dot: 'bg-green-400', title: 'text-green-300' },
  blue: { badge: 'bg-blue-900/40 text-blue-300 border-blue-700/50', border: 'border-blue-700/30', dot: 'bg-blue-400', title: 'text-blue-300' },
  rose: { badge: 'bg-rose-900/40 text-rose-300 border-rose-700/50', border: 'border-rose-700/30', dot: 'bg-rose-400', title: 'text-rose-300' },
}

function ExampleCard({ title, summary, detail, color }: { title: string; summary: string; detail: string; color: string }) {
  const [open, setOpen] = useState(false)
  const c = colorMap[color]
  return (
    <div className={`border ${c.border} rounded-lg bg-stone-900/60 overflow-hidden`}>
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-stone-800/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${c.title}`}>{title}</div>
          <div className="text-sm text-stone-400 mt-0.5">{summary}</div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-stone-500 flex-shrink-0 mt-1" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-stone-800">
          <p className="text-stone-300 text-sm leading-relaxed">{detail}</p>
        </div>
      )}
    </div>
  )
}

function ConstraintSection({ constraint }: { constraint: typeof constraints[0] }) {
  const [open, setOpen] = useState(false)
  const c = colorMap[constraint.color]
  return (
    <div className="mb-4">
      <button
        className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl border ${c.badge} text-left font-semibold transition-colors hover:opacity-90`}
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
        Design Constraint: {constraint.label}
      </button>
      {open && (
        <div className="mt-2 space-y-3 pl-2">
          {constraint.examples.map((ex) => (
            <ExampleCard key={ex.title} {...ex} color={constraint.color} />
          ))}
        </div>
      )}
    </div>
  )
}

const qualityNotes = [
  { label: 'Strong', items: ['A repeating structural feature, not a one-time event', 'Specifies sequence, timing, prompts, what the guide says, what students do', 'Names what happens when it goes sideways', 'Cultural humility built in — local community as co-facilitators, not scenery'] },
  { label: 'Weak', items: ['Vague principle (e.g., "we\'ll have honest conversations")', 'A one-time workshop or off-the-shelf program that doesn\'t fit the cohort', 'Local community featured but not consulted', 'Design treats the local community as a teaching prop'] },
]

export default function ExamplesTab() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Worked Examples</h2>
        <p className="text-stone-400">Strong submissions for Build 2 — The Cohort Experience. Click any constraint to see what good looks like.</p>
      </div>

      <div className="space-y-3 mb-10">
        {constraints.map((c) => (
          <ConstraintSection key={c.id} constraint={c} />
        ))}
      </div>

      <div className="rounded-xl border border-stone-700 overflow-hidden">
        <div className="px-5 py-4 bg-stone-800/60 border-b border-stone-700">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">What Makes a Submission Strong vs. Weak</h3>
        </div>
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-700">
          {qualityNotes.map(({ label, items }) => (
            <div key={label} className="p-5">
              <div className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3 ${label === 'Strong' ? 'bg-green-900/50 text-green-300' : 'bg-rose-900/50 text-rose-300'}`}>
                {label}
              </div>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-300">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${label === 'Strong' ? 'bg-green-400' : 'bg-rose-400'}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
