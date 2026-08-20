import Link from 'next/link';
import MapLoader from '@/components/MapLoader';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div>
            <MapLoader />
            <div className='loginLinkContainer'>
                {user ? (
                    <span className='loginLink'>{user.email}</span>
                ) : (
                    <Link href="/login" className='loginLink'>Login</Link>
                )}
            </div>
        </div>
    )
}
