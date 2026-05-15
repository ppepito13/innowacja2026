import { useEffect, useState } from 'react';
import { parseService, ParseObject } from '../services/parseService';

function Test() {
    const [events, setEvents] = useState<ParseObject[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        parseService.getAll('TestEvent')
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