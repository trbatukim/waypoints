'use client';

import { useState } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import styles from './map.module.css';

export type Pin = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    created_by: string;
};

type PinsLayerProps = {
    pins: Pin[];
    onAddPin: (lat: number, lng: number, name: string) => void;
    onDeletePin: (id: string) => void;
};

export default function PinsLayer({ pins, onAddPin, onDeletePin }: PinsLayerProps) {
    const [draft, setDraft] = useState<LatLng | null>(null);
    const [draftName, setDraftName] = useState('');

    useMapEvents({
        click(e) {
            setDraft(e.latlng);
            setDraftName('');
        },
    });

    function saveDraft() {
        if (!draft || draftName.trim().length === 0) return;
        onAddPin(draft.lat, draft.lng, draftName.trim());
        setDraft(null);
    }

    return (
        <>
            {pins.map((pin) => (
                <Marker key={pin.id} position={[pin.lat, pin.lng]}>
                    <Popup>
                        <div className={styles.pinPopup}>
                            <span className={styles.pinName}>{pin.name}</span>
                            <button
                                className={styles.pinDeleteButton}
                                onClick={() => onDeletePin(pin.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {draft && (
                <Popup
                    position={draft}
                    eventHandlers={{ remove: () => setDraft(null) }}
                >
                    <form
                        className={styles.pinPopupForm}
                        onSubmit={(e) => {
                            e.preventDefault();
                            saveDraft();
                        }}
                    >
                        <input
                            autoFocus
                            className={styles.pinPopupInput}
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="Name this pin…"
                        />
                    </form>
                </Popup>
            )}
        </>
    );
}
