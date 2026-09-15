import type { Pin } from '@/components/PinsLayer';
import { summarizeRatings, type PlacesStore } from './placesStore';

export const DEMO_USER_ID = 'demo-user';

type DemoReview = {
    id: string;
    placeId: string;
    userId: string;
    authorName: string;
    rating: number;
    note: string;
};

const DEMO_PLACES: Pin[] = [
    { id: 'demo-nieuwe-kerk', name: 'Nieuwe Kerk', lat: 52.0121, lng: 4.3606, created_by: 'demo-sanne' },
    { id: 'demo-oude-kerk', name: 'Oude Kerk', lat: 52.0127, lng: 4.3561, created_by: 'demo-jordi' },
    { id: 'demo-stadhuis', name: 'Stadhuis Delft', lat: 52.0114, lng: 4.3583, created_by: 'demo-mei' },
    { id: 'demo-oostpoort', name: 'Oostpoort', lat: 52.0079, lng: 4.3662, created_by: 'demo-sanne' },
    { id: 'demo-molen-de-roos', name: 'Molen de Roos', lat: 52.0137, lng: 4.353, created_by: 'demo-jordi' },
    { id: 'demo-tu-library', name: 'TU Delft Library', lat: 52.0026, lng: 4.3754, created_by: 'demo-mei' },
];

const DEMO_REVIEWS: DemoReview[] = [
    {
        id: 'demo-review-1',
        placeId: 'demo-nieuwe-kerk',
        userId: 'demo-sanne',
        authorName: 'Sanne',
        rating: 5,
        note: 'Climb the tower on a clear day. The view over the old town is worth every step.',
    },
    {
        id: 'demo-review-2',
        placeId: 'demo-nieuwe-kerk',
        userId: 'demo-jordi',
        authorName: 'Jordi',
        rating: 4,
        note: 'Beautiful inside, but the stairs are narrow and it gets crowded at noon.',
    },
    {
        id: 'demo-review-3',
        placeId: 'demo-oude-kerk',
        userId: 'demo-mei',
        authorName: 'Mei',
        rating: 4.5,
        note: 'Quieter than the Nieuwe Kerk. Look out for the leaning tower.',
    },
    {
        id: 'demo-review-4',
        placeId: 'demo-stadhuis',
        userId: 'demo-sanne',
        authorName: 'Sanne',
        rating: 3.5,
        note: '',
    },
    {
        id: 'demo-review-5',
        placeId: 'demo-oostpoort',
        userId: 'demo-jordi',
        authorName: 'Jordi',
        rating: 5,
        note: 'The only city gate left standing. Lovely spot for a canal-side walk at sunset.',
    },
    {
        id: 'demo-review-6',
        placeId: 'demo-tu-library',
        userId: 'demo-mei',
        authorName: 'Mei',
        rating: 4,
        note: 'Grass roof you can walk on, and a good place to study when it rains.',
    },
];

export function createDemoStore(): PlacesStore {
    let pins = DEMO_PLACES.map((pin) => ({ ...pin }));
    let reviews = DEMO_REVIEWS.map((review) => ({ ...review }));

    return {
        async loadPins() {
            return [...pins];
        },

        async loadOwnOpinions(userId) {
            return Object.fromEntries(
                reviews
                    .filter((review) => review.userId === userId)
                    .map((review) => [review.placeId, { rating: review.rating, note: review.note }])
            );
        },

        async loadPlaceOpinions(placeId) {
            return reviews
                .filter((review) => review.placeId === placeId)
                .map((review) => ({
                    id: review.id,
                    userId: review.userId,
                    authorName: review.authorName,
                    rating: review.rating,
                    note: review.note,
                }));
        },

        async loadPlaceStats() {
            return summarizeRatings(reviews);
        },

        async addPin(lat, lng, name, userId) {
            const pin = { id: crypto.randomUUID(), name, lat, lng, created_by: userId };
            pins = [...pins, pin];
            return pin;
        },

        async deletePin(id) {
            if (!pins.some((pin) => pin.id === id)) return false;
            pins = pins.filter((pin) => pin.id !== id);
            reviews = reviews.filter((review) => review.placeId !== id);
            return true;
        },

        async renamePin(id, name) {
            const pin = pins.find((p) => p.id === id);
            if (!pin) return null;
            const renamed = { ...pin, name };
            pins = pins.map((p) => (p.id === id ? renamed : p));
            return renamed;
        },

        async saveOpinion(placeId, userId, rating, note) {
            if (!pins.some((pin) => pin.id === placeId)) return false;

            const existing = reviews.find((review) => review.placeId === placeId && review.userId === userId);
            if (existing) {
                reviews = reviews.map((review) => (review === existing ? { ...review, rating, note } : review));
            } else {
                reviews = [
                    ...reviews,
                    { id: crypto.randomUUID(), placeId, userId, authorName: 'You', rating, note },
                ];
            }
            return true;
        },

        async deleteOpinion(placeId, userId) {
            const before = reviews.length;
            reviews = reviews.filter((review) => !(review.placeId === placeId && review.userId === userId));
            return reviews.length < before;
        },
    };
}
