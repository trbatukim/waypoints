import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient(rememberMe: boolean = true) {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            const finalOptions = rememberMe
                                ? options
                                : { ...options, maxAge: undefined, expires: undefined };
                            cookieStore.set(name, value, finalOptions);
                        });
                    } catch {
                        // pass
                    }
                },
            },
        }
    );
}