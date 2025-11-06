import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { signupService } from '../services/api';

export default function ConfirmSignupPage(){
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Confirmando seu cadastro...');
  const [error, setError] = useState('');

  useEffect(()=>{
    (async()=>{
      const token = params.get('token');
      if(!token){ setError('Token inválido'); return; }
      try{
        const resp = await signupService.confirm(token);
        if (resp.success && resp.setPasswordUrl){
          // redireciona para página de definir senha desta aplicação
          const url = new URL(resp.setPasswordUrl);
          navigate(`/definir-senha?token=${url.searchParams.get('token')}`, { replace: true });
        } else {
          setError('Não foi possível confirmar.');
        }
      }catch(e){ setError(e?.message||'Falha ao confirmar'); }
      finally{ setStatus(''); }
    })();
  },[]);

  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="text-red-600">{error}</div></div>;
  return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-700">{status}</div></div>;
}
