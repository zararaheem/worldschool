'use client'

import { useState } from 'react'
import ApplicationForm from '@/components/ApplicationForm'
import ExamplesTab from '@/components/ExamplesTab'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'apply' | 'examples'>('apply')

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Hero Header */}
      <header className="border-b border-stone-800 bg-stone-950/95 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-stone-950 font-black text-xs">A</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-wide">Alpha World School</span>
              <span className="text-stone-500 text-xs block">Guide Application · 2026–2027</span>
            </div>
          </div>
          <a
            href="https://world.alpha.school"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-white text-xs transition-colors"
          >
            world.alpha.school ↗
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <div className="border-b border-stone-800 bg-gradient-to-b from-stone-900 to-stone-950">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Inaugural Cohort · 2026–2027</p>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Guide Application
          </h1>
          <p className="text-stone-300 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
            This is not a year off. This is the hardest job Alpha has ever asked anyone to do — and the most rewarding year of your career.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-stone-400">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />38 Weeks</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />3 Continents</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />20 Students</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Kenya · Ecuador · USA</span>
          </div>
        </div>
      </div>

      {/* What Top 10% Do Differently */}
      <div className="border-b border-stone-800 bg-stone-900/40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-6 py-5">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">What the Top 10% of Guides Do Differently</p>
            <p className="text-stone-400 text-xs mb-3 italic">If you read this list and think "that's me" — keep going.</p>
            <ul className="space-y-2">
              {[
                'They anticipate problems before they happen',
                'They never wait to be told what to do',
                'They design moments kids remember 10 years later',
                'They stay calm when everyone else escalates',
                'They hold the bar even when it\'s uncomfortable',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-stone-300">
                  <span className="text-amber-500">·</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-stone-800 bg-stone-950 sticky top-[65px] z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0">
            {[
              { id: 'apply', label: 'Application' },
              { id: 'examples', label: 'Worked Examples — Build 2' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'apply' | 'examples')}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-stone-500 hover:text-stone-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main>
        {activeTab === 'apply' ? <ApplicationForm /> : <ExamplesTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-stone-600 text-sm">
          <p>Alpha World School · 2026–2027 Guide Application</p>
          <p className="mt-1">
            Questions? <a href="mailto:apply@alphaworldschool.com" className="text-stone-400 hover:text-white">apply@alphaworldschool.com</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
