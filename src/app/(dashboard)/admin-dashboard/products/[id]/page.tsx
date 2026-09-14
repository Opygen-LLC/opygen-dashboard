import React from "react";
import ProductDetailsView from "@/components/products/ProductDetailsView";

export const metadata = {
    title: "Product Financials | Opygen Admin",
    description: "Product revenue, expenses, and transaction ledger.",
};

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <ProductDetailsView productId={id} />;
}
