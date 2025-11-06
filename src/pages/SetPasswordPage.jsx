import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { signupService } from '../services/api';

export default function SetPasswordPage(){
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e)=>{
    e.preventDefault();
    if (!token) { setError('Token inválido'); return; }
    if (senha !== confirmar) { setError('As senhas não coincidem'); return; }
    try{
      setSaving(true); setError('');
      const resp = await signupService.setPasswordWithToken(token, senha);
      if (resp.success){
        navigate('/login', { replace: true });
      } else {
        setError(resp.message || 'Falha ao definir senha');
      }
    }catch(e){ setError(e?.message||'Falha ao definir senha'); }
    finally{ setSaving(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded border w-full max-w-sm">
        <h1 className="text-lg font-semibold mb-2">Definir Senha</h1>
        <p className="text-sm text-gray-600 mb-4">Crie sua senha para acessar o sistema.</p>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="block text-sm mb-1">Senha</label>
        <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} className="border rounded w-full p-2 mb-3" />
        <label className="block text-sm mb-1">Confirmar senha</label>
        <input type="password" value={confirmar} onChange={e=>setConfirmar(e.target.value)} className="border rounded w-full p-2 mb-4" />
        <button disabled={saving} className="bg-blue-600 text-white px-3 py-2 rounded w-full">{saving? 'Salvando...' : 'Salvar senha'}</button>
      </form>
    </div>
  );
}
