import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuCircleCheck, LuCircleX, LuLoader, LuTriangleAlert } from 'react-icons/lu';
import parseClient from '../services/parseClient';

type UnregisterState =
  | 'loading'
  | 'confirm'
  | 'submitting'
  | 'success'
  | 'alreadyCancelled'
  | 'error';

const UnregisterConfirm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [state, setState] = useState<UnregisterState>('loading');
  const [eventTitle, setEventTitle] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchInfo = async () => {
      try {
        const res = await parseClient.post('/functions/getUnregisterInfo', { token });
        if (!isMounted) return;

        if (res.data.result.status === 'cancelled') {
          setState('alreadyCancelled');
        } else {
          setEventTitle(res.data.result.eventTitle ?? '');
          setState('confirm');
        }
      } catch {
        if (isMounted) setState('error');
      }
    };

    fetchInfo();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleConfirm = async () => {
    setState('submitting');
    try {
      const res = await parseClient.post('/functions/unregisterParticipant', { token });
      setState(res.data.result.alreadyCancelled ? 'alreadyCancelled' : 'success');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-md p-8 text-center">
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-primary/60">
            {LuLoader({ className: 'w-8 h-8 animate-spin' }) as React.ReactElement}
            <p>{t('unregister.loading')}</p>
          </div>
        )}

        {state === 'confirm' && (
          <div className="flex flex-col items-center gap-4">
            {LuTriangleAlert({ className: 'w-10 h-10 text-warning' }) as React.ReactElement}
            <h1 className="text-lg font-bold text-primary">
              {t('unregister.confirmQuestion', { eventTitle })}
            </h1>
            <button
              onClick={handleConfirm}
              className="w-full rounded-lg bg-cb-error text-cb-white py-2.5 font-book hover:bg-cb-error/85 transition-colors mt-2"
            >
              {t('unregister.confirmButton')}
            </button>
          </div>
        )}

        {state === 'submitting' && (
          <div className="flex flex-col items-center gap-3 text-primary/60">
            {LuLoader({ className: 'w-8 h-8 animate-spin' }) as React.ReactElement}
            <p>{t('unregister.submitting')}</p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-3">
            {LuCircleCheck({ className: 'w-10 h-10 text-success' }) as React.ReactElement}
            <h1 className="text-lg font-bold text-primary">{t('unregister.success')}</h1>
          </div>
        )}

        {state === 'alreadyCancelled' && (
          <div className="flex flex-col items-center gap-3">
            {LuCircleCheck({ className: 'w-10 h-10 text-primary/40'}) as React.ReactElement}
            <h1 className="text-lg font-bold text-primary">
              {t('unregister.alreadyCancelled')}
            </h1>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-3">
            {LuCircleX({ className: 'w-10 h-10 text-error' }) as React.ReactElement}
            <h1 className="text-lg font-bold text-primary">{t('unregister.invalidToken')}</h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnregisterConfirm;
