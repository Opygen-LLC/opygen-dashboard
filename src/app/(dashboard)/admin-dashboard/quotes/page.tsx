import { Metadata } from "next";
import QuotesView from "@/components/quotes/QuotesView";

export const metadata: Metadata = {
    title: "Quotes",
    description: "Manage project quotes and proposals",
};

export default function QuotesPage() {
    return <QuotesView />;
}
