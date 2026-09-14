import type { Metadata } from 'next';
import Link from 'next/link';
import MapBackgroundLoader from '@/components/MapBackgroundLoader';
import { login } from './actions';
import styles from './login.module.css';

export const metadata: Metadata = {
    title: 'Login',
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const params = await searchParams;

    return (
        <div className={styles.page}>
            <div className={styles.background} aria-hidden="true">
                <MapBackgroundLoader />
            </div>

            <form className={styles.card} action={login}>
                <h1>Login</h1>

                <label className={styles.field}>
                    Email
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                    />
                </label>

                <label className={styles.field}>
                    Password
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        required
                    />
                </label>

                <label>
                    <input type="checkbox" name="rememberMe" id="rememberMe" />
                    {' '}Remember me
                </label>

                {params.error && <p className={styles.error}>{params.error}</p>}

                <button type="submit" className={styles.submit}>
                    Log in
                </button>

                <Link href="/" className={styles.backLink}>← Back to map</Link>
            </form>
        </div>
    );
}
