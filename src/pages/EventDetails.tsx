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
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      {/* Header section */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Logo</div>
          {/* Navigation or other header elements */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Image Section */}
        <section className="mb-12 rounded-xl overflow-hidden h-64 md:h-96 relative bg-gray-800 shadow-2xl">
          <img
            src={event.heroImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Content */}
          <section className="flex flex-col gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{event.title}</h1>
              <div className="flex flex-col sm:flex-row gap-4 text-gray-300 text-lg mb-6">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 rounded-2xl p-8 shadow-lg backdrop-blur-sm border border-gray-700/50">
              <div
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: event.descriptionHtml }}
              />
            </div>
          </section>

          {/* Right Column: Form */}
          <section>
            <div className="bg-gray-800/80 rounded-2xl p-8 shadow-xl border border-gray-700/50 sticky top-8">
              <h2 className="text-2xl font-bold mb-6 text-white">Register Now</h2>
              <form className="flex flex-col gap-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="dropdown" className="block text-sm font-medium text-gray-300 mb-1">Dropdown</label>
                  <div className="relative">
                    <select
                      id="dropdown"
                      defaultValue=""
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors appearance-none"
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

                <div className="flex items-start gap-3 mt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="consent"
                      type="checkbox"
                      className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                    />
                  </div>
                  <label htmlFor="consent" className="text-sm text-gray-400 leading-tight cursor-pointer">
                    I consent to the processing of my personal data for the purpose of event registration and communication.
                  </label>
                </div>

                <button
                  type="button"
                  className="w-full mt-4 py-3 px-4 rounded-lg text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-indigo-500 hover:bg-indigo-600"
                >
                  Submit Registration
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}