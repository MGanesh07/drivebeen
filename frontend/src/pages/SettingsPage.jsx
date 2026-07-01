import { useState } from 'react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import SuccessOverlay from '../components/SuccessOverlay';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

/* ── Password field with eye toggle ── */
function PasswordField({ label, value, onChange, disabled, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6868a0] mb-1.5">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={visible ? 'text' : 'password'}
          className={clsx('input-field', disabled && 'opacity-75 cursor-not-allowed')}
          style={{ paddingRight: '40px' }}
          value={value}
          onChange={onChange}
          placeholder={placeholder || '••••••••'}
          disabled={disabled}
        />
        {!disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            style={{
              position: 'absolute', right: '12px', top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted, #94a3b8)', display: 'flex', padding: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#7c3aed'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; }}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [originalName, setOriginalName] = useState(user?.name || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Security
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Shared
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  // Success/Error overlay
  const [overlay, setOverlay] = useState(null); // { variant, title, message }

  /* ── Profile save ── */
  const saveProfile = async () => {
    if (saving) return;
    if (!name.trim()) {
      setNameError('Full name is required. Please enter your name.');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile({ name: name.trim() });
      updateUser(data.user);
      setOriginalName(data.user.name);
      setIsEditingProfile(false);
      setOverlay({
        variant: 'profile',
        title: 'Profile Updated Successfully',
        message: 'Your profile information has been saved successfully.',
      });
    } catch (e) {
      setOverlay({
        variant: 'error',
        title: 'Update Failed',
        message: e.response?.data?.message || 'Failed to update your profile. Please try again.',
      });
    } finally { setSaving(false); }
  };

  /* ── Password update ── */
  const handlePasswordUpdate = async () => {
    if (saving) return;
    if (!currentPwd || !newPwd || !confirmPwd) {
      setOverlay({ variant: 'error', title: 'Fields Required', message: 'Please fill in all password fields to continue.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setOverlay({ variant: 'error', title: 'Password Mismatch', message: 'New password and confirm password do not match.' });
      return;
    }
    if (newPwd.length < 6) {
      setOverlay({ variant: 'error', title: 'Password Too Short', message: 'Password must be at least 6 characters long.' });
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setIsEditingPassword(false);
      setOverlay({
        variant: 'password',
        title: 'Password Changed Successfully',
        message: 'Your password has been updated successfully. Your session remains active.',
      });
    } catch (e) {
      setOverlay({
        variant: 'error',
        title: 'Update Failed',
        message: e.response?.data?.message || 'Failed to update password. Please verify your current password.',
      });
    } finally { setSaving(false); }
  };

  const cancelProfileEdit = () => { setName(originalName); setIsEditingProfile(false); setNameError(''); };
  const cancelPasswordEdit = () => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setIsEditingPassword(false); };
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Full-screen success/error overlay */}
      <SuccessOverlay
        open={!!overlay}
        onClose={() => setOverlay(null)}
        variant={overlay?.variant || 'generic'}
        title={overlay?.title || ''}
        message={overlay?.message || ''}
        autoCloseDuration={overlay?.variant === 'error' ? 0 : 2800}
        autoClose={overlay?.variant !== 'error'}
      />

      <div className="space-y-5 animate-slide-up" style={{ maxWidth: '772px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-900/10 flex items-center justify-center">
            <User size={18} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Settings</h1>
            <p className="text-xs text-[#6868a0]">Manage your account and preferences</p>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="flex gap-5 justify-center">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  tab === id
                    ? 'bg-violet-900/10 text-violet-600 border border-violet-800/10 font-bold'
                    : 'text-[#6868a0] hover:text-slate-800 hover:bg-violet-900/5'
                )}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Content card */}
          <div className="flex-1" style={{ maxWidth: '560px' }}>
            {/* ── Profile Tab ── */}
            {tab === 'profile' && (
              <div className="card p-6 space-y-5">
                <h2 className="text-base font-semibold text-slate-800">Profile Information</h2>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-[#6868a0]">{user?.email}</p>
                    <p className="text-[10px] text-violet-500 mt-1">
                      Member since {new Date(user?.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6868a0] mb-1.5">Full Name</label>
                  <input
                    className={clsx('input-field', !isEditingProfile && 'opacity-75 cursor-not-allowed', nameError && 'border-red-400 focus:border-red-400')}
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameError(''); }}
                    placeholder="Your Name"
                    disabled={!isEditingProfile}
                  />
                  {nameError && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <span style={{ fontSize: '11px' }}>⚠</span> {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6868a0] mb-1.5">Email Address</label>
                  <input
                    className="input-field opacity-60 cursor-not-allowed"
                    value={user?.email || ''}
                    disabled
                  />
                  <p className="text-[10px] text-[#6868a0] mt-1">Email cannot be changed</p>
                </div>

                <div className="flex gap-3 pt-2">
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="btn-primary"
                      style={{ width: '160px', justifyContent: 'center' }}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="btn-primary disabled:opacity-50"
                        style={{ width: '160px', justifyContent: 'center' }}
                      >
                        {saving
                          ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Saving...</span>
                          : 'Save Changes'}
                      </button>
                      <button onClick={cancelProfileEdit} disabled={saving} className="btn-ghost" style={{ width: '100px', justifyContent: 'center' }}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Security Tab ── */}
            {tab === 'security' && (
              <div className="card p-6 space-y-5">
                <h2 className="text-base font-semibold text-slate-800">Change Password</h2>

                <PasswordField label="Current Password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} disabled={!isEditingPassword} />
                <PasswordField label="New Password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} disabled={!isEditingPassword} />
                <PasswordField label="Confirm New Password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} disabled={!isEditingPassword} />

                <div className="flex gap-3 pt-2">
                  {!isEditingPassword ? (
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="btn-primary"
                      style={{ width: '180px', justifyContent: 'center' }}
                    >
                      Change Password
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handlePasswordUpdate}
                        disabled={saving}
                        className="btn-primary disabled:opacity-50"
                        style={{ width: '160px', justifyContent: 'center' }}
                      >
                        {saving
                          ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Updating...</span>
                          : 'Save Changes'}
                      </button>
                      <button onClick={cancelPasswordEdit} disabled={saving} className="btn-ghost" style={{ width: '100px', justifyContent: 'center' }}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
