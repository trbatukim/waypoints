'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut } from '@/app/actions';
import styles from './map.module.css';

export default function AccountMenu({ email }: { email: string }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const initial = email.trim().charAt(0).toUpperCase() || '?';

    useEffect(() => {
        if (!open) return;

        function handlePointerDown(e: PointerEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            setOpen(false);
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={rootRef} className={styles.account}>
            <button
                type="button"
                className={styles.avatarButton}
                aria-label="Account"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                {initial}
            </button>

            {open && (
                <div className={styles.accountMenu} role="menu">
                    <div className={styles.accountHeader}>
                        <span className={styles.accountLabel}>Signed in as</span>
                        <span className={styles.accountEmail}>{email}</span>
                    </div>

                    <form action={signOut}>
                        <button type="submit" role="menuitem" className={styles.menuItemDanger}>
                            Sign out
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
