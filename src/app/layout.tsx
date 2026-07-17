import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const sora = Sora({
    variable: "--font-sora",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "OpyDash | Project Management",
    description:
        "Internal project-management dashboard for Opygen co-founders.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full" suppressHydrationWarning>
            <body
                className={`${sora.variable} h-full antialiased font-sans bg-background text-foreground transition-colors duration-200`}
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
