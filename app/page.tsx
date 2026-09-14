import Link from 'next/link';
import MapLoader from '@/components/MapLoader';
import AccountMenu from '@/components/AccountMenu';
import { createClient } from '@/lib/supabase/server';
import styles from './page.module.css';

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div>
            <MapLoader
                userId={user?.id ?? null}
                topRight={
                    user ? (
                        <AccountMenu email={user.email ?? ''} />
                    ) : (
                        <Link href="/login" className={styles.loginButton}>Log in</Link>
                    )
                }
            />
        </div>
    )
}
