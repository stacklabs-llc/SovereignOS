/**
 * UserManagementConsole — Rebuilt as a Premium Dribbble-Inspired UI Dashboard.
 * Includes interactive avatar pickers, security entropy sliders, stats cards,
 * and a live user-assigned ticket registry.
 */
import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Key, Trash2, CheckCircle, XCircle,
  RefreshCw, Eye, EyeOff, Save, UserCircle, ShieldCheck,
  Mail, AtSign, X, Search, Edit2, ShieldAlert, Award,
  Hash, MapPin, Building, Globe, CheckCircle2, ChevronRight,
  Activity, Sliders, Briefcase, Phone, BookOpen, AlertCircle,
  Printer
} from 'lucide-react';

const TOKEN_KEY = 'sovereign_session_token';

interface UserRecord {
  user_name: string;
  display_name: string | null;
  role: string;
  active: number;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  department?: string | null;
  title?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  favorite_team?: string | null;
  introduction?: string | null;
  has_password?: number;
  os_theme?: string;
  entropy_level?: number;
  procedural_avatars?: boolean;
  kiosk_projection?: boolean;
  desk_relic?: string;
  u_nap_mist_balance?: number;
}

interface StatusMsg { type: 'success' | 'error'; text: string; }

// Pre-defined premium avatars
const PRESET_AVATARS = [
  { name: 'Pawel (Operator)', url: '/avatars/pawel.png' },
  { name: 'James (Pilot)', url: '/avatars/james.png' },
  { name: 'Barf (Bandito)', url: '/avatars/barf.png' },
  { name: 'Eileen (Remote)', url: '/avatars/eileen.png' },
  { name: 'Barb (Badass)', url: '/avatars/barb.png' },
  { name: 'Grogu Fan', url: '/avatars/grogu_fan.png' },
  { name: 'Sovereign Core', url: '/avatars/core.png' }
];

