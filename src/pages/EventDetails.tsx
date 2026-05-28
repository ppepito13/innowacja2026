import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Event } from '../types/types';
import { parseService } from '../services/parseService';
import { LuCalendarDays, LuMapPin, LuChevronDown } from 'react-icons/lu';
import Icon from '../components/Icon';

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!eventId) return;
    parseService.getById<Event>('TestEvent', eventId).then(setEvent);
  }, [eventId]);

  if (!event) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        {t('eventDetails.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1521] text-white font-sans relative pb-16">
      <header className="bg-[#1f2937] p-4 flex items-center shadow-md relative z-20">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
          <div className="text-xl font-bold text-white">Logo</div>
        </div>
      </header>

      <div className="w-full h-[50vh] relative z-0">
        <img src={event.heroImageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b1521]/40 to-[#0b1521]"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-40">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <section className="w-full lg:w-[60%] bg-[#162436] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-8 md:p-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Icon icon={LuCalendarDays} size={16} />
                  <span>{event.startDate.date?.toString()}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <Icon icon={LuMapPin} size={16} />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              <div
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-sm md:text-base"
                dangerouslySetInnerHTML={{ __html: event.description || '' }}
              />
            </div>
          </section>

          <section className="w-full lg:w-[40%] bg-[#162436] rounded-xl shadow-2xl p-8 sticky top-8">
            <h2 className="text-xl font-bold mb-1 text-white">{t('eventDetails.registerNow')}</h2>
            <p className="text-sm text-gray-400 mb-8">{t('eventDetails.fillForm')}</p>

            <form className="flex flex-col gap-6">
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-white mb-2">
                  {t('eventDetails.fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  className="w-full box-border bg-[#24364b] border border-transparent rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-white mb-2">
                  {t('eventDetails.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full box-border bg-[#24364b] border border-transparent rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label htmlFor="dropdown" className="block text-xs font-bold text-white mb-2">
                  {t('eventDetails.dropdown')}
                </label>
                <div className="relative w-full box-border">
                  <select
                    id="dropdown"
                    defaultValue=""
                    className="w-full box-border bg-[#24364b] border border-transparent rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none"
                  >
                    <option value="" disabled hidden>
                      {t('eventDetails.selectOption')}
                    </option>
                    <option value="option1">{t('eventDetails.option1')}</option>
                    <option value="option2">{t('eventDetails.option2')}</option>
                    <option value="option3">{t('eventDetails.option3')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <Icon icon={LuChevronDown} size={16} />
                  </div>
                </div>
              </div>

              <div className="bg-[#1e2e40] border border-gray-600/50 rounded-md p-4 mt-2">
                <div className="flex items-start gap-3">
                  <div className="flex items-center mt-1">
                    <input
                      id="consent"
                      type="checkbox"
                      className="w-4 h-4 rounded-full border border-gray-500 bg-[#162436] focus:ring-0 cursor-pointer appearance-none checked:bg-current"
                      style={{ color: event.primaryColor, borderColor: event.accentColor }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="consent"
                      className="text-sm font-medium text-white cursor-pointer block mb-1"
                    >
                      {t('eventDetails.dataConsent')} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-300">
                      {t('eventDetails.readMoreIn')}{' '}
                      <a href="#terms" className="underline text-gray-200 hover:text-white">
                        {t('eventDetails.termsAndConditions')}
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 -mt-2">* {t('eventDetails.requiredField')}</p>

              <button
                type="button"
                className="w-full mt-2 py-3 px-4 rounded-md text-[#0b1521] font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: event.accentColor }}
              >
                {t('eventDetails.register')}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
