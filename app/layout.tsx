import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Waypoints"
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
    const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} data-theme={theme}>
            <body>{children}</body>
        </html>
    );
}
