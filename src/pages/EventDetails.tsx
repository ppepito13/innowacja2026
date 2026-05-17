import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Event } from '../types/Event';
import { getMockEvent } from '../services/MockEventService';

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    // In a real app we would fetch by eventId, for now we just use the mock
    const data = getMockEvent();
    setEvent(data);
  }, [eventId]);

  if (!event) {
    return <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b1521] text-white font-sans relative pb-16">
      {/* Top Navbar */}
      <header className="bg-[#1f2937] p-4 flex items-center shadow-md relative z-20">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
          <div className="text-xl font-bold text-white">Logo</div>
        </div>
      </header>

      {/* Hero Image Full Width */}
      <div className="w-full h-[50vh] relative z-0">
        <img
          src={event.heroImageUrl}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        {/* Dark overlay at the bottom to blend with background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b1521]/40 to-[#0b1521]"></div>
      </div>

      {/* Main Content Area overlapping the hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-40">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Column */}
          <section className="w-full lg:w-[60%] bg-[#162436] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-8 md:p-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">{event.title}</h1>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              </div>

              <div
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-sm md:text-base"
                dangerouslySetInnerHTML={{ __html: event.descriptionHtml }}
              />
            </div>
          </section>

          {/* Right Column: Form */}
          <section className="w-full lg:w-[40%] bg-[#162436] rounded-xl shadow-2xl p-8 sticky top-8">
            <h2 className="text-xl font-bold mb-1 text-white">Register Now</h2>
            <p className="text-sm text-gray-400 mb-8">Fill out the form below to secure your spot.</p>

            <form className="flex flex-col gap-6">
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-white mb-2">
                  Full Name <span className="text-red-500">*</span>
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
                  Email Address <span className="text-red-500">*</span>
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
                  Dropdown
                </label>
                <div className="relative w-full box-border">
                  <select
                    id="dropdown"
                    defaultValue=""
                    className="w-full box-border bg-[#24364b] border border-transparent rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none"
                  >
                    <option value="" disabled hidden>Select option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
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
                      style={{ color: event.brandingHexColor, borderColor: event.brandingHexColor }}
                    />
                  </div>
                  <div>
                    <label htmlFor="consent" className="text-sm font-medium text-white cursor-pointer block mb-1">
                      Data Processing Consent <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-300">
                      Read more in <a href="#" className="underline text-gray-200 hover:text-white">terms and conditions</a>.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 -mt-2">* Required field.</p>

              <button
                type="button"
                className="w-full mt-2 py-3 px-4 rounded-md text-[#0b1521] font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: event.brandingHexColor }}
              >
                Register
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}