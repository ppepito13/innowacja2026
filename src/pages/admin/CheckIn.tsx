import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseService } from '../../services/parseService';
import { Registration, Event } from '../../types/types';
import Icon from '../../components/Icon';
import { LuDownload, LuChevronDown, LuZap, LuZapOff } from 'react-icons/lu';

import { useScanner } from '../../hooks/useScanner';

// Device vibration feedback
const triggerVibration = (type: 'success' | 'error') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'success') {
      navigator.vibrate(100);
    } else {
      navigator.vibrate([120, 80, 120]);
    }
  }
};

export default function CheckIn() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  
  // Scanner state
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState<{
    toastTitle: string;
    toastBody: string;
    inlineTitle: string;
    inlineBody: string;
  } | null>(null);

  // Recent scans state (last 3 in this session)
  const [recentScans, setRecentScans] = useState<Array<{
    name: string;
    status: 'success' | 'warning' | 'error';
    time: string;
  }>>([]);

  const handleScan = async (decodedText: string) => {
    pauseScanner();

    try {
      const registration = await parseService.getById<Registration>('Registration', decodedText);
      
      if (!registration || registration.status !== 'approved') {
        const errorMsg = registration 
          ? t('checkIn.scanner.error', { name: 'User', message: 'Registration not found or not approved.' })
          : t('checkIn.scanner.error', { name: '', message: 'Registration not found.' });
        
        const cleanMsg = errorMsg.replace(/^:\s*/, '');
        
        setScanStatus('error');
        setScanMessage({
          toastTitle: t('checkIn.scanner.warningTitle'), // "Scan Result"
          toastBody: cleanMsg,
          inlineTitle: t('checkIn.scanner.errorTitle'), // "Scan Failed"
          inlineBody: cleanMsg,
        });

        triggerVibration('error');

        setRecentScans(prev => [
          {
            name: registration ? 'User' : 'Unknown',
            status: 'error' as const,
            time: new Date().toLocaleTimeString(),
          },
          ...prev
        ].slice(0, 3));
      } else {
        const name = (registration.formData?.fullName as string) || (registration.formData?.name as string) || 'Attendee';

        if (registration.checkInTime) {
          const checkInDate = registration.checkInTime instanceof Date
            ? registration.checkInTime
            : new Date(registration.checkInTime.iso ?? registration.checkInTime.date ?? '');
          const timeStr = checkInDate.toLocaleString();
          const warningMsg = t('checkIn.scanner.warning', { name, time: timeStr });
          
          setScanStatus('warning');
          setScanMessage({
            toastTitle: t('checkIn.scanner.warningTitle'), // "Scan Result"
            toastBody: warningMsg,
            inlineTitle: t('checkIn.scanner.errorTitle'), // "Scan Failed"
            inlineBody: warningMsg,
          });

          triggerVibration('error');

          setRecentScans(prev => [
            {
              name,
              status: 'warning' as const,
              time: new Date().toLocaleTimeString(),
            },
            ...prev
          ].slice(0, 3));
        } else {
          await parseService.update<Registration>('Registration', registration.objectId, {
            checkInTime: new Date()
          });
          
          const successMsg = t('checkIn.scanner.success', { name });
          
          setScanStatus('success');
          setScanMessage({
            toastTitle: t('checkIn.scanner.successTitle'), // "Success!"
            toastBody: successMsg,
            inlineTitle: t('checkIn.scanner.successInlineTitle'), // "Check-in Successful!"
            inlineBody: successMsg,
          });

          triggerVibration('success');

          setRecentScans(prev => [
            {
              name,
              status: 'success' as const,
              time: new Date().toLocaleTimeString(),
            },
            ...prev
          ].slice(0, 3));
        }
      }
    } catch (err: any) {
      const errorMsg = t('checkIn.scanner.error', { name: '', message: 'Registration not found.' });
      const cleanMsg = errorMsg.replace(/^:\s*/, '');
      
      setScanStatus('error');
      setScanMessage({
        toastTitle: t('checkIn.scanner.warningTitle'), // "Scan Result"
        toastBody: cleanMsg,
        inlineTitle: t('checkIn.scanner.errorTitle'), // "Scan Failed"
        inlineBody: cleanMsg,
      });

      triggerVibration('error');

      setRecentScans(prev => [
        {
          name: 'Unknown',
          status: 'error' as const,
          time: new Date().toLocaleTimeString(),
        },
        ...prev
      ].slice(0, 3));
    }

    setTimeout(() => {
      setScanMessage(null);
      setScanStatus('idle');
      resumeScanner();
    }, 2500);
  };

  const {
    isScanning,
    hasFlashlight,
    flashlightOn,
    toggleScanner,
    toggleFlashlight,
    pauseScanner,
    resumeScanner,
  } = useScanner(handleScan);

  useEffect(() => {
    parseService.getAll<Event>('TestEvent')
      .then(data => {
        setEvents(data);
        if (data.length > 0 && data[0].objectId) {
          setSelectedEventId(data[0].objectId);
        }
      })
      // eslint-disable-next-line no-console
      .catch(console.error);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c1626] text-white overflow-x-hidden overflow-y-auto flex flex-col items-center">
      {/* Toast Notification */}
      {scanMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl shadow-2xl border toast-enter flex flex-col justify-center w-[90%] max-w-[400px] min-h-[80px]
          ${scanStatus === 'success' ? 'bg-[#0f1b2c] border-[#1e324a]' : ''}
          ${scanStatus === 'warning' || scanStatus === 'error' ? 'bg-[#f05252] border-red-600 text-white' : ''}
        `}>
          <h4 className="font-headline font-bold mb-1 text-base">{scanMessage.toastTitle}</h4>
          <p className="text-sm opacity-90">{scanMessage.toastBody}</p>
        </div>
      )}

      {/* Main Content - Mobile Width Constrained */}
      <main className="w-full max-w-[480px] p-4 sm:p-6 lg:p-8 flex flex-col min-h-full font-sans">
        
        {/* Header Section */}
        <div className="w-full mb-8 pt-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">{t('checkIn.title')}</h1>
          <p className="text-sm text-gray-400 mt-2">{t('checkIn.subtitle')}</p>
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative w-full">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#162436] border border-[#24364b] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none appearance-none font-medium shadow-sm"
            >
              {events.map(ev => (
                <option key={ev.objectId} value={ev.objectId}>{ev.title}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <Icon icon={LuChevronDown} size={16} />
            </div>
          </div>

          <button 
            type="button" 
            className="flex items-center justify-center gap-2 w-full bg-[#162436] border border-[#24364b] rounded-xl px-4 py-3.5 text-sm text-white hover:bg-[#1e2e40] transition-colors shadow-sm font-medium"
          >
            <Icon icon={LuDownload} size={16} />
            {t('checkIn.export')}
          </button>
        </div>

        {/* Tabs Container */}
        <div className="flex bg-[#24364b] rounded-xl mb-6 p-1 shadow-sm shrink-0 font-sans">
          <button 
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-3 text-sm transition-all font-semibold rounded-lg
              ${activeTab === 'qr' ? 'bg-[#0b1521] text-white shadow-md' : 'text-gray-400 hover:text-gray-300'}`}
          >
            {t('checkIn.tabs.qrScanner')}
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-sm transition-all font-semibold rounded-lg
              ${activeTab === 'manual' ? 'bg-[#0b1521] text-white shadow-md' : 'text-gray-400 hover:text-gray-300'}`}
          >
            {t('checkIn.tabs.manual')}
          </button>
        </div>

        {/* Scanner Area */}
        {activeTab === 'qr' && (
          <div className="flex-1 bg-[#162436] border border-[#24364b] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col mb-6">
            
            <div className="w-full text-left mb-6">
              <h2 className="text-xl font-bold mb-1">{t('checkIn.scanner.title')}</h2>
              <p className="text-sm text-gray-400">{t('checkIn.scanner.description')}</p>
            </div>

            <div className="flex justify-center mb-6">
              <button
                onClick={toggleScanner}
                className={`py-3 px-8 rounded-xl font-bold text-sm transition-all shadow-md
                  ${isScanning 
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50' 
                    : 'bg-[#fbbd23] text-black hover:bg-[#fbbd23]/90'
                  }
                `}
              >
                {isScanning ? t('checkIn.scanner.stop') : t('checkIn.scanner.start')}
              </button>
            </div>

            {/* QR Video Area with Glowing/Pulsing Borders */}
            <div className={`w-full relative bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center border aspect-square transition-all duration-300
              ${scanStatus === 'success' ? 'border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.35)]' : ''}
              ${scanStatus === 'warning' || scanStatus === 'error' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]' : ''}
              ${scanStatus === 'idle' && isScanning ? 'border-[#24364b] shadow-[0_0_15px_rgba(36,54,75,0.25)]' : 'border-[#24364b]'}
            `}>
              <div id="qr-reader" className="w-full h-full flex items-center justify-center"></div>
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <p className="text-sm font-medium">Camera is off.</p>
                </div>
              )}

              {/* Flashlight/Torch Trigger Button */}
              {isScanning && hasFlashlight && (
                <button
                  type="button"
                  onClick={toggleFlashlight}
                  className={`absolute top-4 right-4 p-3 rounded-full transition-all shadow-lg backdrop-blur-md border z-10
                    ${flashlightOn 
                      ? 'bg-yellow-400 text-black border-yellow-500 scale-110 shadow-yellow-500/20' 
                      : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                    }
                  `}
                >
                  <Icon icon={flashlightOn ? LuZap : LuZapOff} size={18} />
                </button>
              )}
            </div>
            
            {/* Scan Result Box shown below video */}
            {scanMessage && (
              <div className={`w-full mt-6 p-4 rounded-xl border transition-all duration-300 scale-in
                ${scanStatus === 'success' ? 'bg-[#0b1521] border-[#24364b]' : ''}
                ${scanStatus === 'warning' || scanStatus === 'error' ? 'bg-[#0b1521] border-red-500/70' : ''}
              `}>
                <h4 className={`font-bold mb-1 text-sm
                  ${scanStatus === 'success' ? 'text-white' : ''}
                  ${scanStatus === 'warning' || scanStatus === 'error' ? 'text-red-500' : ''}
                `}>{scanMessage.inlineTitle}</h4>
                <p className={`text-sm
                  ${scanStatus === 'success' ? 'text-gray-300' : ''}
                  ${scanStatus === 'warning' || scanStatus === 'error' ? 'text-red-500' : ''}
                `}>{scanMessage.inlineBody}</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Scans Session Log */}
        {activeTab === 'qr' && recentScans.length > 0 && (
          <div className="w-full bg-[#162436]/40 border border-[#24364b]/40 rounded-2xl p-5 shadow-lg scale-in mb-8">
            <h3 className="text-xs font-bold text-gray-400 mb-3 tracking-wider uppercase">Ostatnie skanowania</h3>
            <div className="flex flex-col gap-2.5">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between bg-[#0b1521]/60 px-4 py-3 rounded-xl border border-[#24364b]/20">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      scan.status === 'success' ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]' : 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]'
                    }`} />
                    <span className="text-sm font-medium text-white truncate max-w-[200px]">{scan.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{scan.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Check-in Placeholder */}
        {activeTab === 'manual' && (
          <div className="flex-1 bg-[#162436] border border-[#24364b] rounded-2xl p-6 shadow-xl text-center py-16 text-gray-400 flex flex-col items-center justify-center mb-8">
            <p>Manual check-in feature coming soon.</p>
          </div>
        )}
      </main>

    </div>
  );
}