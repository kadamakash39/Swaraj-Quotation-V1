import { useState, FormEvent } from 'react';
import { KeyRound, ShieldCheck, User, Eye, EyeOff, Building, Sparkles } from 'lucide-react';
import { ERPUser } from '../types';

interface LoginProps {
  users: ERPUser[];
  onLoginSuccess: (user: ERPUser) => void;
  companyName: string;
  companyLogo: string;
}

export default function Login({ users, onLoginSuccess, companyName, companyLogo }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both your operator username and access password.');
      return;
    }

    // Direct case-insensitive comparison for user comfort, accommodating "V@123" request
    const matchedUser = users.find(u => {
      const uLower = u.username.toLowerCase();
      const inputLower = username.trim().toLowerCase();
      
      // Let "V" also log in to "Viewer" role as requested "V@123"
      if (uLower === 'viewer' && inputLower === 'v') return true;
      
      return uLower === inputLower;
    });

    if (!matchedUser) {
      setErrorMsg('No registered operator account found under this username.');
      return;
    }

    if (matchedUser.passwordHash !== password.trim()) {
      setErrorMsg('Incorrect log-in access password passcode.');
      return;
    }

    onLoginSuccess(matchedUser);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Visual background atmospheric premium lighting elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-sm space-y-6 z-10 transition duration-300">
        
        {/* Brand visual box */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 shadow-sm">
            {companyLogo ? (
              <img src={companyLogo} alt="Corporate Logo" className="w-12 h-12 object-contain" />
            ) : (
              <Building className="w-9 h-9 text-blue-400" />
            )}
          </div>
          
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white uppercase font-display flex items-center justify-center gap-1.5 leading-none">
              {companyName} <span className="text-[9px] text-blue-400 border border-blue-500/30 px-1 py-0.5 rounded uppercase font-black tracking-normal">ERP Portal</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold tracking-wider">Secure Access Authentication Console</p>
          </div>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/60 p-6 shadow-xl space-y-4">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded p-2.5 text-[10.5px] font-bold leading-relaxed">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" /> Username
              </label>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Admin or Akash"
                className="w-full border border-slate-700 bg-slate-900/60 rounded p-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-slate-500" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password or PIN"
                  className="w-full border border-slate-700 bg-slate-900/60 rounded p-2 pr-9 text-xs font-semibold font-mono text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-650"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-blue-500/15"
            >
              Sign In to Swaraj ERP
            </button>
            
          </form>

        </div>

        {/* Prompt Help Panel with preseeded users for comfortable testing */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Operator Access Guide:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500 font-semibold uppercase leading-snug">
            <div className="p-1.5 rounded bg-slate-800/40 border border-slate-800/50">
              <span className="text-red-400 block font-bold">Admin (All Rights)</span>
              <span>Admin / 944360</span>
            </div>
            <div className="p-1.5 rounded bg-slate-800/40 border border-slate-800/50">
              <span className="text-purple-400 block font-bold">Gen Manager (All)</span>
              <span>Amar / Amar@$123</span>
            </div>
            <div className="p-1.5 rounded bg-slate-800/40 border border-slate-800/50">
              <span className="text-amber-400 block font-bold">Accountant (Own)</span>
              <span>Akash / Akash@123</span>
            </div>
            <div className="p-1.5 rounded bg-slate-800/40 border border-slate-800/50">
              <span className="text-indigo-400 block font-bold">Designer (Own)</span>
              <span>Aniket / Aniket@321</span>
            </div>
            <div className="p-1.5 rounded bg-slate-800/40 border border-slate-800/50">
              <span className="text-blue-400 block font-bold">Sales (Own)</span>
              <span>Shubham / Shubham@789</span>
            </div>
            <div className="p-1.5 rounded bg-slate-800/40 border border-slate-800/50">
              <span className="text-slate-400 block font-bold">Viewer (ReadOnly)</span>
              <span>V / V@123</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
