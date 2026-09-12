'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L, { type LatLng } from 'leaflet';
import styles from './map.module.css';
import OpinionCard, { averageRating, type Opinion, type PlaceOpinion } from './Opinion';
import { StarDisplay, StarRating } from './Stars';

export const PIN_DRAG_DATA_TYPE = 'application/x-waypoints-new-pin';

export type Pin = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    created_by: string;
};

type PinsLayerProps = {
    pins: Pin[];
    userId: string | null;
    opinions: Record<string, Opinion>;
    placeOpinions: Record<string, PlaceOpinion[]>;
    onAddPin: (lat: number, lng: number, name: string) => void;
    onDeletePin: (id: string) => void;
    onSaveOpinion: (placeId: string, rating: number, review: string) => void;
    onLoadOpinions: (placeId: string) => void;
};

function PinPopup({
    pin,
    userId,
    opinion,
    placeOpinions,
    onDeletePin,
    onSaveOpinion,
    onLoadOpinions,
}: {
    pin: Pin;
    userId: string | null;
    opinion?: Opinion;
    placeOpinions?: PlaceOpinion[];
    onDeletePin: (id: string) => void;
    onSaveOpinion: (placeId: string, rating: number, review: string) => void;
    onLoadOpinions: (placeId: string) => void;
}) {
    const [rating, setRating] = useState(opinion?.rating ?? 0);
    const [review, setReview] = useState(opinion?.note ?? '');
    const [editing, setEditing] = useState(false);
    const [prevOpinion, setPrevOpinion] = useState(opinion);

    useEffect(() => {
        onLoadOpinions(pin.id);
    }, [pin.id, onLoadOpinions]);

    if (opinion !== prevOpinion) {
        setPrevOpinion(opinion);
        if (opinion) {
            setRating(opinion.rating);
            setReview(opinion.note);
        }
    }

    const reviews = placeOpinions ?? [];
    const average = averageRating(reviews);
    const ratedCount = reviews.filter((placeOpinion) => placeOpinion.rating > 0).length;
    const hasOwnReview = userId !== null && reviews.some((placeOpinion) => placeOpinion.userId === userId);

    function saveOpinion() {
        if (rating === 0) return;
        onSaveOpinion(pin.id, rating, review.trim());
        setEditing(false);
    }

    function cancelEdit() {
        setRating(opinion?.rating ?? 0);
        setReview(opinion?.note ?? '');
        setEditing(false);
    }

    return (
        <div className={styles.pinPopup} onClick={(e) => e.stopPropagation()}>
            <span className={styles.pinName}>{pin.name}</span>

            {average === null ? (
                <span className={styles.ratingEmpty}>No ratings yet</span>
            ) : (
                <div className={styles.ratingSummary}>
                    <StarDisplay
                        idPrefix={`average-${pin.id}`}
                        value={average}
                        label={`Average rating ${average.toFixed(1)} out of 5 stars`}
                    />
                    <span className={styles.ratingValue}>{average.toFixed(1)}</span>
                    <span className={styles.ratingCount}>
                        ({ratedCount} {ratedCount === 1 ? 'rating' : 'ratings'})
                    </span>
                </div>
            )}

            {!editing && (
                <>
                    {reviews.length > 0 && (
                        <ul className={styles.opinionList}>
                            {reviews.map((placeOpinion) => (
                                <li key={placeOpinion.id}>
                                    <OpinionCard
                                        opinion={placeOpinion}
                                        isOwn={placeOpinion.userId === userId}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    {userId && (
                        <button type="button" className={styles.reviewEditButton} onClick={() => setEditing(true)}>
                            {hasOwnReview ? 'Edit your review' : 'Write a review'}
                        </button>
                    )}
                </>
            )}

            {editing && userId && (
                <form
                    className={styles.reviewForm}
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveOpinion();
                    }}
                >
                    <StarRating idPrefix={`edit-${pin.id}`} value={rating} onChange={setRating} />

                    <textarea
                        className={styles.reviewArea}
                        placeholder="Enter your review here..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                    />

                    <div className={styles.reviewActions}>
                        <button
                            type="submit"
                            className={styles.reviewSaveButton}
                            aria-label="Save review"
                            disabled={rating === 0}
                        >
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

                        <button type="button" className={styles.reviewCancelButton} onClick={cancelEdit}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <button className={styles.pinDeleteButton} onClick={() => onDeletePin(pin.id)}>
                Delete
            </button>
        </div>
    );
}

export default function PinsLayer({
    pins,
    userId,
    opinions,
    placeOpinions,
    onAddPin,
    onDeletePin,
    onSaveOpinion,
    onLoadOpinions,
}: PinsLayerProps) {
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
                            userId={userId}
                            opinion={opinions[pin.id]}
                            placeOpinions={placeOpinions[pin.id]}
                            onDeletePin={onDeletePin}
                            onSaveOpinion={onSaveOpinion}
                            onLoadOpinions={onLoadOpinions}
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
