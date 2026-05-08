'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  CheckCircle, AlertCircle, ChevronDown, ChevronRight,
  ArrowRight, ArrowLeft, ExternalLink, Info, Upload, Link2, X
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Field config — synced with admin settings ─────────────────────────
const DEFAULT_REQUIRED: Record<string, boolean> = {
  full_name: true, email: true, role_at_alpha: true,
  build1_link: true, build2_design_link: true, build2_video_link: true,
  build2_constraint: true, build3_video_link: true,
}

// ─── Types ────────────────────────────────────────────────────────────

interface FormData {
  full_name: string; email: string; phone: string; role_at_alpha: string
  campus: string; years_at_alpha: string; direct_manager: string; head_of_school: string
  languages_spoken: string
  prior_international_travel_yn: string; prior_international_travel: string
  developing_world_experience_yn: string; developing_world_experience: string
  health_considerations_yn: string; health_considerations: string
  family_obligations_yn: string; family_obligations: string
  emergency_contact: string
  build1_link: string; build2_design_link: string; build2_video_link: string
  build3_video_link: string; build4_language_link: string
  build2_constraint: string
  reference1_name: string; reference1_role: string; reference1_phone: string; reference1_email: string
  reference2_name: string; reference2_role: string; reference2_phone: string; reference2_email: string
  manager_endorsement_status: string; manager_endorsement_text: string
  endorser_name: string; endorser_role: string
  ack_1: boolean; ack_2: boolean; ack_3: boolean; ack_4: boolean
  ack_5: boolean; ack_6: boolean; ack_7: boolean; ack_8: boolean
  applicant_name: string
}

const initialForm: FormData = {
  full_name: '', email: '', phone: '', role_at_alpha: '', campus: '', years_at_alpha: '',
  direct_manager: '', head_of_school: '', languages_spoken: '',
  prior_international_travel_yn: '', prior_international_travel: '',
  developing_world_experience_yn: '', developing_world_experience: '',
  health_considerations_yn: '', health_considerations: '',
  family_obligations_yn: '', family_obligations: '',
  emergency_contact: '',
  build1_link: '', build2_design_link: '', build2_video_link: '', build3_video_link: '', build4_language_link: '',
  build2_constraint: '',
  reference1_name: '', reference1_role: '', reference1_phone: '', reference1_email: '',
  reference2_name: '', reference2_role: '', reference2_phone: '', reference2_email: '',
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

const DRAFT_KEY = 'aws_guide_draft_id'
function getDraftId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(DRAFT_KEY)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DRAFT_KEY, id) }
  return id
}

// ─── Primitives ───────────────────────────────────────────────────────

function Logo({ size = 'md', onClick }: { size?: 'sm' | 'md'; onClick?: () => void }) {
  const h = size === 'sm' ? 'h-8' : 'h-12'
  const t = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <button onClick={onClick} className="flex items-center gap-3">
      <img src="/alphahigh.png" alt="Alpha World School"
        className={`${h} w-auto object-contain`}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      <div className="leading-tight text-left">
        <div className={`font-black text-white uppercase tracking-wider ${t}`}>Alpha World</div>
        <div className="text-xs font-bold text-white/40 uppercase tracking-widest">School</div>
      </div>
    </button>
  )
}

function Input({ label, name, value, onChange, required, placeholder, type = 'text', hint }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; type?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-white/30 mb-1.5">{hint}</p>}
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 transition-all text-sm" />
    </div>
  )
}

function Textarea({ label, name, value, onChange, required, placeholder, rows = 3, hint }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  required?: boolean; placeholder?: string; rows?: number; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-white/30 mb-1.5">{hint}</p>}
      <textarea name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 transition-all resize-none text-sm" />
    </div>
  )
}

