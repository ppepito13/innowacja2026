import { useEffect, useState } from 'react';
import { parseService } from '../services/parseService';
import { Event } from '../types/types';

function Test() {
    const [events, setEvents] = useState<Event[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        parseService.getAll<Event>('TestEvent')
            .then(setEvents)
            .catch(err => setError(err.message));
    }, []);

    if (error) return <p>Błąd: {error}</p>;

    return (
        <div>
            <h1>TestEvent — lista obiektów</h1>
            {events.length === 0
                ? <p>Brak obiektów.</p>
                : <pre>{JSON.stringify(events, null, 2)}</pre>
            }
        </div>
    );
}

export default Test;