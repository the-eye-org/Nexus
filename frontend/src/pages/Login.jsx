import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isSignup) {
      if (!username.trim() || !password) {
        setError('Please enter username and password.');
        return;
      }
      const ok = await login(username.trim(), password);
      if (ok) {
        navigate('/', { replace: true });
      } else {
        setError('Invalid username or password.');
      }
      return;
    }

    // Signup flow
    if (!newUsername.trim() || !newPassword) {
      setError('Please enter username and password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const res = await register(newUsername.trim(), newPassword);
    if (res?.success) {
      navigate('/', { replace: true });
    } else {
      setError(res?.message || 'Unable to register.');
    }
  };

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden bg-marvel-black flex items-center justify-center px-4 selection:bg-marvel-red selection:text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-marvel-red/10 via-marvel-black to-marvel-black opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vh] bg-marvel-red/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(237,29,36,0.1)] border border-white/10 backdrop-blur-xl">
          <div className="text-center mb-8">
            <p className="font-general-sans text-xs uppercase tracking-[0.2em] text-marvel-red mb-2">
              S.H.I.E.L.D. RESTRICTED ACCESS
            </p>
            <h1 className="special-font uppercase text-white leading-none text-5xl sm:text-6xl">
              <b>Nexus</b> <b>Portal</b>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="special-font text-2xl uppercase text-white/60 mb-3 tracking-wider">
                <b>Agent ID</b>
              </label>
              <input
                id="username"
                type="text"
                value={isSignup ? newUsername : username}
                onChange={(e) => (isSignup ? setNewUsername(e.target.value) : setUsername(e.target.value))}
                autoComplete="username"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-white placeholder-white/20 focus:border-marvel-red focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-marvel-red transition-all"
                placeholder="ENTER_ID"
              />
            </div>
            <div>
              <label htmlFor="password" className="special-font text-2xl uppercase text-white/60 mb-3 tracking-wider">
                <b>Passcode</b>
              </label>
              <input
                id="password"
                type="password"
                value={isSignup ? newPassword : password}
                onChange={(e) => (isSignup ? setNewPassword(e.target.value) : setPassword(e.target.value))}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-white placeholder-white/20 focus:border-marvel-red focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-marvel-red transition-all"
                placeholder="••••••••"
              />
            </div>
            {isSignup && (
              <div>
                <label htmlFor="confirm" className="special-font text-2xl uppercase text-white/60 mb-2 tracking-wider"><b>Confirm Passcode</b></label>
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-white placeholder-white/20 focus:border-marvel-red focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-marvel-red transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-marvel-red/10 border border-marvel-red/20">
                <p className="font-general-sans text-xs text-marvel-red text-center tracking-wide">{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full group relative overflow-hidden rounded-lg bg-marvel-red px-7 py-3.5 font-general-sans text-sm uppercase font-bold text-white transition-all hover:bg-marvel-red-dark hover:shadow-[0_0_20px_rgba(237,29,36,0.4)]"
            >
              <span className="relative z-10">{isSignup ? 'Create Agent' : 'Authenticate'}</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-white/20 transition-transform duration-300 skew-x-12" />
            </button>
          </form>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <p className="text-start w-full font-circular-web text-sm text-white/40 flex-1">
              <button
                onClick={() => { setIsSignup((s) => !s); setError(''); }}
                className="underline hover:text-white transition-colors text-left"
                type="button"
              >
                {isSignup ? 'Have an account? Sign in' : "Don't have an account? Create one"}
              </button>
            </p>
            <p className="text-right">
              <Link to="/" className="hover:text-white transition-colors flex items-center justify-center gap-1 group text-sm text-white/40">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Base
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
