/**
 * UserManagementConsole — ServiceNow-style two-panel layout.
 * LEFT: compact scrollable user list — click any row to select.
 * RIGHT: sticky profile editor panel — always visible at top, no scroll-back needed.
 */
import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Key, Trash2, CheckCircle, XCircle,
  RefreshCw, Eye, EyeOff, Save, UserCircle, ShieldCheck,
  Mail, AtSign, X
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
  has_password?: number;
}

interface StatusMsg { type: 'success' | 'error'; text: string; }

function PasswordInput({ value, onChange, placeholder = 'Min 8 characters' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#060a14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#38bdf8]/60 transition-colors placeholder:text-white/20 font-mono" />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

const field = "flex flex-col gap-1";
const label = "text-[10px] text-white/35 uppercase tracking-widest font-sans";
const input = "bg-[#060a14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#38bdf8]/60 transition-colors placeholder:text-white/20 font-mono w-full";

export default function UserManagementConsole() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [tab, setTab] = useState<'users' | 'new' | 'rbac'>('users');
  const [panelStatus, setPanelStatus] = useState<StatusMsg | null>(null);
  const [saving, setSaving] = useState(false);

  // RBAC Console States
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rbacLoading, setRbacLoading] = useState(false);

  // Edit form state
  const [editDisplay, setEditDisplay] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('');

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
        }
      }
    } finally { setLoading(false); }
  };

  const selectUser = (u: UserRecord) => {
    setSelected(u);
    setEditDisplay(u.display_name || '');
    setEditEmail(u.email || '');
    setEditUsername(u.user_name || '');
    setEditRole(u.role || '');
    setEditPassword('');
    setPanelStatus(null);
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
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    if (editPassword && editPassword.length < 8) {
      flash(setPanelStatus, 'error', 'Password must be 8+ characters'); return;
    }
    setSaving(true);
    const isPilotEditing = selected.role === 'pilot';
    const endpoint = isPilotEditing ? '/api/auth/update_my_profile' : '/api/auth/update_user';
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
        }),
      });
      if (res.ok) {
        flash(setPanelStatus, 'success', '✓ Profile saved');
        setEditPassword('');
        await loadUsers();
      } else {
        const d = await res.json();
        flash(setPanelStatus, 'error', d.detail || 'Save failed');
      }
    } catch { flash(setPanelStatus, 'error', 'Connection error'); }
    finally { setSaving(false); }
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

  const isPilot = selected?.role === 'pilot';
  const initials = (u: UserRecord) => (u.display_name || u.user_name).substring(0, 2).toUpperCase();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ fontFamily: "'Outfit','Inter',sans-serif" }}>

      {/* ── Top toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/8 shrink-0">
        <div className="flex gap-1 bg-black/30 border border-white/8 rounded-lg p-0.5">
          {([['users', 'Users', Users], ['new', 'Create Account', Plus], ['rbac', 'Access Control', ShieldCheck]] as const).map(([id, lbl, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${tab === id ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/25' : 'text-white/40 hover:text-white/70'}`}>
              <Icon className="w-3.5 h-3.5" />{lbl}
            </button>
          ))}
        </div>
        <button onClick={loadUsers} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-lg text-white/35 hover:text-white hover:border-white/30 transition-all text-[10px] uppercase tracking-widest">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* ── Main area ── */}
      {tab === 'users' && (
        <div className="flex flex-1 min-h-0">

          {/* LEFT — user list */}
          <div className="w-64 shrink-0 border-r border-white/8 flex flex-col h-full bg-[#060a14]/10">
            {/* Scrollable list of users */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 p-2">
              {/* Select All Checkbox */}
              {users.length > 0 && (
                <div className="flex items-center gap-2 px-2 py-1.5 border-b border-white/5 mb-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={getSelectableUsers().length > 0 && selectedUsernames.size === getSelectableUsers().length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/10 bg-[#060a14] text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0"
                  />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono select-none">
                    Select All ({getSelectableUsers().length})
                  </span>
                </div>
              )}

              {/* Pilots */}
              <div className="px-2 py-1 text-[9px] text-[#38bdf8] font-mono uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Pilot
              </div>
              {users.filter(u => u.role === 'pilot').map(u => (
                <button key={u.user_name} onClick={() => selectUser(u)}
                  className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg text-left transition-all ${selected?.user_name === u.user_name ? 'bg-[#38bdf8]/15 border border-[#38bdf8]/25' : 'hover:bg-white/5 border border-transparent'}`}>
                  {u.user_name !== currentPilot && (
                    <input
                      type="checkbox"
                      checked={selectedUsernames.has(u.user_name)}
                      onChange={() => toggleSelectUser(u.user_name)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded border-white/10 bg-[#060a14] text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0"
                    />
                  )}
                  <div className="w-7 h-7 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] flex items-center justify-center text-[10px] font-bold shrink-0">{initials(u)}</div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-semibold truncate">{u.display_name || u.user_name}</div>
                    <div className="text-white/30 text-[10px] font-mono truncate">@{u.user_name}</div>
                  </div>
                </button>
              ))}

              {/* Guests */}
              <div className="px-2 py-1 mt-2 text-[9px] text-[#a855f7] font-mono uppercase tracking-widest flex items-center gap-1">
                <UserCircle className="w-3 h-3" /> Guests · {users.filter(u => u.role !== 'pilot').length}
              </div>
              {loading ? (
                <div className="text-white/25 text-[10px] font-mono px-2 py-4 text-center">Loading...</div>
              ) : users.filter(u => u.role !== 'pilot').length === 0 ? (
                <div className="text-white/20 text-[10px] font-mono px-2 py-4 text-center">No guests yet</div>
              ) : users.filter(u => u.role !== 'pilot').map(u => (
                <button key={u.user_name} onClick={() => selectUser(u)}
                  className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg text-left transition-all ${selected?.user_name === u.user_name ? 'bg-[#a855f7]/15 border border-[#a855f7]/25' : 'hover:bg-white/5 border border-transparent'} ${!u.active ? 'opacity-40' : ''}`}>
                  {u.user_name !== currentPilot && (
                    <input
                      type="checkbox"
                      checked={selectedUsernames.has(u.user_name)}
                      onChange={() => toggleSelectUser(u.user_name)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded border-white/10 bg-[#060a14] text-[#a855f7] focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0"
                    />
                  )}
                  <div className="w-7 h-7 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#a855f7] flex items-center justify-center text-[10px] font-bold shrink-0">{initials(u)}</div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-semibold truncate">{u.display_name || u.user_name}</div>
                    <div className="text-white/30 text-[10px] font-mono truncate">@{u.user_name}</div>
                  </div>
                  {!u.active && <XCircle className="w-3 h-3 text-red-400 shrink-0 ml-auto" />}
                </button>
              ))}
            </div>

            {/* Bulk Action Bar */}
            {selectedUsernames.size > 0 && (
              <div className="p-2 border-t border-white/8 bg-[#0a0f1e]/95 backdrop-blur-md flex flex-col gap-1.5 shrink-0">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-[#38bdf8] font-mono font-bold uppercase tracking-widest">
                    Selected: {selectedUsernames.size}
                  </span>
                  <button onClick={() => setSelectedUsernames(new Set())} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleBulkDeactivate}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-red-400 border border-red-400/20 hover:bg-red-400/10 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all"
                  >
                    <Trash2 className="w-3 h-3" /> Disable
                  </button>
                  <button
                    onClick={handleBulkReactivate}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e]/10 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all"
                  >
                    <CheckCircle className="w-3 h-3" /> Enable
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — sticky profile editor */}
          <div className="flex-1 overflow-y-auto p-5">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-3">
                <Users className="w-10 h-10" />
                <p className="text-sm font-mono">Select a user from the list</p>
              </div>
            ) : (
              <div className="max-w-2xl flex flex-col gap-4">

                {/* Profile header — ServiceNow style */}
                <div className="flex items-start gap-4 pb-4 border-b border-white/8">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border shrink-0 ${isPilot ? 'bg-[#38bdf8]/15 border-[#38bdf8]/30 text-[#38bdf8]' : 'bg-[#a855f7]/15 border-[#a855f7]/30 text-[#a855f7]'}`}>
                    {initials(selected)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-white font-bold text-lg">{selected.display_name || selected.user_name}</h2>
                      <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${isPilot ? 'text-[#38bdf8] border-[#38bdf8]/30 bg-[#38bdf8]/10' : 'text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10'}`}>{selected.role}</span>
                      {!selected.active && <span className="text-[9px] font-mono text-red-400 border border-red-400/30 px-2 py-0.5 rounded-full bg-red-500/5">Inactive</span>}
                    </div>
                    <p className="text-white/35 text-xs font-mono mt-0.5">@{selected.user_name}</p>
                    {selected.title && <p className="text-white/30 text-[11px] mt-1 truncate">{selected.title}</p>}
                  </div>
                  {/* Deactivate/Reactivate (non-pilot only) */}
                  {!isPilot && (
                    selected.active
                      ? <button onClick={handleDeactivate} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-red-400 border border-red-400/20 hover:bg-red-400/10 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all">
                          <Trash2 className="w-3 h-3" /> Deactivate
                        </button>
                      : <button onClick={handleReactivate} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e]/10 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all">
                          <CheckCircle className="w-3 h-3" /> Reactivate
                        </button>
                  )}
                </div>

                {/* ── About section (ServiceNow "About" panel) ── */}
                <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#38bdf8]/8 border-b border-white/8 flex items-center gap-2">
                    <UserCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span className="text-[10px] text-[#38bdf8] font-mono uppercase tracking-widest">About</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={field}>
                      <label className={label}>Display Name</label>
                      <input value={editDisplay} onChange={e => setEditDisplay(e.target.value)}
                        placeholder={selected.user_name} className={input} />
                    </div>
                    <div className={field}>
                      <label className={label}><span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />Email</span></label>
                      <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                        placeholder="user@example.com" className={input} />
                    </div>
                    <div className={field}>
                      <label className={label}>Username</label>
                      <input value={editUsername} onChange={e => setEditUsername(e.target.value)} className={input} />
                    </div>
                    <div className={field}>
                      <label className={label}>Role</label>
                      <select value={editRole} onChange={e => setEditRole(e.target.value)} className={`${input} appearance-none`}>
                        <option value="pilot">pilot</option>
                        <option value="creator">creator</option>
                        <option value="user">user</option>
                        <option value="guest">guest</option>
                      </select>
                    </div>
                    {selected.department && (
                      <div className={field}>
                        <label className={label}>Department</label>
                        <input value={selected.department} disabled className={`${input} opacity-40 cursor-not-allowed`} />
                      </div>
                    )}
                    {selected.city && (
                      <div className={field}>
                        <label className={label}>City</label>
                        <input value={selected.city} disabled className={`${input} opacity-40 cursor-not-allowed`} />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Password section ── */}
                <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#a855f7]/8 border-b border-white/8 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-[#a855f7]" />
                    <span className="text-[10px] text-[#a855f7] font-mono uppercase tracking-widest">
                      {isPilot ? 'Change Password' : 'Reset Password'}
                    </span>
                  </div>
                  <div className="p-4">
                    <PasswordInput value={editPassword} onChange={setEditPassword}
                      placeholder={isPilot ? 'New password (leave blank to keep current)' : 'Set a new password for this user'} />
                  </div>
                </div>

                {/* Status + Save */}
                {panelStatus && (
                  <div className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${panelStatus.type === 'success' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {panelStatus.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {panelStatus.text}
                  </div>
                )}
                <div className="flex justify-end">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#38bdf8] hover:bg-[#0ea5e9] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0f1e] font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE GUEST TAB ── */}
      {tab === 'new' && (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-xl">
            <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#22c55e]/8 border-b border-white/8 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-[#22c55e]" />
                <span className="text-[10px] text-[#22c55e] font-mono uppercase tracking-widest">New Account</span>
              </div>
              <form onSubmit={handleCreateUser} className="p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className={field}>
                    <label className={label}><AtSign className="w-3 h-3 inline mr-1" />Username *</label>
                    <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. fan_mike" className={input} required />
                  </div>
                  <div className={field}>
                    <label className={label}>Display Name</label>
                    <input value={newDisplay} onChange={e => setNewDisplay(e.target.value)} placeholder="e.g. Fan Mike" className={input} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={field}>
                    <label className={label}><Mail className="w-3 h-3 inline mr-1" />Email</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" className={input} />
                  </div>
                  <div className={field}>
                    <label className={label}>Role</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className={`${input} appearance-none`}>
                      <option value="creator">creator</option>
                      <option value="user">user</option>
                      <option value="guest">guest</option>
                    </select>
                  </div>
                </div>
                <div className={field}>
                  <label className={label}><Key className="w-3 h-3 inline mr-1" />Password *</label>
                  <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Temp password (min 8 chars)" />
                </div>
                <p className="text-white/20 text-[10px] font-mono leading-relaxed">Guests are locked to FanStack / MLB domain. No access to Root, Global, ARGUS, or Pilot controls.</p>
                {newStatus && (
                  <div className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${newStatus.type === 'success' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {newStatus.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {newStatus.text}
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  <button type="submit" disabled={creating || !newUsername.trim() || newPassword.length < 8}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-30 disabled:cursor-not-allowed text-[#030a05] font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                    <Plus className="w-3.5 h-3.5" />
                    {creating ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCESS CONTROL TAB ── */}
      {tab === 'rbac' && (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* User Roster Card */}
          <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-[#38bdf8]/8 border-b border-white/8 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#38bdf8]" />
              <span className="text-xs text-[#38bdf8] font-bold font-mono uppercase tracking-widest">User Role & Status Registry</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] text-white/40 uppercase tracking-widest font-mono">
                    <th className="py-2.5 px-3">Display Name</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-center">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {users.map(u => (
                    <tr key={u.user_name} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">{u.display_name || u.user_name}</td>
                      <td className="py-3 px-3 font-mono text-white/60">@{u.user_name}</td>
                      <td className="py-3 px-3 text-white/50">{u.email || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleSetRole(u.user_name, e.target.value)}
                          disabled={u.user_name === currentPilot}
                          className="bg-[#060a14] border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-mono outline-none focus:border-[#38bdf8]/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="pilot">pilot</option>
                          <option value="creator">creator</option>
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
                          className="w-3.5 h-3.5 rounded border-white/10 bg-[#060a14] text-[#38bdf8] focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RBAC Service Matrix Card */}
          <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-[#a855f7]/8 border-b border-white/8 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#a855f7]" />
              <span className="text-xs text-[#a855f7] font-bold font-mono uppercase tracking-widest">Live RBAC Service Invariants Matrix</span>
            </div>
            <div className="p-4 overflow-x-auto">
              {rbacLoading ? (
                <div className="text-white/30 text-xs font-mono text-center py-6">Loading permissions grid...</div>
              ) : (
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-white/8 text-[9px] text-white/40 uppercase tracking-widest font-mono">
                      <th className="py-2.5 px-3">Service Name</th>
                      <th className="py-2.5 px-3 text-center">Port</th>
                      {['pilot', 'creator', 'patron', 'investor', 'vet_client', 'garden_client', 'observer'].map(r => (
                        <th key={r} className="py-2.5 px-3 text-center">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[11px] font-mono">
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
                            <td colSpan={9} className="py-6 text-center text-white/20">No active permissions loaded.</td>
                          </tr>
                        );
                      }

                      return uniqueServices.map(svc => (
                        <tr key={svc.port} className="hover:bg-white/2 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-white/85 font-sans">{svc.service_name}</td>
                          <td className="py-2.5 px-3 text-center text-white/40">{svc.port}</td>
                          {['pilot', 'creator', 'patron', 'investor', 'vet_client', 'garden_client', 'observer'].map(role => {
                            const match = permissions.find(p => p.role === role && p.port === svc.port);
                            const access = match ? match.access_level : 'none';
                            
                            let pillStyle = "bg-white/5 text-white/30 border border-white/5";
                            if (access === 'full') {
                              pillStyle = "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 font-bold";
                            } else if (access === 'read') {
                              pillStyle = "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 font-bold";
                            }
                            
                            return (
                              <td key={role} className="py-2.5 px-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${pillStyle}`}>
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