function PasswordInput({ value, onChange, placeholder = 'Min 8 characters' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#03060c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#38bdf8]/60 transition-all font-mono"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function UserManagementConsole() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [tab, setTab] = useState<'users' | 'new' | 'rbac'>('users');
  const [panelStatus, setPanelStatus] = useState<StatusMsg | null>(null);
  const [saving, setSaving] = useState(false);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Sub-Tab selections inside Details View
  const [subTab, setSubTab] = useState<'tickets' | 'lore' | 'credentials' | 'achievements'>('tickets');

  // RBAC Console States
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rbacLoading, setRbacLoading] = useState(false);

  // Ticket Cache (To filter assignments for selected user)
  const [allTasks, setAllTasks] = useState<any[]>([]);

  // Edit form states
  const [editDisplay, setEditDisplay] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editFavoriteTeam, setEditFavoriteTeam] = useState('');
  const [editIntroduction, setEditIntroduction] = useState('');

  // RTR Preference States
  const [editOsTheme, setEditOsTheme] = useState('sovereign-home');
  const [editEntropyLevel, setEditEntropyLevel] = useState(5);
  const [editProceduralAvatars, setEditProceduralAvatars] = useState(false);
  const [editKioskProjection, setEditKioskProjection] = useState(false);
  const [editDeskRelic, setEditDeskRelic] = useState('');

  // Avatar Selector Overlay
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // New user form
  const [newUsername, setNewUsername] = useState('');
  const [newDisplay, setNewDisplay] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('guest');
  const [creating, setCreating] = useState(false);
  const [newStatus, setNewStatus] = useState<StatusMsg | null>(null);

  // Multi-select bulk deactivation state
  const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(new Set());

  const token = localStorage.getItem(TOKEN_KEY) || '';
  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Decode sub (current username) from JWT
  let currentPilot = '';
  try {
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        currentPilot = payload.sub || '';
      }
    }
  } catch (e) {
    console.error('Error decoding token:', e);
  }

  const flash = (setter: (m: StatusMsg | null) => void, type: 'success' | 'error', text: string) => {
    setter({ type, text });
    setTimeout(() => setter(null), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        const list: UserRecord[] = data.users || [];
        setUsers(list);
        // Keep selected in sync
        if (selected) {
          const refreshed = list.find(u => u.user_name === selected.user_name);
          if (refreshed) selectUser(refreshed);
        } else if (list.length > 0 && !selected) {
          // Auto-select first user on initial load
          selectUser(list[0]);
        }
      }
    } finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selected) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadingAvatar(true);
    try {
      const res = await fetch(`/api/auth/upload_avatar?username=${selected.user_name}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.avatar_url) {
          setEditAvatarUrl(data.avatar_url);
          flash(setPanelStatus, 'success', 'Avatar uploaded successfully');
        }
      } else {
        const err = await res.json();
        flash(setPanelStatus, 'error', err.detail || 'Upload failed');
      }
    } catch (err: any) {
      flash(setPanelStatus, 'error', err.message || 'Upload error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tickets', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setAllTasks(data || []);
      }
    } catch (e) {
      console.error('Failed to load tasks registry:', e);
    }
  };

  const selectUser = (u: UserRecord) => {
    setSelected(u);
    setEditDisplay(u.display_name || '');
    setEditEmail(u.email || '');
    setEditUsername(u.user_name || '');
    setEditRole(u.role || '');
    setEditFirstName(u.first_name || '');
    setEditLastName(u.last_name || '');
    setEditTitle(u.title || '');
    setEditDepartment(u.department || '');
    setEditCity(u.city || '');
    setEditAvatarUrl(u.avatar_url || '');
    setEditFavoriteTeam(u.favorite_team || '');
    setEditIntroduction(u.introduction || '');
    
    // RTR Hydration
    setEditOsTheme(u.os_theme || 'sovereign-home');
    setEditEntropyLevel(u.entropy_level !== undefined ? u.entropy_level : 5);
    setEditProceduralAvatars(!!u.procedural_avatars);
    setEditKioskProjection(!!u.kiosk_projection);
    setEditDeskRelic(u.desk_relic || '');

    setEditPassword('');
    setPanelStatus(null);
    setShowAvatarPicker(false);
  };

  const loadRbacData = async () => {
    setRbacLoading(true);
    try {
      const [resRoles, resPerms] = await Promise.all([
        fetch('/api/admin/roles', { headers: authHeader }),
        fetch('/api/admin/permissions', { headers: authHeader }),
      ]);
      if (resRoles.ok && resPerms.ok) {
        const rolesData = await resRoles.json();
        const permsData = await resPerms.json();
        setRoles(rolesData);
        setPermissions(permsData);
      }
    } catch (e) {
      console.error('Failed to load RBAC metadata:', e);
    } finally {
      setRbacLoading(false);
    }
  };

  const handleSetRole = async (username: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ username, role: newRole }),
      });
      if (res.ok) {
        flash(setPanelStatus, 'success', `✓ Role updated for ${username}`);
        await loadUsers();
      } else {
        const data = await res.json();
        flash(setPanelStatus, 'error', data.detail || 'Failed to update role');
      }
    } catch {
      flash(setPanelStatus, 'error', 'Network error');
    }
  };

  const handleToggleActive = async (username: string, currentActive: number) => {
    const endpoint = currentActive ? '/api/admin/disable' : '/api/admin/enable';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        flash(setPanelStatus, 'success', `✓ Account status updated for ${username}`);
        await loadUsers();
      } else {
        const data = await res.json();
        flash(setPanelStatus, 'error', data.detail || 'Failed to toggle status');
      }
    } catch {
      flash(setPanelStatus, 'error', 'Network error');
    }
  };

  useEffect(() => {
    loadUsers();
    loadRbacData();
    fetchTasks();
    
    // Auto-sync tasks every 10s
    const taskInterval = setInterval(fetchTasks, 10000);
    return () => clearInterval(taskInterval);
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    if (editPassword && editPassword.length < 8) {
      flash(setPanelStatus, 'error', 'Password must be 8+ characters'); return;
    }
    setSaving(true);
    const endpoint = '/api/auth/update_user';
    try {
      const res = await fetch(endpoint, {
        method: 'POST', headers: authHeader,
        body: JSON.stringify({
          username: selected.user_name,
          new_username: editUsername,
          role: editRole,
          display_name: editDisplay,
          email: editEmail,
          new_password: editPassword,
          first_name: editFirstName,
          last_name: editLastName,
          title: editTitle,
          department: editDepartment,
          city: editCity,
          avatar_url: editAvatarUrl,
          favorite_team: editFavoriteTeam,
          introduction: editIntroduction,
          os_theme: editOsTheme,
          entropy_level: editEntropyLevel,
          procedural_avatars: editProceduralAvatars,
          kiosk_projection: editKioskProjection,
          desk_relic: editDeskRelic
        }),
      });
      if (res.ok) {
        flash(setPanelStatus, 'success', '✓ User Profile saved');
        setEditPassword('');
        await loadUsers();
      } else {
        const d = await res.json();
        flash(setPanelStatus, 'error', d.detail || 'Save failed');
      }
    } catch { flash(setPanelStatus, 'error', 'Connection error'); }
    finally { setSaving(false); }
  };

  const handlePrint = () => {
    if (!selected) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print the dossier.');
      return;
    }
    const avatarUrl = selected.avatar_url 
      ? (selected.avatar_url.startsWith('http') ? selected.avatar_url : `${window.location.origin}${selected.avatar_url}`)
      : '';

    // dynamic ticket content
    let assignedTicketsHtml = '';
    if (assignedTickets.length === 0) {
      assignedTicketsHtml = `
        <div class="flex flex-col items-center justify-center py-6 gap-2 text-slate-500 font-mono text-xs border border-dashed border-white/10 rounded-xl">
          <span>No active stories assigned to this operator.</span>
        </div>
      `;
    } else {
      assignedTicketsHtml = `
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-white/10 text-[9px] text-slate-400 uppercase tracking-widest font-mono">
              <th class="py-2 px-3">Ticket ID</th>
              <th class="py-2 px-3">Description Title</th>
              <th class="py-2 px-3">Status</th>
              <th class="py-2 px-3 text-center">Priority</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 font-mono text-[10px]">
            ${assignedTickets.map(t => {
              let statusPill = "bg-white/5 text-white/50 border border-white/5";
              if (t.status === 'IN_PROGRESS' || t.status === 'Work In Progress') {
                statusPill = "bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold";
              } else if (t.status === 'DONE' || t.status === 'RESOLVED' || t.status === 'Resolved') {
                statusPill = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold";
              } else if (t.status === 'PLANNING' || t.status === 'Planning') {
                statusPill = "bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold";
              }
              let priorityStyle = t.priority === '1' || t.priority === 'P1' ? 'text-red-400 font-bold' : (t.priority === '2' || t.priority === 'P2' ? 'text-amber-400 font-bold' : 'text-slate-400');
              return `
                <tr class="border-b border-white/5">
                  <td class="py-2 px-3 font-bold text-sky-400">${t.id}</td>
                  <td class="py-2 px-3 text-slate-300 font-sans truncate max-w-[250px]">${t.title}</td>
                  <td class="py-2 px-3"><span class="inline-block px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider ${statusPill}">${t.status}</span></td>
                  <td class="py-2 px-3 text-center ${priorityStyle}">${t.priority}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // dynamic achievements content
    let userAchievements = [];
    const username = selected.user_name;
    if (username === 'pawel') {
      userAchievements = [
        { id: 'weedstack_pioneer', title: 'WildSeed Swarm Completed', description: 'Successfully seeded and deployed the first WeedStack IoT matrix to WildSeed.', unlocked: true, dateEarned: '22 05 26', icon: '🌱' },
        { id: 'relay_runner', title: 'Tailscale Mesh Swarm', description: 'Configured 15 concurrent Tailscale tunnel telemetry hops securely on clio.', unlocked: true, dateEarned: '24 05 26', icon: '⚡' },
        { id: 'industrial_dial', title: 'Clio Relic Tethered', description: 'Integrated the custom tactile physical copper relic dial to clio command deck.', unlocked: true, dateEarned: '28 05 26', icon: '⚙️' },
        { id: 'chaos_proof', title: 'Advocate Engagement Champion', description: 'Survive a heated Skew room debate with Barf without dropping telemetry frames.', unlocked: false, icon: '🛡%' }
      ];
    } else if (username === 'james') {
      userAchievements = [
        { id: 'command_pilot', title: 'Bare-Metal Core Swarm', description: 'Executed 1,000 CLI command loops on clio with zero system diagnostic faults.', unlocked: true, dateEarned: '12 05 26', icon: '🚀' },
        { id: 'room_shaper', title: 'Aesthetic Alignment Seeder', description: 'Triggered 50 instant multi-workspace CSS themes dynamically.', unlocked: true, dateEarned: '18 05 26', icon: '🎨' },
        { id: 'blue_tear', title: 'Bullpen Meltdown Survivor', description: 'Expressed undying hope for the Mets bullpen during a Skew session.', unlocked: true, dateEarned: '29 05 26', icon: '💧' },
        { id: 'mard_transcendence', title: 'Relational Cognitive Link', description: 'Achieved full emotional relational alignment on the M.A.R.D core engine.', unlocked: false, icon: '🧠' }
      ];
    } else if (username === 'barf') {
      userAchievements = [
        { id: 'underpants_bandito', title: 'Portal Key Hijack Swarm', description: 'Successfully locked down the entire portal using retro terminal keys.', unlocked: true, dateEarned: '08 05 26', icon: '🦹' },
        { id: 'mets_fanatic', title: 'Mets Bullpen Telemetrist', description: 'Screamed at Stearns for 45 minutes on the active telemetry line.', unlocked: true, dateEarned: '15 05 26', icon: '⚾' },
        { id: 'hot_take_fire', title: 'Vocal Synthesizer Swarm', description: 'Triggered 15 concurrent vocal relay synthesizer overrides on argo.', unlocked: true, dateEarned: '27 05 26', icon: '🔥' },
        { id: 'casino_king', title: 'Credit Injection Whale', description: 'Wagered 10,000 portal credits in a single session without sweating.', unlocked: false, icon: '🎰' }
      ];
    } else {
      userAchievements = [
        { id: 'so_weve_met', title: 'Mesh Swarm Auth', description: 'Successfully authenticated to the Sovereign Portal over secure tailscale.', unlocked: true, dateEarned: '29 05 26', icon: '🤝' },
        { id: 'mom_on_tv', title: 'Genesis Seeder Recruit', description: 'Reached top 1000 operational rank in the Genesis seeder matrix.', unlocked: false, icon: '📺' },
        { id: 'secret_trophy', title: 'Classified Swarm Goal', description: 'Keep completing assigned stories and tasks to unlock this relic.', unlocked: false, icon: '🔒' }
      ];
    }

    const achievementsHtml = userAchievements.map(ach => {
      if (ach.unlocked) {
        return `
          <div class="relative rounded-xl p-3 border bg-[#080d19] border-white/10 flex items-center gap-3 shadow-md">
            <div class="relative shrink-0 w-10 h-10 flex items-center justify-center bg-slate-900 border border-white/10 rounded-lg text-lg">
              ${ach.icon}
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center text-[7px] text-black font-bold">✓</div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1">
                <h5 class="text-[11px] font-bold text-white truncate">${ach.title}</h5>
                <span class="text-[7px] font-mono bg-sky-500/10 text-sky-400 px-1 py-0.2 rounded border border-sky-500/20 shrink-0">${ach.dateEarned}</span>
              </div>
              <p class="text-[9px] text-slate-400 mt-0.5 leading-tight">${ach.description}</p>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="relative rounded-xl p-3 border bg-[#050811]/60 border-white/5 opacity-50 flex items-center gap-3 filter saturate-[0.1]">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
              <span class="text-[8px] font-mono uppercase font-bold text-slate-500 tracking-wider">Locked</span>
            </div>
            <div class="relative shrink-0 w-10 h-10 flex items-center justify-center bg-slate-950 border border-white/5 rounded-lg text-lg">
              ${ach.icon}
            </div>
            <div class="min-w-0 flex-1">
              <h5 class="text-[11px] font-bold text-slate-400 truncate">${ach.title}</h5>
              <p class="text-[9px] text-slate-500 mt-0.5 leading-tight">${ach.description}</p>
            </div>
          </div>
        `;
      }
    }).join('');

    // Generate random barcode blocks
    const barcodeHtml = Array.from({length: 45}).map(() => {
      const w = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
      return `<div class="bg-amber-500" style="width: ${w}px; margin-right: 1px;"></div>`;
    }).join('');

    const html = `
      <html>
        <head>
          <title>Sovereign OS Dossier - ${selected.display_name || selected.user_name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Share+Tech+Mono&display=swap" rel="stylesheet">
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    outfit: ['Outfit', 'sans-serif'],
                    mono: ['"Share Tech Mono"', 'monospace']
                  }
                }
              }
            }
          </script>
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              background-color: #04060c;
              color: #f3f4f6;
            }
            .mono {
              font-family: 'Share Tech Mono', monospace;
            }
            body, div, table, tr, td, h1, h2, h3, h4, h5, p, span, img {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              body {
                background-color: #04060c !important;
                color: #f3f4f6 !important;
              }
            }
            .crt-effect {
              background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%);
              background-size: 100% 4px;
            }
          </style>
        </head>
        <body class="bg-[#04060c] p-6 text-slate-200 min-h-screen">
          <div class="max-w-4xl mx-auto flex flex-col gap-6">
            
            <!-- HEADER BAR -->
            <div class="flex justify-between items-center border-b-2 border-slate-800 pb-4">
              <div>
                <span class="text-[10px] text-sky-400 font-mono tracking-[0.3em] font-extrabold block">SOVEREIGN OS OPERATOR REGISTRY</span>
                <h1 class="text-xl font-black text-white uppercase tracking-wider mt-1">Dossier: ${selected.display_name || selected.user_name}</h1>
              </div>
              <div class="text-right">
                <span class="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-mono uppercase font-bold tracking-widest">
                  Entropy Tier: ${selected.entropy_level || '5'}
                </span>
                <span class="text-[9px] text-slate-500 block mt-2 font-mono">PORT 3016 • MagicDNS SECURE</span>
              </div>
            </div>

            <!-- BADASS IDENTITY BADGE CARD SECTION -->
            <div class="relative bg-gradient-to-br from-[#1b253b] via-[#101726] to-[#080d19] border-4 border-[#8B5A2B] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden crt-effect">
              <!-- Holographic security overlay lines -->
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.08),transparent_50%)] pointer-events-none"></div>
              
              <!-- Badge Header -->
              <div class="flex justify-between items-start border-b border-white/10 pb-4 mb-5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]">🛡️</div>
                  <div>
                    <h2 class="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">Sovereign Security Authorization</h2>
                    <p class="text-[8px] text-slate-400 font-mono">M.A.R.D. INTERFACE MATRIX NODE</p>
                  </div>
                </div>
                <div class="text-right font-mono text-[9px] text-[#38bdf8] bg-sky-500/10 px-2.5 py-1 rounded border border-sky-500/20 font-bold uppercase tracking-widest">
                  OPERATOR VERIFIED
                </div>
              </div>

              <!-- Main Card Body Grid -->
              <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                <!-- PHOTO ID SPACE (4 cols) -->
                <div class="md:col-span-4 flex flex-col items-center">
                  <div class="relative w-36 h-36 rounded-2xl border-2 border-amber-500/40 bg-slate-950 p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    ${avatarUrl 
                      ? `<img class="w-full h-full rounded-xl object-cover" src="${avatarUrl}" />` 
                      : `<div class="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center font-bold text-3xl text-slate-500 font-mono">?</div>`
                    }
                    <!-- Tech overlay grid corner lines -->
                    <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
                    <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500"></div>
                    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500"></div>
                    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>
                  </div>
                  <div class="text-[9px] text-amber-500/80 font-mono font-bold mt-2 uppercase tracking-widest">SYS_REF: #${selected.user_name.toUpperCase()}</div>
                </div>

                <!-- INFO FIELDS (8 cols) -->
                <div class="md:col-span-8 grid grid-cols-2 gap-y-3 gap-x-6 text-sm font-mono border-l border-white/10 pl-6">
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-mono">OPERATOR SYSTEM NAME</span>
                    <span class="text-white font-extrabold text-base tracking-wide uppercase">${selected.display_name || selected.user_name}</span>
                  </div>
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-mono">ACCESS CLASSIFICATION</span>
                    <span class="text-purple-400 font-extrabold uppercase">${selected.role}</span>
                  </div>
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-mono">ENTROPY LEVEL</span>
                    <span class="text-sky-400 font-bold">LEVEL ${selected.entropy_level || '5'}</span>
                  </div>
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-mono">NAP MIST RESERVE</span>
                    <span class="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span>🌿</span>
                      <span>${selected.u_nap_mist_balance ?? 10} CANISTERS</span>
                    </span>
                  </div>
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-mono">DEPLOYED STATION</span>
                    <span class="text-amber-500 font-semibold truncate block uppercase">${selected.city || 'Smyrna Heights, GA'}</span>
                  </div>
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-mono">ACTIVE DEPT</span>
                    <span class="text-slate-300 font-semibold truncate block uppercase">${selected.department || 'RESCUE TRIAGE'}</span>
                  </div>
                </div>

              </div>

              <!-- Badge Footer Barcode row -->
              <div class="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div class="flex items-center gap-2">
                  <div class="flex items-stretch h-8 p-1 rounded bg-black/40">
                    ${barcodeHtml}
                  </div>
                  <span class="text-[8px] text-slate-500 font-mono tracking-widest">SVRGN-ID-${selected.user_name.toUpperCase()}-2026</span>
                </div>
                <div class="text-[8px] text-red-500 font-mono font-bold tracking-wider animate-pulse text-center sm:text-right uppercase">
                  ⚠️ COGNITIVE RELATIONAL INTERFACE MONITORING ACTIVE
                </div>
              </div>
            </div>

            <!-- TWO COLUMN SUB-GRID -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <!-- LEFT CARD: MEMBER INFORMATION (7 cols) -->
              <div class="md:col-span-7 bg-[#080d19] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-3 border-b border-white/5 pb-3 mb-4">
                    <span class="text-[#38bdf8] text-sm">👤</span>
                    <span class="text-xs font-bold text-[#38bdf8] uppercase tracking-wider font-mono">Contact & System Credentials</span>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="text-[9px] text-slate-500 font-mono block">FIRST NAME</span>
                      <span class="text-xs font-semibold text-slate-300">${selected.first_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-500 font-mono block">LAST NAME</span>
                      <span class="text-xs font-semibold text-slate-300">${selected.last_name || 'N/A'}</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-[9px] text-slate-500 font-mono block">PROFESSIONAL TITLE</span>
                      <span class="text-xs font-semibold text-slate-300 truncate block">${selected.title || 'N/A'}</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-[9px] text-slate-500 font-mono block">DEPARTMENT</span>
                      <span class="text-xs font-semibold text-slate-300 truncate block">${selected.department || 'N/A'}</span>
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-500 font-mono block">LOCATION / CITY</span>
                      <span class="text-xs font-semibold text-slate-300">${selected.city || 'N/A'}</span>
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-500 font-mono block">CONTACT EMAIL</span>
                      <span class="text-xs font-semibold text-slate-300 truncate block">${selected.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- RIGHT CARD: AMBIENT PREFERENCE & RTR MATRIX (5 cols) -->
              <div class="md:col-span-5 bg-[#080d19] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                    <span class="text-[#a855f7] text-sm">🛠&nbsp;</span>
                    <span class="text-xs font-bold text-[#a855f7] uppercase tracking-wider font-mono">Preferences & RTR Matrix</span>
                  </div>

                  <!-- Stats grid -->
                  <div class="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div class="bg-black/30 border border-white/5 rounded-xl p-2.5">
                      <div class="text-[8px] text-slate-400 font-mono uppercase">Tasks</div>
                      <div class="text-lg font-black text-[#38bdf8] mt-0.5">${assignedTickets.length}</div>
                    </div>
                    <div class="bg-black/30 border border-white/5 rounded-xl p-2.5">
                      <div class="text-[8px] text-slate-400 font-mono uppercase">Entropy</div>
                      <div class="text-lg font-black text-[#a855f7] mt-0.5">${selected.entropy_level || '5'}</div>
                    </div>
                    <div class="bg-black/30 border border-white/5 rounded-xl p-2.5">
                      <div class="text-[8px] text-slate-400 font-mono uppercase">Aesthetic</div>
                      <div class="text-[10px] font-black text-amber-500 truncate mt-2 font-mono uppercase">${selected.role}</div>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3">
                    <div>
                      <span class="text-[8px] text-slate-500 font-mono block uppercase">Ambient Aesthetic Theme</span>
                      <span class="text-xs font-semibold text-slate-300">${selected.os_theme || 'Default'}</span>
                    </div>
                    <div>
                      <span class="text-[8px] text-slate-500 font-mono block uppercase">Favorite Sports Team</span>
                      <span class="text-xs font-semibold text-slate-300 font-mono">${selected.favorite_team || 'N/A'}</span>
                    </div>
                    <div>
                      <span class="text-[8px] text-slate-500 font-mono block uppercase">Desk Relic (Cave Trophy)</span>
                      <span class="text-xs font-semibold text-slate-300 truncate block">${selected.desk_relic || 'N/A'}</span>
                    </div>
                    
                    <div class="flex gap-4 pt-2 border-t border-white/5 font-mono text-[9px] text-slate-400">
                      <div>PROCEDURAL AVATARS: <span class="text-white font-bold">${selected.procedural_avatars ? 'ENABLED' : 'DISABLED'}</span></div>
                      <div>KIOSK PROJECTION: <span class="text-white font-bold">${selected.kiosk_projection ? 'ENABLED' : 'DISABLED'}</span></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- BIO & DEEP LORE SECTION -->
            <div class="bg-[#080d19] border border-white/5 rounded-2xl p-5 shadow-2xl">
              <div class="flex items-center gap-2 border-b border-white/5 pb-3 mb-3">
                <span class="text-[#f59e0b] text-sm">📖</span>
                <span class="text-xs font-bold text-[#f59e0b] uppercase tracking-wider font-mono">Personal Biography & Deep Lore</span>
              </div>
              <p class="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">${selected.introduction || 'No biography or operational history defined.'}</p>
            </div>

            <!-- TIMELINE & SWARMS MATRIX SECTION -->
            <div class="bg-[#080d19]/40 border border-white/5 rounded-2xl p-5 shadow-xl">
              
              <!-- Timeline header -->
              <div class="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                <div class="flex items-center gap-2">
                  <span class="text-[#38bdf8] text-sm">◈</span>
                  <span class="text-[10px] text-[#38bdf8] font-bold uppercase tracking-wider font-mono">Dynamic Swarm Ingestion Streak</span>
                </div>
                <span class="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-lg font-mono">Active Streak: 4 / 5 Days</span>
              </div>

              <!-- Streak timeline bar -->
              <div class="relative py-4 px-2 select-none mb-6">
                <div class="absolute top-1/2 left-4 right-4 h-1 bg-[#1e293b] -translate-y-1/2 rounded-full">
                  <div class="h-full bg-gradient-to-r from-sky-400 to-sky-500 w-3/4 shadow-md"></div>
                </div>
                
                <div class="relative flex justify-between items-center z-10">
                  ${[
                    { label: 'Node 1', active: true, icon: '✓' },
                    { label: 'Node 2', active: true, icon: '✓' },
                    { label: 'Node 3', active: true, icon: '✓' },
                    { label: 'Node 4', active: true, icon: '✓' },
                    { label: 'Node 5', active: false, icon: '★' }
                  ].map((node) => {
                    let nodeStyle = node.active 
                      ? "bg-sky-400 border-sky-400 text-slate-900 shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                      : "bg-slate-900 border-slate-700 text-slate-500";
                    return `
                      <div class="flex flex-col items-center gap-1">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border ${nodeStyle}">
                          ${node.icon}
                        </div>
                        <span class="text-[8px] font-mono font-bold ${node.active ? 'text-sky-400' : 'text-slate-500'}">
                          ${node.label}
                        </span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Swarms grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                <!-- WeedStack -->
                <div class="bg-black/30 border border-emerald-500/10 p-3 rounded-xl flex flex-col justify-between h-28 relative">
                  <div class="absolute top-0 left-0 w-full h-0.5 bg-emerald-500"></div>
                  <div>
                    <div class="flex justify-between items-center">
                      <span class="text-white text-[10px] font-bold font-mono">WeedStack Swarm</span>
                      <span class="text-[7px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/20 font-mono font-bold">COMPLETED</span>
                    </div>
                    <p class="text-[8.5px] text-slate-500 mt-1 leading-snug">Engaged dispensary target node; sync crop matrix.</p>
                  </div>
                  <div class="text-[8px] text-emerald-400 font-mono tracking-wider">✓ SWARM SYNCHRONIZED</div>
                </div>

                <!-- BistroStack -->
                <div class="bg-black/30 border border-emerald-500/10 p-3 rounded-xl flex flex-col justify-between h-28 relative">
                  <div class="absolute top-0 left-0 w-full h-0.5 bg-emerald-500"></div>
                  <div>
                    <div class="flex justify-between items-center">
                      <span class="text-white text-[10px] font-bold font-mono">BistroStack Swarm</span>
                      <span class="text-[7px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/20 font-mono font-bold">COMPLETED</span>
                    </div>
                    <p class="text-[8.5px] text-slate-500 mt-1 leading-snug">Emergency healing sequence executed; taxonomy seeded.</p>
                  </div>
                  <div class="text-[8px] text-emerald-400 font-mono tracking-wider">✓ SWARM SYNCHRONIZED</div>
                </div>

                <!-- AetherVet -->
                <div class="bg-black/30 border border-sky-500/10 p-3 rounded-xl flex flex-col justify-between h-28 relative">
                  <div class="absolute top-0 left-0 w-full h-0.5 bg-sky-500"></div>
                  <div>
                    <div class="flex justify-between items-center">
                      <span class="text-white text-[10px] font-bold font-mono">AetherVet Swarm</span>
                      <span class="text-[7px] bg-sky-500/10 text-sky-400 px-1 py-0.2 rounded border border-sky-500/20 font-mono font-bold animate-pulse">ACTIVE</span>
                    </div>
                    <p class="text-[8.5px] text-slate-500 mt-1 leading-snug">Verify WebRTC telepresence mesh; verify feline telemetry.</p>
                  </div>
                  <div class="text-[8px] text-sky-400 font-mono tracking-wider">◈ 75% TARGET ENGAGED</div>
                </div>

                <!-- StackLabs -->
                <div class="bg-black/30 border border-purple-500/10 p-3 rounded-xl flex flex-col justify-between h-28 relative">
                  <div class="absolute top-0 left-0 w-full h-0.5 bg-purple-500"></div>
                  <div>
                    <div class="flex justify-between items-center">
                      <span class="text-white text-[10px] font-bold font-mono">StackLabs Swarm</span>
                      <span class="text-[7px] bg-purple-500/10 text-purple-400 px-1 py-0.2 rounded border border-purple-500/20 font-mono font-bold">DEPLOYED</span>
                    </div>
                    <p class="text-[8.5px] text-slate-500 mt-1 leading-snug">Bare-metal hardware configured; engine room standby.</p>
                  </div>
                  <div class="text-[8px] text-purple-400 font-mono tracking-wider">★ STACK SEEDED</div>
                </div>

              </div>

            </div>

            <!-- TABULAR SECTION (Grid: Left is Assigned Tickets, Right is Swarm Badges) -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <!-- LEFT SIDE: ASSIGNED WORK ORDERS (6 cols) -->
              <div class="md:col-span-6 bg-[#080d19] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                    <span class="text-[#38bdf8] text-sm">#</span>
                    <span class="text-xs font-bold text-[#38bdf8] uppercase tracking-wider font-mono">Assigned Work Orders</span>
                  </div>
                  ${assignedTicketsHtml}
                </div>
              </div>

              <!-- RIGHT SIDE: OPERATOR SWARM DEPLOYMENT BADGES (6 cols) -->
              <div class="md:col-span-6 bg-[#080d19] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                    <span class="text-[#f59e0b] text-sm">🏆</span>
                    <span class="text-xs font-bold text-[#f59e0b] uppercase tracking-wider font-mono">Operator Swarm Badges</span>
                  </div>
                  <div class="grid grid-cols-1 gap-3">
                    ${achievementsHtml}
                  </div>
                </div>
              </div>

            </div>

            <!-- FOOTER -->
            <div class="text-center text-[10px] text-slate-600 font-mono border-t border-slate-800 pt-4 mt-4">
              CONFIDENTIAL - FOR INTERNAL SOVEREIGN OS OPERATIONAL USE ONLY<br/>
              Printed on ${new Date().toLocaleString()} | Authenticated Session Secure
            </div>

          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 1200);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDeactivate = async () => {
    if (!selected) return;
    if (!confirm(`Deactivate "${selected.display_name || selected.user_name}"?`)) return;
    await fetch('/api/auth/deactivate_user', { method: 'POST', headers: authHeader, body: JSON.stringify({ username: selected.user_name }) });
    await loadUsers();
  };

  const handleReactivate = async () => {
    if (!selected) return;
    await fetch('/api/auth/reactivate_user', { method: 'POST', headers: authHeader, body: JSON.stringify({ username: selected.user_name }) });
    await loadUsers();
  };

  // Bulk actions
  const getSelectableUsers = () => {
    return users.filter(u => u.user_name !== currentPilot);
  };

  const toggleSelectUser = (username: string) => {
    setSelectedUsernames(prev => {
      const next = new Set(prev);
      if (next.has(username)) {
        next.delete(username);
      } else {
        next.add(username);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsernames(new Set(getSelectableUsers().map(u => u.user_name)));
    } else {
      setSelectedUsernames(new Set());
    }
  };

  const handleBulkDeactivate = async () => {
    const count = selectedUsernames.size;
    if (count === 0) return;
    if (!confirm(`Deactivate the ${count} selected users?`)) return;
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selectedUsernames).map(username =>
          fetch('/api/auth/deactivate_user', {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ username }),
          })
        )
      );
      flash(setPanelStatus, 'success', `✓ Successfully deactivated ${count} users`);
      setSelectedUsernames(new Set());
      await loadUsers();
    } catch {
      flash(setPanelStatus, 'error', 'Error deactivating users');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkReactivate = async () => {
    const count = selectedUsernames.size;
    if (count === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selectedUsernames).map(username =>
          fetch('/api/auth/reactivate_user', {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ username }),
          })
        )
      );
      flash(setPanelStatus, 'success', `✓ Successfully reactivated ${count} users`);
      setSelectedUsernames(new Set());
      await loadUsers();
    } catch {
      flash(setPanelStatus, 'error', 'Error reactivating users');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newPassword.length < 8) return;
    setCreating(true);
    try {
      const res = await fetch('/api/auth/provision_user', {
        method: 'POST', headers: authHeader,
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword, display_name: newDisplay.trim() || newUsername.trim(), role: newRole, email: newEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        flash(setNewStatus, 'success', `✓ Account "${newDisplay || newUsername}" created`);
        setNewUsername(''); setNewDisplay(''); setNewEmail(''); setNewPassword(''); setNewRole('guest');
        setTab('users');
        await loadUsers();
      } else { flash(setNewStatus, 'error', data.detail || 'Failed'); }
    } catch { flash(setNewStatus, 'error', 'Connection error'); }
    finally { setCreating(false); }
  };

  const initials = (u: UserRecord) => (u.display_name || u.user_name).substring(0, 2).toUpperCase();

  // Search filter implementation
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.user_name.toLowerCase().includes(term) ||
      (u.display_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  // Dynamic ticket list filtering for selected user
  const assignedTickets = allTasks.filter(t => {
    if (!selected) return false;
    const nameStr = selected.user_name.toLowerCase();
    const dispStr = (selected.display_name || '').toLowerCase();
    const assignedStr = (t.assigned_to || '').toLowerCase();
    return assignedStr === nameStr || assignedStr === dispStr;
  });

  // Get active status details
  const isPilot = selected?.role === 'pilot';
  const avatarToShow = editAvatarUrl || selected?.avatar_url || '';

  // Helper description text for Entropy level slider
  const getEntropyDescription = (level: number) => {
    if (level === 1) return 'Slate Opaque (Anti-Glassmorphism, crisp solid borders, high contrast)';
    if (level <= 4) return 'Classic Corporate Slate (Opacities removed, optimized operational speed)';
    if (level <= 7) return 'Sovereign Standard (Frosted glass effects, standard gradients)';
    if (level <= 10) return 'Neon Synthwave (Heavy glow masks, floating transparent tabs)';
    return 'Absolute Feral Chaos (Underground wireframe terminal, raw high-contrast terminal theme)';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] text-slate-100 overflow-hidden" style={{ fontFamily: "'Outfit','Inter',sans-serif" }}>

      {/* ── Top premium toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/5 bg-[#090e1a]/85 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-[#38bdf8]" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-mono">Sovereign OS</div>
            <h1 className="text-lg font-black uppercase tracking-wider text-[#38bdf8]">User Management Workspace</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
            {([['users', 'Users', Users], ['new', 'Create Account', Plus], ['rbac', 'Access Control', ShieldCheck]] as const).map(([id, lbl, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${tab === id ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/20 shadow-lg shadow-black/30' : 'text-slate-400 hover:text-white border border-transparent'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{lbl}</span>
              </button>
            ))}
          </div>

          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all text-[10px] uppercase tracking-wider font-bold shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── Main workspace ── */}
      {tab === 'users' && (
        <div className="flex flex-1 min-h-0 relative">

          {/* LEFT PANEL — Styled list of users */}
          <div className="w-72 shrink-0 border-r border-white/5 bg-[#070b14]/50 flex flex-col h-full">
            {/* Search Input */}
            <div className="p-3.5 border-b border-white/5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#03060c] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all font-mono"
                />
              </div>
            </div>

            {/* Scrollable list of users */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 p-3">
              {/* Select All Checkbox */}
              {getSelectableUsers().length > 0 && (
                <div className="flex items-center justify-between px-2.5 py-2 border-b border-white/5 mb-1 bg-white/2 rounded-lg shrink-0">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={getSelectableUsers().length > 0 && selectedUsernames.size === getSelectableUsers().length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-[#03060c] text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono select-none">
                      Select All
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-mono font-bold">
                    {getSelectableUsers().length}
                  </span>
                </div>
              )}

              {/* Roster Items */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 font-mono text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#38bdf8]" />
                  <span>Loading profiles...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-slate-500 text-[10px] font-mono px-2 py-8 text-center bg-white/2 rounded-xl">
                  No matching operators
                </div>
              ) : (
                filteredUsers.map((u, idx) => {
                  const activeUser = selected?.user_name === u.user_name;
                  const isPilotRole = u.role === 'pilot';
                  const userInitial = initials(u);
                  const isUserActive = !!u.active;

                  return (
                    <button
                      key={`${u.user_name}-${idx}-${u.role}`}
                      onClick={() => selectUser(u)}
                      className={`group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left border transition-all duration-200 ${
                        activeUser
                          ? 'bg-[#38bdf8]/10 border-[#38bdf8]/20 shadow-lg shadow-black/20'
                          : 'bg-[#080d1a]/40 border-transparent hover:bg-[#0c1326] hover:border-white/5'
                      }`}
                    >
                      {/* Checkbox select */}
                      {u.user_name !== currentPilot && (
                        <input
                          type="checkbox"
                          checked={selectedUsernames.has(u.user_name)}
                          onChange={() => toggleSelectUser(u.user_name)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-white/10 bg-[#03060c] text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0 transition-all"
                        />
                      )}

                      {/* Avatar preview */}
                      <div className="relative shrink-0">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt="Avatar"
                            className={`w-9 h-9 rounded-xl object-cover border bg-black/40 ${
                              activeUser ? 'border-[#38bdf8]' : 'border-white/15'
                            }`}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextSibling as HTMLDivElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: u.avatar_url ? 'none' : 'flex' }}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isPilotRole
                              ? 'bg-[#38bdf8]/15 border-[#38bdf8]/35 text-[#38bdf8]'
                              : 'bg-[#a855f7]/15 border-[#a855f7]/35 text-[#a855f7]'
                          }`}
                        >
                          {userInitial}
                        </div>
                        {/* Dynamic green status dot */}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050811] ${
                            isUserActive ? 'bg-[#22c55e]' : 'bg-slate-500'
                          }`}
                        />
                      </div>

                      {/* Bio Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[110px]">
                            {u.display_name || u.user_name}
                          </span>
                          <span
                            className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                              isPilotRole
                                ? 'text-[#38bdf8] border-[#38bdf8]/30 bg-[#38bdf8]/10'
                                : 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          @{u.user_name}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bulk Action Bar */}
            {selectedUsernames.size > 0 && (
              <div className="p-3 border-t border-white/5 bg-[#090f1f] flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-[#38bdf8] font-bold font-mono uppercase tracking-wider">
                    Selected Operators: {selectedUsernames.size}
                  </span>
                  <button
                    onClick={() => setSelectedUsernames(new Set())}
                    className="text-slate-400 hover:text-white transition-colors p-0.5 rounded bg-white/5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDeactivate}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Disable
                  </button>
                  <button
                    onClick={handleBulkReactivate}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 hover:bg-[#22c55e]/20 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all duration-200"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Enable
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Dribbble Inspired Dashboard Editor */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#04060c]">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <Users className="w-12 h-12 text-[#38bdf8]/40 animate-pulse" />
                <p className="text-sm font-mono tracking-widest uppercase">Select an Operator Profile</p>
              </div>
            ) : (
              <div className="max-w-6xl flex flex-col gap-6 mx-auto">

                {/* Main details header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <button className="p-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1">
                      <ChevronRight className="w-4 h-4 rotate-180" /> Back to Console
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-white font-black text-2xl tracking-wide">
                          {selected.display_name || selected.user_name}
                        </h2>
                        <span
                          className={`text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                            isPilot ? 'text-[#38bdf8] border-[#38bdf8]/30 bg-[#38bdf8]/10' : 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10'
                          }`}
                        >
                          {selected.role}
                        </span>
                        {selected.active ? (
                          <span className="text-[10px] font-bold font-mono text-[#22c55e] border border-[#22c55e]/30 px-2.5 py-0.5 rounded-full bg-[#22c55e]/5">
                            ✓ Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold font-mono text-red-400 border border-red-400/30 px-2.5 py-0.5 rounded-full bg-red-500/5">
                            ✕ Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs font-mono mt-1">Operator Node: @{selected.user_name}</p>
                    </div>
                  </div>

                  {/* Deactivate Toggle Actions */}
                  {selected.user_name !== currentPilot && (
                    <div className="shrink-0">
                      {selected.active ? (
                        <button
                          onClick={handleDeactivate}
                          className="flex items-center gap-2 px-4 py-2 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" /> Deactivate Account
                        </button>
                      ) : (
                        <button
                          onClick={handleReactivate}
                          className="flex items-center gap-2 px-4 py-2 border border-[#22c55e]/30 bg-[#22c55e]/5 hover:bg-[#22c55e]/10 text-[#22c55e] rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-200"
                        >
                          <CheckCircle className="w-4 h-4" /> Reactivate Account
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Grid Row 1: Two High-Fidelity Cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                  {/* CARD 1: Member Information */}
                  <div className="bg-[#080d19] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-[#38bdf8]" />
                        <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider font-mono">Member Information</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Interactive Profile Photo */}
                      <div className="relative group/avatar shrink-0 mx-auto sm:mx-0">
                        {avatarToShow ? (
                          <img
                            src={avatarToShow}
                            alt="Preview Avatar"
                            className="w-24 h-24 rounded-2xl object-cover border border-white/10 bg-black/40 shadow-inner group-hover/avatar:opacity-75 transition-all duration-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextSibling as HTMLDivElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: avatarToShow ? 'none' : 'flex' }}
                          className={`w-24 h-24 rounded-2xl border flex items-center justify-center text-2xl font-bold shrink-0 group-hover/avatar:opacity-75 transition-all duration-200 ${
                            isPilot
                              ? 'bg-[#38bdf8]/15 border-[#38bdf8]/35 text-[#38bdf8]'
                              : 'bg-[#a855f7]/15 border-[#a855f7]/35 text-[#a855f7]'
                          }`}
                        >
                          {initials(selected)}
                        </div>

                        {/* Interactive Edit overlay */}
                        <button
                          onClick={() => setShowAvatarPicker(v => !v)}
                          className="absolute -bottom-2 -right-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#050811] p-1.5 rounded-xl shadow-lg border border-black/40 transition-all duration-200 shrink-0"
                          title="Change Portrait"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Avatar Preset Picker popover */}
                        {showAvatarPicker && (
                          <div className="absolute left-0 top-full mt-2 bg-[#090f1e]/95 border border-white/10 rounded-2xl p-3.5 shadow-2xl z-20 w-64 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Select Avatar Portrait</span>
                              <button onClick={() => setShowAvatarPicker(false)} className="text-slate-400 hover:text-white">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Grid pre-set avatars */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {PRESET_AVATARS.map((av) => (
                                <button
                                  key={av.url}
                                  onClick={() => {
                                    setEditAvatarUrl(av.url);
                                    setShowAvatarPicker(false);
                                  }}
                                  className={`flex flex-col items-center gap-1 p-1 rounded-lg border transition-all ${
                                    editAvatarUrl === av.url ? 'border-[#38bdf8] bg-[#38bdf8]/10' : 'border-transparent hover:bg-white/5'
                                  }`}
                                >
                                  <img src={av.url} alt={av.name} className="w-9 h-9 rounded-lg object-cover" />
                                  <span className="text-[8px] font-mono truncate w-full text-center text-slate-400">{av.name}</span>
                                </button>
                              ))}
                            </div>
                            {/* File Upload Selector */}
                            <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                              <label className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">Upload New Portrait</label>
                              <div className="relative flex items-center justify-between bg-[#03060c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 focus-within:border-[#38bdf8]/60 transition-all font-mono">
                                <span className="truncate pr-2">{uploadingAvatar ? 'Uploading...' : 'Choose File...'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingAvatar}
                                  onChange={handleAvatarUpload}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                />
                              </div>
                            </div>
                            {/* Custom URL text box */}
                            <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                              <label className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">Custom Portrait Path / URL</label>
                              <input
                                type="text"
                                placeholder="/avatars/custom.png"
                                value={editAvatarUrl}
                                onChange={(e) => setEditAvatarUrl(e.target.value)}
                                className="w-full bg-[#03060c] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fields grid */}
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Display Name</label>
                          <input
                            type="text"
                            value={editDisplay}
                            onChange={(e) => setEditDisplay(e.target.value)}
                            placeholder={selected.user_name}
                            className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="operator@sovereignlabs.ts.net"
                            className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Username</label>
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">System Governance Role</label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all appearance-none cursor-pointer"
                          >
                            <option value="pilot">pilot (Full Admin Node)</option>
                            <option value="creator">creator (Stack Builder)</option>
                            <option value="stack_manager">stack_manager (Advocate Manager)</option>
                            <option value="patron">patron (Core Patron)</option>
                            <option value="investor">investor (Read-only Strategic)</option>
                            <option value="vet_client">vet_client (AetherVet Client)</option>
                            <option value="garden_client">garden_client (GardenStack Client)</option>
                            <option value="observer">observer (Telemetry Watcher)</option>
                            <option value="guest">guest (Guest Operator)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Secondary details grid (first/last names, title, department, city) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mt-5 pt-4 border-t border-white/5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">First Name</label>
                        <input
                          type="text"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          placeholder="First Name"
                          className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Last Name</label>
                        <input
                          type="text"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          placeholder="Last Name"
                          className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Professional Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="e.g. Industrial Systems Supervisor"
                          className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all truncate"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Department</label>
                        <input
                          type="text"
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          placeholder="e.g. Precision Manufacturing"
                          className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2 md:col-span-1">
                        <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">City / Location</label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="e.g. Humboldt County, CA"
                          className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Ambient Preference & RTR Matrix */}
                  <div className="bg-[#080d19] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#a855f7]" />
                          <span className="text-xs font-bold text-[#a855f7] uppercase tracking-wider font-mono">Ambient Preference & RTR Matrix</span>
                        </div>
                      </div>

                      {/* Stats Sub-Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-[#03060c] border border-white/5 rounded-2xl p-3.5 text-center shadow-inner relative group">
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Work Orders</div>
                          <div className="text-2xl font-black text-[#38bdf8] mt-1.5">{assignedTickets.length}</div>
                          <div className="text-[8px] text-slate-500 mt-1 uppercase tracking-widest font-mono">Assigned Tasks</div>
                        </div>

                        <div className="bg-[#03060c] border border-white/5 rounded-2xl p-3.5 text-center shadow-inner relative group">
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Entropy Scale</div>
                          <div className="text-2xl font-black text-[#a855f7] mt-1.5">{editEntropyLevel}</div>
                          <div className="text-[8px] text-slate-500 mt-1 uppercase tracking-widest font-mono">Security Tier</div>
                        </div>

                        <div className="bg-[#03060c] border border-white/5 rounded-2xl p-3.5 text-center shadow-inner relative group">
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Aesthetic Role</div>
                          <div className="text-xs font-bold text-[#f59e0b] truncate mt-3.5 uppercase tracking-widest font-mono">
                            {selected.role}
                          </div>
                          <div className="text-[8px] text-slate-500 mt-2 uppercase tracking-widest font-mono">Access Level</div>
                        </div>
                      </div>

                      {/* Theme Override select */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Ambient Aesthetic Theme</label>
                          <select
                            value={editOsTheme}
                            onChange={(e) => setEditOsTheme(e.target.value)}
                            className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all appearance-none cursor-pointer"
                          >
                            <option value="sovereign-home">Sovereign Grid (Default Theme)</option>
                            <option value="espn">ESPN Workspace Theme (Clean Slate & Bold Red)</option>
                            <option value="windows">Windows (Fluent Metro Layout)</option>
                            <option value="linux">Linux (Hacker Monospace Terminal)</option>
                            <option value="steamboat">Steamboat (1930s Rubberhose Aesthetic)</option>
                            <option value="pixel">Pixel (8-Bit Retro Arcade Layout)</option>
                            <option value="nes">NES (Baseball Stars 1989 Classic)</option>
                            <option value="snes">SNES (16-Bit Super Layout)</option>
                            <option value="n64">N64 (Atomic Polygon Retro Style)</option>
                            <option value="psx">PSX (90s Cyberdeck Console Aesthetic)</option>
                            <option value="mac">Mac (System 7 Classic Workspace)</option>
                            <option value="storybook-sapphire">Storybook Sapphire (High-Contrast, Oversized)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Favorite Sports Team</label>
                          <input
                            type="text"
                            value={editFavoriteTeam}
                            onChange={(e) => setEditFavoriteTeam(e.target.value)}
                            placeholder="e.g. DET or NYM"
                            className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Security Entropy Level slider */}
                      <div className="flex flex-col gap-1.5 mb-4 p-3 bg-[#03060c] border border-white/5 rounded-2xl">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Security Entropy Level (1 - 11)</label>
                          <span className="text-xs font-black text-[#a855f7] bg-[#a855f7]/10 px-2 py-0.5 rounded border border-[#a855f7]/30 font-mono">
                            Level {editEntropyLevel}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="11"
                          value={editEntropyLevel}
                          onChange={(e) => setEditEntropyLevel(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-[#a855f7] focus:outline-none focus:ring-0 mt-1"
                        />
                        <div className="text-[9px] font-mono text-slate-400 leading-relaxed mt-1 flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-[#a855f7] shrink-0 mt-0.5" />
                          <span>{getEntropyDescription(editEntropyLevel)}</span>
                        </div>
                      </div>

                      {/* Relic Input */}
                      <div className="flex flex-col gap-1 mb-4">
                        <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Desk Relic (Cave Trophy Assignment)</label>
                        <input
                          type="text"
                          value={editDeskRelic}
                          onChange={(e) => setEditDeskRelic(e.target.value)}
                          placeholder="e.g. Tactile Industrial Pressure Dial"
                          className="bg-[#03060c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all"
                        />
                      </div>
                    </div>

                    {/* Quick Toggles */}
                    <div className="flex flex-wrap gap-4 pt-3 border-t border-white/5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editProceduralAvatars}
                          onChange={(e) => setEditProceduralAvatars(e.target.checked)}
                          className="w-4 h-4 rounded border-white/10 bg-[#03060c] text-[#a855f7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider font-mono">Procedural Avatars</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editKioskProjection}
                          onChange={(e) => setEditKioskProjection(e.target.checked)}
                          className="w-4 h-4 rounded border-white/10 bg-[#03060c] text-[#a855f7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider font-mono">Kiosk Projection</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* Grid Row 2: Bottom Tabular Section */}
                <div className="bg-[#080d19] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-white/5 bg-[#090f1e] px-4">
                    {([
                      ['tickets', 'Assigned Work Orders', Hash, assignedTickets.length],
                      ['achievements', 'Achievements & Rewards', Award, null],
                      ['lore', 'Biography & Deep Lore', BookOpen, null],
                      ['credentials', 'Security Credentials', Key, null]
                    ] as const).map(([id, labelText, Icon, count]) => (
                      <button
                        key={id}
                        onClick={() => setSubTab(id)}
                        className={`flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 ${
                          subTab === id
                            ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/5'
                            : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{labelText}</span>
                        {count !== null && (
                          <span className="bg-white/10 text-white px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ml-1">
                            {count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="p-5 min-h-[220px]">
                    {subTab === 'tickets' && (
                      <div className="overflow-x-auto">
                        {assignedTickets.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 font-mono text-xs border border-dashed border-white/5 rounded-2xl">
                            <ShieldAlert className="w-8 h-8 text-slate-600 animate-pulse" />
                            <span>No active stories assigned to this operator.</span>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-xs font-sans">
                            <thead>
                              <tr className="border-b border-white/10 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                                <th className="py-2.5 px-3">Ticket ID</th>
                                <th className="py-2.5 px-3">Description Title</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3 text-center">Priority</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                              {assignedTickets.map((t) => {
                                let statusPill = "bg-white/5 text-white/50 border border-white/5";
                                if (t.status === 'IN_PROGRESS' || t.status === 'Work In Progress') {
                                  statusPill = "bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 font-bold";
                                } else if (t.status === 'DONE' || t.status === 'RESOLVED' || t.status === 'Resolved') {
                                  statusPill = "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 font-bold";
                                } else if (t.status === 'PLANNING' || t.status === 'Planning') {
                                  statusPill = "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 font-bold";
                                }

                                let priorityStyle = "text-slate-400";
                                if (t.priority === '1' || t.priority === 'P1') {
                                  priorityStyle = "text-red-400 font-bold";
                                } else if (t.priority === '2' || t.priority === 'P2') {
                                  priorityStyle = "text-[#f59e0b] font-bold";
                                }

                                return (
                                  <tr key={t.id} className="hover:bg-white/2 transition-colors">
                                    <td className="py-3 px-3 font-bold text-[#38bdf8]">{t.id}</td>
                                    <td className="py-3 px-3 text-slate-300 font-sans font-semibold truncate max-w-[300px]">
                                      {t.title}
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${statusPill}`}>
                                        {t.status}
                                      </span>
                                    </td>
                                    <td className={`py-3 px-3 text-center ${priorityStyle}`}>{t.priority}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {subTab === 'lore' && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Personal Biography & Deep Lore Intro</label>
                        <textarea
                          rows={6}
                          value={editIntroduction}
                          onChange={(e) => setEditIntroduction(e.target.value)}
                          placeholder="Type deep-lore details, operational history, ranch location details, or custom system preferences for this user profile..."
                          className="w-full bg-[#03060c] border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-[#38bdf8]/60 transition-all font-sans leading-relaxed"
                        />
                      </div>
                    )}

                    {subTab === 'credentials' && (
                      <div className="max-w-xl flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Set Password Override</label>
                          <PasswordInput
                            value={editPassword}
                            onChange={setEditPassword}
                            placeholder="Set a new password (min 8 characters)"
                          />
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-relaxed">
                            Password will be salted and hashed immediately using robust bcrypt rounds. Leave blank to keep current system password hash active.
                          </p>
                        </div>
                      </div>
                    )}

                    {subTab === 'achievements' && (
                      <div className="flex flex-col gap-6 font-sans text-white">
                        
                        {/* Repeated Rewards Section (Swarm Ingestion Streak) */}
                        <div className="bg-[#03060c] border border-white/5 rounded-2xl p-5 shadow-inner">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                              <span className="text-[10px] text-[#38bdf8] font-bold uppercase tracking-wider font-mono">Dynamic Swarm Ingestion Streak</span>
                              <h4 className="text-sm font-black mt-0.5">Telemetry Synchronization Timeline</h4>
                            </div>
                            <div className="flex items-center gap-2 bg-[#38bdf8]/10 border border-[#38bdf8]/20 px-3 py-1 rounded-xl text-xs text-[#38bdf8] font-mono">
                              <span>Active Streak: 4 / 5 Days</span>
                            </div>
                          </div>
                          
                          {/* Streak Progress Timeline bar */}
                          <div className="relative py-4 px-2 select-none">
                            {/* Track Line */}
                            <div className="absolute top-1/2 left-4 right-4 h-1 bg-[#1e293b] -translate-y-1/2 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] w-3/4 shadow-lg shadow-[#38bdf8]/35" />
                            </div>
                            
                            {/* Timeline Nodes */}
                            <div className="relative flex justify-between items-center z-10">
                              {[
                                { day: 1, label: 'Node 1', active: true, icon: '✓' },
                                { day: 2, label: 'Node 2', active: true, icon: '✓' },
                                { day: 3, label: 'Node 3', active: true, icon: '✓' },
                                { day: 4, label: 'Node 4', active: true, icon: '✓' },
                                { day: 5, label: 'Node 5', active: false, icon: '★' }
                              ].map((node) => {
                                let nodeStyle = "border-2 ";
                                if (node.active) {
                                  nodeStyle += "bg-[#38bdf8] border-[#38bdf8] text-[#03060c] shadow-[0_0_15px_rgba(56,189,248,0.5)]";
                                } else {
                                  nodeStyle += "bg-[#0f172a] border-[#334155] text-slate-500";
                                }
                                
                                return (
                                  <div key={node.day} className="flex flex-col items-center gap-1.5 group cursor-pointer">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 transform group-hover:scale-110 ${nodeStyle}`}>
                                      {node.icon}
                                    </div>
                                    <span className={`text-[9px] font-mono font-bold ${node.active ? 'text-[#38bdf8]' : 'text-slate-400'}`}>
                                      {node.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Brand Stack Active Swarm Matrix */}
                        <div className="bg-[#03060c]/50 border border-white/5 rounded-2xl p-5 shadow-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono">◈ Active Brand Stack Swarm Matrix</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* WeedStack Swarm */}
                            <div className="bg-black/40 border border-emerald-500/20 hover:border-emerald-500/40 p-4 rounded-xl relative overflow-hidden transition-all flex flex-col justify-between h-36">
                              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-white text-xs font-bold font-mono">WeedStack Swarm</span>
                                  <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono font-bold tracking-wider animate-pulse">COMPLETED</span>
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Target: WildSeed</div>
                                <p className="text-[9.5px] text-slate-500 mt-2 leading-tight">Engaged dispensary target node; sync crop matrix intake briefs.</p>
                              </div>
                              <div className="text-[8.5px] text-emerald-400 font-mono tracking-widest mt-2">✓ SWARM SYNCHRONIZED</div>
                            </div>

                            {/* BistroStack Swarm */}
                            <div className="bg-black/40 border border-emerald-500/20 hover:border-emerald-500/40 p-4 rounded-xl relative overflow-hidden transition-all flex flex-col justify-between h-36">
                              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-white text-xs font-bold font-mono">BistroStack Swarm</span>
                                  <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono font-bold tracking-wider animate-pulse">COMPLETED</span>
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Target: Bistro Portal</div>
                                <p className="text-[9.5px] text-slate-500 mt-2 leading-tight">Emergency healing sequence executed; menu taxonomy seeded.</p>
                              </div>
                              <div className="text-[8.5px] text-emerald-400 font-mono tracking-widest mt-2">✓ SWARM SYNCHRONIZED</div>
                            </div>

                            {/* AetherVet Swarm */}
                            <div className="bg-black/40 border border-sky-500/20 hover:border-sky-500/40 p-4 rounded-xl relative overflow-hidden transition-all flex flex-col justify-between h-36">
                              <div className="absolute top-0 left-0 w-full h-1 bg-sky-500"></div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-white text-xs font-bold font-mono">AetherVet Swarm</span>
                                  <span className="text-[7.5px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20 font-mono font-bold tracking-wider animate-pulse">ACTIVE</span>
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Target: Arkle Vet</div>
                                <p className="text-[9.5px] text-slate-500 mt-2 leading-tight">Verify WebRTC telepresence mesh; verify feline telemetry data.</p>
                              </div>
                              <div className="text-[8.5px] text-sky-400 font-mono tracking-widest mt-2">◈ 75% TARGET ENGAGED</div>
                            </div>

                            {/* StackLabs Swarm */}
                            <div className="bg-black/40 border border-purple-500/20 hover:border-purple-500/40 p-4 rounded-xl relative overflow-hidden transition-all flex flex-col justify-between h-36">
                              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-white text-xs font-bold font-mono">StackLabs Swarm</span>
                                  <span className="text-[7.5px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-mono font-bold tracking-wider">DEPLOYED</span>
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Target: Raw Iron</div>
                                <p className="text-[9.5px] text-slate-500 mt-2 leading-tight">Bare-metal hardware configured; engine room on standby.</p>
                              </div>
                              <div className="text-[8.5px] text-purple-400 font-mono tracking-widest mt-2">★ STACK SEEDED</div>
                            </div>
                          </div>
                        </div>

                        {/* All Achievements Grid (Swarm Deployment Badges) */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Award className="w-4 h-4 text-[#f59e0b]" />
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">🧬 Operator Swarm Deployment Badges</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(() => {
                              const username = selected.user_name;
                              let userAchievements = [];
                              if (username === 'pawel') {
                                userAchievements = [
                                  { id: 'weedstack_pioneer', title: 'WildSeed Swarm Completed', description: 'Successfully seeded and deployed the first WeedStack IoT matrix to WildSeed.', unlocked: true, dateEarned: '22 05 26', icon: '🌱' },
                                  { id: 'relay_runner', title: 'Tailscale Mesh Swarm', description: 'Configured 15 concurrent Tailscale tunnel telemetry hops securely on clio.', unlocked: true, dateEarned: '24 05 26', icon: '⚡' },
                                  { id: 'industrial_dial', title: 'Clio Relic Tethered', description: 'Integrated the custom tactile physical copper relic dial to clio command deck.', unlocked: true, dateEarned: '28 05 26', icon: '⚙️' },
                                  { id: 'chaos_proof', title: 'Advocate Engagement Champion', description: 'Survive a heated Skew room debate with Barf without dropping telemetry frames.', unlocked: false, icon: '🛡%' }
                                ];
                              } else if (username === 'james') {
                                userAchievements = [
                                  { id: 'command_pilot', title: 'Bare-Metal Core Swarm', description: 'Executed 1,000 CLI command loops on clio with zero system diagnostic faults.', unlocked: true, dateEarned: '12 05 26', icon: '🚀' },
                                  { id: 'room_shaper', title: 'Aesthetic Alignment Seeder', description: 'Triggered 50 instant multi-workspace CSS themes dynamically.', unlocked: true, dateEarned: '18 05 26', icon: '🎨' },
                                  { id: 'blue_tear', title: 'Bullpen Meltdown Survivor', description: 'Expressed undying hope for the Mets bullpen during a Skew session.', unlocked: true, dateEarned: '29 05 26', icon: '💧' },
                                  { id: 'mard_transcendence', title: 'Relational Cognitive Link', description: 'Achieved full emotional relational alignment on the M.A.R.D core engine.', unlocked: false, icon: '🧠' }
                                ];
                              } else if (username === 'barf') {
                                userAchievements = [
                                  { id: 'underpants_bandito', title: 'Portal Key Hijack Swarm', description: 'Successfully locked down the entire portal using retro terminal keys.', unlocked: true, dateEarned: '08 05 26', icon: '🦹' },
                                  { id: 'mets_fanatic', title: 'Mets Bullpen Telemetrist', description: 'Screamed at Stearns for 45 minutes on the active telemetry line.', unlocked: true, dateEarned: '15 05 26', icon: '⚾' },
                                  { id: 'hot_take_fire', title: 'Vocal Synthesizer Swarm', description: 'Triggered 15 concurrent vocal relay synthesizer overrides on argo.', unlocked: true, dateEarned: '27 05 26', icon: '🔥' },
                                  { id: 'casino_king', title: 'Credit Injection Whale', description: 'Wagered 10,000 portal credits in a single session without sweating.', unlocked: false, icon: '🎰' }
                                ];
                              } else {
                                userAchievements = [
                                  { id: 'so_weve_met', title: 'Mesh Swarm Auth', description: 'Successfully authenticated to the Sovereign Portal over secure tailscale.', unlocked: true, dateEarned: '29 05 26', icon: '🤝' },
                                  { id: 'mom_on_tv', title: 'Genesis Seeder Recruit', description: 'Reached top 1000 operational rank in the Genesis seeder matrix.', unlocked: false, icon: '📺' },
                                  { id: 'secret_trophy', title: 'Classified Swarm Goal', description: 'Keep completing assigned stories and tasks to unlock this relic.', unlocked: false, icon: '🔒' }
                                ];
                              }
                              
                              return userAchievements.map((ach) => (
                                <div 
                                  key={ach.id} 
                                  className={`relative rounded-2xl p-4 border transition-all duration-300 overflow-hidden flex items-center gap-4 ${
                                    ach.unlocked 
                                      ? 'bg-[#080d19] border-white/10 hover:border-[#38bdf8]/40 shadow-lg' 
                                      : 'bg-[#050811]/60 border-white/5 opacity-55 saturate-[0.1]'
                                  }`}
                                >
                                  {/* Locked Blur Overlay */}
                                  {!ach.unlocked && (
                                    <div className="absolute inset-0 bg-[#000]/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                      <div className="flex flex-col items-center gap-1">
                                        <Award className="w-5 h-5 text-slate-500" />
                                        <span className="text-[8px] font-mono uppercase font-bold text-slate-400 tracking-wider">Locked Achievement</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Hexagon icon wrapper */}
                                  <div className="relative shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 rounded-xl shadow-inner text-xl">
                                    {ach.icon}
                                    {ach.unlocked && (
                                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#22c55e] border border-black rounded-full flex items-center justify-center text-[7px] text-black font-bold">
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <h5 className="text-xs font-bold truncate">{ach.title}</h5>
                                      {ach.unlocked && ach.dateEarned && (
                                        <span className="text-[8px] font-mono bg-[#38bdf8]/10 text-[#38bdf8] px-1.5 py-0.5 rounded border border-[#38bdf8]/20 shrink-0">
                                          {ach.dateEarned}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
                                      {ach.description}
                                    </p>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Notification Panel */}
                {panelStatus && (
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xl transition-all duration-300 ${
                      panelStatus.type === 'success'
                        ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {panelStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                    <span>{panelStatus.text}</span>
                  </div>
                )}

                {/* Footer Save actions */}
                <div className="flex justify-end pt-2 gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2.5 px-6 py-3 bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 border border-white/10 hover:border-white/20 font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all duration-200"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                    <span>Print Dossier</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2.5 px-6 py-3 bg-[#38bdf8] hover:bg-[#0ea5e9] disabled:opacity-45 disabled:cursor-not-allowed text-[#050811] font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg hover:shadow-[#38bdf8]/20 transition-all duration-200"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Committing Changes...' : 'Save User Profile'}</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE GUEST TAB ── */}
      {tab === 'new' && (
        <div className="flex-1 overflow-y-auto p-6 bg-[#04060c]">
          <div className="max-w-2xl mx-auto bg-[#080d19] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#22c55e]/5 border-b border-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs font-bold text-[#22c55e] font-mono uppercase tracking-wider">New Operator Account Creation</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                🚨 <strong>OPERATOR ACCOUNT vs AI PERSONA:</strong> This form provisions a <strong>real human operator account</strong> (Pilot, Partner, Guest) who can log in to the Sovereign OS Portal with secure passwords and Tailscale credentials. To create or manage an autonomous <strong>AI chatbot Swarm persona</strong> (like Dr. Kosmos or Terry), please go to the <strong>Persona Swarm Center</strong> instead.
              </p>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">
                    <AtSign className="w-3 h-3 inline mr-1" />Username *
                  </label>
                  <input
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="e.g. operator_mike"
                    className="bg-[#03060c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#22c55e]/60 transition-all font-mono"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Display Name</label>
                  <input
                    value={newDisplay}
                    onChange={e => setNewDisplay(e.target.value)}
                    placeholder="e.g. Operator Mike"
                    className="bg-[#03060c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#22c55e]/60 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">
                    <Mail className="w-3 h-3 inline mr-1" />Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-[#03060c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#22c55e]/60 transition-all font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Governance Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="bg-[#03060c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#22c55e]/60 transition-all appearance-none cursor-pointer"
                  >
                    <option value="pilot">pilot (Full Admin Node)</option>
                    <option value="creator">creator (Stack Builder)</option>
                    <option value="stack_manager">stack_manager (Advocate Manager)</option>
                    <option value="patron">patron (Core Patron)</option>
                    <option value="investor">investor (Read-only Strategic)</option>
                    <option value="vet_client">vet_client (AetherVet Client)</option>
                    <option value="garden_client">garden_client (GardenStack Client)</option>
                    <option value="observer">observer (Telemetry Watcher)</option>
                    <option value="guest">guest (Guest Operator)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">
                  <Key className="w-3 h-3 inline mr-1" />Temporary Password *
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Temp password (min 8 chars)"
                />
              </div>

              <p className="text-slate-500 text-[10px] font-mono leading-relaxed mt-1 flex items-start gap-1">
                <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <span>Guest operators are fully locked down to regional modules. Standard encryption hashes will be applied on creation.</span>
              </p>

              {newStatus && (
                <div
                  className={`px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-inner transition-all duration-300 ${
                    newStatus.type === 'success'
                      ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {newStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                  <span>{newStatus.text}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={creating || !newUsername.trim() || newPassword.length < 8}
                  className="flex items-center gap-2.5 px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-45 disabled:cursor-not-allowed text-[#030a05] font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg hover:shadow-[#22c55e]/20 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creating ? 'Creating Profile...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ACCESS CONTROL TAB ── */}
      {tab === 'rbac' && (
        <div className="flex-1 overflow-y-auto p-6 bg-[#04060c] flex flex-col gap-6">
          {/* User Roster Card */}
          <div className="bg-[#080d19] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-3 bg-[#38bdf8]/5 border-b border-white/5 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#38bdf8]" />
              <span className="text-xs text-[#38bdf8] font-bold font-mono uppercase tracking-wider">User Role & Status Registry</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    <th className="py-2.5 px-3">Display Name</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-center">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.user_name} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">{u.display_name || u.user_name}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">@{u.user_name}</td>
                      <td className="py-3 px-3 text-slate-300 font-mono">{u.email || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleSetRole(u.user_name, e.target.value)}
                          disabled={u.user_name === currentPilot}
                          className="bg-[#03060c] border border-white/10 rounded-xl px-2 py-1 text-white text-xs font-mono outline-none focus:border-[#38bdf8]/60 transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <option value="pilot">pilot</option>
                          <option value="creator">creator</option>
                          <option value="stack_manager">stack_manager</option>
                          <option value="patron">patron</option>
                          <option value="investor">investor</option>
                          <option value="vet_client">vet_client</option>
                          <option value="garden_client">garden_client</option>
                          <option value="observer">observer</option>
                          <option value="guest">guest</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!u.active}
                          onChange={() => handleToggleActive(u.user_name, u.active)}
                          disabled={u.user_name === currentPilot}
                          className="w-4 h-4 rounded border-white/10 bg-[#03060c] text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RBAC Service Matrix Card */}
          <div className="bg-[#080d19] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-3 bg-[#a855f7]/5 border-b border-white/5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#a855f7]" />
              <span className="text-xs text-[#a855f7] font-bold font-mono uppercase tracking-wider">Live RBAC Service Invariants Matrix</span>
            </div>
            <div className="p-4 overflow-x-auto">
              {rbacLoading ? (
                <div className="text-slate-500 text-xs font-mono text-center py-6 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#a855f7]" />
                  <span>Loading permissions grid...</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                      <th className="py-2.5 px-3">Service Name</th>
                      <th className="py-2.5 px-3 text-center">Port</th>
                      {['pilot', 'creator', 'stack_manager', 'patron', 'investor', 'vet_client', 'garden_client', 'observer'].map(r => (
                        <th key={r} className="py-2.5 px-3 text-center">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {(() => {
                      const uniqueServices = Array.from(new Set(permissions.map(p => `${p.service_name}|${p.port}`)))
                        .map(s => {
                          const [name, portStr] = s.split('|');
                          return { service_name: name, port: parseInt(portStr) };
                        })
                        .sort((a, b) => a.port - b.port);

                      if (uniqueServices.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-slate-500">No active permissions loaded.</td>
                          </tr>
                        );
                      }

                      return uniqueServices.map(svc => (
                        <tr key={svc.port} className="hover:bg-white/2 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-white font-sans">{svc.service_name}</td>
                          <td className="py-2.5 px-3 text-center text-slate-400">{svc.port}</td>
                          {['pilot', 'creator', 'stack_manager', 'patron', 'investor', 'vet_client', 'garden_client', 'observer'].map(role => {
                            const match = permissions.find(p => p.role === role && p.port === svc.port);
                            const access = match ? match.access_level : 'none';
                            
                            let pillStyle = "bg-white/5 text-slate-500 border border-white/5";
                            if (access === 'full') {
                              pillStyle = "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 font-bold";
                            } else if (access === 'read') {
                              pillStyle = "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 font-bold";
                            }
                            
                            return (
                              <td key={role} className="py-2.5 px-2 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${pillStyle}`}>
                                  {access}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
