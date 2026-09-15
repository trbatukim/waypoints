import type { Pin } from '@/components/PinsLayer';
import type { Opinion, PlaceOpinion } from '@/components/Opinion';
import type { PlaceStats } from '@/components/PlacesPanel';
import type { createClient } from '@/lib/supabase/client';

export type PlacesStore = {
    loadPins: () => Promise<Pin[] | null>;
    loadOwnOpinions: (userId: string) => Promise<Record<string, Opinion> | null>;
    loadPlaceOpinions: (placeId: string) => Promise<PlaceOpinion[] | null>;
    loadPlaceStats: () => Promise<Record<string, PlaceStats> | null>;
    addPin: (lat: number, lng: number, name: string, userId: string) => Promise<Pin | null>;
    deletePin: (id: string) => Promise<boolean>;
    renamePin: (id: string, name: string) => Promise<Pin | null>;
    saveOpinion: (placeId: string, userId: string, rating: number, note: string) => Promise<boolean>;
    deleteOpinion: (placeId: string, userId: string) => Promise<boolean>;
};

type ProfileRef = { name: string | null } | { name: string | null }[] | null;

type OpinionRow = {
    id: string;
    user_id: string;
    rating: number | null;
    note: string | null;
    profiles: ProfileRef;
};

function profileName(profiles: ProfileRef) {
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    return profile?.name?.trim() || 'Someone';
}

export function summarizeRatings(ratings: { placeId: string; rating: number }[]): Record<string, PlaceStats> {
    const totals: Record<string, { reviewCount: number; ratedCount: number; ratingSum: number }> = {};
    for (const { placeId, rating } of ratings) {
        const entry = (totals[placeId] ??= { reviewCount: 0, ratedCount: 0, ratingSum: 0 });
        entry.reviewCount += 1;
        if (rating > 0) {
            entry.ratedCount += 1;
            entry.ratingSum += rating;
        }
    }

    return Object.fromEntries(
        Object.entries(totals).map(([placeId, t]) => [
            placeId,
            { reviewCount: t.reviewCount, average: t.ratedCount > 0 ? t.ratingSum / t.ratedCount : null },
        ])
    );
}

export function createSupabaseStore(supabase: ReturnType<typeof createClient>): PlacesStore {
    return {
        async loadPins() {
            const { data, error } = await supabase.from('places').select('id, name, lat, lng, created_by');
            if (error) {
                console.error('Failed to load places:', error);
                return null;
            }
            return data;
        },

        async loadOwnOpinions(userId) {
            const { data, error } = await supabase
                .from('opinions')
                .select('place_id, rating, note')
                .eq('user_id', userId);

            if (error) {
                console.error('Failed to load opinions:', error);
                return null;
            }

            return Object.fromEntries(
                (data ?? []).map((o) => [o.place_id, { rating: o.rating / 2, note: o.note ?? '' }])
            );
        },

        async loadPlaceOpinions(placeId) {
            const { data, error } = await supabase
                .from('opinions')
                .select('id, user_id, rating, note, profiles(name)')
                .eq('place_id', placeId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Failed to load opinions for place:', error);
                return null;
            }

            return ((data ?? []) as OpinionRow[]).map((o) => ({
                id: o.id,
                userId: o.user_id,
                authorName: profileName(o.profiles),
                rating: (o.rating ?? 0) / 2,
                note: o.note?.trim() ?? '',
            }));
        },

        async loadPlaceStats() {
            const { data, error } = await supabase.from('opinions').select('place_id, rating');

            if (error) {
                console.error('Failed to load place ratings:', error);
                return null;
            }

            return summarizeRatings((data ?? []).map((o) => ({ placeId: o.place_id, rating: (o.rating ?? 0) / 2 })));
        },

        async addPin(lat, lng, name, userId) {
            const { data, error } = await supabase
                .from('places')
                .insert({ lat, lng, name, created_by: userId })
                .select('id, name, lat, lng, created_by')
                .single();

            if (error) {
                console.error('Failed to add pin:', error);
                return null;
            }

            return data;
        },

        async deletePin(id) {
            const { data, error } = await supabase.from('places').delete().eq('id', id).select('id');
            return !error && !!data && data.length > 0;
        },

        async renamePin(id, name) {
            const { data, error } = await supabase
                .from('places')
                .update({ name })
                .eq('id', id)
                .select('id, name, lat, lng, created_by')
                .single();

            if (error) {
                console.error('Failed to rename pin:', error);
                return null;
            }

            return data;
        },

        async saveOpinion(placeId, userId, rating, note) {
            const { error } = await supabase
                .from('opinions')
                .upsert(
                    { place_id: placeId, rating: Math.round(rating * 2), note, user_id: userId },
                    { onConflict: 'place_id,user_id' }
                );

            if (error) {
                console.error('Failed to save opinion:', error);
                return false;
            }

            return true;
        },

        async deleteOpinion(placeId, userId) {
            const { data, error } = await supabase
                .from('opinions')
                .delete()
                .eq('place_id', placeId)
                .eq('user_id', userId)
                .select('id');

            if (error) {
                console.error('Failed to delete opinion:', error);
                return false;
            }

            return !!data && data.length > 0;
        },
    };
}
