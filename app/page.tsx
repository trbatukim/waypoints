import Link from 'next/link';
import MapLoader from '@/components/MapLoader';
import { createClient } from '@/lib/supabase/server';
import { signOut } from './actions'

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div>
            <MapLoader userId={user?.id ?? null} />

            <div className='topRightContainer'>
                {user ? (
                    <span className='loginLink unselectable'>{user.email}</span>
                ) : (
                    <Link href="/login" className='loginLink'>Login</Link>
                )}

                {user ? (
                    <form action={signOut}>
                        <button type='submit' className='signOutButton'>Sign Out</button>
                    </form>
                ) : null}
            </div>
        </div>
    )
}
