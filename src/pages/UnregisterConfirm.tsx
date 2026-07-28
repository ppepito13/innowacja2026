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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            {LuLoader({ className: 'w-8 h-8 animate-spin' }) as React.ReactElement}
            <p>{t('unregister.loading')}</p>
          </div>
        )}

        {state === 'confirm' && (
          <div className="flex flex-col items-center gap-4">
            {LuTriangleAlert({ className: 'w-10 h-10 text-amber-500' }) as React.ReactElement}
            <h1 className="text-lg font-semibold text-gray-900">
              {t('unregister.confirmQuestion', { eventTitle })}
            </h1>
            <button
              onClick={handleConfirm}
              className="w-full rounded-lg bg-red-600 text-white py-2.5 font-medium hover:bg-red-700 transition-colors mt-2"
            >
              {t('unregister.confirmButton')}
            </button>
          </div>
        )}

        {state === 'submitting' && (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            {LuLoader({ className: 'w-8 h-8 animate-spin' }) as React.ReactElement}
            <p>{t('unregister.submitting')}</p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-3">
            {LuCircleCheck({ className: 'w-10 h-10 text-green-600' }) as React.ReactElement}
            <h1 className="text-lg font-semibold text-gray-900">{t('unregister.success')}</h1>
          </div>
        )}

        {state === 'alreadyCancelled' && (
          <div className="flex flex-col items-center gap-3">
            {LuCircleCheck({ className: 'w-10 h-10 text-gray-400'}) as React.ReactElement}
            <h1 className="text-lg font-semibold text-gray-900">
              {t('unregister.alreadyCancelled')}
            </h1>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-3">
            {LuCircleX({ className: 'w-10 h-10 text-red-600' }) as React.ReactElement}
            <h1 className="text-lg font-semibold text-gray-900">{t('unregister.invalidToken')}</h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnregisterConfirm;
