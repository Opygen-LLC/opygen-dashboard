import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dns from "dns";

if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
}
try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
    console.warn("Failed to set DNS servers:", e);
}

const loadEnv = (fileName: string) => {
    const envPath = path.join(process.cwd(), fileName);
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        envContent.split("\n").forEach((line) => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || "";
                value = value.trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value;
            }
        });
    }
};

loadEnv(".env");
loadEnv(".env.local");

async function resolveMongoUri(uri: string): Promise<string> {
    if (!uri.startsWith("mongodb+srv://")) return uri;
    try {
        const { Resolver } = dns.promises;
        const resolver = new Resolver();
        resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
        const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)\?(.*)$/);
        if (!match) return uri;
        const [, user, pass, host, db, queryParams] = match;
        const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
        if (!srvRecords || srvRecords.length === 0) return uri;
        const hostList = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
        return `mongodb://${user}:${pass}@${hostList}/${db}?ssl=true&authSource=admin&${queryParams}`;
    } catch (e) {
        console.warn("SRV resolution fallback warning:", e);
        return uri;
    }
}

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("Missing MONGODB_URI");
        return;
    }

    const resolvedUri = await resolveMongoUri(uri);
    await mongoose.connect(resolvedUri);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
        console.error("No database instance");
        return;
    }

    const transactionsCol = db.collection("transactions");

    // Fetch all transactions with category product or linked to a product
    const productTransactions = await transactionsCol.find({
        $or: [
            { category: "product" },
            { productId: { $exists: true, $ne: null } },
            { productName: { $regex: /estate|crm/i } }
        ]
    }).toArray();

    console.log(`Found ${productTransactions.length} product transactions to process.`);

    let renewCount = 0;
    let newCount = 0;

    for (const tx of productTransactions) {
        const txIdStr = tx._id.toString();
        const dateStr = tx.date ? new Date(tx.date).toISOString().split("T")[0] : "";
        const desc = tx.description || "";

        // Check if this is the target renewal transaction:
        // "Al Ahbab Properties subscription ... income +500 Sep 29, 2026"
        const isTargetRenewal =
            txIdStr === "6abb8d216a914eaca8e40682" ||
            (desc.toLowerCase().includes("al ahbab") && dateStr === "2026-09-29");

        const orderType = isTargetRenewal ? "renew" : "new";

        await transactionsCol.updateOne(
            { _id: tx._id },
            {
                $set: {
                    orderType: orderType,
                    category: "product", // ensure category is product
                }
            }
        );

        if (orderType === "renew") {
            renewCount++;
            console.log(`[RENEW] Updated ${txIdStr} | ${desc} | ৳${tx.amount} | Date: ${dateStr}`);
        } else {
            newCount++;
            console.log(`[NEW]   Updated ${txIdStr} | ${desc} | ৳${tx.amount} | Date: ${dateStr}`);
        }
    }

    console.log(`\nMigration completed! Total: ${productTransactions.length}, Renew: ${renewCount}, New: ${newCount}`);

    // Verify
    const verifyTxs = await transactionsCol.find({ category: "product" }).toArray();
    console.log("\n--- Verification Summary ---");
    for (const v of verifyTxs) {
        console.log(`- ${v.description} | Date: ${v.date ? new Date(v.date).toISOString().split("T")[0] : ""} | Amount: ৳${v.amount} | Type: ${v.orderType}`);
    }

    await mongoose.disconnect();
}

run().catch(console.error);
