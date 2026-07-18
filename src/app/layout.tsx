import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const sansFont = Plus_Jakarta_Sans({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
});

const monoFont = JetBrains_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
    title: {
        default: "OpyDash — Opygen Project Hub",
        template: "%s | OpyDash",
    },
    description:
        "Sleek internal project-management dashboard for Opygen co-founders. Track priorities, manage Kanban boards, and review aggregate workload logs.",
    openGraph: {
        title: "OpyDash — Opygen Project Management Hub",
        description:
            "Sleek internal project-management dashboard for Opygen co-founders. Track priorities, manage Kanban boards, and review aggregate workload logs.",
        url: "http://localhost:3000",
        siteName: "OpyDash",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 675,
                alt: "OpyDash — Opygen Project Management Hub",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "OpyDash — Opygen Project Hub",
        description:
            "Sleek internal project-management dashboard for Opygen co-founders.",
        images: ["/og-image.jpg"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full" suppressHydrationWarning>
            <body
                className={`${sansFont.variable} ${monoFont.variable} h-full antialiased font-sans bg-background text-foreground transition-colors duration-200`}
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
