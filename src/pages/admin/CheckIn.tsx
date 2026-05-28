import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { parseService } from '../../services/parseService';
import { Registration, Event } from '../../types/types';
import Icon from '../../components/Icon';
import { LuDownload, LuChevronDown } from 'react-icons/lu';

// Assuming we use html5-qrcode once it's installed
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

export default function CheckIn() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  
  // Scanner state
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState<{ title: string; body: string } | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Fetch all events for the dropdown
    parseService.getAll<Event>('TestEvent')
      .then(data => {
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].objectId);
        }
      })
      .catch(console.error);
  }, []);

  const handleScan = async (decodedText: string) => {
    // Stop scanner temporarily or keep scanning?
    // According to AC: "Po wykryciu poprawnego kodu QR, system automatycznie wysyła zapytanie..."
    try {
      const registration = await parseService.getById<Registration>('Registration', decodedText);
      
      if (!registration || registration.status !== 'approved') {
        setScanStatus('error');
        setScanMessage({
          title: t('checkIn.scanner.errorTitle'),
          body: t('checkIn.scanner.error', { 
            name: registration ? 'User' : '', 
            message: 'Registration not found or not approved.' 
          }).replace(/^:\s*/, '')
        });
        return;
      }

      // We need a name to display. Form data could have name or username.
      const name = registration.formData?.fullName || registration.formData?.name || 'Attendee';

      if (registration.checkInTime) {
        // Already checked in
        const checkInDate = new Date(registration.checkInTime);
        const timeStr = checkInDate.toLocaleString();
        setScanStatus('warning');
        setScanMessage({
          title: t('checkIn.scanner.warningTitle'),
          body: t('checkIn.scanner.warning', { name, time: timeStr })
        });
      } else {
        // Not checked in, let's check them in!
        await parseService.update<Registration>('Registration', registration.objectId, {
          checkInTime: new Date()
        });
        setScanStatus('success');
        setScanMessage({
          title: t('checkIn.scanner.successTitle'),
          body: t('checkIn.scanner.success', { name })
        });
      }

    } catch (err: any) {
      setScanStatus('error');
      setScanMessage({
        title: t('checkIn.scanner.errorTitle'),
        body: t('checkIn.scanner.error', { name: '', message: 'Registration not found.' }).replace(/^:\s*/, '')
      });
    }
  };

  // Setup Scanner
  useEffect(() => {
    if (activeTab === 'qr') {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
        false
      );
      
      scanner.render(
        (text) => handleScan(text),
        (error) => { /* ignore normal scanning errors */ }
      );
      
      scannerRef.current = scanner;
      
      return () => {
        scanner.clear().catch(console.error);
      };
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#0b1521] text-white font-sans flex flex-col items-center p-4">
      
      {/* Toast Notification */}
      {scanMessage && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg border-l-4
          ${scanStatus === 'success' ? 'bg-[#162436] border-green-500' : ''}
          ${scanStatus === 'warning' ? 'bg-[#162436] border-yellow-500' : ''}
          ${scanStatus === 'error' ? 'bg-red-500 border-red-700 text-white' : ''}
        `}>
          <h4 className="font-bold mb-1">{scanMessage.title}</h4>
          <p className="text-sm opacity-90">{scanMessage.body}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-md mt-16">
        <h1 className="text-2xl font-bold mb-2">{t('checkIn.title')}</h1>
        <p className="text-sm text-gray-400 mb-6">{t('checkIn.subtitle')}</p>

        {/* Dropdown and Export */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative w-full box-border">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full box-border bg-[#162436] border border-gray-700/50 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 appearance-none"
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
            className="flex items-center justify-center gap-2 w-full bg-[#162436] border border-gray-700/50 rounded-md px-4 py-3 text-sm hover:bg-[#1e2e40] transition-colors"
          >
            <Icon icon={LuDownload} size={16} />
            {t('checkIn.export')} <Icon icon={LuChevronDown} size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#162436] rounded-md p-1 mb-6">
          <button 
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${activeTab === 'qr' ? 'bg-[#24364b] font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            {t('checkIn.tabs.qrScanner')}
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${activeTab === 'manual' ? 'bg-[#24364b] font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            {t('checkIn.tabs.manual')}
          </button>
        </div>

        {/* Scanner Card */}
        {activeTab === 'qr' && (
          <div className="bg-[#162436] border border-gray-700/50 rounded-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-2">{t('checkIn.scanner.title')}</h2>
            <p className="text-sm text-gray-400 mb-6">{t('checkIn.scanner.description')}</p>

            <div className="bg-[#0b1521] rounded-lg overflow-hidden mb-6 min-h-[250px] flex items-center justify-center relative">
              <div id="qr-reader" className="w-full h-full text-black"></div>
            </div>

            {/* Scan Result Box */}
            {scanMessage && (
              <div className={`p-4 rounded-xl border mt-4
                ${scanStatus === 'success' ? 'bg-[#0b1521] border-gray-700/50' : ''}
                ${scanStatus === 'warning' ? 'bg-[#0b1521] border-yellow-500 text-yellow-500' : ''}
                ${scanStatus === 'error' ? 'bg-[#0b1521] border-red-500 text-red-500' : ''}
              `}>
                <h4 className={`font-bold mb-1
                  ${scanStatus === 'success' ? 'text-white' : ''}
                `}>{scanMessage.title}</h4>
                <p className={`text-sm
                  ${scanStatus === 'success' ? 'text-gray-300' : ''}
                `}>{scanMessage.body}</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Check-in Placeholder */}
        {activeTab === 'manual' && (
          <div className="bg-[#162436] border border-gray-700/50 rounded-xl p-6 shadow-2xl text-center py-12 text-gray-400">
            Manual check-in feature coming soon.
          </div>
        )}

      </div>
    </div>
  );
}