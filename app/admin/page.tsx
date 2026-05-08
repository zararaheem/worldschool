'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, GuideApplication, ApplicationStatus } from '@/lib/supabase'
import {
  Users, Search, ChevronDown, ChevronUp, Eye, X,
  CheckCircle, Clock, XCircle, TrendingUp, Award, Filter
} from 'lucide-react'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: 'Draft', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  under_review: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  advancing: { label: 'Advancing', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
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

  const saveNotes = async () => {
    setSaving(true)
    await onNotesChange(app.id, notes)
    setSaving(false)
  }

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    value ? (
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{value}</div>
      </div>
    ) : null
  )

  const LinkField = ({ label, value }: { label: string; value: string | null | undefined }) => (
    value ? (
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-500 break-all">{value}</a>
      </div>
    ) : null
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl mx-4 my-8 bg-white rounded-2xl border border-gray-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{app.full_name}</h2>
            <p className="text-gray-500 text-sm">{app.email} · {app.campus || 'Campus N/A'} · {app.role_at_alpha || 'Role N/A'}</p>
            <p className="text-gray-400 text-xs mt-1">Submitted {new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Status & Admin Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Application Status</div>
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
            <div className="flex flex-col">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Admin Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={3}
                className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
              <button
                onClick={saveNotes}
                disabled={saving}
                className="mt-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Section 1 — About</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone" value={app.phone} />
              <Field label="Direct Manager" value={app.direct_manager} />
              <Field label="Head of School" value={app.head_of_school} />
              <Field label="Years at Alpha" value={app.years_at_alpha} />
              <Field label="Languages Spoken" value={app.languages_spoken} />
              <Field label="Emergency Contact" value={app.emergency_contact} />
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Field label="Prior International Travel" value={app.prior_international_travel} />
              <Field label="Developing-World Experience" value={app.developing_world_experience} />
              <Field label="Health Considerations" value={app.health_considerations} />
              <Field label="Family Obligations" value={app.family_obligations} />
            </div>
          </div>

          {/* Builds */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Section 2 — The Builds</h3>
            <div className="space-y-3">
              <LinkField label="Build 1 — Workshop Sprint" value={app.build1_link} />
              <LinkField label="Build 2 — Cohort Experience (Design)" value={app.build2_design_link} />
              <LinkField label="Build 2 — Cohort Experience (Video)" value={app.build2_video_link} />
              <LinkField label="Build 3 — The Video" value={app.build3_video_link} />
              <LinkField label="Build 4 — Language Tape (Optional)" value={app.build4_language_link} />
            </div>
          </div>

          {/* References */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Section 4 — References</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Reference 1</p>
                <Field label="Name" value={app.reference1_name} />
                <Field label="Role" value={app.reference1_role} />
                <Field label="Relationship" value={app.reference1_relationship} />
                <Field label="Contact" value={app.reference1_phone || app.reference1_email ? `${app.reference1_phone || ''} ${app.reference1_email || ''}`.trim() : null} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Reference 2</p>
                <Field label="Name" value={app.reference2_name} />
                <Field label="Role" value={app.reference2_role} />
                <Field label="Relationship" value={app.reference2_relationship} />
                <Field label="Contact" value={app.reference2_phone || app.reference2_email ? `${app.reference2_phone || ''} ${app.reference2_email || ''}`.trim() : null} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Manager Endorsement Status" value={app.manager_endorsement_status} />
              <Field label="Endorser" value={app.endorser_name && app.endorser_role ? `${app.endorser_name} — ${app.endorser_role}` : app.endorser_name} />
              <Field label="Endorsement Statement" value={app.manager_endorsement_text} />
            </div>
          </div>

          {/* Acknowledgments */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Section 5 — Acknowledgments</h3>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {([1,2,3,4,5,6,7,8] as const).map(n => {
                const key = `ack_${n}` as keyof GuideApplication
                return (
                  <div key={n} className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs ${app[key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {app[key] ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Ack {n}
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
  const [sortField, setSortField] = useState<'created_at' | 'full_name'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [newCount, setNewCount] = useState(0)
  const [liveConnected, setLiveConnected] = useState(false)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('guide_applications')
      .select('*')
      .order(sortField, { ascending: sortDir === 'asc' })
    setApplications(data as GuideApplication[] || [])
    setLoading(false)
  }, [sortField, sortDir])

  useEffect(() => {
    if (authed) fetchApplications()
  }, [authed, fetchApplications])

  useEffect(() => {
    if (!authed) return
    const channel = supabase
      .channel('guide_applications_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guide_applications' },
        (payload) => {
          setApplications(prev => [payload.new as GuideApplication, ...prev])
          setNewCount(c => c + 1)
        }
      )
      .subscribe((status) => {
        setLiveConnected(status === 'SUBSCRIBED')
      })
    return () => { supabase.removeChannel(channel) }
  }, [authed])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'aws-2026') {
      setAuthed(true)
      setAuthError('')
    } else {
      setAuthError('Incorrect password.')
    }
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

  const toggleSort = (field: 'created_at' | 'full_name') => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = applications.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.full_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.campus?.toLowerCase().includes(q) || a.role_at_alpha?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: applications.filter(a => a.status !== 'draft').length,
    drafts: applications.filter(a => a.status === 'draft').length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    advancing: applications.filter(a => a.status === 'advancing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <div>
              <span className="text-gray-900 font-bold text-sm">Alpha World School</span>
              <span className="text-gray-400 text-xs block">Admin Dashboard</span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h1 className="text-lg font-bold text-gray-900 text-center">Sign In</h1>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Enter admin password"
                autoFocus
              />
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
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <div>
              <span className="text-gray-900 font-bold text-sm">Alpha World School</span>
              <span className="text-gray-400 text-xs ml-2">Admin</span>
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
        {/* New applications banner */}
        {newCount > 0 && (
          <div className="mb-5 flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm">
            <span className="text-green-700 font-medium">
              {newCount} new application{newCount > 1 ? 's' : ''} received since you opened this page
            </span>
            <button onClick={() => setNewCount(0)} className="text-green-500 hover:text-green-700 text-xs ml-4">Dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Submitted', value: stats.total, icon: Users, color: 'text-gray-900' },
            { label: 'Drafts', value: stats.drafts, icon: Clock, color: 'text-gray-400' },
            { label: 'Under Review', value: stats.under_review, icon: Eye, color: 'text-amber-600' },
            { label: 'Advancing', value: stats.advancing, icon: TrendingUp, color: 'text-green-600' },
            { label: 'Accepted', value: stats.accepted, icon: Award, color: 'text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, campus..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchApplications}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors border border-gray-300"
          >
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    { key: 'full_name', label: 'Applicant' },
                    { key: null, label: 'Campus / Role' },
                    { key: null, label: 'Builds' },
                    { key: null, label: 'Status' },
                    { key: 'created_at', label: 'Date' },
                    { key: null, label: '' },
                  ].map(({ key, label }, i) => (
                    <th
                      key={i}
                      className={`px-5 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${key ? 'cursor-pointer hover:text-gray-600 select-none' : ''}`}
                      onClick={key ? () => toggleSort(key as 'created_at' | 'full_name') : undefined}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {key === sortField && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Loading applications...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No applications found.</td></tr>
                ) : filtered.map(app => {
                  const buildCount = [app.build1_link, app.build2_design_link, app.build3_video_link].filter(Boolean).length
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 text-sm">{app.full_name || <span className="text-gray-300 italic">Unnamed draft</span>}</div>
                        <div className="text-gray-400 text-xs">{app.email || '—'}</div>
                        {app.status === 'draft' && app.draft_step && (
                          <div className="text-xs text-gray-400 mt-0.5">Section {app.draft_step} of 5</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-gray-700 text-sm">{app.campus || '—'}</div>
                        <div className="text-gray-400 text-xs">{app.role_at_alpha || '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {[1,2,3].map(n => {
                            const link = n === 1 ? app.build1_link : n === 2 ? app.build2_design_link : app.build3_video_link
                            return (
                              <span key={n} className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${link ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                {n}
                              </span>
                            )
                          })}
                          <span className="text-xs text-gray-400 ml-1">{buildCount}/3</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={app.status}
                          onChange={e => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-400">
            Showing {filtered.length} of {applications.length} applications
          </div>
        </div>
      </div>

      {/* Detail Modal */}
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
