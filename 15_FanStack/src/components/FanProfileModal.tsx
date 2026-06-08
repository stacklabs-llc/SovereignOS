import React, { useState, useEffect } from 'react';
import { X, Save, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FanProfileModalProps {
  onClose: () => void;
}

export default function FanProfileModal({ onClose }: FanProfileModalProps) {
  const auth = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (auth) {
      setDisplayName(auth.display_name || '');
      setAvatarUrl(auth.avatar_url || '');
      setFavoriteTeam(auth.favorite_team || '');
    }
  }, [auth]);

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const payload: any = {
        username: auth?.user_name,
        display_name: displayName,
        avatar_url: avatarUrl,
        favorite_team: favoriteTeam,
      };
      if (password) payload.new_password = password;

      const token = localStorage.getItem('sovereign_session_token');
      const res = await fetch('/api/auth/update_my_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatus({ type: 'success', text: 'Profile updated! Refresh to see changes.' });
      } else {
        const data = await res.json();
        setStatus({ type: 'error', text: data.detail || 'Failed to update' });
      }
    } catch (e) {
      setStatus({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h2 className="font-['Outfit'] text-[16px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-[#38bdf8]" />
            Fan Profile
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {status.text && (
            <div className={`text-[12px] font-['Inter'] px-4 py-3 rounded-xl border flex items-center gap-2 shadow-sm ${status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
              {status.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-['Inter'] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block">Display Name</label>
              <input 
                type="text" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20"
                placeholder="Your name in chat..."
              />
            </div>

            <div>
              <label className="text-[11px] font-['Inter'] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block">Avatar URL</label>
              <input 
                type="text" 
                value={avatarUrl} 
                onChange={e => setAvatarUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20"
                placeholder="https://example.com/avatar.png"
              />
              {avatarUrl && (
                <div className="mt-3 flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                   <img src={avatarUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10" onError={(e) => (e.currentTarget.style.display = 'none')} />
                   <span className="text-[11px] text-white/40 italic font-['Inter']">Live Preview</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-['Inter'] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block">Favorite Team</label>
              <select 
                value={favoriteTeam} 
                onChange={e => setFavoriteTeam(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors"
              >
                <option value="">Select a team...</option>
                <option value="NYM">New York Mets (NYM)</option>
                <option value="ATL">Atlanta Braves (ATL)</option>
                <option value="DET">Detroit Tigers (DET)</option>
                <option value="PHI">Philadelphia Phillies (PHI)</option>
                <option value="LAD">Los Angeles Dodgers (LAD)</option>
                <option value="NYY">New York Yankees (NYY)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-['Inter'] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block">Reset Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20"
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-['Outfit'] text-[12px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl font-['Outfit'] text-[12px] font-bold uppercase tracking-widest bg-[#38bdf8] text-slate-900 hover:bg-[#7dd3fc] transition-colors shadow-[0_0_20px_rgba(56,189,248,0.2)] disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
