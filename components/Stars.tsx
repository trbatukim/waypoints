import styles from './map.module.css';

const STAR_PATH =
    'M12 2.5l2.97 6.28 6.91.68-5.15 4.75 1.44 6.79L12 17.27l-6.17 3.73 1.44-6.79-5.15-4.75 6.91-.68L12 2.5z';

const STARS = [1, 2, 3, 4, 5];

function fillFor(value: number, star: number) {
    return Math.min(1, Math.max(0, value - (star - 1)));
}

function Star({ clipId, fill }: { clipId: string; fill: number }) {
    return (
        <svg className={styles.star} width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d={STAR_PATH} fill="none" stroke="currentColor" strokeWidth="1.5" />
            <clipPath id={clipId}>
                <rect x="0" y="0" width={24 * fill} height="24" />
            </clipPath>
            <path d={STAR_PATH} fill="currentColor" clipPath={`url(#${clipId})`} />
        </svg>
    );
}

export function StarDisplay({
    idPrefix,
    value,
    label,
}: {
    idPrefix: string;
    value: number;
    label: string;
}) {
    return (
        <div className={styles.starRating} role="img" aria-label={label}>
            {STARS.map((star) => (
                <Star key={star} clipId={`${idPrefix}-star-${star}`} fill={fillFor(value, star)} />
            ))}
        </div>
    );
}

export function StarRating({
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
            {STARS.map((star) => (
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
                    <Star clipId={`${idPrefix}-star-${star}`} fill={fillFor(value, star)} />
                </button>
            ))}
        </div>
    );
}
