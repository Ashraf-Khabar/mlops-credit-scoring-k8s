'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ShieldCheck, LogOut, Loader2, UserPlus, LogIn } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:8000' });

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, approval_rate: 0 });
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && savedToken !== 'fake-jwt' && savedToken !== 'null') {
      setToken(savedToken);
      fetchStats(savedToken);
    } else {
      localStorage.removeItem('token');
    }
  }, []);

  const fetchStats = async (jwt: string) => {
    try {
      const res = await api.get('/statistics', {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      setStats(res.data);
    } catch (error) {
      logout();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLoginView) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await api.post('/token', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const jwt = res.data.access_token;
        localStorage.setItem('token', jwt);
        setToken(jwt);
        fetchStats(jwt);
      } else {
        await api.post('/register', { username, password });
        setIsLoginView(true);
        setError('Compte créé avec succès. Connectez-vous.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsername('');
    setPassword('');
  };

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="p-8 bg-white rounded-xl shadow-lg w-96">
          <div className="text-center mb-6">
            <ShieldCheck className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
            <h1 className="text-2xl font-bold">CreditPro AI</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLoginView ? 'Connectez-vous à votre espace' : 'Créez un nouveau compte'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Utilisateur</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                required 
              />
            </div>
            
            {error && (
              <p className={`text-sm text-center ${error.includes('succès') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {error}
              </p>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold transition-all flex justify-center items-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLoginView ? 'Se connecter' : "S'inscrire")}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <button 
              onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center w-full"
            >
              {isLoginView ? (
                <><UserPlus className="w-4 h-4 mr-2" /> Créer un compte</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" /> J'ai déjà un compte</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Activity className="mr-3 text-indigo-600" /> Vue d'ensemble
          </h1>
          <button onClick={logout} className="flex items-center text-rose-500 hover:text-rose-700 font-medium px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors">
            <LogOut className="w-5 h-5 mr-2" /> Déconnexion
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 font-medium uppercase tracking-wider text-sm">Dossiers Analysés</p>
            <p className="text-4xl font-bold text-slate-800 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 font-medium uppercase tracking-wider text-sm">Taux d'approbation</p>
            <p className="text-4xl font-bold text-emerald-600 mt-2">{stats.approval_rate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}