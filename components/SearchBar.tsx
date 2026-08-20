'use client';

import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

type Result = { display_name: string; lat: string; lon: string };

export default function SearchBox() {
    const map = useMap();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Result[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (query.trim().length < 3) {
            setResults([]);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await res.json();
            setResults(data);
        }, 600); // stays comfortably under the 1 req/sec limit
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    function selectResult(r: Result) {
        map.flyTo([parseFloat(r.lat), parseFloat(r.lon)], 15);
        setQuery(r.display_name);
        setResults([]);
    }

    return (
        <div style={{ position: 'absolute', top: 10, left: 50, zIndex: 1000, width: 300 }}>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a place…"
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
            />
            {results.length > 0 && (
                <ul style={{ background: 'black', borderRadius: 8, marginTop: 4, listStyle: 'none', padding: 4 }}>
                    {results.map((r, i) => (
                        <li
                            key={i}
                            onClick={() => selectResult(r)}
                            style={{ padding: 6, cursor: 'pointer', fontSize: 14 }}
                        >
                            {r.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}