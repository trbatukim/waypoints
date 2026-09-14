'use client';

import { useEffect, type ReactNode } from 'react';
import styles from './map.module.css';

type PanelProps = {
    title: string;
    label?: string;
    subtitle?: ReactNode;
    footer?: ReactNode;
    onClose: () => void;
    children: ReactNode;
};

export default function Panel({ title, label, subtitle, footer, onClose, children }: PanelProps) {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <aside className={styles.panel} aria-label={label ?? title}>
            <header className={styles.panelHeader}>
                <div className={styles.panelHeading}>
                    <h2 className={styles.panelTitle}>{title}</h2>
                    {subtitle}
                </div>

                <button type="button" className={styles.panelClose} aria-label="Close" onClick={onClose}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                </button>
            </header>

            <div className={styles.panelBody}>{children}</div>

            {footer && <footer className={styles.panelFooter}>{footer}</footer>}
        </aside>
    );
}
