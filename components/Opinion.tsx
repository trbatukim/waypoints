import styles from './map.module.css';
import { StarDisplay } from './Stars';

/** The signed-in user's own opinion on a place. */
export type Opinion = {
    rating: number;
    note: string;
};

/** Any user's opinion on a place, as shown in the popup list. */
export type PlaceOpinion = {
    id: string;
    userId: string;
    authorName: string;
    rating: number;
    note: string;
};

export function averageRating(opinions: PlaceOpinion[]) {
    const rated = opinions.filter((opinion) => opinion.rating > 0);
    if (rated.length === 0) return null;
    return rated.reduce((total, opinion) => total + opinion.rating, 0) / rated.length;
}

export default function OpinionCard({
    opinion,
    isOwn,
}: {
    opinion: PlaceOpinion;
    isOwn: boolean;
}) {
    return (
        <div className={styles.opinionCard}>
            <div className={styles.opinionHeader}>
                <span className={styles.opinionAuthor}>
                    {isOwn ? 'You' : opinion.authorName}
                </span>
                {opinion.rating > 0 && (
                    <StarDisplay
                        idPrefix={`opinion-${opinion.id}`}
                        value={opinion.rating}
                        label={`${opinion.rating} out of 5 stars`}
                    />
                )}
            </div>

            {opinion.note.length > 0 && <p className={styles.opinionNote}>{opinion.note}</p>}
        </div>
    );
}
