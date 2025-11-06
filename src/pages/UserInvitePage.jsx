import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { userService, setorService } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';

export default function UserInvitePage(){
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [setores, setSetores] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ nome_completo: '', email: '', telefone: '' });

  useEffect(()=>{ if (!isAdmin()) navigate('/dashboard'); },[isAdmin, navigate]);
  useEffect(()=>{
    (async()=>{
      try{
        const resp = await setorService.getAll(false);
        setSetores((resp?.data || resp || []).map(s=>({ id: s.id, nome: s.nome })));
      }catch{ /* ignore */ }
    })();
  },[]);

  const onSubmit = async ()=>{
    if(!form.nome_completo || !form.email){ setError('Nome e e-mail são obrigatórios'); return; }
    try{
      setSaving(true); setError(''); setOk('');
      const resp = await userService.invite({ ...form, setores: selected });
      if (resp.success){ setOk('Convite enviado com sucesso.'); setForm({ nome_completo:'', email:'', telefone:'' }); setSelected([]); }
      else setError(resp.message || 'Falha ao enviar convite');
    }catch(e){ setError(e?.message||'Falha ao enviar convite'); }
    finally{ setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={()=>navigate('/usuarios')}><ArrowLeft className="h-4 w-4"/> Voltar</Button>
          <h1 className="text-lg font-semibold">Convidar Usuário</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        {error && <Alert variant="destructive" className="mb-3"><AlertDescription>{error}</AlertDescription></Alert>}
        {ok && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-800">{ok}</div>}
        <Card>
          <CardHeader><CardTitle>Novo Convite</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm block">Nome</label>
              <Input value={form.nome_completo} onChange={e=>setForm({...form, nome_completo:e.target.value})} />
            </div>
            <div>
              <label className="text-sm block">E-mail</label>
              <Input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            </div>
            <div>
              <label className="text-sm block">Telefone</label>
              <Input value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})} />
            </div>
            <div>
              <label className="text-sm block mb-1">Setores (onde pode trabalhar)</label>
              <div className="flex flex-wrap gap-2">
                {setores.map(s=>{
                  const checked = selected.includes(s.id);
                  return (
                    <label key={s.id} className={`px-2 py-1 border rounded text-sm cursor-pointer ${checked? 'bg-blue-50 border-blue-300' : ''}`}>
                      <input type="checkbox" className="mr-1" checked={checked} onChange={()=>{
                        setSelected(prev => checked ? prev.filter(x=>x!==s.id) : [...prev, s.id]);
                      }} />{s.nome}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onSubmit} disabled={saving}>{saving? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Enviando...</> : <><UserPlus className="h-4 w-4 mr-2"/>Enviar Convite</>}</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
