import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, Eye, EyeOff, ArrowRight, ArrowLeft, Check, X, AlertTriangle } from 'lucide-react';

/* ─── Custom Alert Dialog ──────────────────────────────────── */
function AlertDialog({ title, message, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff', borderRadius: '20px',
          padding: '32px 28px', maxWidth: '400px', width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          textAlign: 'center',
          animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <AlertTriangle size={28} style={{ color: '#ef4444' }} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
          {title || 'Login Failed'}
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 26px', lineHeight: 1.65 }}>
          {message}
        </p>
        <button
          onClick={onClose}
          autoFocus
          style={{
            background: '#7c3aed', color: '#ffffff', border: 'none',
            borderRadius: '12px', padding: '11px 36px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/* ─── Main Auth Page (sliding) ─────────────────────────────── */
export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // 'signup' = show sign-up first, 'signin' = show sign-in first (default)
  const [panel, setPanel] = useState('signin');
  const [animating, setAnimating] = useState(false);

  // Sign-in form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPwd, setSignInPwd] = useState('');
  const [showSignInPwd, setShowSignInPwd] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertTitle, setAlertTitle] = useState(null);
  const signInEmailRef = useRef(null);
  const signUpNameRef = useRef(null);
  const containerRef = useRef(null);

  // Sign-up form state
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false); // NOT checked by default
  const [showPwd, setShowPwd] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  const update = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const switchTo = (target) => {
    if (animating || panel === target) return;
    setAnimating(true);
    setPanel(target);
    setTimeout(() => setAnimating(false), 500);
  };

  /* ── Login ── */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInLoading(true);
    try {
      await login(signInEmail, signInPwd);
      navigate('/recent', { replace: true });
    } catch (err) {
      const serverMsg = err.response?.data?.message || '';
      let title, msg;

      if (serverMsg === 'WRONG_PASSWORD') {
        // Email exists in DB but password is incorrect
        title = 'Wrong Password';
        msg = 'The password you entered is incorrect. Please check your password and try again.';
      } else {
        // Email not found or any other login failure
        title = 'Invalid Email and Password';
        msg = 'The email address or password you entered is invalid. Please check your credentials and try again.';
      }

      // Clear both fields and re-focus email
      setSignInEmail('');
      setSignInPwd('');
      setAlertTitle(title);
      setAlertMsg(msg);
    } finally {
      setSignInLoading(false);
    }
  };

  const closeAlert = () => {
    setAlertMsg(null);
    setAlertTitle(null);
    setTimeout(() => {
      if (panel === 'signin') {
        signInEmailRef.current?.focus();
      } else {
        signUpNameRef.current?.focus();
      }
    }, 50);
  };

  /* ── Register ── */
  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = passwordStrength();
  const strengthColors = ['', '#ef4444', '#f59e0b', '#eab308', '#10b981'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setAlertTitle('Terms Required');
      setAlertMsg('Please accept the Terms of Service and Privacy Policy to create your account.');
      return;
    }
    if (form.password !== form.confirm) {
      setAlertTitle('Passwords Do Not Match');
      setAlertMsg('The passwords you entered do not match. Please re-enter your password.');
      return;
    }
    if (form.password.length < 6) {
      setAlertTitle('Password Too Short');
      setAlertMsg('Your password must be at least 6 characters long. Please choose a stronger password.');
      return;
    }
    setSignUpLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/recent', { replace: true });
    } catch (err) {
      setAlertTitle('Registration Failed');
      setAlertMsg(err.response?.data?.message || 'Unable to create account. Please try again.');
    } finally {
      setSignUpLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────── */
  /* Layout: two full-height panels side-by-side in a container  */
  /* The whole inner strip slides left/right                      */
  /* ─────────────────────────────────────────────────────────── */
  const slideTo = panel === 'signin' ? '-50%' : '0%';

  return (
    <>
      {alertMsg && (
        <AlertDialog title={alertTitle} message={alertMsg} onClose={closeAlert} />
      )}

      <div style={{
        minHeight: '100vh', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 50%, #f1f5f9 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Sliding container: 200% wide, contains both panels */}
        <div
          ref={containerRef}
          onScroll={(e) => { e.currentTarget.scrollLeft = 0; }}
          style={{
            width: '900px', maxWidth: '95vw',
            borderRadius: '24px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Inner strip — 200% wide, slides */}
          <div style={{
            display: 'flex',
            width: '200%',
            transform: `translateX(${slideTo})`,
            transition: 'transform 0.5s cubic-bezier(0.77, 0, 0.18, 1)',
            willChange: 'transform',
          }}>

            {/* ── Slide 0: Sign Up (default) ─────────────────── */}
            <div style={{ width: '50%', display: 'flex', minHeight: '640px', flexShrink: 0 }}>
              {/* Left welcome panel */}
              <div style={{
                width: '42%', flexShrink: 0, padding: '48px 40px',
                background: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 60%, #6d28d9 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cloud size={20} color="#ffffff" />
                  </div>
                  <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>DriveBeen</span>
                </div>

                {/* Center text */}
                <div style={{ position: 'relative' }}>
                  <h2 style={{ color: '#ffffff', fontSize: '26px', fontWeight: 800, lineHeight: 1.3, margin: '0 0 12px' }}>
                    Welcome Back!
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', lineHeight: 1.7, margin: '0 0 28px' }}>
                    Sign in to continue accessing your files, folders, and cloud storage.
                  </p>
                  <button
                    onClick={() => switchTo('signin')}
                    style={{
                      border: '2px solid rgba(255,255,255,0.6)', background: 'transparent',
                      color: '#ffffff', borderRadius: '12px', padding: '10px 28px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Sign In <ArrowLeft size={14} />
                  </button>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', position: 'relative' }}>
                  © 2025 DriveBeen
                </p>
              </div>

              {/* Right: Sign Up form */}
              <div style={{
                flex: 1, background: '#ffffff', padding: '48px 44px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                overflowY: 'auto',
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Create Account</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 28px' }}>5 GB free · No credit card required</p>

                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Enter Your Name</label>
                    <input
                      ref={signUpNameRef}
                      className="input-field"
                      placeholder="Your Name"
                      value={form.name}
                      onChange={update('name')}
                      required
                      style={{ marginTop: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Enter Your Email Address</label>
                    <input type="email" className="input-field" placeholder="Mail ID" value={form.email} onChange={update('email')} required style={{ marginTop: '6px' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Enter Your Password</label>
                    <div style={{ position: 'relative', marginTop: '6px' }}>
                      <input type={showPwd ? 'text' : 'password'} className="input-field pr-10" placeholder="Your Password" value={form.password} onChange={update('password')} required />
                      <button type="button" onClick={() => setShowPwd(s => !s)} style={eyeBtnStyle}>
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.password && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px', alignItems: 'center' }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '9999px', background: i <= strength ? strengthColors[strength] : '#e2e8f0', transition: 'background 0.3s' }} />
                        ))}
                        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px', width: '32px' }}>{strengthLabels[strength]}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm Password</label>
                    <div style={{ position: 'relative', marginTop: '6px' }}>
                      <input type="password" className="input-field pr-10" placeholder="Confirm Password" value={form.confirm} onChange={update('confirm')} required />
                      {form.confirm && form.password === form.confirm && (
                        <Check size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
                      )}
                    </div>
                  </div>

                  {/* Checkbox — UNCHECKED by default */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <button
                      type="button"
                      onClick={() => setAgreed(a => !a)}
                      style={{
                        width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
                        border: agreed ? '2px solid #7c3aed' : '2px solid #cbd5e1',
                        background: agreed ? '#7c3aed' : '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      {agreed && <Check size={11} color="#ffffff" />}
                    </button>
                    <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                      I agree to the{' '}
                      <span style={{ color: '#7c3aed', cursor: 'pointer' }}>Terms of Service</span>{' '}
                      and <span style={{ color: '#7c3aed', cursor: 'pointer' }}>Privacy Policy</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={signUpLoading || !agreed}
                    onMouseEnter={e => {
                      if (!signUpLoading && agreed) {
                        e.currentTarget.style.background = '#6d28d9';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.3)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#7c3aed';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    style={{
                      ...submitBtnStyle,
                      opacity: signUpLoading || !agreed ? 0.6 : 1,
                      cursor: signUpLoading || !agreed ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {signUpLoading
                      ? <div style={spinnerStyle} />
                      : <><span>Create Account</span></>
                    }
                  </button>
                </form>


              </div>
            </div>

            {/* ── Slide 1: Sign In ────────────────────────────── */}
            <div style={{ width: '50%', display: 'flex', minHeight: '640px', flexShrink: 0 }}>
              {/* Left: Sign In form */}
              <div style={{
                flex: 1, background: '#ffffff', padding: '48px 44px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Sign In</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 28px' }}>Welcome back to your cloud drive</p>

                <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Enter Your Email Address</label>
                    <input
                      ref={signInEmailRef}
                      type="email"
                      className="input-field"
                      placeholder="Mail ID"
                      value={signInEmail}
                      onChange={e => setSignInEmail(e.target.value)}
                      required
                      style={{ marginTop: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Enter Your Password</label>
                    <div style={{ position: 'relative', marginTop: '6px' }}>
                      <input
                        type={showSignInPwd ? 'text' : 'password'}
                        className="input-field pr-10"
                        placeholder="Your Password"
                        value={signInPwd}
                        onChange={e => setSignInPwd(e.target.value)}
                        required
                      />
                      <button type="button" onClick={() => setShowSignInPwd(s => !s)} style={eyeBtnStyle}>
                        {showSignInPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signInLoading}
                    onMouseEnter={e => {
                      if (!signInLoading) {
                        e.currentTarget.style.background = '#6d28d9';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.3)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#7c3aed';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    style={{
                      ...submitBtnStyle,
                      opacity: signInLoading ? 0.65 : 1,
                      cursor: signInLoading ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {signInLoading
                      ? <div style={spinnerStyle} />
                      : <span>Sign In</span>
                    }
                  </button>
                </form>

              </div>

              {/* Right welcome panel */}
              <div style={{
                width: '42%', flexShrink: 0, padding: '48px 40px',
                background: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 60%, #6d28d9 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cloud size={20} color="#ffffff" />
                  </div>
                  <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>DriveBeen</span>
                </div>

                <div style={{ position: 'relative' }}>
                  <h2 style={{ color: '#ffffff', fontSize: '26px', fontWeight: 800, lineHeight: 1.3, margin: '0 0 12px' }}>
                    Hello, Friend!
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', lineHeight: 1.7, margin: '0 0 28px' }}>
                    New here? Create a free account to start storing and managing your files in the cloud.
                  </p>
                  <button
                    onClick={() => switchTo('signup')}
                    style={{
                      border: '2px solid rgba(255,255,255,0.6)', background: 'transparent',
                      color: '#ffffff', borderRadius: '12px', padding: '10px 28px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Sign Up <ArrowRight size={14} />
                  </button>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', position: 'relative' }}>
                  © 2025 DriveBeen
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Shared inline style objects ─────────────────────────── */
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151',
};
const eyeBtnStyle = {
  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
  display: 'flex', transition: 'color 0.15s',
};
const submitBtnStyle = {
  background: '#7c3aed', color: '#ffffff', border: 'none',
  borderRadius: '12px', padding: '12px 24px',
  fontSize: '14px', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  width: '180px', alignSelf: 'flex-start', transition: 'background 0.2s ease',
};
const spinnerStyle = {
  width: '16px', height: '16px',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff', borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
};
const linkBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#7c3aed', fontWeight: 600, fontSize: '13px',
  textDecoration: 'underline',
};
