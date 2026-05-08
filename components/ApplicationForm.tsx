'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, Upload, Link2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, Users, Globe, Calendar } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────

interface FormData {
  full_name: string; email: string; phone: string; role_at_alpha: string
  campus: string; years_at_alpha: string; direct_manager: string; head_of_school: string
  languages_spoken: string; prior_international_travel: string
  developing_world_experience: string; health_considerations: string
  family_obligations: string; emergency_contact: string
  build1_link: string; build2_design_link: string; build2_video_link: string
  build3_video_link: string; build4_language_link: string
  reference1_name: string; reference1_role: string; reference1_relationship: string
  reference1_phone: string; reference1_email: string
  reference2_name: string; reference2_role: string; reference2_relationship: string
  reference2_phone: string; reference2_email: string
  manager_endorsement_status: string; manager_endorsement_text: string
  endorser_name: string; endorser_role: string
  ack_1: boolean; ack_2: boolean; ack_3: boolean; ack_4: boolean
  ack_5: boolean; ack_6: boolean; ack_7: boolean; ack_8: boolean
  applicant_name: string
}

const initialForm: FormData = {
  full_name: '', email: '', phone: '', role_at_alpha: '', campus: '', years_at_alpha: '',
  direct_manager: '', head_of_school: '', languages_spoken: '', prior_international_travel: '',
  developing_world_experience: '', health_considerations: '', family_obligations: '', emergency_contact: '',
  build1_link: '', build2_design_link: '', build2_video_link: '', build3_video_link: '', build4_language_link: '',
  reference1_name: '', reference1_role: '', reference1_relationship: '', reference1_phone: '', reference1_email: '',
  reference2_name: '', reference2_role: '', reference2_relationship: '', reference2_phone: '', reference2_email: '',
  manager_endorsement_status: '', manager_endorsement_text: '', endorser_name: '', endorser_role: '',
  ack_1: false, ack_2: false, ack_3: false, ack_4: false,
  ack_5: false, ack_6: false, ack_7: false, ack_8: false,
  applicant_name: '',
}

const STEPS = [
  { id: 1, label: 'About You',        desc: 'Background & contact info' },
  { id: 2, label: 'The Builds',       desc: '3 required + 1 optional' },
  { id: 3, label: 'Submission Check', desc: 'Confirm all links' },
  { id: 4, label: 'References',       desc: '2 references + endorsement' },
  { id: 5, label: 'Sign & Submit',    desc: 'Acknowledgments & signature' },
]

// ─── Progress helper ──────────────────────────────────────────────────────────

function calcProgress(form: FormData): number {
  const keys = Object.keys(form) as (keyof FormData)[]
  const filled = keys.filter(k => {
    const v = form[k]
    return typeof v === 'boolean' ? v : Boolean(v && String(v).trim())
  }).length
  return Math.round((filled / keys.length) * 100)
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box = { sm: 'w-7 h-7 text-sm rounded-lg', md: 'w-9 h-9 text-base rounded-xl', lg: 'w-12 h-12 text-2xl rounded-2xl' }[size]
  const main = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' }[size]
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${box} bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0`}>
        <span className="font-black text-blue-300 leading-none">α</span>
      </div>
      <div className="leading-tight">
        <div className={`font-black text-white uppercase tracking-wider ${main}`}>Alpha World</div>
        <div className="text-xs font-bold text-white/40 uppercase tracking-widest">School</div>
      </div>
    </div>
  )
}

// ─── Field components ─────────────────────────────────────────────────────────
// ─── KV Storage API Helper ────────────────────────────────────────────────────

async function saveToKV(key: string, data: FormData) {
  try {
    const response = await fetch('/api/kv-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data, timestamp: new Date().toISOString() })
    })
    return response.ok
  } catch (error) {
    console.error('KV save failed:', error)
    return false
  }
}

async function loadFromKV(key: string): Promise<FormData | null> {
  try {
    const response = await fetch(`/api/kv-load?key=${key}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.data || null
  } catch (error) {
    console.error('KV load failed:', error)
    return null
  }
}

// ─── Field components ────────────────────────────────────────────────────────

function Input({ label, name, value, onChange, required, placeholder, type = 'text', hint }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; type?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-white/30 mb-1.5">{hint}</p>}
      <input
        type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 transition-all text-sm"
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all"
      />
    </div>
  )
}

function Textarea({ label, name, value, onChange, required, placeholder, rows = 3, hint }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  required?: boolean; placeholder?: string; rows?: number; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-white/40 mb-1.5">{hint}</p>}
      <textarea
        name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 transition-all resize-none text-sm"
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all"
      />
    </div>
  )
}

// ─── Video Input ──────────────────────────────────────────────────────────────

function VideoInput({ label, name, value, onValueChange, placeholder, required }: {
  label: string; name: string; value: string
  onValueChange: (name: string, val: string) => void
  placeholder?: string; required?: boolean
}) {
  const [mode, setMode] = useState<'link' | 'upload'>('link')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadError(null)
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage
      .from('video-submissions').upload(fileName, file, { upsert: true })
    if (error) { setUploadError('Upload failed. Try pasting a link instead.'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('video-submissions').getPublicUrl(data.path)
    onValueChange(name, urlData.publicUrl)
    setUploading(false)
  }

  const isUploaded = value && value.includes('supabase')

  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      <div className="flex gap-1 mb-2">
        {(['link', 'upload'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              mode === m ? 'bg-blue-500/15 text-blue-300 border-blue-400/30' : 'text-white/30 border-white/10 hover:border-white/20 hover:text-white/50'
            }`}>
            {m === 'link' ? <><Link2 className="w-3 h-3" /> Paste Link</> : <><Upload className="w-3 h-3" /> Upload File</>}
          </button>
        ))}
      </div>
      {mode === 'link' ? (
        <div>
          <input type="text" name={name} value={value} onChange={e => onValueChange(name, e.target.value)}
            placeholder={placeholder || 'YouTube, Loom, Zoom, Google Drive…'}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/20 transition-all text-sm"
          />
          <p className="text-xs text-white/20 mt-1">Accepted: YouTube · Loom · Zoom · Google Drive · Vimeo · Dropbox</p>
        </div>
      ) : (
        <div>
          <label className={`flex flex-col items-center justify-center gap-2 w-full border border-dashed rounded-lg px-4 py-6 cursor-pointer transition-all ${
            uploading ? 'border-blue-400/30 bg-blue-500/5' : isUploaded ? 'border-emerald-400/30 bg-emerald-500/5' : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
          }`}>
            <input type="file" accept="video/*" className="sr-only" onChange={handleFileChange} disabled={uploading} />
            {uploading
              ? <><div className="w-5 h-5 border-2 border-blue-400/50 border-t-blue-400 rounded-full animate-spin" /><span className="text-xs text-blue-300 font-medium">Uploading…</span></>
              : isUploaded
              ? <><CheckCircle className="w-5 h-5 text-emerald-400" /><span className="text-xs text-emerald-300 font-medium">Video uploaded ✓</span></>
              : <><Upload className="w-5 h-5 text-white/25" /><span className="text-xs text-white/40 font-medium">Click to select video file</span><span className="text-xs text-white/20">MP4, MOV, WebM · up to 500 MB</span></>
            }
          </label>
          {uploadError && <p className="text-xs text-rose-400 mt-1">{uploadError}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Build card (accordion) ───────────────────────────────────────────────────

function BuildCard({ number, title, meta, optional, filled, children }: {
  number: string; title: string; meta?: [string, string][]
  optional?: boolean; filled?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3.5 bg-white/[0.04] hover:bg-white/[0.07] flex items-center gap-3 text-left transition-colors"
      >
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${
          filled ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
          optional ? 'border-white/15 text-white/25' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
        }`}>
          {filled ? '✓' : number}
        </span>
        <div className="flex-1">
          {optional && <span className="text-xs font-bold text-white/25 uppercase tracking-wider">Optional · </span>}
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white/25 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />}
      </button>
      {open && (
        <>
          {meta && (
            <div className="grid grid-cols-3 border-t border-white/8">
              {meta.map(([k, v]) => (
                <div key={k} className="px-4 py-2.5 border-r last:border-r-0 border-white/8">
                  <div className="text-xs text-white/25 uppercase tracking-wider mb-0.5">{k}</div>
                  <div className="text-xs text-white/50">{v}</div>
                </div>
              ))}
            </div>
          )}
          <div className="p-5 space-y-4 border-t border-white/8">{children}</div>
        </>
      )}
    </div>
  )
}

