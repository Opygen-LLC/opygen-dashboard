import { redirect } from "next/navigation";

export default function AdminProductsIndexPage() {
    redirect("/admin-dashboard/settings?_tab=products");
}

