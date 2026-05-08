'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle } from 'lucide-react'

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/alphahigh.png"
        alt="Alpha World School"
        className="h-10 w-auto object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="leading-tight">
        <div className="font-black text-white uppercase tracking-wider text-sm">Alpha World</div>
        <div className="text-xs font-bold text-white/40 uppercase tracking-widest">School</div>
      </div>
    </div>
  )
}

function Input({ label, name, value, onChange, required, placeholder, type = 'text' }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 transition-all text-sm"
      />
    </div>
  )
}

function Textarea({ label, name, value, onChange, required, placeholder, rows = 4, hint }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  required?: boolean; placeholder?: string; rows?: number; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-white/30 mb-1.5">{hint}</p>}
      <textarea
        name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 transition-all resize-none text-sm"
      />
    </div>
  )
}

interface ReferenceForm {
  ref_name: string; ref_role: string; ref_phone: string; ref_email: string
  endorsement_status: string; endorsement_text: string; endorser_signature: string
}

function ReferenceFormContent() {
  const searchParams = useSearchParams()
  const refNumber = searchParams.get('ref') || '1'
  const applicantName = searchParams.get('applicant') || 'the applicant'
  const applicantEmail = searchParams.get('email') || ''

  const [form, setForm] = useState<ReferenceForm>({
    ref_name: '', ref_role: '', ref_phone: '', ref_email: '',
    endorsement_status: '', endorsement_text: '', endorser_signature: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.ref_name || !form.ref_email || !form.endorsement_text || !form.endorser_signature) {
      setError('Please fill in all required fields.')
      return
    }
    if (!form.endorsement_status) {
      setError('Please indicate whether you verbally support this guide applying.')
      return
    }

    setSubmitting(true)
    setError(null)

    const refNum = parseInt(refNumber)
    const updateData: Record<string, string> = {}

    if (refNum === 1) {
      updateData.reference1_name = form.ref_name
      updateData.reference1_role = form.ref_role
      updateData.reference1_phone = form.ref_phone
      updateData.reference1_email = form.ref_email
      updateData.manager_endorsement_status = form.endorsement_status
      updateData.manager_endorsement_text = form.endorsement_text
      updateData.endorser_name = form.ref_name
      updateData.endorser_role = form.ref_role
    } else {
      updateData.reference2_name = form.ref_name
      updateData.reference2_role = form.ref_role
      updateData.reference2_phone = form.ref_phone
      updateData.reference2_email = form.ref_email
    }

    const { error: dbError } = await supabase
      .from('reference_submissions')
      .insert([{
        applicant_email: applicantEmail,
        applicant_name: applicantName,
        ref_number: refNum,
        ref_name: form.ref_name,
        ref_role: form.ref_role,
        ref_phone: form.ref_phone,
        ref_email: form.ref_email,
        endorsement_status: form.endorsement_status,
        endorsement_text: form.endorsement_text,
        endorser_signature: form.endorser_signature,
      }])

    if (dbError) {
      const { error: appError } = await supabase
        .from('guide_applications')
        .update(updateData)
        .eq('email', applicantEmail)

      if (appError) {
        setError('Something went wrong. Please try again or contact the Alpha team.')
        setSubmitting(false)
        return
      }
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#08111f] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Reference Submitted</p>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Thank You.</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Your reference for <span className="text-white/60">{applicantName}</span> has been received. The Alpha World School team will review it as part of their application.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08111f] flex flex-col">
      <header className="border-b border-white/8 px-6 py-4">
        <Logo />
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Reference {refNumber} of 2</p>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Reference Form</h1>
          <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3">
            <p className="text-white/50 text-sm leading-relaxed">
              <span className="text-white/70 font-bold">{applicantName}</span> has applied to be a Guide for Alpha World School&apos;s inaugural 2026–2027 cohort — a 38-week program across Kenya, Ecuador, and the United States. They have listed you as an internal Alpha reference.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 mb-8 space-y-3">
          <p className="text-xs font-black text-white/30 uppercase tracking-widest">What You&apos;re Vouching For</p>
          <p className="text-white/45 text-sm leading-relaxed">
            This is a 24/7 role. Guides are the primary caretakers of 5–7 students for multiple weeks at a time in developing-world environments. They need to hold students and themselves to a high physical, mental, emotional, and academic standard — and be the calm first responder when things go wrong at 3am. This is not a year abroad. It is the hardest job Alpha has ever asked anyone to do.
          </p>
          <p className="text-white/35 text-sm">Your reference helps us understand whether this person is ready for that.</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-4">
            <h2 className="text-xs font-black text-white/30 uppercase tracking-widest">Your Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Your Name" name="ref_name" value={form.ref_name} onChange={handleChange} required placeholder="Full name" />
              <Input label="Your Role at Alpha" name="ref_role" value={form.ref_role} onChange={handleChange} placeholder="e.g. Head of School, Guide" />
              <Input label="Phone" name="ref_phone" value={form.ref_phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
              <Input label="Email" name="ref_email" value={form.ref_email} onChange={handleChange} required placeholder="your@alpha.school" type="email" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
              Has <span className="text-white/70">{applicantName}</span> had your verbal support to apply? <span className="text-blue-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {['Yes', 'No', 'Conversation pending'].map(opt => (
                <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-xs font-bold uppercase tracking-wide transition-all ${form.endorsement_status === opt ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' : 'border-white/15 text-white/25 hover:border-white/30'}`}>
                  <input type="radio" name="endorsement_status" value={opt} checked={form.endorsement_status === opt} onChange={handleChange} className="sr-only" />{opt}
                </label>
              ))}
            </div>
          </div>

          <Textarea
            label="Your Endorsement (150 words minimum)"
            name="endorsement_text"
            value={form.endorsement_text}
            onChange={handleChange}
            required
            placeholder={`In your judgment, is ${applicantName} ready for the demands of this role — physically, emotionally, and as a representative of Alpha to families, students, and partner communities? Why or why not?`}
            rows={8}
            hint="Be specific. We're looking for concrete observations, not general praise."
          />

          <Input
            label="Your Full Name (Signature)"
            name="endorser_signature"
            value={form.endorser_signature}
            onChange={handleChange}
            required
            placeholder="Type your full legal name"
          />

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3.5 bg-white text-[#08111f] font-black uppercase tracking-wider text-sm rounded-full hover:bg-white/90 disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting…' : 'Submit Reference'}
          </button>

          <p className="text-center text-xs text-white/20">
            Questions? Contact <a href="mailto:apply@alphaworldschool.com" className="text-blue-400 hover:text-blue-300">apply@alphaworldschool.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ReferencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#08111f] flex items-center justify-center">
        <div className="text-white/30 text-sm">Loading…</div>
      </div>
    }>
      <ReferenceFormContent />
    </Suspense>
  )
}