// ─── Inline examples (Build 2) ────────────────────────────────────────────────

const constraints = [
  { id: 'conflict', label: 'Conflict by Week 5', color: 'amber' as const, examples: [
    { title: 'The Sunday Council', detail: "Every Sunday at 6pm, the cohort sits in a circle for 30 minutes. Each person gets 90 seconds to name one thing they appreciated about another cohort member, and one thing that's grating on them." },
    { title: 'The Repair Protocol', detail: 'Cohort agrees in week 1 to a written 4-step protocol. When something happens, say "I need a Repair." Within 24 hours, sit with a guide for 20 minutes using a specific 4-question template.' },
  ]},
  { id: 'energy', label: 'Energy Drop at Mid-Rotation', color: 'emerald' as const, examples: [
    { title: 'Friday Bring-Your-Best', detail: 'Every Friday afternoon, one cohort member leads a 30-minute recharge activity. Rotates so every kid gets two slots per rotation.' },
    { title: 'The Midpoint Reset Day', detail: 'Built into the calendar at the exact midpoint of each rotation. Morning: solo journaling. Afternoon: cohort names one behavior to recommit to.' },
  ]},
  { id: 'cultural', label: 'Cultural Missteps', color: 'blue' as const, examples: [
    { title: 'The What-We-Got-Wrong Debrief', detail: "Friday evenings in the local language, co-facilitated by the local guide. Each cohort member shares one cultural moment where they messed up." },
    { title: 'The Cultural Compass', detail: "A 60-minute pre-arrival workshop covering 20 specific cultural norms, then role-playing 10 hard scenarios." },
  ]},
  { id: 'homesick', label: 'Someone Wants to Go Home (Week 10)', color: 'rose' as const, examples: [
    { title: 'Buddy-Up Pairs', detail: "Every cohort member is paired with one peer they're responsible for. Daily 5-minute check-ins, weekly 30-minute deeper conversation." },
    { title: 'The Sunday Letter Home', detail: 'Every Sunday at 4pm, every cohort member writes a letter or records a voice memo to someone back home.' },
  ]},
  {
    id: 'conflict', label: 'Conflict by Week 5', color: 'amber' as const,
    examples: [
      { title: 'The Sunday Council', detail: "Every Sunday at 6pm, the cohort sits in a circle for 30 minutes. Each person gets 90 seconds to name one thing they appreciated about another cohort member." },
      { title: 'The Repair Protocol', detail: 'Cohort agrees in week 1 to a written 4-step protocol. When something happens, say "I need a Repair." Within 24 hours, sit with a guide for 20 minutes using the protocol.' },
    ],
  },
  {
    id: 'energy', label: 'Energy Drop at Mid-Rotation', color: 'emerald' as const,
    examples: [
      { title: 'Friday Bring-Your-Best', detail: 'Every Friday afternoon, one cohort member leads a 30-minute recharge activity. Rotates so every kid gets two slots per rotation.' },
      { title: 'The Midpoint Reset Day', detail: 'Built into the calendar at the exact midpoint of each rotation. Morning: solo journaling. Afternoon: cohort names one behavior to recommit to.' },
    ],
  },
  {
    id: 'cultural', label: 'Cultural Missteps', color: 'blue' as const,
    examples: [
      { title: 'The What-We-Got-Wrong Debrief', detail: "Friday evenings in the local language, co-facilitated by the local guide. Each cohort member shares one cultural moment where they learned." },
      { title: 'The Cultural Compass', detail: "A 60-minute pre-arrival workshop covering 20 specific cultural norms, then role-playing 10 hard scenarios. By naming the likely misstep ahead of time, we build competence." },
    ],
  },
  {
    id: 'homesick', label: 'Someone Wants to Go Home (Week 10)', color: 'rose' as const,
    examples: [
      { title: 'Buddy-Up Pairs', detail: "Every cohort member is paired with one peer they're responsible for. Daily 5-minute check-ins, weekly 30-minute deeper conversation on Sundays." },
      { title: 'The Sunday Letter Home', detail: 'Every Sunday at 4pm, every cohort member writes a letter or records a voice memo to someone back home. Then each shares one sentence with the cohort.' },
    ],
  },
]

const dotColor = { amber: 'bg-amber-400', emerald: 'bg-emerald-400', blue: 'bg-blue-400', rose: 'bg-rose-400' }
const labelColor = { amber: 'text-amber-300 border-amber-400/20 bg-amber-400/10', emerald: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10', blue: 'text-blue-300 border-blue-400/20 bg-blue-400/10', rose: 'text-rose-300 border-rose-400/20 bg-rose-400/10' }

function ExampleItem({ title, detail }: { title: string; detail: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border ${c.border} rounded-lg bg-white/5 overflow-hidden`}>
      <button className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors" onClick={() => setOpen(!open)}>
        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${c.title}`}>{title}</div>
          <div className="text-xs text-white/40 mt-0.5">{summary}</div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-white/10"><p className="text-white/60 text-sm leading-relaxed">{detail}</p></div>}
    </div>
  )
}

