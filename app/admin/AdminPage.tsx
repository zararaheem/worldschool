'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, GuideApplication, ApplicationStatus } from '@/lib/supabase'
import {
  Users, Search, ChevronDown, ChevronUp, Eye, X,
  CheckCircle, Clock, XCircle, TrendingUp, Award, Filter,
  ExternalLink, MessageSquare, Download, RefreshCw
} from 'lucide-react'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  draft:        { label: 'Draft',        color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200',   dot: 'bg-gray-400' },
  submitted:    { label: 'Submitted',    color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',   dot: 'bg-blue-500' },
  under_review: { label: 'Under Review', color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',  dot: 'bg-amber-500' },
  advancing:    { label: 'Advancing',    color: 'text-green-700',   bg: 'bg-green-50',    border: 'border-green-200',  dot: 'bg-green-500' },
  rejected:     { label: 'Rejected',     color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',    dot: 'bg-red-500' },
  accepted:     { label: 'Accepted',     color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200',dot: 'bg-emerald-500' },
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status]
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

function DetailModal({ app, onClose, onStatusChange, onNotesChange }: {
  app: GuideApplication
  onClose: () => void
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>
  onNotesChange: (id: string, notes: string) => Promise<void>
}) {
  const [notes, setNotes] = useState(app.admin_notes || '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  const saveNotes = async () => {
    setSaving(true)
    await onNotesChange(app.id, notes)
    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) =>
    value ? (
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
  const allAcks = [1,2,3,4,5,6,7,8].every(n => app[`ack_${n}` as keyof GuideApplication])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl mx-4 my-8 bg-white rounded-2xl border border-gray-200 shadow-2xl">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{app.full_name || <span className="italic text-gray-400">Unnamed Draft</span>}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{app.email} · {app.campus || '—'} · {app.role_at_alpha || '—'}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={app.status} />
              <span className="text-xs text-gray-400">Submitted {new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-xs text-gray-400">{completedBuilds}/4 builds</span>
              {allAcks && <span className="text-xs text-green-600 font-medium">All acks ✓</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Admin Actions */}
          <div className="flex flex-wrap gap-4 items-start p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex-1 min-w-48">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Application Status</div>
              <select
                value={app.status}
                onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500"
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-48 flex flex-col">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Internal Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visible only to admin..."
                rows={2}
                className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
              <button onClick={saveNotes} disabled={saving}
                className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 self-start">
                {saving ? 'Saving…' : savedMsg ? '✓ Saved' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Builds */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Builds</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Build 1 — Workshop Sprint', value: app.build1_link },
                { label: 'Build 2 — Cohort Experience (Design)', value: app.build2_design_link },
                { label: 'Build 2 — Cohort Experience (Video)', value: app.build2_video_link },
                { label: 'Build 3 — The Video', value: app.build3_video_link },
                { label: 'Build 4 — Language Tape (Optional)', value: app.build4_language_link },
              ].map(({ label, value }) => (
                <div key={label} className={`p-3 rounded-lg border ${value ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
                  {value
                    ? <a href={value} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-500 break-all flex items-center gap-1">
                        Open submission <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    : <span className="text-xs text-gray-400 italic">Not submitted</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Section 1 — About</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone" value={app.phone} />
              <Field label="Direct Manager" value={app.direct_manager} />
              <Field label="Head of School" value={app.head_of_school} />
              <Field label="Years at Alpha" value={app.years_at_alpha} />
              <Field label="Emergency Contact" value={app.emergency_contact} />
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Field label="Languages Spoken" value={app.languages_spoken} />
              <Field label="Prior International Travel" value={app.prior_international_travel} />
              <Field label="Developing-World Experience" value={app.developing_world_experience} />
              <Field label="Health Considerations" value={app.health_considerations} />
              <Field label="Family Obligations" value={app.family_obligations} />
            </div>
          </div>

          {/* References */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Section 4 — References</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: 'Reference 1', name: app.reference1_name, role: app.reference1_role, phone: app.reference1_phone, email: app.reference1_email },
                { label: 'Reference 2', name: app.reference2_name, role: app.reference2_role, phone: app.reference2_phone, email: app.reference2_email },
              ].map(ref => (
                <div key={ref.label} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{ref.label}</p>
                  <p className="text-sm font-medium text-gray-800">{ref.name || <span className="italic text-gray-400">Not filled</span>}</p>
                  {ref.role && <p className="text-xs text-gray-500">{ref.role}</p>}
                  {ref.email && <a href={`mailto:${ref.email}`} className="text-xs text-blue-600 hover:underline block">{ref.email}</a>}
                  {ref.phone && <p className="text-xs text-gray-500">{ref.phone}</p>}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <Field label={`Manager Endorsement (${app.manager_endorsement_status || 'not set'})`} value={app.manager_endorsement_text} />
              <Field label="Endorser" value={app.endorser_name && app.endorser_role ? `${app.endorser_name} — ${app.endorser_role}` : app.endorser_name} />
            </div>
          </div>

          {/* Acknowledgments */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Section 5 — Acknowledgments</h3>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {ackTexts.map((text, i) => {
                const key = `ack_${i+1}` as keyof GuideApplication
                const checked = Boolean(app[key])
                return (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${checked ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {checked ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="truncate">{text}</span>
                  </div>
                )
              })}
            </div>
            <Field label="Applicant Signature" value={app.applicant_name} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [applications, setApplications] = useState<GuideApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all')
  const [selectedApp, setSelectedApp] = useState<GuideApplication | null>(null)
  const [sortField, setSortField] = useState<'created_at' | 'full_name' | 'status'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [newCount, setNewCount] = useState(0)
  const [liveConnected, setLiveConnected] = useState(false)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('guide_applications').select('*').order('created_at', { ascending: false })
    setApplications(data as GuideApplication[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (authed) fetchApplications() }, [authed, fetchApplications])

  useEffect(() => {
    if (!authed) return
    const channel = supabase
      .channel('guide_applications_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guide_applications' },
        (payload) => {
          setApplications(prev => [payload.new as GuideApplication, ...prev])
          setNewCount(c => c + 1)
        })
      .subscribe((status) => setLiveConnected(status === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [authed])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'aws-2026') { setAuthed(true); setAuthError('') }
    else setAuthError('Incorrect password.')
  }

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await supabase.from('guide_applications').update({ status }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status } : null)
  }

  const handleNotesChange = async (id: string, admin_notes: string) => {
    await supabase.from('guide_applications').update({ admin_notes }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, admin_notes } : a))
  }

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = applications
    .filter(a => {
      const q = search.toLowerCase()
      const matchSearch = !q || a.full_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) ||
        a.campus?.toLowerCase().includes(q) || a.role_at_alpha?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || a.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      const av = a[sortField] || ''; const bv = b[sortField] || ''
      return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })

  const stats = {
    total: applications.filter(a => a.status !== 'draft').length,
    drafts: applications.filter(a => a.status === 'draft').length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    advancing: applications.filter(a => a.status === 'advancing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
  }

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Campus', 'Role', 'Status', 'Builds Completed', 'Languages', 'Submitted']
    const rows = filtered.map(a => [
      a.full_name || '', a.email || '', a.campus || '', a.role_at_alpha || '', a.status || '',
      [a.build1_link, a.build2_design_link, a.build2_video_link, a.build3_video_link].filter(Boolean).length,
      a.languages_spoken || '', new Date(a.created_at).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'aws-applications.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <img src="/Alpha_World_School_Logo.png" alt="Alpha World School" className="h-12 w-auto object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h1 className="text-lg font-bold text-gray-900 text-center">Admin Dashboard</h1>
            <p className="text-center text-sm text-gray-400">Guide Applications 2026–27</p>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Enter admin password" autoFocus />
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
      <header className="border-b border-gray-200 bg-white/95 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Alpha_World_School_Logo.png" alt="Alpha World School" className="h-9 w-auto object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div>
              <span className="text-gray-900 font-bold text-sm">Alpha World School</span>
              <span className="text-gray-400 text-xs ml-2">Admin · Guide Applications 2026–27</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className={liveConnected ? 'text-green-600' : 'text-gray-400'}>{liveConnected ? 'Live' : 'Connecting…'}</span>
            </div>
            <a href="/" className="text-gray-400 hover:text-gray-700 text-xs transition-colors">← View Form</a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {newCount > 0 && (
          <div className="mb-5 flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm">
            <span className="text-green-700 font-medium">🎉 {newCount} new application{newCount > 1 ? 's' : ''} received since you opened this page</span>
            <button onClick={() => setNewCount(0)} className="text-green-500 hover:text-green-700 text-xs ml-4">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Submitted', value: stats.total, icon: Users, color: 'text-gray-900', click: () => setStatusFilter('all') },
            { label: 'Drafts', value: stats.drafts, icon: Clock, color: 'text-gray-400', click: () => setStatusFilter('draft') },
            { label: 'Under Review', value: stats.under_review, icon: Eye, color: 'text-amber-600', click: () => setStatusFilter('under_review') },
            { label: 'Advancing', value: stats.advancing, icon: TrendingUp, color: 'text-green-600', click: () => setStatusFilter('advancing') },
            { label: 'Accepted', value: stats.accepted, icon: Award, color: 'text-emerald-600', click: () => setStatusFilter('accepted') },
            { label: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, icon: XCircle, color: 'text-red-400', click: () => setStatusFilter('rejected') },
          ].map(({ label, value, icon: Icon, color, click }) => (
            <button key={label} onClick={click} className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, campus..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-blue-500">
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <button onClick={fetchApplications} className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors border border-gray-300">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    { key: 'full_name', label: 'Applicant' },
                    { key: null, label: 'Campus / Role' },
                    { key: null, label: 'Builds' },
                    { key: 'status', label: 'Status' },
                    { key: 'created_at', label: 'Date' },
                    { key: null, label: '' },
                  ].map(({ key, label }, i) => (
                    <th key={i}
                      className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${key ? 'cursor-pointer hover:text-gray-600 select-none' : ''}`}
                      onClick={key ? () => toggleSort(key as typeof sortField) : undefined}>
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
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Loading applications…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No applications found.</td></tr>
                ) : filtered.map(app => {
                  const builds = [
                    { v: app.build1_link, l: 'Build 1: Workshop Sprint' },
                    { v: app.build2_design_link, l: 'Build 2: Design Doc' },
                    { v: app.build2_video_link, l: 'Build 2: Video' },
                    { v: app.build3_video_link, l: 'Build 3: Video' },
                  ]
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 text-sm">{app.full_name || <span className="text-gray-300 italic text-xs">Unnamed draft</span>}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{app.email || '—'}</div>
                        {app.languages_spoken && (
                          <div className="text-gray-400 text-xs mt-0.5 truncate max-w-44" title={app.languages_spoken}>
                            🌐 {app.languages_spoken}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-gray-700 text-sm">{app.campus || '—'}</div>
                        <div className="text-gray-400 text-xs">{app.role_at_alpha || '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {builds.map(({ v, l }, i) => <BuildPip key={i} filled={Boolean(v)} label={l} />)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{builds.filter(b => b.v).length}/4</div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={app.status} />
                        {app.admin_notes && (
                          <div className="flex items-center gap-1 mt-1" title={app.admin_notes}>
                            <MessageSquare className="w-3 h-3 text-gray-300" />
                            <span className="text-xs text-gray-400 truncate max-w-24">{app.admin_notes}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <div className="text-gray-300">{new Date(app.created_at).getFullYear()}</div>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors font-medium">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing {filtered.length} of {applications.length} applications</span>
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')} className="text-blue-500 hover:text-blue-700">Clear filter</button>
            )}
          </div>
        </div>
      </div>

      {selectedApp && (
        <DetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
        />
      )}
    </div>
  )
}