function YesNoField({ label, hint, ynValue, detailValue, onYnChange, onDetailChange, yesPrompt }: {
  label: string; hint?: string; ynValue: string; detailValue: string
  onYnChange: (v: string) => void; onDetailChange: (v: string) => void; yesPrompt: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider">{label}</label>
      {hint && <p className="text-xs text-white/30">{hint}</p>}
      <div className="flex gap-2">
        {['Yes', 'No'].map(opt => (
          <button key={opt} type="button" onClick={() => onYnChange(opt)}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
              ynValue === opt
                ? opt === 'Yes' ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-white/8 border-white/20 text-white/50'
                : 'border-white/10 text-white/25 hover:border-white/20'
            }`}>{opt}</button>
        ))}
      </div>
      {ynValue === 'Yes' && (
        <textarea value={detailValue} onChange={e => onDetailChange(e.target.value)} rows={3} placeholder={yesPrompt}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/60 transition-all resize-none text-sm" />
      )}
    </div>
  )
}

// ─── Video/File Input ─────────────────────────────────────────────────

function VideoInput({ label, name, value, onValueChange, hint }: {
  label: string; name: string; value: string
  onValueChange: (name: string, val: string) => void; hint?: string
}) {
  const [mode, setMode]         = useState<'link' | 'upload'>('link')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024 * 1024) { setUploadErr('File too large. Max 500 MB.'); return }
    setUploading(true); setUploadErr(null)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('video-submissions').upload(path, file, { upsert: true })
    if (error) { setUploadErr('Upload failed — try pasting a link instead.'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('video-submissions').getPublicUrl(data.path)
    setFileName(file.name)
    onValueChange(name, urlData.publicUrl)
    setUploading(false)
  }

  const clear = () => { onValueChange(name, ''); setFileName(null); setUploadErr(null) }

  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      {hint && <p className="text-xs text-white/30 mb-2">{hint}</p>}
      <div className="flex gap-1 mb-3">
        {([['link', 'Paste link', Link2], ['upload', 'Upload file', Upload]] as const).map(([m, lbl, Icon]) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all ${
              mode === m ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' : 'border-white/10 text-white/30 hover:border-white/20'
            }`}>
            <Icon className="w-3 h-3" />{lbl}
          </button>
        ))}
      </div>

      {mode === 'link' && (
        <div className="relative">
          <input type="text" value={value} onChange={e => onValueChange(name, e.target.value)}
            placeholder="Paste Google Drive, YouTube, Loom, Dropbox, or any link…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/60 transition-all text-sm pr-10" />
          {value && <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"><X className="w-4 h-4" /></button>}
          <p className="text-xs text-white/20 mt-1">Google Drive · YouTube · Loom · Dropbox · Vimeo · Notion</p>
        </div>
      )}

      {mode === 'upload' && (
        <div>
          {value && fileName ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-400/20 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-300 flex-1 truncate">{fileName}</span>
              <button type="button" onClick={clear} className="text-white/25 hover:text-white/50 text-xs flex-shrink-0">Remove</button>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 w-full border border-dashed rounded-xl px-4 py-8 cursor-pointer transition-all ${
              uploading ? 'border-blue-400/30 bg-blue-500/5' : 'border-white/15 bg-white/[0.02] hover:border-white/25'
            }`}>
              <input type="file" accept="video/*,.pdf,.doc,.docx,.ppt,.pptx" className="sr-only" onChange={handleUpload} disabled={uploading} />
              {uploading
                ? <><div className="w-6 h-6 border-2 border-blue-400/50 border-t-blue-400 rounded-full animate-spin" /><span className="text-xs text-blue-300">Uploading…</span></>
                : <><Upload className="w-6 h-6 text-white/25" /><span className="text-sm font-medium text-white/40">Click to select file</span><span className="text-xs text-white/20">Video, PDF, PPTX · up to 500 MB</span></>
              }
            </label>
          )}
          {uploadErr && <p className="text-xs text-rose-400 mt-1.5">{uploadErr}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Build card ───────────────────────────────────────────────────────

function BuildCard({ number, title, meta, optional, filled, children }: {
  number: string; title: string; meta?: [string, string][]
  optional?: boolean; filled?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3.5 bg-white/[0.04] hover:bg-white/[0.07] flex items-center gap-3 text-left transition-colors">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${
          filled ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
          optional ? 'border-white/15 text-white/25' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
        }`}>{filled ? '✓' : number}</span>
        <div className="flex-1">
          {optional && <span className="text-xs font-bold text-white/25 uppercase tracking-wider">Optional · </span>}
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white/25" /> : <ChevronRight className="w-4 h-4 text-white/25" />}
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

const CONSTRAINTS = [
  { id: 'conflict',  label: 'Conflict by Week 5',              color: 'amber'   },
  { id: 'energy',   label: 'Energy drop at mid-rotation',      color: 'emerald' },
  { id: 'cultural', label: 'Cultural missteps',                color: 'blue'    },
  { id: 'homesick', label: 'Someone wants to go home (Wk 10)',color: 'rose'    },
]
const DOT    = { amber: 'bg-amber-400',   emerald: 'bg-emerald-400', blue: 'bg-blue-400',   rose: 'bg-rose-400' }
const SEL_BG = { amber: 'bg-amber-400/12 border-amber-400/40', emerald: 'bg-emerald-400/12 border-emerald-400/40', blue: 'bg-blue-400/12 border-blue-400/40', rose: 'bg-rose-400/12 border-rose-400/40' }
const SEL_TX = { amber: 'text-amber-300', emerald: 'text-emerald-300', blue: 'text-blue-300', rose: 'text-rose-300' }

function ConstraintSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-white/40 text-sm">Pick one design constraint and build for it:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CONSTRAINTS.map(c => {
          const sel = value === c.id
          return (
            <button key={c.id} type="button" onClick={() => onChange(c.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all ${sel ? SEL_BG[c.color] : 'border-white/8 bg-white/[0.02] hover:border-white/15'}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[c.color]}`} />
              <span className={`text-xs font-bold ${sel ? SEL_TX[c.color] : 'text-white/50'}`}>{c.label}{sel && ' ✓'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────

export default function ApplicationForm() {
  const [started, setStarted]       = useState(false)
  const [hasDraft, setHasDraft]     = useState(false)
  const returnedToLanding           = useRef(false)
  const [step, setStep]             = useState(1)
  const [form, setForm]             = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [saveState, setSaveState]   = useState<'idle' | 'saving' | 'saved'>('idle')
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>(DEFAULT_REQUIRED)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalSteps = STEPS.length

  // Load required field config from admin settings
  useEffect(() => {
    supabase.from('form_config').select('config').eq('id', 'default').single()
      .then(({ data }) => {
        if (data?.config) {
          const config = data.config as Record<string, { required: boolean }>
          const req: Record<string, boolean> = {}
          Object.entries(config).forEach(([k, v]) => { req[k] = v.required })
          setRequiredFields(req)
        }
      })
  }, [])

  // Restore draft
  useEffect(() => {
    const id = localStorage.getItem(DRAFT_KEY)
    if (!id) return
    supabase.from('guide_applications').select('*').eq('id', id).eq('status', 'draft').single()
      .then(({ data }) => {
        if (!data) return
        const { id: _id, created_at: _ca, updated_at: _ua, status: _s, admin_notes: _an, draft_step, ...fields } = data
        setForm(f => ({ ...f, ...fields }))
        if (draft_step) setStep(draft_step)
        setHasDraft(true)
        if (!returnedToLanding.current) setStarted(true)
      })
  }, [])

  const isReq = (field: string) => Boolean(requiredFields[field])

  const saveDraft = useCallback((formData: FormData, currentStep: number) => {
    const id = getDraftId()
    setSaveState('saving')
    supabase.from('guide_applications')
      .upsert({ id, ...formData, status: 'draft', draft_step: currentStep }, { onConflict: 'id' })
      .then(() => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000) })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const updated = { ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }
    setForm(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(updated, step), 1500)
  }

  const handleFieldChange = (name: string, value: string) => {
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(updated, step), 1500)
  }

  const goStep = (s: number) => { setStep(s); saveDraft(form, s); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const handleSubmit = async () => {
    const allAcks = [1,2,3,4,5,6,7,8].every(n => form[`ack_${n}` as keyof FormData])
    if (!allAcks) { setError('Please check all acknowledgments before submitting.'); return }
    if (!form.applicant_name.trim()) { setError('Please type your full name as your signature.'); return }
    setSubmitting(true); setError(null)
    const id = getDraftId()

    // Use API route — saves to Supabase AND sends email to Zara
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...form }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setError(err.error || 'Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    localStorage.removeItem(DRAFT_KEY)
    setSubmitted(true)
    setSubmitting(false)
  }

  // ── Success ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#08111f] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Application Received</p>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-3">You&rsquo;re In The Pool.</h2>
          <p className="text-white/40 text-sm leading-relaxed">Our team will review carefully. You&apos;ll hear from us when decisions are made. In the meantime — keep being the person who applied.</p>
          <p className="text-white/20 text-xs mt-4">The admin team will follow up with your references directly.</p>
        </div>
      </div>
    )
  }

  // ── Landing ──
  if (!started) {
    return (
      <div className="min-h-screen bg-[#08111f] flex flex-col">
        <nav className="flex items-center px-6 py-5 border-b border-white/8"><Logo /></nav>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 text-center">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-5">Inaugural Cohort · 2026–2027</p>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-none mb-5">Guide<br/>Application</h1>
          <p className="text-white/40 text-base max-w-lg mb-3 leading-relaxed">This is not a year off. This is the hardest job Alpha has ever asked anyone to do — and the most rewarding year of your career.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-10 text-white/30 text-sm">
            {['38 Weeks', '3 Continents', '20 Students', 'Kenya · Ecuador · USA'].map((s, i) => (
              <span key={s} className="flex items-center gap-2">{i > 0 && <span className="w-1 h-1 rounded-full bg-white/15" />}{s}</span>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 mb-10 w-full max-w-xs text-left">
            <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-2 text-center">Jump to any section</p>
            {STEPS.map((s, i) => (
              <button key={s.id} onClick={() => { setStarted(true); goStep(s.id) }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-white/15 transition-all text-left group">
                <span className="w-5 h-5 rounded-full border border-white/15 group-hover:border-blue-400/40 flex items-center justify-center text-xs text-white/25 group-hover:text-blue-300 font-bold flex-shrink-0 transition-all">{i + 1}</span>
                <div className="flex-1">
                  <span className="text-xs font-bold text-white/50 group-hover:text-white/70 uppercase tracking-wide">{s.label}</span>
                  <span className="text-xs text-white/20 ml-2">{s.desc}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-white/10 group-hover:text-blue-300/50 transition-colors" />
              </button>
            ))}
          </div>
          {hasDraft && (
            <div className="w-full max-w-xs mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Draft saved</p>
                <p className="text-xs text-white/30 mt-0.5">Section {step} of {totalSteps} — continue where you left off</p>
              </div>
              <button
                onClick={() => { returnedToLanding.current = false; setStarted(true) }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-emerald-300 uppercase tracking-wider border border-emerald-400/30 hover:bg-emerald-500/15 rounded-full transition-colors"
              >
                Resume <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button onClick={() => { returnedToLanding.current = false; setStarted(true) }}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-wider text-sm rounded-full transition-colors shadow-lg shadow-blue-500/20">
              {hasDraft ? 'Continue Application' : 'Start Application'} <ArrowRight className="w-4 h-4" />
            </button>
            <a href="https://world.alpha.school" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-3.5 text-white/45 hover:text-white font-bold uppercase tracking-wider text-sm rounded-full border border-white/15 hover:border-white/30 transition-colors">
              Explore the Program <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <div className="border-t border-white/8 grid grid-cols-3">
          {[['20', 'Students Selected'], ['3', 'Continents'], ['38', 'Weeks']].map(([n, lbl]) => (
            <div key={lbl} className="py-7 flex flex-col items-center gap-1 border-r last:border-r-0 border-white/8">
              <span className="text-3xl font-black text-blue-400">{n}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/30">{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-[#08111f] flex flex-col">
      <header className="border-b border-white/8 sticky top-0 z-40 bg-[#08111f]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Logo size="sm" onClick={() => { saveDraft(form, step); setStarted(false) }} />
          <div className="flex items-center gap-3">
            {saveState === 'saving' && <span className="text-xs text-white/30 animate-pulse">Saving…</span>}
            {saveState === 'saved'  && <span className="text-xs text-emerald-400/70">Saved ✓</span>}
            <span className="hidden sm:inline text-xs text-white/25 font-medium uppercase tracking-wider">Section {step}/{totalSteps}</span>
            <button
              onClick={() => { returnedToLanding.current = true; saveDraft(form, step); setStarted(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white border border-white/10 hover:border-white/25 rounded-full transition-all"
            >
              <ArrowLeft className="w-3 h-3" /> Save &amp; Exit
            </button>
          </div>
        </div>
        <div className="h-1 bg-white/[0.06]">
          <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex gap-8">
        <aside className="hidden md:flex flex-col gap-1 w-56 flex-shrink-0 pt-1">
          <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-3 px-3">{totalSteps} Sections</p>
          {STEPS.map(s => {
            const active = s.id === step, done = s.id < step
            return (
              <button key={s.id} onClick={() => goStep(s.id)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${active ? 'bg-blue-500/12 border border-blue-400/20' : 'hover:bg-white/[0.04]'}`}>
                <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border transition-all ${
                  active ? 'bg-blue-500 border-blue-400 text-white' : done ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : 'border-white/12 text-white/20'
                }`}>{done ? '✓' : s.id}</span>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-blue-300' : done ? 'text-white/50' : 'text-white/20'}`}>{s.label}</div>
                  <div className={`text-xs mt-0.5 ${active ? 'text-white/30' : 'text-white/15'}`}>{s.desc}</div>
                </div>
              </button>
            )
          })}
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex md:hidden items-center gap-1.5 mb-6 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => goStep(s.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border ${
                    s.id === step ? 'bg-blue-500 border-blue-400 text-white' :
                    s.id < step ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : 'border-white/12 text-white/20'
                  }`}>{s.id < step ? '✓' : s.id}</button>
                {i < STEPS.length - 1 && <span className="text-white/12 text-xs">›</span>}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 1 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">About You</h1>
                <p className="text-white/35 text-sm mt-1.5">Basic info. Write "N/A" if a field doesn't apply.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required={isReq('full_name')} placeholder="Jane Smith" />
                <Input label="Email" name="email" value={form.email} onChange={handleChange} required={isReq('email')} placeholder="jane@alpha.school" type="email" />
                <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} required={isReq('phone')} placeholder="+1 (555) 000-0000" />
                <Input label="Role at Alpha" name="role_at_alpha" value={form.role_at_alpha} onChange={handleChange} required={isReq('role_at_alpha')} placeholder="e.g. Guide, Academic Coach" />
                <Input label="Campus" name="campus" value={form.campus} onChange={handleChange} required={isReq('campus')} placeholder="e.g. Austin, NYC" />
                <Input label="Years at Alpha" name="years_at_alpha" value={form.years_at_alpha} onChange={handleChange} required={isReq('years_at_alpha')} placeholder="e.g. 2 years" />
                <Input label="Direct Manager" name="direct_manager" value={form.direct_manager} onChange={handleChange} required={isReq('direct_manager')} placeholder="Manager's name" />
                <Input label="Dean of Parents / Head of School" name="head_of_school" value={form.head_of_school} onChange={handleChange} required={isReq('head_of_school')} placeholder="Head of School's name" />
              </div>
              <Textarea label="Languages Spoken" name="languages_spoken" value={form.languages_spoken} onChange={handleChange}
                required={isReq('languages_spoken')} placeholder="English (native), Spanish (conversational)…" hint="Note proficiency level" />
              <YesNoField label="Prior International Travel"
                ynValue={form.prior_international_travel_yn} detailValue={form.prior_international_travel}
                onYnChange={v => handleFieldChange('prior_international_travel_yn', v)}
                onDetailChange={v => handleFieldChange('prior_international_travel', v)}
                yesPrompt="List countries, length of stay, and purpose…" />
              <YesNoField label="Developing-World Living Experience" hint="Have you spent 2+ weeks living in a developing-world setting?"
                ynValue={form.developing_world_experience_yn} detailValue={form.developing_world_experience}
                onYnChange={v => handleFieldChange('developing_world_experience_yn', v)}
                onDetailChange={v => handleFieldChange('developing_world_experience', v)}
                yesPrompt="Where, how long, what you were doing, and what surprised you…" />
              <YesNoField label="Health Considerations" hint="Any current health considerations relevant to 38 weeks of international travel?"
                ynValue={form.health_considerations_yn} detailValue={form.health_considerations}
                onYnChange={v => handleFieldChange('health_considerations_yn', v)}
                onDetailChange={v => handleFieldChange('health_considerations', v)}
                yesPrompt="Please describe — kept confidential, used only for planning…" />
              <YesNoField label="Personal or Family Obligations" hint="Partner, children, or caregiving responsibilities relevant to a 38-week commitment?"
                ynValue={form.family_obligations_yn} detailValue={form.family_obligations}
                onYnChange={v => handleFieldChange('family_obligations_yn', v)}
                onDetailChange={v => handleFieldChange('family_obligations', v)}
                yesPrompt="Be specific so we can plan with you, not around you…" />
              <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleChange}
                required={isReq('emergency_contact')} placeholder="Name, relationship, phone number" />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 2 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">The Builds</h1>
                <p className="text-white/35 text-sm mt-1.5">Three required, one optional. Paste a link (Google Drive, Loom, YouTube) or upload a file directly.</p>
              </div>

              <BuildCard number="1" title="The Workshop Sprint" filled={Boolean(form.build1_link)}
                meta={[['Testing', 'Life skills design, AI fluency, taste'], ['Time', '2 hours max'], ['Deliverable', 'Slides / Notion / one-pager']]}>
                <p className="text-white/45 text-sm leading-relaxed">Design and produce a real <strong className="text-white/70">90-minute kickoff workshop</strong> for your cohort — anchored in one of the Kenya team's focus areas. Not a lecture. A first 90 minutes of real work that produces something the community uses.</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Food','Water','Empowerment','Education','Healthcare','Culture & Conservation','Community'].map(f => (
                    <span key={f} className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold">{f}</span>
                  ))}
                </div>
                <VideoInput label="Build 1 — Paste link or upload" name="build1_link" value={form.build1_link} onValueChange={handleFieldChange}
                  hint="Google Drive, Notion, Slides, PDF, or file upload" />
              </BuildCard>

              <BuildCard number="2" title="The Cohort Experience" filled={Boolean(form.build2_design_link && form.build2_video_link)}
                meta={[['Testing', 'Design instinct, cultural humility, resilience'], ['Time', '1.5–2 hours'], ['Deliverable', 'Design doc + 3-min video']]}>
                <p className="text-white/45 text-sm leading-relaxed">Design something that <strong className="text-white/70">prevents a cohort from breaking</strong>. By week 30 they'll be tired, homesick, and far from home. Strong cohorts don't avoid that — they're built to survive it.</p>
                <ConstraintSelector value={form.build2_constraint} onChange={v => handleFieldChange('build2_constraint', v)} />
                <div className="rounded-lg bg-amber-500/8 border border-amber-400/15 px-3 py-2">
                  <p className="text-xs text-amber-300/80"><strong>Cultural humility is not optional.</strong> If your design involves the local community, tell us how you'll center their leadership — not feature them as a backdrop.</p>
                </div>
                <VideoInput label="Design Doc — paste link or upload" name="build2_design_link" value={form.build2_design_link} onValueChange={handleFieldChange}
                  hint="One-pager, plan, visual — Drive, Notion, or PDF" />
                <VideoInput label="3-Minute Video — paste link or upload" name="build2_video_link" value={form.build2_video_link} onValueChange={handleFieldChange}
                  hint="Loom, YouTube, Google Drive, or upload" />
              </BuildCard>

              <BuildCard number="3" title="The Video" filled={Boolean(form.build3_video_link)}
                meta={[['Testing', 'Self-awareness, honesty, mindset'], ['Time', '20 minutes'], ['Deliverable', '90 sec – 2 min video']]}>
                <p className="text-white/45 text-sm leading-relaxed">Talk to us. 90 seconds to 2 minutes. <strong className="text-white/65">Phone-quality is fine. Don't script. Don't read.</strong></p>
                <div className="space-y-1.5">
                  {[
                    'What are you most excited about for this year?',
                    'What do you understand your role to be on this trip? Not what you hope — what you actually believe it is.',
                  ].map((q, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/8">
                      <span className="text-blue-400 font-bold text-xs flex-shrink-0 mt-0.5">{'①②'[i]}</span>
                      <p className="text-sm text-white/50">{q}</p>
                    </div>
                  ))}
                </div>
                <VideoInput label="Your Video — paste link or upload" name="build3_video_link" value={form.build3_video_link} onValueChange={handleFieldChange}
                  hint="Loom, YouTube, Google Drive, or upload directly" />
              </BuildCard>

              <BuildCard number="4" title="Language Tape" optional filled={Boolean(form.build4_language_link)}>
                <p className="text-white/45 text-sm leading-relaxed">If you speak Swahili, Spanish, or any language relevant to Kenya or Ecuador — talk to us in it. Anything natural. ≤60 seconds.</p>
                <VideoInput label="Language Video (optional)" name="build4_language_link" value={form.build4_language_link} onValueChange={handleFieldChange} />
              </BuildCard>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 3 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Submission Check</h1>
                <p className="text-white/35 text-sm mt-1.5">Confirm your builds are ready before continuing.</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Build 1 — Workshop Sprint',           value: form.build1_link,        required: isReq('build1_link') },
                  { label: 'Build 2 — Cohort Experience (design)',value: form.build2_design_link,  required: isReq('build2_design_link') },
                  { label: 'Build 2 — Cohort Experience (video)', value: form.build2_video_link,   required: isReq('build2_video_link') },
                  { label: 'Build 2 — Design constraint chosen',  value: form.build2_constraint,   required: isReq('build2_constraint') },
                  { label: 'Build 3 — The Video',                 value: form.build3_video_link,   required: isReq('build3_video_link') },
                  { label: 'Build 4 — Language Tape',             value: form.build4_language_link, required: false },
                ].map(({ label, value, required }) => (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${value ? 'bg-emerald-500/8 border-emerald-500/15' : required ? 'bg-rose-500/8 border-rose-500/15' : 'bg-white/[0.02] border-white/8'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black border ${value ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : required ? 'bg-rose-500/20 border-rose-400/30 text-rose-400' : 'border-white/15 text-white/25'}`}>
                      {value ? '✓' : required ? '!' : '–'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-wide ${value ? 'text-emerald-300' : required ? 'text-rose-300' : 'text-white/20'}`}>{label}</div>
                      {value
                        ? <div className="text-xs text-white/20 truncate mt-0.5">{value}</div>
                        : <div className={`text-xs mt-0.5 ${required ? 'text-rose-400/60' : 'text-white/15'}`}>{required ? 'Missing — go back and add' : 'Optional'}</div>
                      }
                    </div>
                    {!value && required && (
                      <button onClick={() => goStep(2)} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase border border-blue-400/20 px-3 py-1 rounded-full flex-shrink-0 transition-colors">Fix</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 4 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">References</h1>
                <p className="text-white/35 text-sm mt-1.5">Two internal Alpha references. One must be your direct manager or Dean of Parents / Head of School.</p>
              </div>
              <div className="rounded-xl bg-blue-500/8 border border-blue-400/15 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300/80 leading-relaxed">List your two references below. The Alpha team will reach out to them directly — you don't need to do anything else once you've submitted.</p>
                </div>
              </div>
              {([
                { n: 1, label: 'Reference 1 — Direct Manager or Dean of Parents / HoS', nameF: 'reference1_name', roleF: 'reference1_role', phoneF: 'reference1_phone', emailF: 'reference1_email' },
                { n: 2, label: 'Reference 2', nameF: 'reference2_name', roleF: 'reference2_role', phoneF: 'reference2_phone', emailF: 'reference2_email' },
              ] as const).map(({ n, label, nameF, roleF, phoneF, emailF }) => (
                <div key={n} className="bg-white/[0.03] rounded-xl border border-white/8 p-5 space-y-4">
                  <p className="text-xs font-black text-white/25 uppercase tracking-widest">{label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Name" name={nameF} value={form[nameF]} onChange={handleChange} placeholder="Full name" />
                    <Input label="Role at Alpha" name={roleF} value={form[roleF]} onChange={handleChange} placeholder="e.g. Dean of Parents, Head of School" />
                    <Input label="Phone" name={phoneF} value={form[phoneF]} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                    <Input label="Email" name={emailF} value={form[emailF]} onChange={handleChange} placeholder="ref@alpha.school" type="email" />
                  </div>
                </div>
              ))}
              <div className="bg-blue-500/8 rounded-xl border border-blue-400/12 p-5 space-y-4">
                <p className="text-xs font-black text-blue-300 uppercase tracking-widest">Manager / Dean of Parents / HoS endorsement status</p>
                <div className="flex flex-wrap gap-2">
                  {['Yes', 'No', 'Conversation pending'].map(opt => (
                    <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-xs font-bold uppercase tracking-wide transition-all ${form.manager_endorsement_status === opt ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' : 'border-white/15 text-white/25 hover:border-white/30'}`}>
                      <input type="radio" name="manager_endorsement_status" value={opt} checked={form.manager_endorsement_status === opt} onChange={handleChange} className="sr-only" />{opt}
                    </label>
                  ))}
                </div>
                <Textarea label="Brief note (optional)" name="manager_endorsement_text" value={form.manager_endorsement_text} onChange={handleChange}
                  placeholder="Anything you want the team to know about your reference conversations…" rows={3} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Endorser Name" name="endorser_name" value={form.endorser_name} onChange={handleChange} />
                  <Input label="Endorser Role" name="endorser_role" value={form.endorser_role} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 5 of {totalSteps}</p>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Acknowledge & Sign</h1>
                <p className="text-white/35 text-sm mt-1.5">Check each line. Each one is a real thing you are agreeing to.</p>
              </div>
              <div className="space-y-2">
                {acknowledgments.map((text, i) => {
                  const key = `ack_${i + 1}` as keyof FormData
                  return (
                    <label key={i} className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${form[key] ? 'border-blue-400/20 bg-blue-500/8' : 'border-white/8 bg-white/[0.02] hover:border-white/12'}`}>
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
                <p className="text-white/20 text-sm mb-4 italic">I am submitting this application of my own volition. I have read everything in this packet. I understand what I am signing up for.</p>
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

          {/* Nav */}
          <div className="flex items-center justify-between mt-10 pt-5 border-t border-white/8">
            <button onClick={() => step === 1 ? setStarted(false) : goStep(step - 1)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white/25 hover:text-white/55 transition-colors rounded-full border border-transparent hover:border-white/8">
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Home' : 'Back'}
            </button>
            {step < totalSteps ? (
              <button onClick={() => goStep(step + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#08111f] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-white text-[#08111f] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting…' : <><span>Submit Application</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
