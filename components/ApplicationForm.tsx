'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  CheckCircle, AlertCircle, ChevronDown, ChevronRight,
  ArrowRight, ArrowLeft, ExternalLink, Info, Upload, Link2, X, Sun, Moon
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DEFAULT_REQUIRED: Record<string, boolean> = {
  full_name: true, email: true, role_at_alpha: true,
  build1_link: true, build2_design_link: true, build2_video_link: true,
  build2_constraint: true, build3_video_link: true,
}

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
  build1_focus_area: string
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
  build1_focus_area: '',
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
  { id: 4, label: 'References',       desc: '2 internal references' },
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

const LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'Swahili',
  'Mandarin', 'Arabic', 'Hindi', 'Japanese', 'German',
  'Italian', 'Korean', 'Russian', 'Dutch', 'Hausa',
  'Amharic', 'Somali', 'Igbo', 'Yoruba', 'Zulu',
  'Tagalog', 'Vietnamese', 'Thai', 'Turkish', 'Farsi',
]

const DRAFT_KEY = 'aws_guide_draft_id'
function getDraftId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(DRAFT_KEY)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DRAFT_KEY, id) }
  return id
}

// ─── Primitives ───────────────────────────────────────────────────────

function LandingLogo() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white rounded-2xl p-5 shadow-xl shadow-blue-500/10">
        <img src="/awslogo.png" alt="Alpha World School"
          className="h-24 w-auto object-contain"
          onError={e => {
            const el = e.target as HTMLImageElement
            el.style.display = 'none'
          }} />
      </div>
    </div>
  )
}

function HeaderLogo({ onClick, lightMode }: { onClick?: () => void; lightMode: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 group">
      <div className="bg-blue-600 rounded-xl p-1.5 group-hover:bg-blue-500 transition-colors">
        <img src="/alphahigh.png" alt="Alpha World School"
          className="h-7 w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      </div>
      <div className="leading-tight text-left">
        <div className={`font-black uppercase tracking-wider text-xs ${lightMode ? 'text-blue-900' : 'text-white'}`}>Alpha World</div>
        <div className={`text-xs font-bold uppercase tracking-widest ${lightMode ? 'text-blue-400' : 'text-white/40'}`}>School</div>
      </div>
    </button>
  )
}

function Input({ label, name, value, onChange, required, placeholder, type = 'text', hint, lm }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; type?: string; hint?: string; lm?: boolean
}) {
  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${lm ? 'text-blue-700' : 'text-white/50'}`}>
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className={`text-xs mb-1.5 ${lm ? 'text-blue-400' : 'text-white/30'}`}>{hint}</p>}
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 transition-all text-sm ${
          lm ? 'bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-300' : 'bg-white/5 border-white/10 text-white placeholder-white/20'
        }`} />
    </div>
  )
}

function Textarea({ label, name, value, onChange, required, placeholder, rows = 3, hint, lm }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  required?: boolean; placeholder?: string; rows?: number; hint?: string; lm?: boolean
}) {
  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${lm ? 'text-blue-700' : 'text-white/50'}`}>
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className={`text-xs mb-1.5 ${lm ? 'text-blue-400' : 'text-white/30'}`}>{hint}</p>}
      <textarea name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
        className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 transition-all resize-none text-sm ${
          lm ? 'bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-300' : 'bg-white/5 border-white/10 text-white placeholder-white/20'
        }`} />
    </div>
  )
}

function YesNoField({ label, hint, ynValue, detailValue, onYnChange, onDetailChange, yesPrompt, lm }: {
  label: string; hint?: string; ynValue: string; detailValue: string
  onYnChange: (v: string) => void; onDetailChange: (v: string) => void; yesPrompt: string; lm?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className={`block text-xs font-bold uppercase tracking-wider ${lm ? 'text-blue-700' : 'text-white/50'}`}>{label}</label>
      {hint && <p className={`text-xs ${lm ? 'text-blue-400' : 'text-white/30'}`}>{hint}</p>}
      <div className="flex gap-2">
        {['Yes', 'No'].map(opt => (
          <button key={opt} type="button" onClick={() => onYnChange(opt)}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
              ynValue === opt
                ? opt === 'Yes'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-600'
                  : lm ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white/8 border-white/20 text-white/50'
                : lm ? 'border-blue-200 text-blue-300 hover:border-blue-300' : 'border-white/10 text-white/25 hover:border-white/20'
            }`}>{opt}</button>
        ))}
      </div>
      {ynValue === 'Yes' && (
        <textarea value={detailValue} onChange={e => onDetailChange(e.target.value)} rows={3} placeholder={yesPrompt}
          className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400/60 transition-all resize-none text-sm ${
            lm ? 'bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-300' : 'bg-white/5 border-white/10 text-white placeholder-white/20'
          }`} />
      )}
    </div>
  )
}

