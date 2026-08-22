'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L, { type LatLng } from 'leaflet';
import styles from './map.module.css';

export const PIN_DRAG_DATA_TYPE = 'application/x-waypoints-new-pin';

export type Pin = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    created_by: string;
};

export type Opinion = {
    rating: number;
    note: string;
};

type PinsLayerProps = {
    pins: Pin[];
    opinions: Record<string, Opinion>;
    onAddPin: (lat: number, lng: number, name: string) => void;
    onDeletePin: (id: string) => void;
    onSaveOpinion: (placeId: string, rating: number, review: string) => void;
};

const STAR_PATH = 'M12 2.5l2.97 6.28 6.91.68-5.15 4.75 1.44 6.79L12 17.27l-6.17 3.73 1.44-6.79-5.15-4.75 6.91-.68L12 2.5z';

function StarRating({
    idPrefix,
    value,
    onChange,
}: {
    idPrefix: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => {
                const fill = Math.min(1, Math.max(0, value - (star - 1)));
                const clipId = `${idPrefix}-star-${star}`;

                return (
                    <button
                        key={star}
                        type="button"
                        className={styles.starButton}
                        aria-label={`Rate ${star} stars`}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickedLeftHalf = e.clientX - rect.left < rect.width / 2;
                            onChange(clickedLeftHalf ? star - 0.5 : star);
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d={STAR_PATH} fill="none" stroke="currentColor" strokeWidth="1.5" />
                            <clipPath id={clipId}>
                                <rect x="0" y="0" width={24 * fill} height="24" />
                            </clipPath>
                            <path d={STAR_PATH} fill="currentColor" clipPath={`url(#${clipId})`} />
                        </svg>
                    </button>
                );
            })}
        </div>
    );
}

function PinPopup({
    pin,
    opinion,
    onDeletePin,
    onSaveOpinion,
}: {
    pin: Pin;
    opinion?: Opinion;
    onDeletePin: (id: string) => void;
    onSaveOpinion: (placeId: string, rating: number, review: string) => void;
}) {
    const [rating, setRating] = useState(opinion?.rating ?? 0);
    const [review, setReview] = useState(opinion?.note ?? '');

    useEffect(() => {
        if (opinion) {
            setRating(opinion.rating);
            setReview(opinion.note);
        }
    }, [opinion]);

    function saveOpinion() {
        if (rating === 0) return;
        onSaveOpinion(pin.id, rating, review.trim());
    }

    return (
        <div className={styles.pinPopup}>
            <span className={styles.pinName}>{pin.name}</span>

            <StarRating idPrefix={pin.id} value={rating} onChange={setRating} />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    saveOpinion();
                }}
            >
                <textarea
                    className={styles.reviewArea}
                    placeholder="Enter your review here..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                <button type="submit" className={styles.reviewSaveButton} aria-label="Save review">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 407.096 407.096"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M402.115,84.008L323.088,4.981C319.899,1.792,315.574,0,311.063,0H17.005C7.613,0,0,7.614,0,17.005v373.086 c0,9.392,7.613,17.005,17.005,17.005h373.086c9.392,0,17.005-7.613,17.005-17.005V96.032 C407.096,91.523,405.305,87.197,402.115,84.008z M300.664,163.567H67.129V38.862h233.535V163.567z" />
                        <path d="M214.051,148.16h43.08c3.131,0,5.668-2.538,5.668-5.669V59.584c0-3.13-2.537-5.668-5.668-5.668h-43.08 c-3.131,0-5.668,2.538-5.668,5.668v82.907C208.383,145.622,210.92,148.16,214.051,148.16z" />
                    </svg>
                </button>
            </form>

            <button className={styles.pinDeleteButton} onClick={() => onDeletePin(pin.id)}>
                Delete
            </button>
        </div>
    );
}

export default function PinsLayer({ pins, opinions, onAddPin, onDeletePin, onSaveOpinion }: PinsLayerProps) {
    const [draft, setDraft] = useState<LatLng | null>(null);
    const [draftName, setDraftName] = useState('');
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();

        function handleDragOver(e: DragEvent) {
            if (!e.dataTransfer?.types.includes(PIN_DRAG_DATA_TYPE)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }

        function handleDrop(e: DragEvent) {
            if (!e.dataTransfer?.types.includes(PIN_DRAG_DATA_TYPE)) return;
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const point = L.point(e.clientX - rect.left, e.clientY - rect.top);
            setDraft(map.containerPointToLatLng(point));
            setDraftName('');
        }

        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        return () => {
            container.removeEventListener('dragover', handleDragOver);
            container.removeEventListener('drop', handleDrop);
        };
    }, [map]);

    function saveDraft() {
        if (!draft || draftName.trim().length === 0) return;
        onAddPin(draft.lat, draft.lng, draftName.trim());
        setDraft(null);
    }

    return (
        <>
            {pins.map((pin) => (
                <Marker key={pin.id} position={[pin.lat, pin.lng]}>
                    <Popup className={styles.pinContainer}>
                        <PinPopup
                        pin={pin}
                        opinion={opinions[pin.id]}
                        onDeletePin={onDeletePin}
                        onSaveOpinion={onSaveOpinion}
                        />
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
