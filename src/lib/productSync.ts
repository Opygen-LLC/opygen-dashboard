import mongoose from "mongoose";
import Transaction from "@/models/Transaction";
import Product, { IProduct } from "@/models/Product";

/**
 * Synchronize transactions when a product name is changed or updated.
 * Updates all transactions with this productId or matching the old/new name.
 */
export async function syncTransactionsForProduct(
    productId: string | mongoose.Types.ObjectId,
    newName: string,
    oldName?: string
) {
    const objectId = typeof productId === "string" ? new mongoose.Types.ObjectId(productId) : productId;
    const stringId = objectId.toString();

    const orConditions: any[] = [
        { productId: objectId },
        { productId: stringId },
    ];

    if (oldName && oldName.trim()) {
        const escapedOld = oldName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        orConditions.push({ productName: { $regex: new RegExp(`^${escapedOld}$`, "i") } });
    }

    const escapedNew = newName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    orConditions.push({ productName: { $regex: new RegExp(`^${escapedNew}$`, "i") } });

    // Handle known legacy alias: Opygen Estate was previously named Opygen Real Estate CRM
    if (newName.toLowerCase().includes("estate") || (oldName && oldName.toLowerCase().includes("estate"))) {
        orConditions.push({ productName: { $regex: /real estate crm/i } });
    }

    const result = await Transaction.updateMany(
        { $or: orConditions },
        {
            $set: {
                productName: newName.trim(),
                productId: objectId,
            },
        }
    );

    return result;
}

/**
 * Auto-syncs any orphaned or desynchronized product transactions across all products.
 * Guarantees that:
 * 1. Transactions with productId have their productName matching the canonical Product name.
 * 2. Transactions without productId matching a product name/alias are linked with productId.
 */
export async function autoSyncAllProductTransactions() {
    try {
        const products: IProduct[] = await Product.find().lean();
        if (!products || products.length === 0) return 0;

        let totalUpdated = 0;

        for (const prod of products) {
            const escapedName = prod.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const orConditions: any[] = [
                {
                    productId: prod._id,
                    productName: { $ne: prod.name.trim() },
                },
                {
                    category: "product",
                    $or: [{ productId: { $exists: false } }, { productId: null }],
                    productName: { $regex: new RegExp(`^${escapedName}$`, "i") },
                },
            ];

            if (prod.name.toLowerCase().includes("estate")) {
                orConditions.push({
                    category: "product",
                    $or: [{ productId: { $exists: false } }, { productId: null }],
                    productName: { $regex: /real estate crm/i },
                });
            }

            const res = await Transaction.updateMany(
                { $or: orConditions },
                {
                    $set: {
                        productName: prod.name.trim(),
                        productId: prod._id,
                    },
                }
            );

            totalUpdated += res.modifiedCount || 0;
        }

        return totalUpdated;
    } catch (err) {
        console.error("autoSyncAllProductTransactions error:", err);
        return 0;
    }
}

