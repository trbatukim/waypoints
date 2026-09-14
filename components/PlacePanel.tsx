'use client';

import { useEffect, useState } from 'react';
import styles from './map.module.css';
import Panel from './Panel';
import OpinionCard, { averageRating, type Opinion, type PlaceOpinion } from './Opinion';
import { StarDisplay, StarRating } from './Stars';
import type { Pin } from './PinsLayer';

type PlacePanelProps = {
    pin: Pin;
    userId: string | null;
    opinion?: Opinion;
    placeOpinions?: PlaceOpinion[];
    onClose: () => void;
    onDeletePin: (id: string) => void;
    onSaveOpinion: (placeId: string, rating: number, review: string) => void;
    onLoadOpinions: (placeId: string) => void;
};

export default function PlacePanel({
    pin,
    userId,
    opinion,
    placeOpinions,
    onClose,
    onDeletePin,
    onSaveOpinion,
    onLoadOpinions,
}: PlacePanelProps) {
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

    const summary =
        average === null ? (
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
        );

    return (
        <Panel
            title={pin.name}
            label={`Details for ${pin.name}`}
            subtitle={summary}
            onClose={onClose}
            footer={
                <button type="button" className={styles.pinDeleteButton} onClick={() => onDeletePin(pin.id)}>
                    Delete pin
                </button>
            }
        >
            {editing && userId ? (
                <form
                    className={styles.reviewForm}
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveOpinion();
                    }}
                >
                    <StarRating idPrefix={`edit-${pin.id}`} value={rating} onChange={setRating} />

                    <textarea
                        autoFocus
                        className={styles.reviewArea}
                        placeholder="Share what this place is like…"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                    />

                    <div className={styles.panelActions}>
                        <button type="submit" className={styles.primaryButton} disabled={rating === 0}>
                            Save review
                        </button>

                        <button type="button" className={styles.reviewCancelButton} onClick={cancelEdit}>
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    {userId && (
                        <button type="button" className={styles.reviewEditButton} onClick={() => setEditing(true)}>
                            {hasOwnReview ? 'Edit your review' : 'Write a review'}
                        </button>
                    )}

                    {reviews.length > 0 ? (
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
                    ) : (
                        <p className={styles.panelEmpty}>No reviews yet.</p>
                    )}
                </>
            )}
        </Panel>
    );
}
