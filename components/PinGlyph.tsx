import styles from './map.module.css';
import { PIN_DOT, PIN_HEIGHT, PIN_PATH, PIN_WIDTH } from '@/lib/pinShape';

const BLEED = 2;

export default function PinGlyph({ selected = false }: { selected?: boolean }) {
    return (
        <span className={`${styles.pin} ${selected ? styles.pinSelected : ''}`}>
            <svg
                width={PIN_WIDTH + BLEED * 2}
                height={PIN_HEIGHT + BLEED * 2}
                viewBox={`${-BLEED} ${-BLEED} ${PIN_WIDTH + BLEED * 2} ${PIN_HEIGHT + BLEED * 2}`}
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d={PIN_PATH} fill="currentColor" />
                <circle cx={PIN_DOT.cx} cy={PIN_DOT.cy} r={PIN_DOT.r} fill="#ffffff" />
            </svg>
        </span>
    );
}
