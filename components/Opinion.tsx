import styles from './map.module.css';

/** The signed-in user's own opinion on a place. */
export type Opinion = {
    rating: number;
    note: string;
};

/** Any user's opinion on a place, as shown in the popup list. */
export type PlaceOpinion = {
    id: string;
    note: string;
};

export default function OpinionNote({ note }: { note: string }) {
    return <textarea className={styles.opinionNote} value={note} readOnly />;
}
