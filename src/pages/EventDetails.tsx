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
            <div className="bg-gray-800/50 rounded-xl p-8 min-h-[400px]">
              Form Area Placeholder
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}