function ExamplesInline() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-3">
      <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border ${c.badge} text-left text-sm font-semibold transition-colors hover:opacity-90`} onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
        {constraint.label}
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button className="w-full flex items-center justify-between px-5 py-3 bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-left" onClick={() => setOpen(o => !o)}>
        <span className="text-xs font-black text-white/50 uppercase tracking-widest">Worked Examples</span>
        <span className="flex items-center gap-1.5 text-xs text-white/25">
          {open ? 'Hide' : 'See what strong looks like'}
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 pl-1">
          {constraint.examples.map(ex => <ExampleCard key={ex.title} {...ex} color={constraint.color} />)}
        </div>
      )}
    </div>
  )
}

function ExamplesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 my-10 bg-[#0d1b2e] rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0d1b2e] rounded-t-2xl">
          <div>
            <h2 className="font-bold text-white">Worked Examples — Build 2</h2>
            <p className="text-xs text-white/40 mt-0.5">Click any constraint to see what a strong submission looks like</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 ml-4 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          {constraints.map(c => <ConstraintSection key={c.id} constraint={c} />)}
          <div className="mt-5 rounded-xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">Strong vs. Weak</h3>
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {[
                { label: 'Strong', color: 'green', items: ['A repeating structural feature, not a one-time event', 'Specifies sequence, timing, prompts, what the guide says', 'Names what happens when it goes sideways', 'Local community as co-facilitators, not scenery'] },
                { label: 'Weak', color: 'rose', items: ["Vague principle (\"we'll have honest conversations\")", "A one-time workshop that doesn't fit the cohort", 'Local community featured but not consulted', 'Design treats the community as a teaching prop'] },
              ].map(({ label, color, items }) => (
                <div key={label} className="p-4">
                  <div className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3 ${color === 'green' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>{label}</div>
                  <ul className="space-y-1.5">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${color === 'green' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Acknowledgments ──────────────────────────────────────────────────────────
// ─── Build card ──────────────────────────────────────────────────────────

function BuildCard({ number, title, meta, optional, children }: {
  number: string; title: string; meta?: [string, string][]; optional?: boolean; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="px-5 py-3.5 bg-white/[0.04] border-b border-white/8 flex items-center gap-3">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${optional ? 'border border-white/15 text-white/25' : 'bg-blue-500/20 border border-blue-400/30 text-blue-300'}`}>
          {number}
        </span>
        <div>
          {optional && <span className="text-xs font-bold text-white/25 uppercase tracking-wider">Optional · </span>}
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
      </div>
      {meta && (
        <div className="grid grid-cols-3 border-b border-white/8">
          {meta.map(([k, v]) => (
            <div key={k} className="px-4 py-2.5 border-r last:border-r-0 border-white/8">
              <div className="text-xs text-white/25 uppercase tracking-wider mb-0.5">{k}</div>
              <div className="text-xs text-white/50">{v}</div>
            </div>
          ))}
        </div>
      )}
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── Acknowledgments ─────────────────────────────────────────────────────────

const acknowledgments = [
  'I understand this is a job. It is not a vacation.',
  'I understand I will be the primary 24/7 caretaker for 5–7 students for multiple weeks at a time, including travel time and re-entry weeks.',
  'I understand I will be away from my home, family, and routines for two extended international rotations and one U.S.-based rotation.',
  "I understand I am responsible for upholding Alpha's three commitments in environments where our normal systems are not available.",
  'I understand I will hold both students AND myself to a high physical, mental, emotional, and academic standard for the full year.',
  'I understand that when something goes wrong — medical, emotional, logistical — I am the first responder.',
  'I understand that I represent Alpha to communities, parents, and partners who have trusted us with their kids and their land.',
  'My direct manager and Head of School are aware that I am applying.',
]

// ─── Draft helpers ────────────────────────────────────────────────────────────

const DRAFT_KEY = 'aws_guide_draft_id'

function getDraftId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(DRAFT_KEY)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DRAFT_KEY, id) }
  return id
// ─── Logo ────────────────────────────────────────────────────────────

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const mainText = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'
  const subText = size === 'lg' ? 'text-sm' : 'text-xs'
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size === 'lg' ? '48' : size === 'sm' ? '24' : '32'}
        height={size === 'lg' ? '48' : size === 'sm' ? '24' : '32'}
        viewBox="0 0 2793.08 1060.44"
        className="object-contain"
      >
        <path d="M568.05,118.7l141.02-77.83-59.86,185.66,107.9,111.72,15.28,73.59,159.91,83.28,3.75,61.63-100.47,64.53-161.96-30.78-61.98,56.6,58.3,308.28-187.08-165.57,57.38,271.84-190.69-200.38-28.8-89.65-92.41,204.48-44.79-197.55,19.32-99.06-132.53,89.79,57.24-174.98,39.41-48.61-124.32,39.62,96.65-162.74,73.02-52.22-131.39,5.73,167.05-114.34,130.55-40.61,63.68-128.92L585.11-1.3l-17.05,120.28v-.28ZM238.83,352.69l158.21-40.68,182.76,31.63,62.27-11.82-257.84-94.88-128.92,40.12-116.75,80.02,100.26-4.39ZM558.15,367.27l-284.93,84.55-130.76,150.99-41.04,125.38,107.97-73.45,99.69-121.7,174.77-66.44,74.29-99.06v-.28ZM191.35,520.88l72.45-83.63,279.49-83-145.54-25.12-153.96,39.62-91.98,65.66-72.38,121.7,111.94-35.38v.14ZM363.99,628.85l90.5-49.53,22.64-91.98-157.93,59.72-96.3,117.6-22.15,113.7,32.9,145.26c44.44-97.71,88.38-195.85,130.33-294.77ZM453.93,598.71l-76.84,42.03-46.06,107.76,33.33,103.66,147.38,155.17-50.59-239.51-7.08-169.11h-.14ZM593.95,357.93l37.36,34.95,106.13,14.15-66.79-63.68-76.7,14.58ZM766.1,427.41l-142.29-18.61-44.65-41.75-82.43,110.17-22.5,91.98,182.34-94.88,214.11,81.44-16.84-49.53,26.18-19.32-113.92-59.29v-.21ZM668.53,572.46l109.81-33.89-120.71-45.92-187.36,97.22,7.08,158.63,191.18-176.04ZM875.49,575.78l-77.83-25.75-94.03,29.08,128.63,24.48,43.23-27.81ZM916.17,505.52l-19.67-10.26-22.93,16.98,17.97,53.21,27.17-17.48-2.55-42.45ZM680.27,75.89l-115.12,63.68-10.12,70.76,197.34,187.5-10.68-51.51-111.37-115.33,49.95-155.1ZM597.13,661.05l-115.19,106.13,162.74,144.06-47.27-249.98-.28-.21ZM638.24,312.86l-100.9-96.09,26.11-183.96-108.47,71.39-59.15,119.29,242.41,89.37Z" fill="white" fillRule="evenodd"/>
        <path d="M1338.37,726.14h63.68l-142.5-227.76c-4.11-7.37-10.12-13.5-17.4-17.77-7.28-4.27-15.56-6.52-24-6.52s-16.72,2.25-24,6.52c-7.28,4.27-13.28,10.41-17.39,17.77l-143.14,227.76h63.26l35.02-56.6h170.66l35.8,56.6ZM1217.23,529.79l59.65,97.29h-119.29l59.65-97.29ZM1678,726.14v-47.05h-146.46c-34.67,0-44.08-11.18-44.08-39.76v-159.77h-54.62v161.96c0,62.19,21.23,84.91,94.03,84.91l151.13-.28ZM1896.84,655.38c71.96,0,92.56-16.27,92.56-75.21v-21.23c0-58.23-22.09-79.53-92.56-79.53h-197.41v246.73h54.91v-70.76h142.5ZM1934.42,578.26c0,26.04-9.34,32.9-38.28,32.9h-141.79v-84.27h141.01c29.64,0,38.99,7.57,38.99,34.39v16.98h.07ZM2335.89,726.14v-246.58h-54.63v100.47h-180.71v-100.47h-54.97v246.58h54.97v-98.35h180.71v98.35h54.63ZM2686.69,726.14h63.68l-142.5-227.76c-4.11-7.37-10.11-13.5-17.4-17.77-7.27-4.27-15.56-6.52-24-6.52s-16.71,2.25-24,6.52c-7.27,4.27-13.27,10.41-17.38,17.77l-143.14,227.76h63.25l35.02-56.6h170.66l35.8,56.6ZM2565.55,529.79l59.66,97.29h-119.3l59.64-97.29Z" fill="white" fillRule="evenodd"/>
      </svg>
      <div className="leading-tight">
        <div className={`font-black text-white uppercase tracking-wider ${mainText}`}>Alpha World</div>
        <div className={`font-bold text-white/40 uppercase tracking-widest ${subText}`}>School</div>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

