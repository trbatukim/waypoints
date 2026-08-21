'use client';

import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import styles from './map.module.css';

type Result = { display_name: string; lat: string; lon: string };

type SearchBoxProps = {
    onSelectResult: (lat: number, lng: number, name: string) => void;
};

export default function SearchBox({ onSelectResult }: SearchBoxProps) {
    const map = useMap();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Result[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (query.trim().length < 3) {
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

    function handleQueryChange(value: string) {
        setQuery(value);
        if (value.trim().length < 3) {
            setResults([]);
        }
    }

    function selectResult(r: Result) {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        map.flyTo([lat, lng], 15);
        onSelectResult(lat, lng, r.display_name.split(',')[0]);
        setQuery(r.display_name);
        setResults([]);
    }

    return (
        <div className={styles.searchBarContainer}>
            <input
                className={styles.searchBar}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search for a place…"
            />

            {results.length > 0 && (
                <ul className={styles.searchResults}>
                    {results.map((r, i) => (
                        <li
                            key={i}
                            onClick={() => selectResult(r)}
                            style={{ padding: '8px 20px', cursor: 'pointer', fontSize: 14 }}
                        >
                            {r.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}