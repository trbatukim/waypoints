import { ImageResponse } from 'next/og';

export function renderAppIcon(size: number) {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#171717',
                }}
            >
                <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
                    <path
                        fill="#fafafa"
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
                    />
                </svg>
            </div>
        ),
        { width: size, height: size }
    );
}