const DRAFT_KEY = 'aws_guide_draft_id'

function getDraftId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(DRAFT_KEY)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DRAFT_KEY, id) }
  return id
}

export default function ApplicationForm() {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalSteps = STEPS.length

  // Load existing draft on mount
  useEffect(() => {
    const id = localStorage.getItem(DRAFT_KEY)
    if (!id) return
    supabase.from('guide_applications').select('*').eq('id', id).eq('status', 'draft').single()
      .then(({ data }) => {
        if (!data) return
        const { id: _id, created_at: _ca, updated_at: _ua, status: _s, admin_notes: _an, draft_step, ...fields } = data
        setForm(f => ({ ...f, ...fields }))
        if (draft_step) setStep(draft_step)
        setStarted(true)
      })
  }, [])

  const saveDraft = useCallback((formData: FormData, currentStep: number) => {
    const id = getDraftId()
    setSaveState('saving')
    supabase.from('guide_applications')
      .upsert({ id, ...formData, status: 'draft', draft_step: currentStep }, { onConflict: 'id' })
      .then(() => {
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      })
  const totalSteps = STEPS.length

  useEffect(() => {
    const id = localStorage.getItem(DRAFT_KEY)
    if (!id) return
    supabase.from('guide_applications').select('*').eq('id', id).eq('status', 'draft').single()
      .then(({ data }) => {
        if (!data) return
        const { id: _id, created_at: _ca, updated_at: _ua, status: _s, admin_notes: _an, draft_step, ...fields } = data
        setForm(f => ({ ...f, ...fields }))
        if (draft_step) setStep(draft_step)
        setStarted(true)
      })
  }, [])

  const saveDraft = useCallback((formData: FormData, currentStep: number) => {
    const id = getDraftId()
    setSaveState('saving')
    supabase.from('guide_applications')
      .upsert({ id, ...formData, status: 'draft', draft_step: currentStep }, { onConflict: 'id' })
      .then(() => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000) })
  const [lastSaved, setLastSaved] = useState<string>('')

  const totalSteps = STEPS.length

  // ─── Auto-save to KV ───
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      const kvKey = `app_draft_${form.full_name || 'unnamed'}_${new Date().toISOString().split('T')[0]}`
      const saved = await saveToKV(kvKey, form)
      if (saved) {
        setLastSaved(new Date().toLocaleTimeString())
      }
    }, 1000) // Save 1 second after last change

    return () => clearTimeout(saveTimer)
  }, [form])

  // ─── Load draft on mount ───
  useEffect(() => {
    const loadDraft = async () => {
      const draftKey = localStorage.getItem('currentDraftKey')
      if (draftKey) {
        const savedData = await loadFromKV(draftKey)
        if (savedData) {
          setForm(savedData)
        }
      }
    }
    loadDraft()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const updated = { ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }
    setForm(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(updated, step), 1500)
  }

  const handleStepChange = (newStep: number) => {
    setStep(newStep)
    saveDraft(form, newStep)
  const handleVideoValue = (name: string, val: string) => {
    const updated = { ...form, [name]: val }
    setForm(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(updated, step), 1500)
  }

  const handleStepChange = (newStep: number) => {
    setStep(newStep)
    saveDraft(form, newStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setForm(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }
      // Save draft key for recovery
      if (updated.full_name) {
        const draftKey = `app_draft_${updated.full_name}_${new Date().toISOString().split('T')[0]}`
        localStorage.setItem('currentDraftKey', draftKey)
      }
      return updated
    })
  }

  const allAcksChecked = [1,2,3,4,5,6,7,8].every(n => form[`ack_${n}` as keyof FormData])

  const handleSubmit = async () => {
    if (!allAcksChecked) { setError('Please check all acknowledgments before submitting.'); return }
    setSubmitting(true); setError(null)
    const id = getDraftId()
    const { error: dbError } = await supabase.from('guide_applications')
      .upsert({ id, ...form, status: 'submitted', draft_step: totalSteps }, { onConflict: 'id' })
    if (dbError) { setError('Something went wrong. Please try again or email apply@alphaworldschool.com.'); setSubmitting(false); return }
    localStorage.removeItem(DRAFT_KEY)
    if (dbError) { setError('Something went wrong. Please try again.'); setSubmitting(false); return }
    localStorage.removeItem(DRAFT_KEY)
    const { error: dbError } = await supabase.from('guide_applications').insert([form])
    if (dbError) { setError('Something went wrong. Please try again or email apply@alphaworldschool.com.'); setSubmitting(false); return }
    // Clear draft on successful submission
    localStorage.removeItem('currentDraftKey')
    setSubmitted(true); setSubmitting(false)
  }

  const progress = (step / totalSteps) * 100

  // ── Success ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlphaLogo className="w-12 h-12 text-blue-400 mx-auto mb-6" />
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Application Received</p>
          <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">You&rsquo;re In The Pool.</h2>
          <p className="text-white/50 text-base mb-2">We have your application on file.</p>
          <p className="text-white/30 text-sm">Our team will review it carefully. You'll hear from us when decisions are made.</p>
        <div className="text-center max-w-sm">
          <Logo size="lg" />
          <div className="mt-8 w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Application Received</p>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">You&rsquo;re In The Pool.</h2>
          <p className="text-white/40 text-sm">Our team will review carefully. You&apos;ll hear from us when decisions are made.</p>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <AlphaLogo className="w-7 h-7 text-white/80" />
            <div>
              <span className="text-white font-black text-xs tracking-widest uppercase">Alpha World School</span>
              <span className="text-white/30 text-xs block leading-none tracking-wide uppercase">For Guides</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider px-4 py-1.5 rounded-full border border-white/10">For Students</span>
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider px-4 py-1.5 rounded-full">For Parents</span>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="flex items-center gap-3 mb-8 opacity-60">
            <AlphaLogo className="w-5 h-5 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">Alpha World School</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-none mb-6 max-w-3xl">
            Guide Application
          </h1>

          <p className="text-white/50 text-lg md:text-xl max-w-xl mb-4 leading-relaxed">
            This is not a year off. This is the hardest job Alpha has ever asked anyone to do — and the most rewarding year of your career.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-12">
            {['38 Weeks', '3 Continents', '20 Students', 'Kenya · Ecuador · USA'].map((stat, i) => (
              <span key={stat} className="flex items-center gap-2 text-white/40 text-sm">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-white/20" />}
                {stat}
              </span>
        <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <Logo />
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Inaugural Cohort · 2026–2027</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-4">
            Guide<br/>Application
          </h1>
          <p className="text-white/40 text-sm md:text-base max-w-lg mb-3 leading-relaxed">
            This is not a year off. This is the hardest job Alpha has ever asked anyone to do — and the most rewarding year of your career.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-8 text-white/30 text-xs">
            {['38 Weeks', '3 Continents', '20 Students', 'Kenya · Ecuador · USA'].map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-white/15" />}{s}
              </span>
            ))}

          {/* Stats with icons */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 w-full max-w-2xl">
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-sm font-bold text-white">20 Students</span>
              <span className="text-xs text-white/30">Selected</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col items-center gap-2">
              <Globe className="w-8 h-8 text-emerald-400" />
              <span className="text-sm font-bold text-white">3 Continents</span>
              <span className="text-xs text-white/30">Kenya · Ecuador · USA</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col items-center gap-2">
              <Calendar className="w-8 h-8 text-amber-400" />
              <span className="text-sm font-bold text-white">1 School Year</span>
              <span className="text-xs text-white/30">38 Weeks</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-8 w-full max-w-xs text-left">
            <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-1 text-center">{totalSteps} Sections</p>
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/8">
                <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center text-xs text-white/25 font-bold flex-shrink-0">{i + 1}</span>
                <div>
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wide">{s.label}</span>
                  <span className="text-xs text-white/20 ml-2">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button onClick={() => setStarted(true)}
              className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-wider text-sm rounded-full transition-colors shadow-lg shadow-blue-500/20">
              Apply Now <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://world.alpha.school"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 text-white/60 hover:text-white font-bold uppercase tracking-wider text-sm rounded-full border border-white/20 hover:border-white/40 transition-colors"
            <a href="https://world.alpha.school" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3 text-white/45 hover:text-white font-bold uppercase tracking-wider text-sm rounded-full border border-white/15 hover:border-white/30 transition-colors">
              className="flex items-center gap-2 px-8 py-3.5 text-white/45 hover:text-white font-bold uppercase tracking-wider text-sm rounded-full border border-white/15 hover:border-white/30 transition-colors"
            >
              Explore the Program
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 grid grid-cols-3">
          {[['20', 'Students Selected'], ['3', 'Continents'], ['1', 'School Year']].map(([n, label]) => (
            <div key={label} className="py-8 flex flex-col items-center gap-1 border-r last:border-r-0 border-white/10">
              <span className="text-3xl font-black text-blue-400">{n}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/30">{label}</span>
        <div className="border-t border-white/8 px-6 py-8 flex flex-wrap justify-center gap-3">
          {[['20', 'Students Selected'], ['3', 'Continents'], ['1', 'School Year']].map(([n, label]) => (
            <div key={label} className="flex flex-col items-center gap-1 px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/10 min-w-[110px]">
              <span className="text-2xl font-black text-blue-400">{n}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/25">{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-white/10 sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlphaLogo className="w-8 h-8 text-white/80" />
            <div>
              <span className="text-white font-black text-sm tracking-wider uppercase">Alpha World School</span>
              <span className="text-white/30 text-xs block leading-none tracking-wide">Guide Application · 2026–2027</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
  // ── Form ──
  const progress = calcProgress(form)

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">

      {/* Top bar */}
      <header className="border-b border-white/8 sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            {saveState === 'saving' && <span className="text-xs text-white/25 animate-pulse">Saving…</span>}
            {saveState === 'saved' && <span className="text-xs text-emerald-400/70">Draft saved</span>}
            <span className="text-xs text-white/25 font-medium uppercase tracking-wider">Section {step} of {totalSteps}</span>
            {saveState === 'saved' && <span className="text-xs text-emerald-400/70">Saved ✓</span>}
            <span className="text-xs text-white/40 font-bold tabular-nums">{progress}%</span>
            <span className="text-xs text-white/25 uppercase tracking-wider">Section {step}/{totalSteps}</span>
          </div>
        </div>
        {/* Progress bar — fills based on fields completed */}
        <div className="h-1.5 bg-white/[0.07]">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }} />
            <span className="text-xs text-white/25 font-medium uppercase tracking-wider">Section {step} of {totalSteps}</span>
            {lastSaved && <span className="text-xs text-emerald-400 font-medium">✓ Saved {lastSaved}</span>}
          </div>
        </div>
        <div className="h-1 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 shadow-lg shadow-blue-500/50"
            style={{ width: `${progress}%` }} 
          />
        </div>
      </header>

      {/* ── Step indicators ── */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                  s.id === step  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                  s.id < step   ? 'text-white/40 hover:text-white/60 cursor-pointer' :
                  'text-white/20 cursor-default'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${
                  s.id === step  ? 'bg-blue-500 border-blue-400 text-white' :
                  s.id < step   ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                  'border-white/10 text-white/20'
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex gap-8">

        {/* Left sidebar */}
        <aside className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0 pt-1">
          <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-3 px-3">{totalSteps} Sections</p>
          {STEPS.map(s => {
            const done = s.id < step
            const active = s.id === step
            return (
              <button key={s.id} onClick={() => handleStepChange(s.id)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  active ? 'bg-blue-500/12 border border-blue-400/20' : 'hover:bg-white/[0.04]'
                }`}>
                <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border transition-all ${
                  active ? 'bg-blue-500 border-blue-400 text-white' :
                  done   ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
                  'border-white/12 text-white/20'
                }`}>
                  {s.id < step ? '✓' : s.id}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <span className="text-white/10 px-0.5">›</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

      {/* ── Step content ── */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">

        {/* STEP 1 — About You */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Step 1 of 5</p>
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">About You</h1>
              <p className="text-white/40 text-sm mt-2">Basic info. If a field does not apply, write "N/A."</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Jane Smith" />
              <Input label="Email" name="email" value={form.email} onChange={handleChange} required placeholder="jane@alpha.school" type="email" />
              <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
              <Input label="Current Role at Alpha" name="role_at_alpha" value={form.role_at_alpha} onChange={handleChange} required placeholder="e.g. Guide, Academic Coach" />
              <Input label="Campus" name="campus" value={form.campus} onChange={handleChange} placeholder="e.g. Austin, NYC" />
              <Input label="Years at Alpha" name="years_at_alpha" value={form.years_at_alpha} onChange={handleChange} placeholder="e.g. 2 years" />
              <Input label="Direct Manager" name="direct_manager" value={form.direct_manager} onChange={handleChange} placeholder="Name of direct manager" />
              <Input label="Head of School" name="head_of_school" value={form.head_of_school} onChange={handleChange} placeholder="Name of Head of School" />
            </div>
            <Textarea label="Languages Spoken" name="languages_spoken" value={form.languages_spoken} onChange={handleChange} placeholder="English (native), Spanish (conversational), Swahili (basic)" hint="Note proficiency: conversational, fluent, or native" />
            <Textarea label="Prior International Travel" name="prior_international_travel" value={form.prior_international_travel} onChange={handleChange} placeholder="Kenya (3 weeks, community development), Ecuador (1 month, volunteer teaching)..." hint="List countries, length of stay, and purpose" rows={3} />
            <Textarea label="Developing-World Living Experience" name="developing_world_experience" value={form.developing_world_experience} onChange={handleChange} placeholder="Yes — spent 6 weeks in rural Guatemala..." hint="Have you spent 2+ weeks living in a developing-world setting? Y/N — describe" rows={3} />
            <Textarea label="Health Considerations" name="health_considerations" value={form.health_considerations} onChange={handleChange} placeholder="Any current health considerations relevant to extended international travel..." rows={2} />
            <Textarea label="Personal or Family Obligations" name="family_obligations" value={form.family_obligations} onChange={handleChange} placeholder="Partner, children, caregiving responsibilities..." hint="Relevant to a 38-week commitment" rows={3} />
            <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleChange} placeholder="Name, relationship, phone number" />
          </div>
        )}

        {/* STEP 2 — The Builds */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Step 2 of 5</p>
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">The Builds</h1>
              <p className="text-white/40 text-sm mt-2">Three required Builds. One optional fourth. Submit each to the shared Drive folder from your invitation email.</p>
            </div>

            <BuildCard number="1" title="The Workshop Sprint" testing="Life skills design, project orientation, taste, AI fluency" time="2 hours max" deliverable="Workshop artifact (slides / Notion / one-pager)">
              <p className="text-white/50 text-sm leading-relaxed">
                Design and produce a real 90-minute kickoff workshop for your cohort of 5–7 students — anchored in one of: <span className="text-white/80 font-medium">Food · Water · Empowerment · Education · Healthcare · Culture & Conservation · Community</span>. The workshop should launch a real project with a real output the community actually uses.
              </p>
              <Input label="Build 1 Link or File Name" name="build1_link" value={form.build1_link} onChange={handleChange} placeholder="https://docs.google.com/... or Smith_Jane_Build1.pdf" />
            </BuildCard>

            <BuildCard number="2" title="The Cohort Experience" testing="Anticipating breaking points, design instinct, cultural humility" time="1.5–2 hours" deliverable="Two links: experience design + 3-min walkthrough video">
              <div className="text-white/50 text-sm leading-relaxed space-y-2">
                <p>Design something that prevents a cohort from breaking. Pick one design constraint:</p>
                <ul className="space-y-1 ml-4">
                  {['Assume your cohort has conflict by week 5.', 'Assume energy drops by mid-rotation.', 'Assume cultural missteps happen.', 'Assume someone wants to go home by week 10.'].map(c => (
                    <li key={c} className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">·</span> {c}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => setShowExamples(true)} className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider mt-1 transition-colors border border-blue-400/30 hover:border-blue-400/60 px-3 py-1.5 rounded-full">
                  <BookOpen className="w-3.5 h-3.5" /> See worked examples
                </button>
          {/* Mobile steps */}
          <div className="flex md:hidden items-center gap-1.5 mb-6 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleStepChange(s.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border flex-shrink-0 transition-all ${
                    s.id === step ? 'bg-blue-500 border-blue-400 text-white' :
                    s.id < step  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
                    'border-white/12 text-white/20'
                  }`}>{s.id < step ? '✓' : s.id}</button>
                {i < STEPS.length - 1 && <span className="text-white/15 text-xs">›</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Design Doc Link" name="build2_design_link" value={form.build2_design_link} onChange={handleChange} placeholder="Link to one-pager, plan, or visual flow" />
                <Input label="3-Minute Video Link" name="build2_video_link" value={form.build2_video_link} onChange={handleChange} placeholder="YouTube, Loom, or Drive link" />
              </div>
            </BuildCard>

            <BuildCard number="3" title="The Video" testing="Self-awareness, honesty, mindset" time="20 minutes" deliverable="One 90-second to 2-minute video">
              <p className="text-white/50 text-sm leading-relaxed">
                Talk to us. 90 seconds to 2 minutes. Phone-quality is fine. Don't script. Don't read. <span className="text-white/80">(1) What are you most excited about for this year?</span> <span className="text-white/80">(2) What do you understand your role to be on this trip?</span>
              </p>
              <Input label="Video Link" name="build3_video_link" value={form.build3_video_link} onChange={handleChange} placeholder="YouTube, Loom, or Drive link" />
            </BuildCard>

            <BuildCard number="4" title="Language Tape" optional>
              <p className="text-white/50 text-sm leading-relaxed">
                If you speak a language other than English — especially Swahili, Spanish, or any language relevant to Kenya or Ecuador — talk to us in it. Anything natural. ≤60 seconds.
              </p>
              <Input label="Language Video Link (optional)" name="build4_language_link" value={form.build4_language_link} onChange={handleChange} placeholder="YouTube, Loom, or Drive link" />
            </BuildCard>
          </div>
        )}

        {/* STEP 3 — Submission Tracker */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Step 3 of 5</p>
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">Submission Check</h1>
              <p className="text-white/40 text-sm mt-2">Confirm your builds are uploaded and linked. Go back to fix anything missing.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Build 1 — Workshop Sprint', value: form.build1_link, required: true },
                { label: 'Build 2 — Cohort Experience (design doc)', value: form.build2_design_link, required: true },
                { label: 'Build 2 — Cohort Experience (3-min video)', value: form.build2_video_link, required: true },
                { label: 'Build 3 — The Video', value: form.build3_video_link, required: true },
                { label: 'Build 4 — Language Tape', value: form.build4_language_link, required: false },
              ].map(({ label, value, required }) => (
                <div key={label} className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${value ? 'bg-emerald-500/10 border-emerald-500/20' : required ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border ${value ? 'bg-emerald-500/20 border-emerald-500/40' : required ? 'bg-rose-500/10 border-rose-500/30' : 'border-white/10'}`}>
                    {value
                      ? <span className="text-emerald-400 font-black text-sm">✓</span>
                      : <span className={`text-xs font-bold ${required ? 'text-rose-400' : 'text-white/20'}`}>{required ? '!' : '–'}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold uppercase tracking-wide ${value ? 'text-emerald-300' : required ? 'text-rose-300' : 'text-white/30'}`}>{label}</div>
                    {value
                      ? <div className="text-xs text-white/30 truncate mt-0.5">{value}</div>
                      : <div className={`text-xs mt-0.5 ${required ? 'text-rose-400/70' : 'text-white/30'}`}>{required ? 'Missing — go back and add a link' : 'Optional — skip if not applicable'}</div>
                    }
                  </div>
                  {!value && required && (
                    <button onClick={() => setStep(2)} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider flex-shrink-0 border border-blue-400/30 px-3 py-1 rounded-full transition-colors">Fix</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 1 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">About You</h1>
                <p className="text-white/35 text-sm mt-1">Basic info. Write &quot;N/A&quot; if a field doesn&apos;t apply.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Jane Smith" />
                <Input label="Email" name="email" value={form.email} onChange={handleChange} required placeholder="jane@alpha.school" type="email" />
                <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                <Input label="Role at Alpha" name="role_at_alpha" value={form.role_at_alpha} onChange={handleChange} required placeholder="e.g. Guide, Academic Coach" />
                <Input label="Campus" name="campus" value={form.campus} onChange={handleChange} placeholder="e.g. Austin, NYC" />
                <Input label="Years at Alpha" name="years_at_alpha" value={form.years_at_alpha} onChange={handleChange} placeholder="e.g. 2 years" />
                <Input label="Direct Manager" name="direct_manager" value={form.direct_manager} onChange={handleChange} placeholder="Manager's name" />
                <Input label="Head of School" name="head_of_school" value={form.head_of_school} onChange={handleChange} placeholder="Head of School's name" />
              </div>
              <Textarea label="Languages Spoken" name="languages_spoken" value={form.languages_spoken} onChange={handleChange} placeholder="English (native), Spanish (conversational)..." hint="Note proficiency level for each" />
              <Textarea label="Prior International Travel" name="prior_international_travel" value={form.prior_international_travel} onChange={handleChange} placeholder="Kenya (3 weeks, community dev), Ecuador (1 month, teaching)..." rows={3} />
              <Textarea label="Developing-World Living Experience" name="developing_world_experience" value={form.developing_world_experience} onChange={handleChange} placeholder="Yes — 6 weeks in rural Guatemala..." hint="2+ weeks in a developing-world setting? Describe" rows={3} />
              <Textarea label="Health Considerations" name="health_considerations" value={form.health_considerations} onChange={handleChange} placeholder="Anything relevant to extended international travel..." rows={2} />
              <Textarea label="Personal or Family Obligations" name="family_obligations" value={form.family_obligations} onChange={handleChange} placeholder="Partner, children, caregiving responsibilities..." rows={2} />
              <Textarea label="Languages Spoken" name="languages_spoken" value={form.languages_spoken} onChange={handleChange} placeholder="English (native), Spanish (conversational)..." />
              <Textarea label="Prior International Travel" name="prior_international_travel" value={form.prior_international_travel} onChange={handleChange} placeholder="Kenya (3 weeks, community dev)..." />
              <Textarea label="Developing-World Living Experience" name="developing_world_experience" value={form.developing_world_experience} onChange={handleChange} placeholder="Yes — 6 weeks in rural..." />
              <Textarea label="Health Considerations" name="health_considerations" value={form.health_considerations} onChange={handleChange} placeholder="Anything relevant to extended international travel..." />
              <Textarea label="Personal or Family Obligations" name="family_obligations" value={form.family_obligations} onChange={handleChange} placeholder="Partner, children, caregiving responsibilities..." />
              <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleChange} placeholder="Name, relationship, phone" />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 2 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">The Builds</h1>
                <p className="text-white/35 text-sm mt-1">Three required, one optional. Click each to expand.</p>
              </div>

              <BuildCard number="1" title="The Workshop Sprint" filled={Boolean(form.build1_link)}
                meta={[['Testing', 'Life skills design'], ['Time', '2 hours max'], ['Deliverable', 'Slides / doc']]}>
                <p className="text-white/45 text-sm leading-relaxed">
                  Design a 90-minute kickoff workshop for your cohort — anchored in one of: <span className="text-white/70 font-medium">Food · Water · Empowerment · Education · Healthcare · Culture · Community</span>.
                  Design a real 90-minute kickoff workshop for your cohort of 5–7 students — anchored in one of: <span className="text-white/70 font-medium">Food · Water · Empowerment · Education</span>.
                </p>
                <Input label="Build 1 Link or File Name" name="build1_link" value={form.build1_link} onChange={handleChange} placeholder="https://docs.google.com/... or Smith_Jane_Build1.pdf" />
              </BuildCard>

              <BuildCard number="2" title="The Cohort Experience" filled={Boolean(form.build2_design_link && form.build2_video_link)}
                meta={[['Testing', 'Design instinct'], ['Time', '1.5–2 hours'], ['Deliverable', 'Doc + 3-min video']]}>
                <div className="text-white/45 text-sm space-y-2">
                  <p>Design something that prevents a cohort from breaking. Pick one constraint:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {['Conflict by week 5', 'Energy drop at mid-rotation', 'Cultural missteps', 'Someone wants to go home (week 10)'].map(c => (
                      <div key={c} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-white/45">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">·</span>{c}
                      </div>
                    ))}
                  </div>
                </div>
                <ExamplesInline />
                <Input label="Design Doc Link" name="build2_design_link" value={form.build2_design_link} onChange={handleChange} placeholder="One-pager, plan, or visual flow" />
                <VideoInput label="3-Minute Video" name="build2_video_link" value={form.build2_video_link} onValueChange={handleVideoValue} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Design Doc Link" name="build2_design_link" value={form.build2_design_link} onChange={handleChange} placeholder="https://docs.google.com/document/..." />
                  <Input label="3-Minute Video Link" name="build2_video_link" value={form.build2_video_link} onChange={handleChange} placeholder="https://youtube.com/... or Loom link" />
                </div>
              </BuildCard>

              <BuildCard number="3" title="The Video" filled={Boolean(form.build3_video_link)}
                meta={[['Testing', 'Self-awareness, honesty'], ['Time', '20 min'], ['Deliverable', '90 sec – 2 min']]}>
                <p className="text-white/45 text-sm leading-relaxed">
                  Talk to us. Phone quality fine. Don&apos;t script. <span className="text-white/65">(1) What are you most excited about?</span> <span className="text-white/65">(2) What do you understand about this job that others might not?</span>
                </p>
                <VideoInput label="Video" name="build3_video_link" value={form.build3_video_link} onValueChange={handleVideoValue} required />
                <Input label="Video Link" name="build3_video_link" value={form.build3_video_link} onChange={handleChange} placeholder="https://youtube.com/... or Loom link" />
              </BuildCard>

              <BuildCard number="4" title="Language Tape" optional filled={Boolean(form.build4_language_link)}>
                <p className="text-white/45 text-sm leading-relaxed">
                  Speak a language other than English — especially Swahili, Spanish, or relevant to Kenya or Ecuador. Anything natural. ≤60 seconds.
                </p>
                <VideoInput label="Language Video (optional)" name="build4_language_link" value={form.build4_language_link} onValueChange={handleVideoValue} />
                <Input label="Language Video Link (optional)" name="build4_language_link" value={form.build4_language_link} onChange={handleChange} placeholder="https://youtube.com/... or Loom link" />
              </BuildCard>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 3 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Submission Check</h1>
                <p className="text-white/35 text-sm mt-1">Confirm every build is linked. Click &ldquo;Fix&rdquo; to jump back.</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Build 1 — Workshop Sprint', value: form.build1_link, required: true },
                  { label: 'Build 2 — Design doc', value: form.build2_design_link, required: true },
                  { label: 'Build 2 — 3-min video', value: form.build2_video_link, required: true },
                  { label: 'Build 3 — The Video', value: form.build3_video_link, required: true },
                  { label: 'Build 4 — Language Tape', value: form.build4_language_link, required: false },
                ].map(({ label, value, required }) => (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${value ? 'bg-emerald-500/8 border-emerald-500/15' : required ? 'bg-rose-500/8 border-rose-500/15' : 'bg-white/[0.02] border-white/8'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black border ${value ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : required ? 'border-rose-400/30 text-rose-400' : 'border-white/10 text-white/20'}`}>
                  <div key={label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${value ? 'bg-emerald-500/8 border-emerald-500/15' : required ? 'bg-rose-500/8 border-rose-500/15' : 'bg-white/[0.02] border-white/8'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black border ${value ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : required ? 'bg-rose-500/20 border-rose-400/30 text-rose-400' : 'border-white/15 text-white/25'}`}>
                      {value ? '✓' : required ? '!' : '–'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-wide ${value ? 'text-emerald-300' : required ? 'text-rose-300' : 'text-white/20'}`}>{label}</div>
                      {value ? <div className="text-xs text-white/20 truncate mt-0.5">{value}</div>
                        : <div className={`text-xs mt-0.5 ${required ? 'text-rose-400/60' : 'text-white/15'}`}>{required ? 'Missing' : 'Optional'}</div>}
                    </div>
                    {!value && required && (
                      <button onClick={() => handleStepChange(2)} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider border border-blue-400/20 px-3 py-1 rounded-full flex-shrink-0 transition-colors">Fix</button>
                      {value
                        ? <div className="text-xs text-white/20 truncate mt-0.5"><a href={value} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 underline">{value}</a></div>
                        : <div className={`text-xs mt-0.5 ${required ? 'text-rose-400/60' : 'text-white/15'}`}>{required ? 'Missing — go back and add a link' : 'Optional'}</div>
                      }
                    </div>
                    {!value && required && (
                      <button onClick={() => setStep(2)} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider border border-blue-400/20 px-3 py-1 rounded-full flex-shrink-0">
                        Fix
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 4 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">References</h1>
                <p className="text-white/35 text-sm mt-1">Two internal Alpha references. One must be your direct manager or Head of School.</p>
              </div>
              {([
                { n: 1, fields: ['reference1_name', 'reference1_role', 'reference1_relationship', 'reference1_phone', 'reference1_email'] },
                { n: 2, fields: ['reference2_name', 'reference2_role', 'reference2_relationship', 'reference2_phone', 'reference2_email'] },
              ] as { n: number; fields: (keyof FormData)[] }[]).map(({ n, fields }) => (
                <div key={n} className="bg-white/[0.03] rounded-xl border border-white/8 p-5 space-y-4">
                  <p className="text-xs font-black text-white/25 uppercase tracking-widest">Reference {n}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[['Name', fields[0]], ['Role', fields[1]], ['Relationship', fields[2]], ['Phone', fields[3]], ['Email', fields[4]]].map(([label, fieldName]) => (
                      <Input key={String(fieldName)} label={String(label)} name={String(fieldName)} value={form[fieldName as keyof FormData] as string} onChange={handleChange} type={String(label) === 'Email' ? 'email' : 'text'} />
                    ))}
                  </div>
                </div>
              ))}

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Reference 2</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name" name="reference2_name" value={form.reference2_name} onChange={handleChange} />
                <Input label="Role" name="reference2_role" value={form.reference2_role} onChange={handleChange} />
                <Input label="Relationship to You" name="reference2_relationship" value={form.reference2_relationship} onChange={handleChange} />
                <Input label="Phone" name="reference2_phone" value={form.reference2_phone} onChange={handleChange} />
                <Input label="Email" name="reference2_email" value={form.reference2_email} onChange={handleChange} type="email" />
              </div>
            </div>

            <div className="bg-blue-500/10 rounded-2xl border border-blue-400/20 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-black text-blue-300 uppercase tracking-widest">Manager / Head of School Endorsement</h3>
                <p className="text-xs text-white/30 mt-1">To be filled out by the candidate's direct manager or Head of School — <em>not</em> by the candidate.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Has this guide had your verbal support to apply?</label>
                <div className="flex flex-wrap gap-3">
                  {['Yes', 'No', 'Conversation pending'].map(opt => (
                    <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm font-bold uppercase tracking-wide transition-all ${form.manager_endorsement_status === opt ? 'border-blue-400/60 bg-blue-500/20 text-blue-300' : 'border-white/10 text-white/30 hover:border-white/20'}`}>
                      <input type="radio" name="manager_endorsement_status" value={opt} checked={form.manager_endorsement_status === opt} onChange={handleChange} className="sr-only" />
                      {opt}
                    </label>
                  ))}
              <div className="bg-blue-500/8 rounded-xl border border-blue-400/12 p-5 space-y-4">
                <div>
                  <p className="text-xs font-black text-blue-300 uppercase tracking-widest">Manager / HoS Endorsement</p>
                  <p className="text-xs text-white/25 mt-1">To be completed by the candidate&apos;s direct manager or Head of School — not by the candidate.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/35 uppercase tracking-wider mb-2">Has this guide had your verbal support to apply?</label>
                  <div className="flex flex-wrap gap-2">
                    {['Yes', 'No', 'Conversation pending'].map(opt => (
                      <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-xs font-bold uppercase tracking-wide transition-all ${form.manager_endorsement_status === opt ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' : 'border-white/15 text-white/25 hover:border-white/30'}`}>
                        <input type="radio" name="manager_endorsement_status" value={opt} checked={form.manager_endorsement_status === opt} onChange={handleChange} className="sr-only" />{opt}
                      </label>
                    ))}
                  </div>
                </div>
                <Textarea label="Endorsement Statement (150 words minimum)" name="manager_endorsement_text" value={form.manager_endorsement_text} onChange={handleChange} placeholder="Is this guide ready for this commitment? Why?" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Endorser Name" name="endorser_name" value={form.endorser_name} onChange={handleChange} />
                  <Input label="Endorser Role" name="endorser_role" value={form.endorser_role} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Section 5 of {totalSteps}</p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Acknowledge & Sign</h1>
                <p className="text-white/35 text-sm mt-1">Check each line. Each one is something you are actually agreeing to.</p>
              </div>
              <div className="space-y-2">
                {acknowledgments.map((text, i) => {
                  const key = `ack_${i + 1}` as keyof FormData
                  return (
                    <label key={i} className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${form[key] ? 'border-blue-400/20 bg-blue-500/8' : 'border-white/8 bg-white/[0.02] hover:border-white/15'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${form[key] ? 'bg-blue-500 border-blue-400' : 'border-white/20'}`}>
                        {form[key] && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <input type="checkbox" name={key} checked={form[key] as boolean} onChange={handleChange} className="sr-only" />
                      <span className="text-sm text-white/50 leading-relaxed">{text}</span>
                    </label>
                  )
                })}
              </div>
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                <p className="text-white/20 text-sm mb-4 italic">I am submitting this application of my own volition. I have read everything in this packet.</p>
                <Input label="Full Name (Signature)" name="applicant_name" value={form.applicant_name} onChange={handleChange} required placeholder="Type your full legal name" />
              </div>
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-5 border-t border-white/8">
            <button
              onClick={() => step === 1 ? setStarted(false) : handleStepChange(step - 1)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white/25 hover:text-white/55 transition-colors rounded-full border border-transparent hover:border-white/8"
              onClick={() => step === 1 ? setStarted(false) : setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white/25 hover:text-white/55 transition-colors rounded-full border border-transparent hover:border-white/15"
            >
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Home' : 'Back'}
            </button>
            {step < totalSteps ? (
              <button
                onClick={() => handleStepChange(step + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 transition-colors"
              >
              <button onClick={() => handleStepChange(step + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting…' : <><span>Submit</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        )}

        {/* STEP 5 — Acknowledgments */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Step 5 of 5</p>
              <h1 className="text-4xl font-black text-white uppercase tracking-tight">Acknowledge & Sign</h1>
              <p className="text-white/40 text-sm mt-2">Check each line. Each one is a real thing you are agreeing to.</p>
            </div>
            <div className="space-y-3">
              {acknowledgments.map((text, i) => {
                const key = `ack_${i + 1}` as keyof FormData
                return (
                  <label key={i} className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${form[key] ? 'border-blue-400/30 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${form[key] ? 'bg-blue-500 border-blue-400' : 'border-white/20'}`}>
                      {form[key] && <span className="text-white text-xs font-black">✓</span>}
                    </div>
                    <input type="checkbox" name={key} checked={form[key] as boolean} onChange={handleChange} className="sr-only" />
                    <span className="text-sm text-white/60 leading-relaxed">{text}</span>
                  </label>
                )
              })}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white/30 text-sm mb-4 italic">I am submitting this application of my own volition. I have read everything in this packet. I understand what I am signing up for.</p>
              <Input label="Full Name (Signature)" name="applicant_name" value={form.applicant_name} onChange={handleChange} required placeholder="Type your full legal name" />
            </div>

            {error && (
              <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-rose-300 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white/30 hover:text-white/60 disabled:opacity-0 transition-colors rounded-full border border-transparent hover:border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 transition-colors shadow-lg"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-white text-[#0a1628] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 disabled:opacity-50 transition-colors shadow-lg"
            >
              {submitting ? 'Submitting…' : 'Submit Application'} {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {showExamples && <ExamplesModal onClose={() => setShowExamples(false)} />}
        </div>
      </div>
    </div>
  )
}
