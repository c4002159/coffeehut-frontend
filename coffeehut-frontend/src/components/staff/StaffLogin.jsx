import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

const HERO_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCaSaE_ht4FOQFnIV2yZR8OwH_TAvQ9cyi5TwTWDqHNDAboLQuC-BH2s8hgiQP4Up3dZg5VycqNU7GLiqFvq-I30okA17i4r8PML_jI0TU4qFvsBqTc2QH5cxfEkjLCgYXkjsGqBgKt5OuNs1HQrTusuQJ1qFT5-I0kz-bF0lQrsM93uETVVTHXSLnE-dDmflPyChtfRK5Dv5yVJ7jK2SnAFEsP1T60jTWzT5a3YP0ic38K8dyBRJhVci3qoRgraSPmTKzZoMFjrM8";

export default function StaffLogin({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            if (rememberMe) localStorage.setItem('staff', 'true');
            else sessionStorage.setItem('staff', 'true');

            if (onLoginSuccess) onLoginSuccess();
            navigate('/dashboard');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background-light">
            <div className="bg-white p-4 pb-2 text-center border-b border-primary/5">
                <h2 className="text-primary text-lg font-bold uppercase tracking-widest">Whistlestop Coffee Hut</h2>
            </div>
            <div className="px-4 py-3">
                <div className="w-full h-64 bg-center bg-cover rounded-xl relative overflow-hidden shadow-lg" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                </div>
            </div>
            <div className="flex-1 px-4 pt-8 pb-12">
                <h2 className="text-3xl font-bold text-center mb-2">Staff Portal</h2>
                <p className="text-slate-600 text-center mb-8">Please sign in to access your dashboard</p>
                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-semibold text-primary mb-2 ml-1 text-left">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 size-5" />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@whistlestop.com" className="w-full h-14 pl-12 pr-4 bg-white border border-primary/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-primary mb-2 ml-1 text-left">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 size-5" />
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-14 pl-12 pr-12 bg-white border border-primary/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/50">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded text-primary focus:ring-primary border-primary/20" />
                            <span className="text-sm text-slate-600">Remember me</span>
                        </label>
                        <button type="button" onClick={() => alert('重置密码链接已发送（演示）')} className="text-sm font-semibold text-primary hover:underline">Forgot password?</button>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-6 active:scale-95 transition-transform">
                        {loading ? 'Signing in...' : 'Sign In'} <LogIn className="size-5" />
                    </button>
                </form>
                <p className="text-sm text-slate-500 text-center mt-12">
                    Need help? Contact the <button onClick={() => alert('请联系 support@whistlestop.com')} className="text-primary font-medium hover:underline">Support Team</button>
                </p>
            </div>
        </div>
    );
}