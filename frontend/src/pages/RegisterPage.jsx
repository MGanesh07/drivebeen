import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to DriveBeen 🎉');
      navigate('/', { replace: true });
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const strength = passwordStrength();
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510] p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-xl">
            <Cloud size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">DriveBeen</h1>
            <p className="text-xs text-violet-400">Create your account</p>
          </div>
        </div>

        <div className="card p-7">
          <h2 className="text-xl font-bold text-white mb-1">Get started free</h2>
          <p className="text-sm text-[#6868a0] mb-6">5GB free storage, no credit card required</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Full Name</label>
              <input className="input-field" placeholder="Alex Johnson" value={form.name} onChange={update('name')} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Email Address</label>
              <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" value={form.password} onChange={update('password')} required />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6868a0] hover:text-white">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-violet-950'}`} />
                  ))}
                  <span className="text-[10px] text-[#6868a0] ml-2 w-12">{strengthLabels[strength]}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type="password" className="input-field pr-10" placeholder="••••••••" value={form.confirm} onChange={update('confirm')} required />
                {form.confirm && form.password === form.confirm && (
                  <Check size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                )}
              </div>
            </div>

            <div className="flex gap-2 items-start mt-1">
              <div className="w-4 h-4 rounded border border-violet-600 bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={10} className="text-violet-400" />
              </div>
              <p className="text-xs text-[#6868a0]">I agree to the <span className="text-violet-400">Terms of Service</span> and <span className="text-violet-400">Privacy Policy</span></p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Create Account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-[#6868a0] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
