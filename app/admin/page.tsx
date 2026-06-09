'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_REMINDER_TEMPLATES, renderTemplate, type ReminderTemplateDef } from '@/lib/email-templates'
import {
  Users, Search, ChevronDown, ChevronUp, Eye, X,
  CheckCircle, Clock, XCircle, TrendingUp, Award, Filter,
  ExternalLink, MessageSquare, Download, RefreshCw,
  Mail, Copy, Check, Settings, ToggleLeft, ToggleRight, Save,
  Undo2, Trash2, FlaskConical
} from 'lucide-react'

const PREV_STATUS: Record<string, string> = {
  under_review: 'submitted',
  advancing:    'under_review',
  accepted:     'advancing',
  rejected:     'under_review',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Default field config ──────────────────────────────────────────────
// Edit this to change what's required by default.
// Admins can override via the Settings tab — saved to Supabase.
const DEFAULT_FIELD_CONFIG = {
  full_name:                    { label: 'Full Name',                        required: true,  section: 'About You' },
  email:                        { label: 'Email',                            required: true,  section: 'About You' },
  phone:                        { label: 'Phone',                            required: false, section: 'About You' },
  role_at_alpha:                { label: 'Role at Alpha',                    required: true,  section: 'About You' },
  campus:                       { label: 'Campus',                           required: false, section: 'About You' },
  years_at_alpha:               { label: 'Years at Alpha',                   required: false, section: 'About You' },
  direct_manager:               { label: 'Direct Manager',                   required: false, section: 'About You' },
  head_of_school:               { label: 'Dean of Parents / Head of School', required: false, section: 'About You' },
  languages_spoken:             { label: 'Languages Spoken',                 required: false, section: 'About You' },
  prior_international_travel:   { label: 'Prior International Travel',       required: false, section: 'About You' },
  developing_world_experience:  { label: 'Developing-World Experience',      required: false, section: 'About You' },
  health_considerations:        { label: 'Health Considerations',             required: false, section: 'About You' },
  family_obligations:           { label: 'Personal/Family Obligations',       required: false, section: 'About You' },
  emergency_contact:            { label: 'Emergency Contact',                 required: false, section: 'About You' },
  build1_link:                  { label: 'Build 1 — Workshop Sprint',         required: true,  section: 'Builds' },
  build2_design_link:           { label: 'Build 2 — Design Doc',              required: true,  section: 'Builds' },
  build2_video_link:            { label: 'Build 2 — Video',                  required: true,  section: 'Builds' },
  build2_constraint:            { label: 'Build 2 — Constraint Chosen',      required: true,  section: 'Builds' },
  build3_video_link:            { label: 'Build 3 — The Video',              required: true,  section: 'Builds' },
  build4_language_link:         { label: 'Build 4 — Language Tape',          required: false, section: 'Builds' },
  reference1_name:              { label: 'Reference 1 — Name',               required: false, section: 'References' },
  reference1_email:             { label: 'Reference 1 — Email',              required: false, section: 'References' },
  reference2_name:              { label: 'Reference 2 — Name',               required: false, section: 'References' },
  reference2_email:             { label: 'Reference 2 — Email',              required: false, section: 'References' },
  manager_endorsement_status:   { label: 'Manager Endorsement Status',       required: false, section: 'References' },
}

type FieldKey = keyof typeof DEFAULT_FIELD_CONFIG
type FieldConfig = typeof DEFAULT_FIELD_CONFIG

const STATUS_CONFIG = {
  draft:        { label: 'Draft',        color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',   dot: 'bg-gray-400' },
  submitted:    { label: 'Submitted',    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500' },
  under_review: { label: 'Under Review', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500' },
  advancing:    { label: 'Advancing',    color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500' },
  rejected:     { label: 'Rejected',     color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500' },
  accepted:     { label: 'Accepted',     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-500' },
}

const CONSTRAINT_LABELS: Record<string, string> = {
  conflict: 'Conflict by Week 5',
  energy:   'Energy drops at mid-rotation',
  cultural: 'Cultural missteps happen',
  homesick: 'Someone wants to go home by Week 10',
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function BuildPip({ filled, label }: { filled: boolean; label: string }) {
  return (
    <span title={label} className={`inline-flex w-5 h-5 rounded items-center justify-center text-xs font-bold ${filled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
      {filled ? '✓' : '–'}
    </span>
  )
}

// ─── Field Config Editor ──────────────────────────────────────────────

function FieldConfigEditor({ config, onSave }: { config: FieldConfig; onSave: (c: FieldConfig) => Promise<void> }) {
  const [local, setLocal] = useState<FieldConfig>(config)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setLocal(config) }, [config])

  const toggle = (key: FieldKey) => {
    setLocal(prev => ({ ...prev, [key]: { ...prev[key], required: !prev[key].required } }))
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(local)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const sections = [...new Set(Object.values(DEFAULT_FIELD_CONFIG).map(f => f.section))]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Form Field Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Toggle which fields are required. Changes apply to future applications immediately.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'} disabled:opacity-50`}>
          {saving ? 'Saving…' : saved ? <><Check className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Changes</>}
        </button>
      </div>

      {sections.map(section => (
        <div key={section} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{section}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {(Object.entries(local) as [FieldKey, FieldConfig[FieldKey]][])
              .filter(([, v]) => v.section === section)
              .map(([key, field]) => (
                <div key={key} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{field.label}</span>
                    <span className="text-xs text-gray-400 ml-2 font-mono">{key}</span>
                  </div>
                  <button onClick={() => toggle(key)} className="flex items-center gap-2 group">
                    <span className={`text-xs font-bold ${field.required ? 'text-blue-600' : 'text-gray-400'}`}>
                      {field.required ? 'Required' : 'Optional'}
                    </span>
                    {field.required
                      ? <ToggleRight className="w-8 h-8 text-blue-600 group-hover:text-blue-500 transition-colors" />
                      : <ToggleLeft className="w-8 h-8 text-gray-300 group-hover:text-gray-400 transition-colors" />
                    }
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Nudge Composer ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RowReminderButton({ app, templates, onSendReminder }: { app: any; templates: ReminderTemplateDef[]; onSendReminder: (app: any, template: ReminderTemplateDef) => void }) {
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (menuPos) { setMenuPos(null); return }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
  }
  return (
    <>
      <button onClick={openMenu}
        title={app.last_nudged_at ? `Last reminded ${new Date(app.last_nudged_at).toLocaleString()} · ${app.nudge_count || 0} sent` : 'No reminders sent yet'}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs rounded-lg font-medium transition-colors">
        <Mail className="w-3 h-3" /> Remind{app.nudge_count ? ` (${app.nudge_count})` : ''}
        <ChevronDown className="w-3 h-3" />
      </button>
      {menuPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={e => { e.stopPropagation(); setMenuPos(null) }} />
          <div className="fixed z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto"
            style={{ top: menuPos.top, right: menuPos.right }}>
            {templates.map(t => (
              <button key={t.key} onClick={e => { e.stopPropagation(); setMenuPos(null); onSendReminder(app, t) }}
                className="w-full text-left px-3 py-2.5 hover:bg-amber-50 border-b border-gray-100 last:border-b-0">
                <div className="text-xs font-semibold text-gray-900">{t.label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5 truncate">{t.subject}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RefereeNudgeComposer({ app, refNum, onClose }: { app: any; refNum: number; onClose: () => void }) {
  const refName  = refNum === 1 ? app.reference1_name  : app.reference2_name
  const refEmail = refNum === 1 ? app.reference1_email : app.reference2_email
  const refRole  = refNum === 1 ? app.reference1_role  : app.reference2_role

  const refFormUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/reference?ref=${refNum}&applicant=${encodeURIComponent(app.full_name || '')}&email=${encodeURIComponent(app.email || '')}`

  const templates = {
    endorsement: {
      label: '⭐ Endorsement request',
      subject: `Endorsement request — ${app.full_name || 'Guide applicant'} · Alpha World School 2026–27`,
      body: `Hi ${refName || '[Name]'},\n\n${app.full_name || 'One of our guides'} has applied to be a Guide for Alpha World School's inaugural 2026–2027 cohort — a 38-week program across Kenya, Ecuador, and the United States — and has listed you as a reference.\n\nAs their ${refRole || 'manager / Head of School'}, we'd like to hear directly from you. Please complete the short endorsement form at the link below — it takes about 5 minutes:\n\n${refFormUrl}\n\nThis is a demanding 24/7 role. Your honest assessment matters to us.\n\nThank you,\nAlpha World School Team\napply@alphaworldschool.com`,
    },
    initial: {
      label: 'Initial outreach',
      subject: `Reference request — ${app.full_name || 'Guide applicant'} · Alpha World School 2026–27`,
      body: `Hi ${refName || '[Name]'},\n\n${app.full_name || 'One of our guides'} has applied to be a Guide for Alpha World School's inaugural 2026–2027 cohort — a 38-week program across Kenya, Ecuador, and the United States — and has listed you as a reference.\n\nThis is a demanding 24/7 role: guides are the primary caretakers of 5–7 students in developing-world environments. Your perspective on whether this person is ready matters to us.\n\nA short call (10–15 min) or a written reply both work equally well. Could you let us know when you're available?\n\nThank you,\nAlpha World School Team\napply@alphaworldschool.com`,
    },
    followup: {
      label: 'Follow-up nudge',
      subject: `Following up — ${app.full_name || 'guide applicant'} reference`,
      body: `Hi ${refName || '[Name]'},\n\nJust following up on our reference request for ${app.full_name || 'one of our applicants'}. We're in the final stages of review and want to hear from you before decisions are made.\n\nEven a few sentences about your experience working with ${app.full_name?.split(' ')[0] || 'them'} — and whether you'd recommend them for a 24/7 guide role with students in Kenya and Ecuador — would be hugely helpful.\n\nFeel free to reply directly.\n\nThank you,\nAlpha World School\napply@alphaworldschool.com`,
    },
    brief: {
      label: 'Short & direct',
      subject: `Quick reference for ${app.full_name || 'guide applicant'}`,
      body: `Hi ${refName || '[Name]'},\n\n${app.full_name || 'One of your colleagues'} is applying to be a World School Guide (38 weeks, Kenya/Ecuador/USA, 2026–27). You're listed as a reference.\n\nWould you be a strong advocate for them in a 24/7 caretaker role with students in challenging environments? A quick reply is all we need.\n\nThank you — Alpha World School\napply@alphaworldschool.com`,
    },
  }

  const [tKey, setTKey]     = useState('endorsement')
  const [subject, setSubject] = useState(templates.endorsement.subject)
  const [body, setBody]     = useState(templates.endorsement.body)
  const [copied, setCopied] = useState<string | null>(null)

  const switchT = (k: string) => { setTKey(k); setSubject(templates[k as keyof typeof templates].subject); setBody(templates[k as keyof typeof templates].body) }
  const copy = (type: string) => {
    const text = type === 'all' ? `To: ${refEmail}\nSubject: ${subject}\n\n${body}` : type === 'subject' ? subject : body
    navigator.clipboard.writeText(text).then(() => { setCopied(type); setTimeout(() => setCopied(null), 2000) })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 my-8 bg-white rounded-2xl border border-gray-200 shadow-2xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Mail className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Nudge Reference {refNum}</h2>
            </div>
            <p className="text-sm text-gray-500">
              {refName || <span className="italic">Name not filled</span>}
              {refRole && <span className="text-gray-400"> · {refRole}</span>}
              {refEmail && <span className="text-blue-600 ml-1">· {refEmail}</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2">
            {Object.keys(templates).map(k => (
              <button key={k} onClick={() => switchT(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${tKey === k ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {templates[k as keyof typeof templates].label}
              </button>
            ))}
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">To</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
              {refEmail || <span className="italic text-gray-400">No email on file — add to application first</span>}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Subject</div>
              <button onClick={() => copy('subject')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                {copied === 'subject' ? <><Check className="w-3 h-3 text-green-500" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
              </button>
            </div>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Body</div>
              <button onClick={() => copy('body')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                {copied === 'body' ? <><Check className="w-3 h-3 text-green-500" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
              </button>
            </div>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400 resize-none font-mono" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button onClick={() => window.open(`mailto:${refEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors">
              <Mail className="w-4 h-4" /> Open in Mail App
            </button>
            <button onClick={() => copy('all')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg border transition-all ${copied === 'all' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}`}>
              {copied === 'all' ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy full email</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DetailModal({ app, onClose, onStatusChange, onNotesChange, onToggleTest, onDelete, onSendReminder, reminderTemplates }: { app: any; onClose: () => void; onStatusChange: (id: string, status: string) => void; onNotesChange: (id: string, notes: string) => void; onToggleTest: (id: string, isTest: boolean) => void; onDelete: (id: string) => void; onSendReminder: (app: any, template: ReminderTemplateDef) => void; reminderTemplates: ReminderTemplateDef[] }) {
  const [notes, setNotes]       = useState(app.admin_notes || '')
  const [saving, setSaving]     = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [nudgeRef, setNudgeRef] = useState<number | null>(null)
  const [showReminderMenu, setShowReminderMenu] = useState(false)

  const saveNotes = async () => {
    setSaving(true); await onNotesChange(app.id, notes); setSaving(false)
    setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000)
  }

  const F = ({ label, value }: { label: string; value: string | null | undefined }) => value ? (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{value}</div>
    </div>
  ) : null

  const ackTexts = [
    'This is a job, not a vacation.',
    'Primary 24/7 caretaker for 5–7 students.',
    'Away for two international + one U.S. rotation.',
    "Upholding Alpha's three commitments in the field.",
    'Holding students AND self to high standards.',
    'First responder when things go wrong.',
    'Representing Alpha to communities and partners.',
    'Manager and HoS are aware of application.',
  ]

  const completedBuilds = [app.build1_link, app.build2_design_link, app.build2_video_link, app.build3_video_link].filter(Boolean).length
  const allAcks = [1,2,3,4,5,6,7,8].every(n => app[`ack_${n}`])

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-3xl mx-4 my-8 bg-white rounded-2xl border border-gray-200 shadow-2xl">
          <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{app.full_name || 'Unnamed Draft'}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{app.email} · {app.campus || '—'} · {app.role_at_alpha || '—'}</p>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={app.status} />
                {app.is_test && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    <FlaskConical className="w-3 h-3" /> Test
                  </span>
                )}
                <span className="text-xs text-gray-400">Submitted {new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-xs text-gray-400">{completedBuilds}/4 builds</span>
                {allAcks && <span className="text-xs text-green-600 font-medium">All acknowledgments ✓</span>}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4"><X className="w-5 h-5" /></button>
          </div>

          <div className="px-6 py-5 space-y-8 max-h-[75vh] overflow-y-auto">
            <div className="flex flex-wrap gap-4 items-start p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex-1 min-w-48">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Status</div>
                <select value={app.status} onChange={e => onStatusChange(app.id, e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500">
                  {Object.entries(STATUS_CONFIG).map(([k, cfg]) => <option key={k} value={k}>{cfg.label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-48 flex flex-col">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Internal Notes</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Admin-only notes…"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 resize-none" />
                <button onClick={saveNotes} disabled={saving}
                  className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg transition-colors self-start">
                  {saving ? 'Saving…' : savedMsg ? '✓ Saved' : 'Save Notes'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Builds</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Build 1 — Workshop Sprint', value: app.build1_link, isVideo: false, meta: app.build1_focus_area ? `Focus area: ${app.build1_focus_area}` : null },
                  { label: 'Build 2 — Design Doc', value: app.build2_design_link, isVideo: false, meta: app.build2_constraint ? `Constraint: ${CONSTRAINT_LABELS[app.build2_constraint] || app.build2_constraint}` : null },
                  { label: 'Build 2 — Video', value: app.build2_video_link, isVideo: true, meta: null },
                  { label: 'Build 3 — The Video', value: app.build3_video_link, isVideo: true, meta: null },
                  { label: 'Build 4 — Language Tape', value: app.build4_language_link, isVideo: true, meta: null },
                ].map(({ label, value, isVideo, meta }) => {
                  const isYoutube = value && (value.includes('youtube.com') || value.includes('youtu.be'))
                  const isLoom = value && value.includes('loom.com')
                  const isDrive = value && value.includes('drive.google.com')
                  const canEmbed = isVideo && (isYoutube || isLoom)
                  const embedUrl = isYoutube
                    ? value.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                    : isLoom ? value.replace('/share/', '/embed/') : null
                  return (
                  <div key={label} className={`p-3 rounded-lg border ${value ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
                    {meta && (
                      <div className="inline-block mb-2 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold">{meta}</div>
                    )}
                    {value ? (
                      <div className="space-y-2">
                        {canEmbed && embedUrl && (
                          <div className="rounded overflow-hidden bg-black aspect-video">
                            <iframe src={embedUrl} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen title={label} />
                          </div>
                        )}
                        {isDrive && isVideo && (
                          <div className="rounded overflow-hidden bg-black aspect-video">
                            <iframe
                              src={value.replace('/view', '/preview').replace('/edit', '/preview')}
                              className="w-full h-full" allow="autoplay" allowFullScreen title={label} />
                          </div>
                        )}
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Submitted link</div>
                          <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-500 underline break-all flex items-start gap-1">
                            <span className="break-all">{value}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          </a>
                        </div>
                      </div>
                    ) : <span className="text-xs text-gray-400 italic">Not submitted</span>}
                  </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">About</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Phone" value={app.phone} />
                <F label="Direct Manager" value={app.direct_manager} />
                <F label="Dean of Parents / HoS" value={app.head_of_school} />
                <F label="Years at Alpha" value={app.years_at_alpha} />
                <F label="Emergency Contact" value={app.emergency_contact} />
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <F label="Languages Spoken" value={app.languages_spoken} />
                <F label="International Travel" value={app.prior_international_travel_yn === 'Yes' ? app.prior_international_travel : app.prior_international_travel_yn} />
                <F label="Developing-World Experience" value={app.developing_world_experience_yn === 'Yes' ? app.developing_world_experience : app.developing_world_experience_yn} />
                <F label="Health Considerations" value={app.health_considerations_yn === 'Yes' ? app.health_considerations : app.health_considerations_yn} />
                <F label="Family Obligations" value={app.family_obligations_yn === 'Yes' ? app.family_obligations : app.family_obligations_yn} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">References</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Reference 1 — Manager / Dean / HoS', name: app.reference1_name, role: app.reference1_role, email: app.reference1_email, phone: app.reference1_phone, n: 1 },
                  { label: 'Reference 2', name: app.reference2_name, role: app.reference2_role, email: app.reference2_email, phone: app.reference2_phone, n: 2 },
                ].map(ref => (
                  <div key={ref.n} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{ref.label}</p>
                      <button onClick={() => setNudgeRef(ref.n)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg border border-blue-200 transition-colors">
                        <Mail className="w-3 h-3" /> Nudge
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{ref.name || <span className="italic text-gray-400">Not filled</span>}</p>
                    {ref.role  && <p className="text-xs text-gray-500">{ref.role}</p>}
                    {ref.email && <a href={`mailto:${ref.email}`} className="text-xs text-blue-600 hover:underline">{ref.email}</a>}
                    {ref.phone && <p className="text-xs text-gray-500">{ref.phone}</p>}
                  </div>
                ))}
              </div>
              <F label={`Manager Endorsement (${app.manager_endorsement_status || 'not set'})`} value={app.manager_endorsement_text} />
              <div className="mt-2"><F label="Endorser" value={app.endorser_name ? `${app.endorser_name}${app.endorser_role ? ' — ' + app.endorser_role : ''}` : null} /></div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Acknowledgments</h3>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {ackTexts.map((text, i) => {
                  const checked = Boolean(app[`ack_${i+1}`])
                  return (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${checked ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {checked ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span className="truncate">{text}</span>
                    </div>
                  )
                })}
              </div>
              <F label="Applicant Signature" value={app.applicant_name} />
            </div>

            <div className="pt-4 mt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => onToggleTest(app.id, !app.is_test)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${app.is_test
                    ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  <FlaskConical className="w-3.5 h-3.5" />
                  {app.is_test ? 'Unmark as test' : 'Mark as test'}
                </button>
                {app.status === 'draft' && app.email && (
                  <div className="relative">
                    <button onClick={() => setShowReminderMenu(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
                      title={app.last_nudged_at ? `Last reminded ${new Date(app.last_nudged_at).toLocaleString()} · ${app.nudge_count || 0} sent` : 'No reminders sent yet'}>
                      <Mail className="w-3.5 h-3.5" />
                      {app.last_nudged_at ? `Send reminder (${app.nudge_count || 0} sent)` : 'Send reminder'}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showReminderMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowReminderMenu(false)} />
                        <div className="absolute z-40 left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto">
                          {reminderTemplates.map(t => (
                            <button key={t.key} onClick={() => { setShowReminderMenu(false); onSendReminder(app, t) }}
                              className="w-full text-left px-3 py-2.5 hover:bg-amber-50 border-b border-gray-100 last:border-b-0">
                              <div className="text-xs font-semibold text-gray-900">{t.label}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5 truncate">{t.subject}</div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => {
                if (window.confirm(`Permanently delete the application for ${app.full_name || app.email || 'this applicant'}? This cannot be undone.`)) {
                  onDelete(app.id)
                }
              }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border bg-red-50 border-red-200 text-red-700 hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete application
              </button>
            </div>
          </div>
        </div>
      </div>
      {nudgeRef && <RefereeNudgeComposer app={app} refNum={nudgeRef} onClose={() => setNudgeRef(null)} />}
    </>
  )
}

const ADMIN_EMAILS = [
  'tasha.arnold@alpha.school',
  'emily.lopez@alpha.school',
  'zara.raheem@alpha.school',
]

// ─── Admin Users Panel ────────────────────────────────────────────────

const SUPER_ADMINS = ['zara.raheem@alpha.school']

// ─── Email Templates Panel ────────────────────────────────────────────

function EmailTemplatesPanel({ templates, onSave }: { templates: ReminderTemplateDef[]; onSave: (t: ReminderTemplateDef[]) => Promise<void> }) {
  const [list, setList]     = useState<ReminderTemplateDef[]>(templates)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [openKey, setOpenKey] = useState<string | null>(null)

  useEffect(() => { setList(templates) }, [templates])

  const dirty = JSON.stringify(list) !== JSON.stringify(templates)

  const update = (key: string, patch: Partial<ReminderTemplateDef>) =>
    setList(prev => prev.map(t => t.key === key ? { ...t, ...patch } : t))

  const resetBuiltin = (key: string) => {
    const def = DEFAULT_REMINDER_TEMPLATES.find(t => t.key === key)
    if (def) update(key, { label: def.label, subject: def.subject, body: def.body })
  }

  const remove = (key: string) => setList(prev => prev.filter(t => t.key !== key))

  const add = () => {
    let base = 'custom', key = base, i = 1
    const keys = new Set(list.map(t => t.key))
    while (keys.has(key)) { key = `${base}_${i++}` }
    const t: ReminderTemplateDef = { key, label: 'New template', subject: '', body: 'Hi {first_name},\n\n{resume_link}\n\n— The Alpha World School team' }
    setList(prev => [...prev, t]); setOpenKey(key)
  }

  const save = async () => {
    setSaving(true); await onSave(list); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Reminder Email Templates</h2>
          <p className="text-xs text-gray-400 mt-0.5">Templates shown in the &ldquo;Remind&rdquo; menu on draft applicants. Use <code className="text-gray-500">{'{first_name}'}</code> and <code className="text-gray-500">{'{resume_link}'}</code> as placeholders.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
          {dirty && !saving && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
          <button onClick={save} disabled={!dirty || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {list.map(t => {
          const open = openKey === t.key
          return (
            <div key={t.key} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => setOpenKey(open ? null : t.key)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                  {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{t.label || <span className="italic text-gray-400">Untitled</span>}
                      {t.builtin && <span className="ml-2 text-[10px] uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full">Built-in</span>}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{t.subject || <span className="italic">No subject</span>}</div>
                  </div>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.builtin
                    ? <button onClick={() => resetBuiltin(t.key)} title="Reset to default" className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"><Undo2 className="w-3.5 h-3.5" /> Reset</button>
                    : <button onClick={() => remove(t.key)} title="Delete template" className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /> Delete</button>}
                </div>
              </div>
              {open && (
                <div className="mt-3 space-y-3 pl-6">
                  {!t.builtin && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Menu label</label>
                      <input value={t.label} onChange={e => update(t.key, { label: e.target.value })}
                        className="mt-1 w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Subject</label>
                    <input value={t.subject} onChange={e => update(t.key, { subject: e.target.value })}
                      className="mt-1 w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Body</label>
                    <textarea value={t.body} onChange={e => update(t.key, { body: e.target.value })} rows={12}
                      className="mt-1 w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono leading-relaxed focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
        <button onClick={add} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add template</button>
      </div>
    </div>
  )
}

function AdminUsersPanel({ currentEmail }: { currentEmail: string }) {
  const [adminList, setAdminList] = useState<string[]>(ADMIN_EMAILS)
  const [newEmail, setNewEmail]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const isSuperAdmin = SUPER_ADMINS.includes(currentEmail.toLowerCase())

  useEffect(() => {
    supabase.from('form_config').select('config').eq('id', 'admin_users').single()
      .then(({ data }) => { if (data?.config?.emails) setAdminList(data.config.emails) })
  }, [])

  const save = async (list: string[]) => {
    setSaving(true)
    await supabase.from('form_config').upsert({ id: 'admin_users', config: { emails: list } }, { onConflict: 'id' })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const add = () => {
    const e = newEmail.toLowerCase().trim()
    if (!e || adminList.includes(e)) return
    const updated = [...adminList, e]
    setAdminList(updated); setNewEmail(''); save(updated)
  }

  const remove = (email: string) => {
    if (SUPER_ADMINS.includes(email)) return
    const updated = adminList.filter(e => e !== email)
    setAdminList(updated); save(updated)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Admin Users</h2>
          <p className="text-xs text-gray-400 mt-0.5">People who can access this dashboard.</p>
        </div>
        {saved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
      </div>
      <div className="divide-y divide-gray-100">
        {adminList.map(email => (
          <div key={email} className="flex items-center justify-between px-5 py-3">
            <div>
              <span className="text-sm text-gray-800">{email}</span>
              {SUPER_ADMINS.includes(email) && <span className="ml-2 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">Super Admin</span>}
              {email === currentEmail && <span className="ml-2 text-xs text-gray-400">(you)</span>}
            </div>
            {isSuperAdmin && !SUPER_ADMINS.includes(email) && (
              <button onClick={() => remove(email)} className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors">Remove</button>
            )}
          </div>
        ))}
      </div>
      {isSuperAdmin && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="new.admin@alpha.school"
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
          <button onClick={add} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors">Add</button>
        </div>
      )}
      {!isSuperAdmin && (
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Contact zara.raheem@alpha.school to add or remove admin users.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed]             = useState(false)
  const [adminEmail, setAdminEmail]     = useState('')
  const [authError, setAuthError]       = useState('')
  const [tab, setTab]                   = useState<'applications' | 'settings'>('applications')
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading]           = useState(false)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('non_draft')
  const [showTest, setShowTest]         = useState(false)
  const [selectedApp, setSelectedApp]   = useState<any>(null)
  const [sortField, setSortField]       = useState('created_at')
  const [sortDir, setSortDir]           = useState('desc')
  const [newCount, setNewCount]         = useState(0)
  const [liveConnected, setLiveConnected] = useState(false)
  const [fieldConfig, setFieldConfig]   = useState<FieldConfig>(DEFAULT_FIELD_CONFIG)
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplateDef[]>(DEFAULT_REMINDER_TEMPLATES)
  const [sheetUrl, setSheetUrl]   = useState<string | null>(null)
  const [syncing, setSyncing]     = useState(false)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('guide_applications').select('*').order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }, [])

  const fetchFieldConfig = useCallback(async () => {
    const { data } = await supabase.from('form_config').select('config').eq('id', 'default').single()
    if (data?.config) setFieldConfig(data.config as FieldConfig)
  }, [])

  const saveFieldConfig = async (config: FieldConfig) => {
    await supabase.from('form_config').upsert({ id: 'default', config }, { onConflict: 'id' })
    setFieldConfig(config)
  }

  const fetchReminderTemplates = useCallback(async () => {
    const { data } = await supabase.from('form_config').select('config').eq('id', 'reminder_templates').single()
    const stored = (data?.config as { templates?: ReminderTemplateDef[] } | null)?.templates
    if (stored && stored.length) setReminderTemplates(stored)
  }, [])

  const saveReminderTemplates = async (templates: ReminderTemplateDef[]) => {
    await supabase.from('form_config').upsert({ id: 'reminder_templates', config: { templates } }, { onConflict: 'id' })
    setReminderTemplates(templates)
  }

  // Persist auth across refreshes within the session
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_email')
    if (saved && ADMIN_EMAILS.includes(saved)) {
      setAdminEmail(saved)
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchApplications()
    fetchFieldConfig()
    fetchReminderTemplates()
    fetch('/api/admin/sync-sheet/info', { headers: { 'x-admin-email': adminEmail } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.configured) setSheetUrl(d.url) })
      .catch(() => {})
  }, [authed, adminEmail, fetchApplications, fetchFieldConfig, fetchReminderTemplates])

  const handleSyncSheet = async () => {
    if (!window.confirm('Resync wipes the Google Sheet and re-writes every non-draft application from the current DB state. Any manual edits in the sheet will be lost. Continue?')) return
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/sync-sheet', {
        method: 'POST',
        headers: { 'x-admin-email': adminEmail },
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Sync failed.'); return }
      alert(`Synced ${data.written} application${data.written === 1 ? '' : 's'} to the Sheet.`)
    } catch (err) {
      alert(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (!authed) return
    const ch = supabase.channel('guide_apps_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guide_applications' },
        p => { setApplications(prev => [p.new, ...prev]); setNewCount(c => c + 1) })
      .subscribe(s => setLiveConnected(s === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(ch) }
  }, [authed])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const email = adminEmail.toLowerCase().trim()
    if (ADMIN_EMAILS.includes(email)) {
      sessionStorage.setItem('admin_email', email)
      setAuthed(true)
      setAuthError('')
    } else {
      setAuthError('This email is not authorized for admin access.')
    }
  }

  const syncApplicationToSheet = (id: string) => {
    fetch('/api/admin/sync-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify({ id }),
    }).catch(err => console.error('Sheet sync failed:', err))
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('guide_applications').update({ status }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selectedApp?.id === id) setSelectedApp((prev: any) => prev ? { ...prev, status } : null)
    syncApplicationToSheet(id)
  }

  const handleNotesChange = async (id: string, admin_notes: string) => {
    await supabase.from('guide_applications').update({ admin_notes }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, admin_notes } : a))
    syncApplicationToSheet(id)
  }

  const handleToggleTest = async (id: string, is_test: boolean) => {
    await supabase.from('guide_applications').update({ is_test }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, is_test } : a))
    if (selectedApp?.id === id) setSelectedApp((prev: any) => prev ? { ...prev, is_test } : null)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('guide_applications').delete().eq('id', id)
    setApplications(prev => prev.filter(a => a.id !== id))
    if (selectedApp?.id === id) setSelectedApp(null)
  }

  const [driveExporting, setDriveExporting] = useState(false)
  const handleExportDrive = async () => {
    const targets = applications.filter(a => a.status !== 'draft' && !a.is_test)
    if (!targets.length) { alert('No non-draft applications to export.'); return }
    if (!window.confirm(`Create or refresh a Drive subfolder for each of ${targets.length} non-draft application${targets.length === 1 ? '' : 's'}? Each folder gets an application.csv and summary.md.`)) return
    setDriveExporting(true)
    try {
      const res = await fetch('/api/admin/export-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Export failed.'); return }
      const failMsg = data.failures?.length
        ? `\n\n${data.failures.length} failed:\n${data.failures.map((f: { name: string; error: string }) => `• ${f.name}: ${f.error}`).join('\n')}`
        : ''
      if (window.confirm(`Exported ${data.exported} applicant${data.exported === 1 ? '' : 's'} to Drive.${failMsg}\n\nOpen the parent folder?`)) {
        window.open(data.parentFolderUrl, '_blank')
      }
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDriveExporting(false)
    }
  }

  const handleSendReminder = async (app: any, template: ReminderTemplateDef) => {
    if (!app.email) { alert('This applicant has no email on file.'); return }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const resumeUrl = `${origin}/?token=${encodeURIComponent(app.id)}`
    const { subject, body } = renderTemplate(template, { name: app.full_name || '', resumeUrl })
    const mailto = `mailto:${encodeURIComponent(app.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto, '_blank')
    const now = new Date().toISOString()
    const nextCount = (app.nudge_count || 0) + 1
    await supabase.from('guide_applications').update({ last_nudged_at: now, nudge_count: nextCount }).eq('id', app.id)
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, last_nudged_at: now, nudge_count: nextCount } : a))
    if (selectedApp?.id === app.id) {
      setSelectedApp((prev: any) => prev ? { ...prev, last_nudged_at: now, nudge_count: nextCount } : null)
    }
  }

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(p => p === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const visible = showTest ? applications : applications.filter(a => !a.is_test)

  const filtered = visible
    .filter(a => {
      const q = search.toLowerCase()
      const statusMatch = statusFilter === 'all' ? true :
        statusFilter === 'non_draft' ? a.status !== 'draft' :
        a.status === statusFilter
      return (!q || a.full_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.campus?.toLowerCase().includes(q)) && statusMatch
    })
    .sort((a, b) => {
      const av = a[sortField] || '', bv = b[sortField] || ''
      return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })

  const testCount = applications.filter(a => a.is_test).length

  const stats = {
    submitted:    visible.filter(a => a.status === 'submitted').length,
    drafts:       visible.filter(a => a.status === 'draft').length,
    under_review: visible.filter(a => a.status === 'under_review').length,
    advancing:    visible.filter(a => a.status === 'advancing').length,
    accepted:     visible.filter(a => a.status === 'accepted').length,
    rejected:     visible.filter(a => a.status === 'rejected').length,
  }
  const totalSubmitted = visible.filter(a => a.status !== 'draft').length

  const exportCSV = () => {
    const headers = ['Name','Email','Campus','Role','Status','Builds Submitted','Build 1 Focus','Build 1 Link','Build 2 Constraint','Build 2 Design','Build 2 Video','Build 3 Video','Build 4 Language','Languages','Ref1 Name','Ref1 Email','Ref2 Name','Ref2 Email','Submitted']
    const rows = filtered.map(a => [
      a.full_name||'', a.email||'', a.campus||'', a.role_at_alpha||'', a.status||'',
      [a.build1_link,a.build2_design_link,a.build2_video_link,a.build3_video_link].filter(Boolean).length,
      a.build1_focus_area||'', a.build1_link||'',
      a.build2_constraint||'', a.build2_design_link||'', a.build2_video_link||'',
      a.build3_video_link||'', a.build4_language_link||'',
      a.languages_spoken||'',
      a.reference1_name||'', a.reference1_email||'',
      a.reference2_name||'', a.reference2_email||'',
      new Date(a.created_at).toLocaleDateString(),
    ])
    const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    Object.assign(document.createElement('a'),{href:url,download:'aws-applications.csv'}).click()
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <img src="/alphahigh.png" alt="Alpha World School" className="h-10 w-auto object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
          </div>
          <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">Guide Applications 2026–27</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Your Alpha Email</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} autoFocus placeholder="you@alpha.school"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm" />
              <p className="text-xs text-gray-400 mt-1.5">Access is restricted to authorised Alpha staff.</p>
            </div>
            {authError && <p className="text-rose-600 text-sm">{authError}</p>}
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-sm">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/alphahigh.png" alt="Alpha World School" className="h-7 w-auto object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
            <div>
              <span className="text-gray-900 font-bold text-sm">Alpha World School</span>
              <span className="text-gray-400 text-xs ml-2">Admin · Guide Applications 2026–27</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className={liveConnected ? 'text-green-600' : 'text-gray-400'}>{liveConnected ? 'Live' : 'Connecting…'}</span>
            </div>
            {/* Tab switcher */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setTab('applications')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${tab === 'applications' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                <Users className="w-3.5 h-3.5" /> Applications
              </button>
              <button onClick={() => setTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${tab === 'settings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                <Settings className="w-3.5 h-3.5" /> Form Settings
              </button>
            </div>
            <a href="/" className="text-gray-400 hover:text-gray-700 text-xs">← View Form</a>
            <button onClick={() => { sessionStorage.removeItem('admin_email'); setAuthed(false); setAdminEmail('') }}
              className="text-gray-400 hover:text-gray-700 text-xs border border-gray-200 px-3 py-1.5 rounded-lg">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Settings tab ── */}
        {tab === 'settings' && (
          <div className="space-y-8">
            <FieldConfigEditor config={fieldConfig} onSave={saveFieldConfig} />
            {SUPER_ADMINS.includes(adminEmail.toLowerCase()) && (
              <EmailTemplatesPanel templates={reminderTemplates} onSave={saveReminderTemplates} />
            )}
            <AdminUsersPanel currentEmail={adminEmail} />
          </div>
        )}

        {/* ── Applications tab ── */}
        {tab === 'applications' && (
          <>
            {newCount > 0 && (
              <div className="mb-5 flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm">
                <span className="text-green-700 font-medium">🎉 {newCount} new application{newCount > 1 ? 's' : ''} since you opened this page</span>
                <button onClick={() => setNewCount(0)} className="text-green-500 text-xs ml-4">Dismiss</button>
              </div>
            )}

            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pipeline</h2>
              <button onClick={() => setStatusFilter('non_draft')}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                <span className="font-bold text-gray-900 text-base mr-1.5">{totalSubmitted}</span>
                total applications submitted
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
              {[
                { label: 'Submitted',    value: stats.submitted,    Icon: Users,      color: 'text-blue-700',    filter: 'submitted' },
                { label: 'Drafts',       value: stats.drafts,       Icon: Clock,      color: 'text-gray-400',    filter: 'draft' },
                { label: 'Under Review', value: stats.under_review, Icon: Eye,        color: 'text-amber-600',   filter: 'under_review' },
                { label: 'Advancing',    value: stats.advancing,    Icon: TrendingUp, color: 'text-green-600',   filter: 'advancing' },
                { label: 'Accepted',     value: stats.accepted,     Icon: Award,      color: 'text-emerald-600', filter: 'accepted' },
                { label: 'Rejected',     value: stats.rejected,     Icon: XCircle,    color: 'text-red-400',     filter: 'rejected' },
              ].map(({ label, value, Icon, color, filter }) => {
                const active = statusFilter === filter
                return (
                  <button key={label}
                    onClick={() => setStatusFilter(active ? 'non_draft' : filter)}
                    aria-pressed={active}
                    className={`rounded-xl p-4 text-left border transition-all ${active
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs ${active ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>{label}</span>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, campus…"
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-blue-500">
                  <option value="non_draft">All Submitted</option>
                  <option value="all">All (incl. Drafts)</option>
                  {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'draft').map(([k,cfg]) => <option key={k} value={k}>{cfg.label}</option>)}
                  <option value="draft">Drafts only</option>
                </select>
              </div>
              {(testCount > 0 || showTest) && (
                <button onClick={() => setShowTest(v => !v)}
                  title={showTest ? 'Hide test applications' : 'Show test applications'}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg border transition-colors ${showTest
                    ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  <FlaskConical className="w-3.5 h-3.5" />
                  {showTest ? `Showing ${testCount} test` : `${testCount} test hidden`}
                </button>
              )}
              <button onClick={fetchApplications} className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-300 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              {sheetUrl && (
                <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Sheet
                </a>
              )}
              <button onClick={handleSyncSheet} disabled={syncing}
                title="Wipe and re-write the Google Sheet from the current DB state (status, notes, etc.)"
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm rounded-lg font-medium transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> {syncing ? 'Syncing…' : 'Resync Sheet'}
              </button>
              <button onClick={handleExportDrive} disabled={driveExporting}
                title="Create a Drive subfolder per non-draft applicant with their CSV and a summary"
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-sm rounded-lg font-medium transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> {driveExporting ? 'Exporting…' : 'Export to Drive'}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {[
                        { key: 'full_name',  label: 'Applicant' },
                        { key: null,         label: 'Campus / Role' },
                        { key: null,         label: 'Builds' },
                        { key: null,         label: 'Refs' },
                        { key: 'status',     label: 'Status' },
                        { key: 'created_at', label: 'Date' },
                        { key: null,         label: '' },
                      ].map(({ key, label }, i) => (
                        <th key={i}
                          className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${key ? 'cursor-pointer hover:text-gray-600 select-none' : ''}`}
                          onClick={key ? () => toggleSort(key) : undefined}>
                          <span className="flex items-center gap-1">
                            {label}
                            {key === sortField && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No applications found.</td></tr>
                    ) : filtered.map(app => {
                      const builds = [
                        { v: app.build1_link,        l: 'Build 1' },
                        { v: app.build2_design_link, l: 'Build 2 Design' },
                        { v: app.build2_video_link,  l: 'Build 2 Video' },
                        { v: app.build3_video_link,  l: 'Build 3' },
                      ]
                      return (
                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900 text-sm">{app.full_name || <span className="italic text-gray-300 text-xs">Unnamed draft</span>}</div>
                            <div className="text-gray-400 text-xs mt-0.5">{app.email || '—'}</div>
                            {app.languages_spoken && <div className="text-gray-400 text-xs mt-0.5 truncate max-w-44">🌐 {app.languages_spoken}</div>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-gray-700 text-sm">{app.campus || '—'}</div>
                            <div className="text-gray-400 text-xs">{app.role_at_alpha || '—'}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">{builds.map(({ v, l }, i) => <BuildPip key={i} filled={Boolean(v)} label={l} />)}</div>
                            <div className="text-xs text-gray-400 mt-1">{builds.filter(b => b.v).length}/4</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${app.reference1_email ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>1</span>
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${app.reference2_email ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>2</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {(() => {
                              const NEXT: Record<string, { label: string; value: string; cls: string }[]> = {
                                submitted:    [{ label: '→ Under Review', value: 'under_review', cls: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' }],
                                under_review: [
                                  { label: '→ Advancing',  value: 'advancing', cls: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
                                  { label: '→ Reject',     value: 'rejected',  cls: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' },
                                ],
                                advancing:    [
                                  { label: '→ Accept',     value: 'accepted',  cls: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
                                  { label: '→ Reject',     value: 'rejected',  cls: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' },
                                ],
                              }
                              const actions = NEXT[app.status] || []
                              const prev = PREV_STATUS[app.status]
                              return (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <StatusBadge status={app.status} />
                                    {app.is_test && (
                                      <span title="Test application" className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                        TEST
                                      </span>
                                    )}
                                  </div>
                                  {actions.map(a => (
                                    <button key={a.value}
                                      onClick={e => { e.stopPropagation(); handleStatusChange(app.id, a.value) }}
                                      className={`block w-full text-left px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${a.cls}`}>
                                      {a.label}
                                    </button>
                                  ))}
                                  {prev && (
                                    <button
                                      onClick={e => { e.stopPropagation(); handleStatusChange(app.id, prev) }}
                                      title={`Revert to ${STATUS_CONFIG[prev as keyof typeof STATUS_CONFIG]?.label}`}
                                      className="flex items-center gap-1 w-full text-left px-2.5 py-1 rounded-lg border text-xs font-medium bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                                      <Undo2 className="w-3 h-3" /> Revert to {STATUS_CONFIG[prev as keyof typeof STATUS_CONFIG]?.label}
                                    </button>
                                  )}
                                  {app.admin_notes && (
                                    <div className="flex items-center gap-1 mt-1" title={app.admin_notes}>
                                      <MessageSquare className="w-3 h-3 text-gray-300" />
                                      <span className="text-xs text-gray-400 truncate max-w-24">{app.admin_notes}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                            {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            <div className="text-gray-300">{new Date(app.created_at).getFullYear()}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSelectedApp(app)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg font-medium transition-colors">
                                <Eye className="w-3 h-3" /> View
                              </button>
                              {app.status === 'draft' && app.email && (
                                <RowReminderButton app={app} templates={reminderTemplates} onSendReminder={handleSendReminder} />
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Showing {filtered.length} of {applications.length} applications</span>
                {statusFilter !== 'all' && <button onClick={() => setStatusFilter('all')} className="text-blue-500 hover:text-blue-700">Clear filter</button>}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedApp && (
        <DetailModal app={selectedApp} onClose={() => setSelectedApp(null)}
          onStatusChange={handleStatusChange} onNotesChange={handleNotesChange}
          onToggleTest={handleToggleTest} onDelete={handleDelete}
          onSendReminder={handleSendReminder} reminderTemplates={reminderTemplates} />
      )}
    </div>
  )
}
