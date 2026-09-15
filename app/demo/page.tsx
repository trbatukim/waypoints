import type { Metadata } from 'next';
import Link from 'next/link';
import MapLoader from '@/components/MapLoader';
import { DEMO_USER_ID } from '@/lib/demoStore';
import styles from '../page.module.css';

export const metadata: Metadata = {
    title: 'Demo',
};

export default function DemoPage() {
    return (
        <div>
            <MapLoader
                userId={DEMO_USER_ID}
                demo
                topRight={<Link href="/login" className={styles.loginButton}>Log in</Link>}
                bottomLeft={
                    <div className={styles.demoBadge}>
                        <span>
                            <strong>Demo mode</strong> - changes aren&apos;t saved
                        </span>
                        <Link href="/" className={styles.demoExit}>Exit</Link>
                    </div>
                }
            />
        </div>
    );
}
