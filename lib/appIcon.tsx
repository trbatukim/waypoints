import { ImageResponse } from 'next/og';
import { PIN_COLOR, PIN_DOT, PIN_HEIGHT, PIN_PATH, PIN_WIDTH } from '@/lib/pinShape';

export function renderAppIcon(size: number) {
    const height = size * 0.6;
    const width = (height * PIN_WIDTH) / PIN_HEIGHT;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <svg width={width} height={height} viewBox={`0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`}>
                    <path d={PIN_PATH} fill={PIN_COLOR} />
                    <circle cx={PIN_DOT.cx} cy={PIN_DOT.cy} r={PIN_DOT.r} fill="#ffffff" />
                </svg>
            </div>
        ),
        { width: size, height: size }
    );
}
