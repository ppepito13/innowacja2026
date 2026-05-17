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
        {/* Hero Image Section Structure */}
        <section className="mb-12 rounded-xl overflow-hidden h-64 md:h-96 relative bg-gray-800">
          {/* We will render the hero image here in step 3 */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Hero Image Placeholder
          </div>
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Content */}
          <section className="flex flex-col gap-6">
            <div className="bg-gray-800/50 rounded-xl p-8 min-h-[300px]">
               Content Area Placeholder
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