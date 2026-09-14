import { renderAppIcon } from '@/lib/appIcon';

const SIZES = [192, 512];

export function generateImageMetadata() {
    return SIZES.map((s) => ({
        id: String(s),
        size: { width: s, height: s },
        contentType: 'image/png',
    }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
    return renderAppIcon(Number(await id));
}
