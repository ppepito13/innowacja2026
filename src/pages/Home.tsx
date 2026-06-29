import { useEffect, useState } from 'react';
import { LuCircleAlert } from 'react-icons/lu';
import Icon from '../components/Icon';
import { Link } from '@lsg/components';
import { useTranslation } from 'react-i18next';
import { parseService } from '../services/parseService';
import { Event } from '../types/types';

export default function Home() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    parseService
      .getAll<Event>('TestEvent')
      .then((data) => {
        setEvents(data.filter((e) => e.isActive));
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col items-center w-full bg-background min-h-screen">
      <section className="relative w-full overflow-hidden bg-brand px-6 py-28 flex flex-col items-center text-center">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute top-1/4 right-1/3 w-56 h-56 rounded-full bg-white/5 blur-2xl" />

        <span className="relative mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-secondary backdrop-blur-sm">
          Commerzbank Łódź
        </span>

        <h1 className="relative max-w-4xl text-5xl font-extrabold leading-tight sm:text-6xl md:text-7xl bg-gradient-to-r from-white via-white to-secondary bg-clip-text text-transparent">
          {t('home.heroTitle')}
        </h1>

        <p className="relative mt-6 max-w-xl text-lg text-white/70 sm:text-xl">
          {t('home.heroSubtitle')}
        </p>
      </section>

      <section className="relative z-10 w-full max-w-6xl px-6 pb-24 -mt-16">
        <div className="rounded-3xl bg-background px-16 py-2">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary sm:text-4xl" id="events">
            {t('home.activeEvents')}
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-primary/70">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/15 border-t-secondary" />
              <p className="font-medium">{t('home.loading')}</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-error">
              <Icon icon={LuCircleAlert} size={40} />
              <p className="font-medium">{t('home.loadError')}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="py-16 text-center text-primary/60">
              <p className="text-lg">{t('home.noEvents')}</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Link
                  key={event.objectId}
                  href={`/events/${event.objectId}`}
                  className="group overflow-hidden rounded-3xl bg-surface shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                >
                  <div className="relative h-48 overflow-hidden bg-primary/5">
                    {event.heroImageUrl ? (
                      <img
                        src={event.heroImageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-primary/40">
                        {t('home.noImage')}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-secondary via-yellow-300 to-secondary" />
                  </div>

                  <div className="p-6">
                    <h3 className="mb-2 line-clamp-1 text-lg font-bold text-primary">
                      {event.title}
                    </h3>
                    <p
                      className="line-clamp-3 text-sm text-primary/60"
                      dangerouslySetInnerHTML={{ __html: event.description || '' }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
