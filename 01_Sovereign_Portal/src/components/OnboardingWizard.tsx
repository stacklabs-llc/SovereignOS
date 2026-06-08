import React, { useState, useEffect } from 'react';
import { Wine, Music, BookOpen, Brain, Sparkles, ChevronRight, ShieldAlert, Cpu } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (newConfig: any) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [answers, setAnswers] = useState({
    drink: '',
    music: '',
    mission: '',
    exercise: ''
  });

  // Suggest layout automatically based on user's biography
  const handleBioPrefill = async () => {
    setSuggesting(true);
    try {
      const token = localStorage.getItem('sovereign_session_token');
      const res = await fetch('/api/user/parse_bio', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.suggested_layout) {
          const intro = (data.introduction || '').toLowerCase();
          
          let drink = 'Shaken Martini';
          let music = 'The Mills Brothers';
          let mission = 'System Administration';
          let exercise = 'Sunday Crossword';

          if (intro.includes('martini') || intro.includes('drink')) drink = 'Shaken Martini';
          if (intro.includes('mills') || intro.includes('jukebox')) music = 'The Mills Brothers';
          if (intro.includes('granddaughter') || intro.includes('lenora') || intro.includes('education')) mission = 'Educate my granddaughter';
          if (intro.includes('admin') || intro.includes('system') || intro.includes('infrastructure')) mission = 'System Administration';
          if (intro.includes('crossword') || intro.includes('puzzle')) exercise = 'Sunday Crossword';
          if (intro.includes('terminal') || intro.includes('hack') || intro.includes('command')) exercise = 'CLI commands';

          setAnswers({ drink, music, mission, exercise });
          setStep(1); // Jump past welcome to verify selections
        }
      }
    } catch (err) {
      console.error("Failed to parse bio:", err);
    } finally {
      setSuggesting(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sovereign_session_token');
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });
      if (res.ok) {
        const data = await res.json();
        onComplete(data.configuration);
      } else {
        alert("Failed to submit onboarding answers.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (key: keyof typeof answers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[70vh] font-sans">
      <div className="w-full max-w-2xl bg-[#0f172a]/80 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(56,189,248,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.015)_1px,transparent_1px)] bg-[size:30px_30px]" />

        {/* Progress Bar */}
        <div className="w-full bg-white/5 h-1.5 rounded-full mb-8 relative z-10 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#38bdf8] to-[#a855f7] h-full transition-all duration-500" 
            style={{ width: `${((step + 1) / 5) * 100}%` }}
          />
        </div>

        {step === 0 && (
          <div className="relative z-10 text-center py-4">
            <div className="inline-flex p-3 bg-[#38bdf8]/10 rounded-2xl border border-[#38bdf8]/20 text-[#38bdf8] mb-4">
              <Cpu size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-wide text-white mb-2">Welcome to Sovereign OS</h2>
            <p className="text-white/60 text-sm max-w-md mx-auto mb-8">
              We need to configure your environmental aesthetic and dashboard layout. You can complete our dynamic questionnaire, or prefill it from your identity profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleBioPrefill}
                disabled={suggesting}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)]"
              >
                <Sparkles size={14} />
                {suggesting ? 'Parsing Bio...' : 'Prefill from Bio'}
              </button>
              <button
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
              >
                Start Survey
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="relative z-10">
            <h3 className="text-xs uppercase tracking-widest text-[#38bdf8] font-mono font-bold mb-1 flex items-center gap-1.5">
              <Wine size={12} /> Branch A: Aesthetic Base
            </h3>
            <h2 className="text-xl font-bold text-white mb-6">If you walked into a bar, what would you order to drink?</h2>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {[
                { label: '🍸 Shaken Martini, very cold (-8°C), 3 olives', value: 'Shaken Martini' },
                { label: '🍺 Piney Craft IPA, fresh & bitter', value: 'Craft IPA' },
                { label: '🥃 Old Fashioned, neat with a twist of orange', value: 'Old Fashioned' },
                { label: '☕ Double espresso, black & piping hot', value: 'Espresso' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    updateAnswer('drink', opt.value);
                    setStep(2);
                  }}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all ${
                    answers.drink === opt.value 
                      ? 'bg-[#38bdf8]/10 border-[#38bdf8] text-white' 
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end border-t border-white/5 pt-4">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 text-white/60 hover:text-white transition-all text-xs font-bold uppercase font-mono"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!answers.drink}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(56,189,248,0.2)]"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="relative z-10">
            <h3 className="text-xs uppercase tracking-widest text-[#38bdf8] font-mono font-bold mb-1 flex items-center gap-1.5">
              <Music size={12} /> Branch A: Ambient Selection
            </h3>
            <h2 className="text-xl font-bold text-white mb-6">What type of soundtrack do you want playing in the background?</h2>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {[
                { label: '🎵 The Mills Brothers (Retro Vocal Jukebox)', value: 'The Mills Brothers' },
                { label: '🎹 Smooth synthwave or lo-fi beats', value: 'Lo-fi Synthwave' },
                { label: '🎸 Traditional bluegrass string acoustic', value: 'Bluegrass Acoustic' },
                { label: '🔇 Total silence, only the sound of bare metal', value: 'Silence' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    updateAnswer('music', opt.value);
                    setStep(3);
                  }}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all ${
                    answers.music === opt.value 
                      ? 'bg-[#38bdf8]/10 border-[#38bdf8] text-white' 
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end border-t border-white/5 pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-white/60 hover:text-white transition-all text-xs font-bold uppercase font-mono"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!answers.music}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(56,189,248,0.2)]"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="relative z-10">
            <h3 className="text-xs uppercase tracking-widest text-[#a855f7] font-mono font-bold mb-1 flex items-center gap-1.5">
              <BookOpen size={12} /> Branch B: Domain Responsibility
            </h3>
            <h2 className="text-xl font-bold text-white mb-6">What is your primary mission on our private network?</h2>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {[
                { label: '🎒 Educating & guiding my granddaughter (Swarm Portal)', value: 'Educate my granddaughter' },
                { label: '⚙️ System administration & stack infrastructure manager', value: 'System Administration' },
                { label: '🌐 Public outreach and creative writing coordination', value: 'Public Outreach' },
                { label: '🔒 Security auditing and threat intelligence monitoring', value: 'Security Auditing' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    updateAnswer('mission', opt.value);
                    setStep(4);
                  }}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all ${
                    answers.mission === opt.value 
                      ? 'bg-[#a855f7]/10 border-[#a855f7] text-white' 
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end border-t border-white/5 pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-white/60 hover:text-white transition-all text-xs font-bold uppercase font-mono"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!answers.mission}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#38bdf8] text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="relative z-10">
            <h3 className="text-xs uppercase tracking-widest text-[#a855f7] font-mono font-bold mb-1 flex items-center gap-1.5">
              <Brain size={12} /> Branch C: Mental Exercise
            </h3>
            <h2 className="text-xl font-bold text-white mb-6">What is your favorite mental exercise to stay sharp?</h2>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {[
                { label: '🧩 NYT Sunday Crossword puzzle, filled half-awake', value: 'Sunday Crossword' },
                { label: '💻 Interactive command line & scripting exercises', value: 'CLI commands' },
                { label: '📖 Deep narrative investigation & reading detective cases', value: 'Detective Reading' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateAnswer('exercise', opt.value)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all ${
                    answers.exercise === opt.value 
                      ? 'bg-[#a855f7]/10 border-[#a855f7] text-white' 
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-end border-t border-white/5 pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-white/60 hover:text-white transition-all text-xs font-bold uppercase font-mono"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading || !answers.exercise}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#a855f7] text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]"
              >
                {loading ? 'Building...' : 'Configure Workspace'}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
