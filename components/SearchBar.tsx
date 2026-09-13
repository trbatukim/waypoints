'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './map.module.css';

type Result = { place_id: number; display_name: string; lat: string; lon: string };

type SearchBoxProps = {
    onSelectResult: (lat: number, lng: number, name: string) => void;
};

function splitName(displayName: string) {
    const [primary, ...rest] = displayName.split(',');
    return { primary: primary.trim(), secondary: rest.join(',').trim() };
}

export default function SearchBox({ onSelectResult }: SearchBoxProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Result[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const selectedQueryRef = useRef<string | null>(null);

    useEffect(() => {
        if (query.trim().length < 3 || query === selectedQueryRef.current) {
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
        selectedQueryRef.current = null;
        setQuery(value);
        if (value.trim().length < 3) {
            setResults([]);
        }
    }

    function selectResult(r: Result) {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        onSelectResult(lat, lng, splitName(r.display_name).primary);
        selectedQueryRef.current = r.display_name;
        setQuery(r.display_name);
        setResults([]);
    }

    function clear() {
        selectedQueryRef.current = null;
        setQuery('');
        setResults([]);
    }

    return (
        <div className={styles.search}>
            <div className={styles.searchField}>
                <svg
                    className={styles.searchIcon}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                </svg>

                <input
                    className={styles.searchInput}
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setResults([]);
                    }}
                    placeholder="Search for a place…"
                    aria-label="Search for a place"
                />

                {query.length > 0 && (
                    <button type="button" className={styles.searchClear} aria-label="Clear search" onClick={clear}>
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                )}
            </div>

            {results.length > 0 && (
                <ul className={styles.searchResults}>
                    {results.map((r) => {
                        const { primary, secondary } = splitName(r.display_name);

                        return (
                            <li key={r.place_id}>
                                <button type="button" className={styles.searchResult} onClick={() => selectResult(r)}>
                                    <span className={styles.searchResultPrimary}>{primary}</span>
                                    {secondary && (
                                        <span className={styles.searchResultSecondary}>{secondary}</span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
