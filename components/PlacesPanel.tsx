'use client';

import styles from './map.module.css';
import Panel from './Panel';
import type { Pin } from './PinsLayer';
import { StarDisplay } from './Stars';

export type PlaceStats = {
    reviewCount: number;
    average: number | null;
};

type PlacesPanelProps = {
    pins: Pin[];
    stats: Record<string, PlaceStats>;
    onSelectPin: (id: string) => void;
    onClose: () => void;
};

function PlaceSummary({ pinId, stats }: { pinId: string; stats: PlaceStats | undefined }) {
    if (!stats || stats.reviewCount === 0) {
        return <span className={styles.ratingEmpty}>No reviews yet</span>;
    }

    return (
        <span className={styles.ratingSummary}>
            {stats.average !== null && (
                <>
                    <StarDisplay
                        idPrefix={`list-${pinId}`}
                        value={stats.average}
                        label={`Average rating ${stats.average.toFixed(1)} out of 5 stars`}
                    />
                    <span className={styles.ratingValue}>{stats.average.toFixed(1)}</span>
                </>
            )}
            <span className={styles.ratingCount}>
                ({stats.reviewCount} {stats.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
        </span>
    );
}

export default function PlacesPanel({ pins, stats, onSelectPin, onClose }: PlacesPanelProps) {
    const sorted = [...pins].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Panel
            title="All places"
            subtitle={
                <span className={styles.panelCoords}>
                    {pins.length} {pins.length === 1 ? 'place' : 'places'}
                </span>
            }
            onClose={onClose}
        >
            {sorted.length > 0 ? (
                <ul className={styles.placeList}>
                    {sorted.map((pin) => (
                        <li key={pin.id}>
                            <button type="button" className={styles.placeListItem} onClick={() => onSelectPin(pin.id)}>
                                <span className={styles.searchResultPrimary}>{pin.name}</span>
                                <PlaceSummary pinId={pin.id} stats={stats[pin.id]} />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.panelEmpty}>No places yet.</p>
            )}
        </Panel>
    );
}
