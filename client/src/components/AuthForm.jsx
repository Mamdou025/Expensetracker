import React, { useState } from 'react';
import { Brand, BrandLine, I } from '../ui/BrandIcon';
import { useAuth } from '../contexts/AuthContext';

const AuthForm = ({ initialMode = 'login', onSuccess }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ email: email.trim(), password, firstName: firstName.trim() || undefined });
      } else {
        await login(email.trim(), password);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Une erreur s'est produite");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 max-w-md w-full">
      <div className="flex items-center gap-1 mb-5 bg-gray-800 rounded-lg p-1">
        <button
          type="button"
          onClick={() => { setMode('login'); setError(null); }}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            !isRegister ? 'nav-active' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Se connecter
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError(null); }}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isRegister ? 'nav-active' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Créer un compte
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isRegister && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Nom (facultatif)</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Votre nom"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Courriel</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="vous@exemple.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Mot de passe {isRegister && <span className="text-gray-500 font-normal">(min. 8 caractères)</span>}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-800 bg-red-900/20 text-red-300 text-xs px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {submitting ? (
            <BrandLine name={I.loading} size={16} className="animate-spin" style={{ color: '#fff' }} />
          ) : isRegister ? (
            <BrandLine name={I.userPlus} size={16} style={{ color: '#fff' }} />
          ) : (
            <BrandLine name={I.login} size={16} style={{ color: '#fff' }} />
          )}
          {submitting
            ? (isRegister ? 'Création du compte…' : 'Connexion…')
            : (isRegister ? 'Créer un compte' : 'Se connecter')}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