function LanguagesSelect({ value, onChange, lm }: { value: string; onChange: (v: string) => void; lm?: boolean }) {
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  const [other, setOther] = useState('')

  const toggle = (lang: string) => {
    const next = selected.includes(lang)
      ? selected.filter(l => l !== lang)
      : [...selected, lang]
    onChange(next.join(', '))
  }

  const addOther = () => {
    const trimmed = other.trim()
    if (!trimmed || selected.includes(trimmed)) return
    onChange([...selected, trimmed].join(', '))
    setOther('')
  }

  return (
    <div className="space-y-2">
      <label className={`block text-xs font-bold uppercase tracking-wider ${lm ? 'text-blue-700' : 'text-white/50'}`}>
        Languages Spoken
      </label>
      <p className={`text-xs ${lm ? 'text-blue-400' : 'text-white/30'}`}>Select all that apply</p>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map(lang => {
          const sel = selected.includes(lang)
          return (
            <button key={lang} type="button" onClick={() => toggle(lang)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                sel
                  ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                  : lm ? 'border-blue-200 text-blue-400 hover:border-blue-400' : 'border-white/10 text-white/30 hover:border-white/25'
              }`}>
              {lang}{sel && ' ✓'}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={other}
          onChange={e => setOther(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOther())}
          placeholder="Other language…"
          className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400/60 transition-all ${
            lm ? 'bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-300' : 'bg-white/5 border-white/10 text-white placeholder-white/20'
          }`}
        />
        <button type="button" onClick={addOther}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
            lm ? 'border-blue-300 text-blue-600 hover:bg-blue-100' : 'border-white/15 text-white/40 hover:border-white/30'
          }`}>Add</button>
      </div>
      {selected.length > 0 && (
        <p className={`text-xs ${lm ? 'text-blue-500' : 'text-white/30'}`}>
          Selected: {selected.join(' · ')}
        </p>
      )}
    </div>
  )
}

// ─── Video/File Input ─────────────────────────────────────────────────

function VideoInput({ label, name, value, onValueChange, hint, lm }: {
  label: string; name: string; value: string
  onValueChange: (name: string, val: string) => void; hint?: string; lm?: boolean
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

    // Build Drive filename: LastName_FirstName_BuildX.ext
    const stored = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null
    const rawName = (typeof window !== 'undefined' && (document.querySelector('[name="full_name"]') as HTMLInputElement)?.value) || 'Applicant'
    const parts = rawName.trim().split(' ')
    const namePart = parts.length > 1 ? `${parts[parts.length - 1]}_${parts[0]}` : parts[0]
    const buildTag = name === 'build1_link' ? 'Build1' : name === 'build2_design_link' ? 'Build2Design' : name === 'build2_video_link' ? 'Build2Video' : name === 'build3_video_link' ? 'Build3' : 'Build4'
    const driveName = `${namePart}_${buildTag}.${ext}`

    const fd = new FormData()
    fd.append('file', file)
    fd.append('fileName', driveName)

    const res = await fetch('/api/upload-drive', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setFileName(driveName); onValueChange(name, url)
    } else {
      // Fallback: upload to Supabase Storage
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from('video-submissions').upload(path, file, { upsert: true })
      if (error) { setUploadErr('Upload failed — try pasting a link instead.'); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('video-submissions').getPublicUrl(data.path)
      setFileName(file.name); onValueChange(name, urlData.publicUrl)
    }
    setUploading(false)
  }

  const clear = () => { onValueChange(name, ''); setFileName(null); setUploadErr(null) }

  const tabCls = (m: string) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all ${
    mode === m
      ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
      : lm ? 'border-blue-200 text-blue-400 hover:border-blue-300' : 'border-white/10 text-white/30 hover:border-white/20'
  }`

  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${lm ? 'text-blue-700' : 'text-white/50'}`}>{label}</label>
      {hint && <p className={`text-xs mb-2 ${lm ? 'text-blue-400' : 'text-white/30'}`}>{hint}</p>}
      <div className="flex gap-1 mb-3">
        <button type="button" onClick={() => setMode('link')} className={tabCls('link')}>
          <Link2 className="w-3 h-3" />Paste link
        </button>
        <button type="button" onClick={() => setMode('upload')} className={tabCls('upload')}>
          <Upload className="w-3 h-3" />Upload file
        </button>
      </div>

      {mode === 'link' && (
        <div className="space-y-1.5">
          <div className="relative">
            <input type="text" value={value} onChange={e => onValueChange(name, e.target.value)}
              placeholder="Paste Google Drive, YouTube, Loom, Dropbox, or any link…"
              className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400/60 transition-all text-sm pr-10 ${
                lm ? 'bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-300' : 'bg-white/5 border-white/10 text-white placeholder-white/20'
              }`} />
            {value && <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"><X className="w-4 h-4" /></button>}
          </div>
          <p className={`text-xs ${lm ? 'text-blue-400' : 'text-white/20'}`}>
            Google Drive · YouTube · Loom · Dropbox · Vimeo · Notion
          </p>
          <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${lm ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/8 border-blue-400/15'}`}>
            <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className={`text-xs ${lm ? 'text-blue-600' : 'text-blue-300/70'}`}>
              Upload your file to the <strong>shared Drive folder linked in your invitation email</strong>, then paste the link here. File naming: <strong>LastName_FirstName_Build#.mp4</strong> (or .pdf, .mov, etc.)
              For Google Drive: set sharing to <strong>Anyone with the link</strong> and share it with <strong>apply@alphaworldschool.com</strong>
            </p>
          </div>
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
              uploading ? 'border-blue-400/30 bg-blue-500/5' : lm ? 'border-blue-300 bg-blue-50 hover:border-blue-400' : 'border-white/15 bg-white/[0.02] hover:border-white/25'
            }`}>
              <input type="file" accept="video/*,.pdf,.doc,.docx,.ppt,.pptx" className="sr-only" onChange={handleUpload} disabled={uploading} />
              {uploading
                ? <><div className="w-6 h-6 border-2 border-blue-400/50 border-t-blue-400 rounded-full animate-spin" /><span className="text-xs text-blue-300">Uploading…</span></>
                : <><Upload className={`w-6 h-6 ${lm ? 'text-blue-300' : 'text-white/25'}`} />
                   <span className={`text-sm font-medium ${lm ? 'text-blue-500' : 'text-white/40'}`}>Click to select file</span>
                   <span className={`text-xs ${lm ? 'text-blue-400' : 'text-white/20'}`}>Video, PDF, PPTX · up to 500 MB</span></>
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

function BuildCard({ number, title, meta, optional, filled, children, lm }: {
  number: string; title: string; meta?: [string, string][]
  optional?: boolean; filled?: boolean; children: React.ReactNode; lm?: boolean
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`rounded-xl border overflow-hidden ${lm ? 'border-blue-200' : 'border-white/10'}`}>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full px-5 py-3.5 flex items-center gap-3 text-left transition-colors ${lm ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white/[0.04] hover:bg-white/[0.07]'}`}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${
          filled ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
          optional ? lm ? 'border-blue-200 text-blue-300' : 'border-white/15 text-white/25' :
          'bg-blue-500/20 border-blue-400/30 text-blue-300'
        }`}>{filled ? '✓' : number}</span>
        <div className="flex-1">
          {optional && <span className={`text-xs font-bold uppercase tracking-wider ${lm ? 'text-blue-300' : 'text-white/25'}`}>Optional · </span>}
          <span className={`font-bold text-sm ${lm ? 'text-blue-800' : 'text-white'}`}>{title}</span>
        </div>
        {open ? <ChevronDown className={`w-4 h-4 ${lm ? 'text-blue-300' : 'text-white/25'}`} /> : <ChevronRight className={`w-4 h-4 ${lm ? 'text-blue-300' : 'text-white/25'}`} />}
      </button>
      {open && (
        <>
          {meta && (
            <div className={`grid grid-cols-3 border-t ${lm ? 'border-blue-100' : 'border-white/8'}`}>
              {meta.map(([k, v]) => (
                <div key={k} className={`px-4 py-2.5 border-r last:border-r-0 ${lm ? 'border-blue-100' : 'border-white/8'}`}>
                  <div className={`text-xs uppercase tracking-wider mb-0.5 ${lm ? 'text-blue-400' : 'text-white/25'}`}>{k}</div>
                  <div className={`text-xs ${lm ? 'text-blue-600' : 'text-white/50'}`}>{v}</div>
                </div>
              ))}
            </div>
          )}
          <div className={`p-5 space-y-4 border-t ${lm ? 'border-blue-100' : 'border-white/8'}`}>{children}</div>
        </>
      )}
    </div>
  )
}

const FOCUS_AREAS = ['Food', 'Water', 'Empowerment', 'Education', 'Healthcare', 'Culture & Conservation', 'Community']

function FocusAreaSelector({ value, onChange, lm }: { value: string; onChange: (v: string) => void; lm?: boolean }) {
  return (
    <div className="space-y-2">
      <p className={`text-sm ${lm ? 'text-blue-500' : 'text-white/40'}`}>Pick one focus area for your workshop:</p>
      <div className="flex flex-wrap gap-2">
        {FOCUS_AREAS.map(f => {
          const sel = value === f
          return (
            <button key={f} type="button" onClick={() => onChange(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                sel
                  ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                  : lm ? 'border-blue-200 text-blue-400 hover:border-blue-400' : 'border-white/10 text-white/30 hover:border-white/25'
              }`}>
              {f}{sel && ' ✓'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const CONSTRAINTS = [
  { id: 'conflict',  label: 'Conflict by Week 5 — design for that',              color: 'amber'   },
  { id: 'energy',   label: 'Energy drops at mid-rotation — design for that',      color: 'emerald' },
  { id: 'cultural', label: 'Cultural missteps happen — design for that',          color: 'blue'    },
  { id: 'homesick', label: 'Someone wants to go home by Week 10 — design for that', color: 'rose' },
  { id: 'conflict',  label: 'Conflict by Week 5',              color: 'amber'   },
  { id: 'energy',   label: 'Energy drop at mid-rotation',      color: 'emerald' },
  { id: 'cultural', label: 'Cultural missteps',                color: 'blue'    },
  { id: 'homesick', label: 'Someone wants to go home (Wk 10)', color: 'rose'    },
]
const DOT    = { amber: 'bg-amber-400',   emerald: 'bg-emerald-400', blue: 'bg-blue-400',   rose: 'bg-rose-400' }
const SEL_BG = { amber: 'bg-amber-400/12 border-amber-400/40', emerald: 'bg-emerald-400/12 border-emerald-400/40', blue: 'bg-blue-400/12 border-blue-400/40', rose: 'bg-rose-400/12 border-rose-400/40' }
const SEL_TX = { amber: 'text-amber-300', emerald: 'text-emerald-300', blue: 'text-blue-300', rose: 'text-rose-300' }

function ConstraintSelector({ value, onChange, lm }: { value: string; onChange: (v: string) => void; lm?: boolean }) {
  return (
    <div className="space-y-2">
      <p className={`text-sm ${lm ? 'text-blue-500' : 'text-white/40'}`}>Pick one design constraint and build for it:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CONSTRAINTS.map(c => {
          const sel = value === c.id
          return (
            <button key={c.id} type="button" onClick={() => onChange(c.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all ${
                sel ? SEL_BG[c.color] : lm ? 'border-blue-200 bg-blue-50 hover:border-blue-300' : 'border-white/8 bg-white/[0.02] hover:border-white/15'
              }`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[c.color]}`} />
              <span className={`text-xs font-bold ${sel ? SEL_TX[c.color] : lm ? 'text-blue-600' : 'text-white/50'}`}>{c.label}{sel && ' ✓'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────

export default function ApplicationForm() {
  // phase: landing → gate (name+email) → form
  const [phase, setPhase]           = useState<'landing' | 'gate' | 'form'>('landing')
  const [hasDraft, setHasDraft]     = useState(false)
  const returnedToLanding           = useRef(false)
  const [step, setStep]             = useState(1)
  const [form, setForm]             = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [saveState, setSaveState]   = useState<'idle' | 'saving' | 'saved'>('idle')
  const [requiredFields, setRequiredFields] = useState<Record<string, boolean>>(DEFAULT_REQUIRED)
  const [lightMode, setLightMode]   = useState(false)
  const [gateForm, setGateForm]     = useState({ name: '', email: '' })
  const [gateLoading, setGateLoading] = useState(false)
  const [gateError, setGateError]   = useState<string | null>(null)
  const [resumeUrl, setResumeUrl]   = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalSteps = STEPS.length

  const lm = lightMode

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

  // Check for ?token= URL param (magic resume link) or existing localStorage draft
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      supabase.from('guide_applications').select('*').eq('id', token).eq('status', 'draft').single()
        .then(({ data }) => {
          if (!data) return
          localStorage.setItem(DRAFT_KEY, data.id)
          const { id: _id, created_at: _ca, updated_at: _ua, status: _s, admin_notes: _an, draft_step, ...fields } = data
          setForm(f => ({ ...f, ...fields }))
          if (draft_step) setStep(draft_step)
          if (data.email) setGateForm({ name: data.full_name || '', email: data.email })
          setHasDraft(true)
          setPhase('form')
        })
    } else {
      const id = localStorage.getItem(DRAFT_KEY)
      if (!id) return
      supabase.from('guide_applications').select('draft_step, email, full_name').eq('id', id).eq('status', 'draft').single()
        .then(({ data }) => {
          if (!data) return
          setHasDraft(true)
          if (data.draft_step) setStep(data.draft_step)
          if (data.email) setGateForm(g => ({ ...g, email: data.email, name: data.full_name || g.name }))
        })
    }
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

  const handleGateSubmit = async () => {
    if (!gateForm.name.trim() || !gateForm.email.trim()) {
      setGateError('Please enter your name and email.')
      return
    }
    setGateLoading(true); setGateError(null)

    // Look up by email first
    const { data } = await supabase
      .from('guide_applications')
      .select('*')
      .eq('email', gateForm.email.trim())
      .eq('status', 'draft')
      .maybeSingle()

    let draftId: string
    if (data) {
      localStorage.setItem(DRAFT_KEY, data.id)
      draftId = data.id
      const { id: _id, created_at: _ca, updated_at: _ua, status: _s, admin_notes: _an, draft_step, ...fields } = data
      setForm(f => ({ ...f, ...fields }))
      if (draft_step) setStep(draft_step)
      setHasDraft(true)
    } else {
      draftId = getDraftId()
      setForm(f => ({ ...f, full_name: gateForm.name.trim(), email: gateForm.email.trim() }))
    }
    setResumeUrl(`${window.location.origin}${window.location.pathname}?token=${draftId}`)
    setGateLoading(false)
    setPhase('form')
  }

  const handleSubmit = async () => {
    const allAcks = [1,2,3,4,5,6,7,8].every(n => form[`ack_${n}` as keyof FormData])
    if (!allAcks) { setError('Please check all acknowledgments before submitting.'); return }
    if (!form.applicant_name.trim()) { setError('Please type your full name as your signature.'); return }
    setSubmitting(true); setError(null)
    const id = getDraftId()

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

  const bg = lm ? 'bg-white' : 'bg-[#08111f]'
  const border = lm ? 'border-blue-100' : 'border-white/8'

  // ── Success ──
  if (submitted) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center px-4`}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Application Received</p>
          <h2 className={`text-3xl font-black uppercase tracking-tight mb-3 ${lm ? 'text-blue-900' : 'text-white'}`}>You&rsquo;re In The Pool.</h2>
          <p className={`text-sm leading-relaxed ${lm ? 'text-blue-500' : 'text-white/40'}`}>Our team will review carefully. You&apos;ll hear from us when decisions are made. In the meantime — keep being the person who applied.</p>
          <p className={`text-xs mt-4 ${lm ? 'text-blue-300' : 'text-white/20'}`}>The admin team will follow up with your references directly.</p>
        </div>
      </div>
    )
  }

  // ── Landing ──
  if (phase === 'landing') {
    return (
      <div className={`min-h-screen ${bg} flex flex-col`}>
        <nav className={`flex items-center justify-between px-6 py-5 border-b ${border}`}>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-1.5">
              <img src="/alphahigh.png" alt="Alpha World School"
                className="h-7 w-auto object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div className="leading-tight">
              <div className={`font-black uppercase tracking-wider text-xs ${lm ? 'text-blue-900' : 'text-white'}`}>Alpha World</div>
              <div className={`text-xs font-bold uppercase tracking-widest ${lm ? 'text-blue-400' : 'text-white/40'}`}>School</div>
            </div>
          </div>
          <button onClick={() => setLightMode(m => !m)}
            className={`p-2 rounded-full border transition-all ${lm ? 'border-blue-200 text-blue-500 hover:bg-blue-50' : 'border-white/15 text-white/40 hover:border-white/30'}`}>
            {lm ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </nav>

        <div className={`flex-1 flex flex-col items-center justify-center px-6 py-14 text-center`}>
          {/* Logo hero */}
          <div className="mb-8">
            <LandingLogo />
          </div>

          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Inaugural Cohort · 2026–2027</p>
          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-8 ${lm ? 'text-blue-900' : 'text-white'}`}>
            Guide<br/>Application
          </h1>

          {/* Intro text */}
          <div className={`max-w-2xl text-left space-y-4 mb-10 rounded-2xl border p-6 ${lm ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-white/[0.03] border-white/8 text-white/55'}`}>
            <p className="text-sm leading-relaxed">
              This is the inaugural year of Alpha World School. Twenty Alpha students will travel through Kenya, Ecuador, and the United States across 38 weeks. They are going to build schools, learn languages, run rigorous academics, and live in communities most of them have never imagined. <strong className={lm ? 'text-blue-900' : 'text-white/80'}>We need guides who can lead them through it.</strong>
            </p>
            <p className="text-sm leading-relaxed">
              This is not a year off. This is not a year abroad. <strong className={lm ? 'text-blue-900' : 'text-white/80'}>This is a full-time job — arguably the hardest one Alpha has ever asked anyone to do.</strong> You will be a 24/7 chaperone, coach, and culture-keeper for a cohort of teenagers in environments where the systems we rely on at home are not available. You will be far from your family for long stretches. You will be the calm voice when something goes wrong at 3 AM. You will be the person who tells a homesick kid they will make it through the week — and then you will be the one who actually walks them through that week. You will hold both students and yourself to the highest physical, emotional, and academic bar.
            </p>
            <p className="text-sm leading-relaxed">
              You will also have the most rewarding year of your career. You will see kids transform in front of you. You will speak languages you never thought you would. You will eat with families on three continents and remember their names for the rest of your life. You will come home different.
            </p>
            <p className={`text-sm font-bold ${lm ? 'text-blue-900' : 'text-white/80'}`}>Both of these things are true.</p>
            <div className={`border-t pt-4 ${lm ? 'border-blue-100' : 'border-white/8'}`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${lm ? 'text-blue-500' : 'text-white/30'}`}>How this application works</p>
              <p className="text-sm leading-relaxed">
                This packet has three required Builds and one optional one. Each produces a real artifact — a workshop, a cohort experience, a video. AI use is expected, not penalized. Reading this and thinking &ldquo;yes, this is for me&rdquo; is the right starting point. Reading this and thinking &ldquo;I just want to travel&rdquo; is a sign to stop here.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-8 text-sm">
            {['38 Weeks', '3 Continents', '20 Students', 'Kenya · Ecuador · USA'].map((s, i) => (
              <span key={s} className={`flex items-center gap-2 ${lm ? 'text-blue-400' : 'text-white/30'}`}>
                {i > 0 && <span className={`w-1 h-1 rounded-full ${lm ? 'bg-blue-200' : 'bg-white/15'}`} />}{s}
              </span>
            ))}
          </div>

          {hasDraft && (
            <div className={`w-full max-w-sm mb-6 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 ${lm ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-400/20'}`}>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Draft saved</p>
                <p className={`text-xs mt-0.5 ${lm ? 'text-blue-500' : 'text-white/30'}`}>Section {step} of {totalSteps} — continue where you left off</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { returnedToLanding.current = false; setPhase('gate') }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-emerald-600 uppercase tracking-wider border border-emerald-300 hover:bg-emerald-100 rounded-full transition-colors">
                  Resume <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(DRAFT_KEY)
                    setHasDraft(false)
                    setForm(initialForm)
                    setStep(1)
                    setGateForm({ name: '', email: '' })
                  }}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded-full transition-colors ${lm ? 'border-blue-200 text-blue-400 hover:bg-blue-50' : 'border-white/15 text-white/25 hover:border-white/30'}`}>
                  Start Over
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button onClick={() => setPhase('gate')}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-wider text-sm rounded-full transition-colors shadow-lg shadow-blue-500/20">
              {hasDraft ? 'Continue Application' : 'Start Application'} <ArrowRight className="w-4 h-4" />
            </button>
            <a href="https://world.alpha.school" target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 px-8 py-3.5 font-bold uppercase tracking-wider text-sm rounded-full border transition-colors ${lm ? 'border-blue-200 text-blue-400 hover:border-blue-400 hover:text-blue-600' : 'border-white/15 text-white/45 hover:text-white hover:border-white/30'}`}>
              Explore the Program <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className={`border-t ${border} grid grid-cols-3`}>
          {[['20', 'Students Selected'], ['3', 'Continents'], ['38', 'Weeks']].map(([n, lbl]) => (
            <div key={lbl} className={`py-7 flex flex-col items-center gap-1 border-r last:border-r-0 ${border}`}>
              <span className="text-3xl font-black text-blue-400">{n}</span>
              <span className={`text-xs font-bold uppercase tracking-widest ${lm ? 'text-blue-400' : 'text-white/30'}`}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Gate: Name + Email ──
  if (phase === 'gate') {
    return (
      <div className={`min-h-screen ${bg} flex flex-col`}>
        <nav className={`flex items-center justify-between px-6 py-5 border-b ${border}`}>
          <button onClick={() => setPhase('landing')} className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-1.5">
              <img src="/alphahigh.png" alt="Alpha World School"
                className="h-7 w-auto object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div className="leading-tight text-left">
              <div className={`font-black uppercase tracking-wider text-xs ${lm ? 'text-blue-900' : 'text-white'}`}>Alpha World</div>
              <div className={`text-xs font-bold uppercase tracking-widest ${lm ? 'text-blue-400' : 'text-white/40'}`}>School</div>
            </div>
          </button>
          <button onClick={() => setLightMode(m => !m)}
            className={`p-2 rounded-full border transition-all ${lm ? 'border-blue-200 text-blue-500 hover:bg-blue-50' : 'border-white/15 text-white/40 hover:border-white/30'}`}>
            {lm ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-14">
          <div className="w-full max-w-sm">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 text-center">Guide Application</p>
            <h1 className={`text-3xl font-black uppercase tracking-tight mb-2 text-center ${lm ? 'text-blue-900' : 'text-white'}`}>
              Let&rsquo;s Get Started
            </h1>
            <p className={`text-sm text-center mb-8 ${lm ? 'text-blue-500' : 'text-white/35'}`}>
              Enter your name and email to start or resume your application. Your progress saves automatically.
            </p>

            <div className="space-y-4">
              <Input label="Full Name" name="name" value={gateForm.name}
                onChange={e => setGateForm(g => ({ ...g, name: e.target.value }))}
                required placeholder="Jane Smith" lm={lm} />
              <Input label="Email" name="email" value={gateForm.email} type="email"
                onChange={e => setGateForm(g => ({ ...g, email: e.target.value }))}
                required placeholder="jane@alpha.school" lm={lm} />

              {gateError && (
                <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-300 text-sm">{gateError}</p>
                </div>
              )}

              <button onClick={handleGateSubmit} disabled={gateLoading}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-black uppercase tracking-wider text-sm rounded-full transition-colors flex items-center justify-center gap-2">
                {gateLoading ? 'Checking…' : <>{hasDraft ? 'Resume Application' : 'Begin Application'} <ArrowRight className="w-4 h-4" /></>}
              </button>

              <button onClick={() => setPhase('landing')}
                className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${lm ? 'border-blue-200 text-blue-400 hover:bg-blue-50' : 'border-white/10 text-white/25 hover:border-white/20'}`}>
                <ArrowLeft className="w-3 h-3 inline mr-1" /> Back
              </button>
            </div>

            <p className={`text-xs text-center mt-6 ${lm ? 'text-blue-300' : 'text-white/20'}`}>
              Your email is used to save and resume your draft — it won&rsquo;t be shared.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className={`min-h-screen ${bg} flex flex-col`}>
      <header className={`border-b ${border} sticky top-0 z-40 ${lm ? 'bg-white/95' : 'bg-[#08111f]/95'} backdrop-blur-sm`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <HeaderLogo lightMode={lm}
            onClick={() => { returnedToLanding.current = true; saveDraft(form, step); setPhase('landing') }} />
          <div className="flex items-center gap-3">
            {saveState === 'saving' && <span className={`text-xs animate-pulse ${lm ? 'text-blue-300' : 'text-white/50'}`}>Saving…</span>}
            {saveState === 'saved'  && <span className="text-xs text-emerald-400">Saved ✓</span>}
            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${lm ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-blue-500 border-blue-400 text-white'}`}>
              Section {step} / {totalSteps}
            </span>
            <button onClick={() => setLightMode(m => !m)}
              className={`p-1.5 rounded-full border transition-all ${lm ? 'border-blue-200 text-blue-500 hover:bg-blue-50' : 'border-white/30 text-white/60 hover:border-white/50 hover:text-white'}`}>
              {lm ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { returnedToLanding.current = true; saveDraft(form, step); setPhase('landing') }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${lm ? 'border-blue-300 text-blue-600 hover:bg-blue-50' : 'border-white/30 text-white/70 hover:text-white hover:border-white/60 hover:bg-white/5'}`}>
              <ArrowLeft className="w-3 h-3" /> Save &amp; Exit
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className={`h-1 ${lm ? 'bg-blue-100' : 'bg-white/[0.06]'}`}>
          <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col gap-1 w-56 flex-shrink-0 pt-1">
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 px-3 ${lm ? 'text-blue-300' : 'text-white/20'}`}>{totalSteps} Sections</p>
          {STEPS.map(s => {
            const active = s.id === step, done = s.id < step
            return (
              <button key={s.id} onClick={() => goStep(s.id)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                  active ? lm ? 'bg-blue-100 border border-blue-300' : 'bg-blue-500/30 border border-blue-400/50' : lm ? 'hover:bg-blue-50' : 'hover:bg-white/[0.06]'
                }`}>
                <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border transition-all ${
                  active ? 'bg-blue-500 border-blue-400 text-white' : done ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : lm ? 'border-blue-200 text-blue-300' : 'border-white/20 text-white/35'
                }`}>{done ? '✓' : s.id}</span>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wide ${active ? lm ? 'text-blue-700' : 'text-blue-200' : done ? lm ? 'text-blue-500' : 'text-white/60' : lm ? 'text-blue-300' : 'text-white/40'}`}>{s.label}</div>
                  <div className={`text-xs mt-0.5 ${active ? lm ? 'text-blue-500' : 'text-white/50' : lm ? 'text-blue-200' : 'text-white/25'}`}>{s.desc}</div>
                </div>
              </button>
            )
          })}
        </aside>

        <div className="flex-1 min-w-0">
          {/* Resume link banner */}
          {resumeUrl && (
            <div className={`mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border ${lm ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-400/20'}`}>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${lm ? 'text-blue-700' : 'text-blue-300'}`}>Your resume link</p>
                <p className={`text-xs truncate ${lm ? 'text-blue-500' : 'text-white/30'}`}>{resumeUrl}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(resumeUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${lm ? 'border-blue-300 text-blue-600 hover:bg-blue-100' : 'border-blue-400/30 text-blue-300 hover:bg-blue-500/15'}`}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button onClick={() => setResumeUrl(null)} className={`flex-shrink-0 ${lm ? 'text-blue-300' : 'text-white/20'} hover:opacity-60`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile step dots */}
          <div className="flex md:hidden items-center gap-1.5 mb-6 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => goStep(s.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border ${
                    s.id === step ? 'bg-blue-500 border-blue-400 text-white' :
                    s.id < step ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' :
                    lm ? 'border-blue-200 text-blue-300' : 'border-white/12 text-white/20'
                  }`}>{s.id < step ? '✓' : s.id}</button>
                {i < STEPS.length - 1 && <span className={`text-xs ${lm ? 'text-blue-200' : 'text-white/12'}`}>›</span>}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 1 of {totalSteps}</p>
                <h1 className={`text-3xl font-black uppercase tracking-tight ${lm ? 'text-blue-900' : 'text-white'}`}>About You</h1>
                <p className={`text-sm mt-1.5 ${lm ? 'text-blue-400' : 'text-white/35'}`}>Basic info. Write "N/A" if a field doesn't apply.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required={isReq('full_name')} placeholder="Jane Smith" lm={lm} />
                <Input label="Email" name="email" value={form.email} onChange={handleChange} required={isReq('email')} placeholder="jane@alpha.school" type="email" lm={lm} />
                <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} required={isReq('phone')} placeholder="+1 (555) 000-0000" lm={lm} />
                <Input label="Role at Alpha" name="role_at_alpha" value={form.role_at_alpha} onChange={handleChange} required={isReq('role_at_alpha')} placeholder="e.g. Guide, Academic Coach" lm={lm} />
                <Input label="Campus" name="campus" value={form.campus} onChange={handleChange} required={isReq('campus')} placeholder="e.g. Austin, NYC" lm={lm} />
                <Input label="Years at Alpha" name="years_at_alpha" value={form.years_at_alpha} onChange={handleChange} required={isReq('years_at_alpha')} placeholder="e.g. 2 years" lm={lm} />
                <Input label="Direct Manager" name="direct_manager" value={form.direct_manager} onChange={handleChange} required={isReq('direct_manager')} placeholder="Manager's name" lm={lm} />
                <Input label="Dean of Parents / Head of School" name="head_of_school" value={form.head_of_school} onChange={handleChange} required={isReq('head_of_school')} placeholder="Head of School's name" lm={lm} />
              </div>
              <LanguagesSelect value={form.languages_spoken} onChange={v => handleFieldChange('languages_spoken', v)} lm={lm} />
              <Textarea label="Prior International Travel" name="prior_international_travel"
                value={form.prior_international_travel} onChange={handleChange}
                placeholder="Countries, length of stay, and purpose…" rows={3} lm={lm} />
              <YesNoField label="Developing-World Living Experience"
                hint="Have you spent 2+ weeks living in a developing-world setting?"
              <YesNoField label="Prior International Travel"
                ynValue={form.prior_international_travel_yn} detailValue={form.prior_international_travel}
                onYnChange={v => handleFieldChange('prior_international_travel_yn', v)}
                onDetailChange={v => handleFieldChange('prior_international_travel', v)}
                yesPrompt="List countries, length of stay, and purpose…" lm={lm} />
              <YesNoField label="Developing-World Living Experience" hint="Have you spent 2+ weeks living in a developing-world setting?"
                ynValue={form.developing_world_experience_yn} detailValue={form.developing_world_experience}
                onYnChange={v => handleFieldChange('developing_world_experience_yn', v)}
                onDetailChange={v => handleFieldChange('developing_world_experience', v)}
                yesPrompt="Where, how long, what you were doing, and what surprised you…" lm={lm} />
              <Textarea label="Health Considerations" name="health_considerations"
                value={form.health_considerations} onChange={handleChange}
                hint="Any current health considerations relevant to extended travel. Kept confidential, used only for planning."
                placeholder="Describe any relevant considerations, or write N/A…" rows={3} lm={lm} />
              <Textarea label="Personal or Family Obligations" name="family_obligations"
                value={form.family_obligations} onChange={handleChange}
                hint="Partner, children, caregiving responsibilities relevant to a 38-week commitment. Please be specific so we can plan with you, not around you."
                placeholder="Describe any relevant obligations, or write N/A…" rows={3} lm={lm} />
              <YesNoField label="Health Considerations" hint="Any current health considerations relevant to 38 weeks of international travel?"
                ynValue={form.health_considerations_yn} detailValue={form.health_considerations}
                onYnChange={v => handleFieldChange('health_considerations_yn', v)}
                onDetailChange={v => handleFieldChange('health_considerations', v)}
                yesPrompt="Please describe — kept confidential, used only for planning…" lm={lm} />
              <YesNoField label="Personal or Family Obligations" hint="Partner, children, or caregiving responsibilities relevant to a 38-week commitment?"
                ynValue={form.family_obligations_yn} detailValue={form.family_obligations}
                onYnChange={v => handleFieldChange('family_obligations_yn', v)}
                onDetailChange={v => handleFieldChange('family_obligations', v)}
                yesPrompt="Be specific so we can plan with you, not around you…" lm={lm} />
              <Input label="Emergency Contact" name="emergency_contact" value={form.emergency_contact} onChange={handleChange}
                required={isReq('emergency_contact')} placeholder="Name, relationship, phone number" lm={lm} />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 2 of {totalSteps}</p>
                <h1 className={`text-3xl font-black uppercase tracking-tight ${lm ? 'text-blue-900' : 'text-white'}`}>The Builds</h1>
                <p className={`text-sm mt-1.5 ${lm ? 'text-blue-400' : 'text-white/35'}`}>Three required, one optional. Paste a link or upload a file directly.</p>
              </div>

              <BuildCard number="1" title="The Workshop Sprint" filled={Boolean(form.build1_link && form.build1_focus_area)} lm={lm}
                meta={[['Testing', 'Life skills design, project orientation, AI fluency, taste'], ['Time', '2 hours max'], ['Deliverable', 'The workshop artifact (slides / Notion / one-pager)']]}>
                <p className={`text-sm leading-relaxed ${lm ? 'text-blue-600' : 'text-white/45'}`}>
                  Design and produce a real <strong className={lm ? 'text-blue-800' : 'text-white/70'}>90-minute kickoff workshop</strong> for your cohort of 5–7 students — anchored in one of the international development focus areas we're working in with the Kenya team. Pick ONE area. The workshop should launch a real project in that area — something the cohort will continue building over the rotation, with a real output that lives past the workshop. <strong className={lm ? 'text-blue-700' : 'text-white/60'}>This isn't a lecture. It's the first 90 minutes of work that produces something the community actually uses.</strong>
                </p>
                <FocusAreaSelector value={form.build1_focus_area} onChange={v => handleFieldChange('build1_focus_area', v)} lm={lm} />
                <VideoInput label="Workshop Artifact — paste link or upload" name="build1_link" value={form.build1_link} onValueChange={handleFieldChange}
                  hint="Slides, Notion page, one-pager, or whatever you'd actually use on the day" lm={lm} />
              </BuildCard>

              <BuildCard number="2" title="The Cohort Experience" filled={Boolean(form.build2_design_link && form.build2_video_link && form.build2_constraint)} lm={lm}
                meta={[['Testing', 'Anticipating breaking points, design instinct, cultural humility, cohort resilience'], ['Time', '1.5–2 hours'], ['Deliverable', 'Design doc + 3-min video']]}>
                <p className={`text-sm leading-relaxed ${lm ? 'text-blue-600' : 'text-white/45'}`}>
                  Design something that <strong className={lm ? 'text-blue-800' : 'text-white/70'}>prevents a cohort from breaking</strong>. By week 30, the cohort will be tired, homesick, and far from home. The strongest cohorts don't avoid these moments — they're built to survive them. The greatest cohort experiences anticipate the failure modes and design for them before they happen. That's your job: build the experience, ritual, or structure that holds this cohort together when the year gets hard.
                </p>
                <ConstraintSelector value={form.build2_constraint} onChange={v => handleFieldChange('build2_constraint', v)} lm={lm} />
                <p className={`text-xs leading-relaxed ${lm ? 'text-blue-500' : 'text-white/35'}`}>
                  Your design could be a repeating ritual, a milestone tradition, a built-in reset mechanism, an integration with the local community — whatever actually addresses the failure mode you chose. Show how it runs in practice: sequence, prompts, materials, what the guide says, what the students do, what happens when it goes sideways. <strong className={lm ? 'text-blue-700' : 'text-white/55'}>How do you know this ritual is working by week 15?</strong>
                </p>
                <div className="rounded-lg bg-amber-500/8 border border-amber-400/15 px-3 py-2">
                  <p className="text-xs text-amber-300/80"><strong>Cultural humility is not optional.</strong> If your design involves the local community, tell us how you'll center their leadership — not feature them as a backdrop.</p>
                </div>
                <VideoInput label="Experience Design — paste link or upload" name="build2_design_link" value={form.build2_design_link} onValueChange={handleFieldChange}
                  hint="One-pager, plan, or visual flow — Drive, Notion, or PDF" lm={lm} />
                <VideoInput label="3-Minute Walkthrough Video — paste link or upload" name="build2_video_link" value={form.build2_video_link} onValueChange={handleFieldChange}
                  hint="Walk us through it in the voice you'd actually use — Loom, YouTube, Drive, or upload" lm={lm} />
              <BuildCard number="1" title="The Workshop Sprint" filled={Boolean(form.build1_link)} lm={lm}
                meta={[['Testing', 'Life skills design, AI fluency, taste'], ['Time', '2 hours max'], ['Deliverable', 'Slides / Notion / one-pager']]}>
                <p className={`text-sm leading-relaxed ${lm ? 'text-blue-600' : 'text-white/45'}`}>Design and produce a real <strong className={lm ? 'text-blue-800' : 'text-white/70'}>90-minute kickoff workshop</strong> for your cohort — anchored in one of the Kenya team's focus areas. Not a lecture. A first 90 minutes of real work that produces something the community uses.</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Food','Water','Empowerment','Education','Healthcare','Culture & Conservation','Community'].map(f => (
                    <span key={f} className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold">{f}</span>
                  ))}
                </div>
                <VideoInput label="Build 1 — Paste link or upload" name="build1_link" value={form.build1_link} onValueChange={handleFieldChange}
                  hint="Google Drive, Notion, Slides, PDF, or file upload" lm={lm} />
              </BuildCard>

              <BuildCard number="2" title="The Cohort Experience" filled={Boolean(form.build2_design_link && form.build2_video_link)} lm={lm}
                meta={[['Testing', 'Design instinct, cultural humility, resilience'], ['Time', '1.5–2 hours'], ['Deliverable', 'Design doc + 3-min video']]}>
                <p className={`text-sm leading-relaxed ${lm ? 'text-blue-600' : 'text-white/45'}`}>Design something that <strong className={lm ? 'text-blue-800' : 'text-white/70'}>prevents a cohort from breaking</strong>. By week 30 they'll be tired, homesick, and far from home. Strong cohorts don't avoid that — they're built to survive it.</p>
                <ConstraintSelector value={form.build2_constraint} onChange={v => handleFieldChange('build2_constraint', v)} lm={lm} />
                <div className="rounded-lg bg-amber-500/8 border border-amber-400/15 px-3 py-2">
                  <p className="text-xs text-amber-300/80"><strong>Cultural humility is not optional.</strong> If your design involves the local community, tell us how you'll center their leadership — not feature them as a backdrop.</p>
                </div>
                <VideoInput label="Design Doc — paste link or upload" name="build2_design_link" value={form.build2_design_link} onValueChange={handleFieldChange}
                  hint="One-pager, plan, visual — Drive, Notion, or PDF" lm={lm} />
                <VideoInput label="3-Minute Video — paste link or upload" name="build2_video_link" value={form.build2_video_link} onValueChange={handleFieldChange}
                  hint="Loom, YouTube, Google Drive, or upload" lm={lm} />
              </BuildCard>

              <BuildCard number="3" title="The Video" filled={Boolean(form.build3_video_link)} lm={lm}
                meta={[['Testing', 'Self-awareness, honesty, mindset'], ['Time', '20 minutes'], ['Deliverable', '90 sec – 2 min video']]}>
                <p className={`text-sm leading-relaxed ${lm ? 'text-blue-600' : 'text-white/45'}`}>
                  Talk to us. 90 seconds to 2 minutes. <strong className={lm ? 'text-blue-700' : 'text-white/65'}>Phone-quality is fine. Don't script. Don't read.</strong> We are looking for a clear-eyed picture of the job — not a pitch. The candidates who get it will sound different from the candidates who don't.
                </p>
                <p className={`text-sm leading-relaxed ${lm ? 'text-blue-600' : 'text-white/45'}`}>Talk to us. 90 seconds to 2 minutes. <strong className={lm ? 'text-blue-700' : 'text-white/65'}>Phone-quality is fine. Don't script. Don't read.</strong></p>
                <div className="space-y-1.5">
                  {[
                    'What are you most excited about for this year?',
                    "What do you understand your role to be on this trip? Be specific — not what you hope it will be, what you actually believe it is.",
                  ].map((q, i) => (
                    <div key={i} className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border ${lm ? 'bg-blue-50 border-blue-100' : 'bg-white/[0.03] border-white/8'}`}>
                      <span className="text-blue-400 font-bold text-xs flex-shrink-0 mt-0.5">{'①②'[i]}</span>
                      <p className={`text-sm ${lm ? 'text-blue-600' : 'text-white/50'}`}>{q}</p>
                    </div>
                  ))}
                </div>
                <p className={`text-xs ${lm ? 'text-blue-400' : 'text-white/25'}`}>Most of the 20 minutes is taking 3 takes and picking the most honest one.</p>
                <VideoInput label="Your Video — paste link or upload" name="build3_video_link" value={form.build3_video_link} onValueChange={handleFieldChange}
                  hint="Loom, YouTube, Google Drive, or upload directly" lm={lm} />
              </BuildCard>

              <BuildCard number="4" title="Language Tape" optional filled={Boolean(form.build4_language_link)} lm={lm}
                meta={[['Testing', 'Real fluency in non-English language'], ['Time', '5 minutes'], ['Deliverable', '≤60-second video in the language']]}>
                <p className={`text-sm leading-relaxed ${lm ? 'text-blue-600' : 'text-white/45'}`}>
                  If you speak a language other than English — especially Swahili, Spanish, or any language likely to come up in Kenya or Ecuador — talk to us in it. Tell us about your morning, your last vacation, your favorite food. Anything natural.
                </p>
                <p className={`text-xs ${lm ? 'text-blue-400' : 'text-white/30'}`}>
                  This filters for actual conversational fluency, which we value more than self-reported proficiency. Optional, but it helps.
                </p>
                <VideoInput label="Language Video — ≤60 seconds, in the language (optional)" name="build4_language_link" value={form.build4_language_link} onValueChange={handleFieldChange} lm={lm} />
              <BuildCard number="4" title="Language Tape" optional filled={Boolean(form.build4_language_link)} lm={lm}>
                <p className={`text-sm leading-relaxed ${lm ? 'text-blue-600' : 'text-white/45'}`}>If you speak Swahili, Spanish, or any language relevant to Kenya or Ecuador — talk to us in it. Anything natural. ≤60 seconds.</p>
                <VideoInput label="Language Video (optional)" name="build4_language_link" value={form.build4_language_link} onValueChange={handleFieldChange} lm={lm} />
              </BuildCard>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 3 of {totalSteps}</p>
                <h1 className={`text-3xl font-black uppercase tracking-tight ${lm ? 'text-blue-900' : 'text-white'}`}>Submission Check</h1>
                <p className={`text-sm mt-1.5 ${lm ? 'text-blue-400' : 'text-white/35'}`}>Confirm your builds are ready before continuing.</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Build 1 — Workshop Sprint',           value: form.build1_link,        required: isReq('build1_link'),         sub: form.build1_focus_area ? `Focus area: ${form.build1_focus_area}` : 'Focus area not selected' },
                  { label: 'Build 1 — Focus area selected',       value: form.build1_focus_area,  required: isReq('build1_link'),         sub: null },
                  { label: 'Build 2 — Cohort Experience (design)',value: form.build2_design_link,  required: isReq('build2_design_link'),  sub: null },
                  { label: 'Build 2 — Cohort Experience (video)', value: form.build2_video_link,   required: isReq('build2_video_link'),   sub: null },
                  { label: 'Build 2 — Design constraint chosen',  value: form.build2_constraint,   required: isReq('build2_constraint'),  sub: null },
                  { label: 'Build 3 — The Video',                 value: form.build3_video_link,   required: isReq('build3_video_link'),   sub: null },
                  { label: 'Build 4 — Language Tape (optional)',  value: form.build4_language_link, required: false,                       sub: null },
                ].map(({ label, value, required, sub }) => (
                  { label: 'Build 1 — Workshop Sprint',           value: form.build1_link,        required: isReq('build1_link') },
                  { label: 'Build 2 — Cohort Experience (design)',value: form.build2_design_link,  required: isReq('build2_design_link') },
                  { label: 'Build 2 — Cohort Experience (video)', value: form.build2_video_link,   required: isReq('build2_video_link') },
                  { label: 'Build 2 — Design constraint chosen',  value: form.build2_constraint,   required: isReq('build2_constraint') },
                  { label: 'Build 3 — The Video',                 value: form.build3_video_link,   required: isReq('build3_video_link') },
                  { label: 'Build 4 — Language Tape',             value: form.build4_language_link, required: false },
                ].map(({ label, value, required }) => (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${value ? lm ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/8 border-emerald-500/15' : required ? 'bg-rose-500/8 border-rose-500/15' : lm ? 'bg-blue-50 border-blue-100' : 'bg-white/[0.02] border-white/8'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black border ${value ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : required ? 'bg-rose-500/20 border-rose-400/30 text-rose-400' : lm ? 'border-blue-200 text-blue-300' : 'border-white/15 text-white/25'}`}>
                      {value ? '✓' : required ? '!' : '–'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-wide ${value ? 'text-emerald-400' : required ? 'text-rose-300' : lm ? 'text-blue-300' : 'text-white/20'}`}>{label}</div>
                      {value
                        ? <div className={`text-xs truncate mt-0.5 ${lm ? 'text-blue-400' : 'text-white/20'}`}>{sub || value}</div>
                        ? <div className={`text-xs truncate mt-0.5 ${lm ? 'text-blue-400' : 'text-white/20'}`}>{value}</div>
                        : <div className={`text-xs mt-0.5 ${required ? 'text-rose-400/60' : lm ? 'text-blue-300' : 'text-white/15'}`}>{required ? 'Missing — go back and add' : 'Optional'}</div>
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
                <h1 className={`text-3xl font-black uppercase tracking-tight ${lm ? 'text-blue-900' : 'text-white'}`}>References</h1>
                <p className={`text-sm mt-1.5 ${lm ? 'text-blue-400' : 'text-white/35'}`}>Two internal Alpha references. One must be your direct manager or Dean of Parents / Head of School.</p>
              </div>
              <div className={`rounded-xl border px-4 py-3 ${lm ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/8 border-blue-400/15'}`}>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className={`text-xs leading-relaxed ${lm ? 'text-blue-600' : 'text-blue-300/80'}`}>List your two references below. The Alpha team will reach out to them directly — you don't need to do anything else once you've submitted.</p>
                </div>
              </div>
              {([
                { n: 1, label: 'Reference 1 — Direct Manager or Dean of Parents / HoS', nameF: 'reference1_name', roleF: 'reference1_role', phoneF: 'reference1_phone', emailF: 'reference1_email' },
                { n: 2, label: 'Reference 2', nameF: 'reference2_name', roleF: 'reference2_role', phoneF: 'reference2_phone', emailF: 'reference2_email' },
              ] as const).map(({ n, label, nameF, roleF, phoneF, emailF }) => (
                <div key={n} className={`rounded-xl border p-5 space-y-4 ${lm ? 'bg-blue-50 border-blue-100' : 'bg-white/[0.03] border-white/8'}`}>
                  <p className={`text-xs font-black uppercase tracking-widest ${lm ? 'text-blue-400' : 'text-white/25'}`}>{label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Name" name={nameF} value={form[nameF]} onChange={handleChange} placeholder="Full name" lm={lm} />
                    <Input label="Role at Alpha" name={roleF} value={form[roleF]} onChange={handleChange} placeholder="e.g. Dean of Parents, Head of School" lm={lm} />
                    <Input label="Phone" name={phoneF} value={form[phoneF]} onChange={handleChange} placeholder="+1 (555) 000-0000" lm={lm} />
                    <Input label="Email" name={emailF} value={form[emailF]} onChange={handleChange} placeholder="ref@alpha.school" type="email" lm={lm} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="mb-7">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1.5">Section 5 of {totalSteps}</p>
                <h1 className={`text-3xl font-black uppercase tracking-tight ${lm ? 'text-blue-900' : 'text-white'}`}>Acknowledge & Sign</h1>
                <p className={`text-sm mt-1.5 ${lm ? 'text-blue-400' : 'text-white/35'}`}>Check each line. Each one is a real thing you are agreeing to.</p>
              </div>
              <div className="space-y-2">
                {acknowledgments.map((text, i) => {
                  const key = `ack_${i + 1}` as keyof FormData
                  return (
                    <label key={i} className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      form[key] ? lm ? 'border-blue-300 bg-blue-50' : 'border-blue-400/20 bg-blue-500/8' : lm ? 'border-blue-100 bg-white hover:border-blue-200' : 'border-white/8 bg-white/[0.02] hover:border-white/12'
                    }`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${form[key] ? 'bg-blue-500 border-blue-400' : lm ? 'border-blue-200' : 'border-white/20'}`}>
                        {form[key] && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <input type="checkbox" name={key} checked={form[key] as boolean} onChange={handleChange} className="sr-only" />
                      <span className={`text-sm leading-relaxed ${lm ? 'text-blue-700' : 'text-white/50'}`}>{text}</span>
                    </label>
                  )
                })}
              </div>
              <div className={`border rounded-xl p-5 ${lm ? 'bg-blue-50 border-blue-100' : 'bg-white/[0.03] border-white/8'}`}>
                <p className={`text-sm mb-4 italic ${lm ? 'text-blue-400' : 'text-white/20'}`}>I am submitting this application of my own volition. I have read everything in this packet. I understand what I am signing up for.</p>
                <Input label="Full Name (Signature)" name="applicant_name" value={form.applicant_name} onChange={handleChange} required placeholder="Type your full legal name" lm={lm} />
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
          <div className={`flex items-center justify-between mt-10 pt-5 border-t ${border}`}>
            <button onClick={() => step === 1 ? setPhase('landing') : goStep(step - 1)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors rounded-full border border-transparent ${lm ? 'text-blue-300 hover:text-blue-600 hover:border-blue-100' : 'text-white/25 hover:text-white/55 hover:border-white/8'}`}>
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Home' : 'Back'}
            </button>
            {step < totalSteps ? (
              <button onClick={() => goStep(step + 1)}
                className={`flex items-center gap-2 px-8 py-3 font-black uppercase tracking-wider text-sm rounded-full transition-colors ${lm ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-[#08111f] hover:bg-white/90'}`}>
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className={`flex items-center gap-2 px-8 py-3 font-black uppercase tracking-wider text-sm rounded-full disabled:opacity-50 transition-colors ${lm ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-[#08111f] hover:bg-white/90'}`}>
                {submitting ? 'Submitting…' : <><span>Submit Application</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
