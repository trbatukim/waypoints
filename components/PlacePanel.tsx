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
    onRenamePin: (id: string, name: string) => void;
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
    onRenamePin,
    onSaveOpinion,
    onLoadOpinions,
}: PlacePanelProps) {
    const [renaming, setRenaming] = useState(false);
    const [name, setName] = useState(pin.name);
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

    function startRename() {
        setName(pin.name);
        setEditing(false);
        setRenaming(true);
    }

    function saveName() {
        const trimmed = name.trim();
        if (trimmed.length === 0) return;
        if (trimmed !== pin.name) onRenamePin(pin.id, trimmed);
        setRenaming(false);
    }

    function deletePin() {
        if (!window.confirm(`Delete "${pin.name}"? This can't be undone.`)) return;
        onDeletePin(pin.id);
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
            actions={
                userId &&
                !renaming && (
                    <button
                        type="button"
                        className={styles.panelIconButton}
                        aria-label="Edit place name"
                        title="Edit place name"
                        onClick={startRename}
                    >
                        <svg width="14" height="14" viewBox="0 0 122.88 121.51" fill="currentColor" aria-hidden="true">
                            <path d="M28.66,1.64H58.88L44.46,16.71H28.66a13.52,13.52,0,0,0-9.59,4l0,0a13.52,13.52,0,0,0-4,9.59v76.14H91.21a13.5,13.5,0,0,0,9.59-4l0,0a13.5,13.5,0,0,0,4-9.59V77.3l15.07-15.74V92.85a28.6,28.6,0,0,1-8.41,20.22l0,.05a28.58,28.58,0,0,1-20.2,8.39H11.5a11.47,11.47,0,0,1-8.1-3.37l0,0A11.52,11.52,0,0,1,0,110V30.3A28.58,28.58,0,0,1,8.41,10.09L8.46,10a28.58,28.58,0,0,1,20.2-8.4ZM73,76.47l-29.42,6,4.25-31.31L73,76.47ZM57.13,41.68,96.3.91A2.74,2.74,0,0,1,99.69.38l22.48,21.76a2.39,2.39,0,0,1-.19,3.57L82.28,67,57.13,41.68Z" />
                        </svg>
                    </button>
                )
            }
            footer={
                <button type="button" className={styles.pinDeleteButton} onClick={deletePin}>
                    Delete pin
                </button>
            }
        >
            {renaming && userId ? (
                <form
                    className={styles.reviewForm}
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveName();
                    }}
                >
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor={`rename-${pin.id}`}>
                            Name
                        </label>

                        <input
                            id={`rename-${pin.id}`}
                            autoFocus
                            className={styles.fieldInput}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    e.stopPropagation();
                                    setRenaming(false);
                                }
                            }}
                            placeholder="Name this pin…"
                        />
                    </div>

                    <div className={styles.panelActions}>
                        <button type="submit" className={styles.primaryButton} disabled={name.trim().length === 0}>
                            Save name
                        </button>

                        <button type="button" className={styles.reviewCancelButton} onClick={() => setRenaming(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            ) : editing && userId ? (
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
