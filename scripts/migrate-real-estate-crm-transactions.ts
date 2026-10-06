import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dns from "dns";
import { Resolver } from "dns/promises";

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
        const envConfig = fs.readFileSync(envPath, "utf-8");
        envConfig.split("\n").forEach((line) => {
            const cleanLine = line.trim();
            if (cleanLine && !cleanLine.startsWith("#")) {
                const parts = cleanLine.split("=");
                const key = parts[0]?.trim();
                const value = parts.slice(1).join("=").trim();
                if (key) {
                    process.env[key] = value;
                }
            }
        });
    }
};

loadEnv(".env");

async function resolveMongoUri(uri: string): Promise<string> {
    if (!uri.startsWith("mongodb+srv://")) return uri;
    try {
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

async function runMigration() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("Missing MONGODB_URI");
        return;
    }

    const resolved = await resolveMongoUri(uri);
    await mongoose.connect(resolved);
    console.log("Connected to DB");

    const db = mongoose.connection.db;
    if (!db) {
        console.error("DB not connected");
        return;
    }

    // 1. Find the target "Opygen Estate" product
    const estateProduct = await db.collection("products").findOne({
        name: { $regex: /^Opygen Estate$/i }
    });

    if (!estateProduct) {
        console.error("Could not find 'Opygen Estate' product in database!");
        await mongoose.disconnect();
        return;
    }

    console.log("Found Opygen Estate product:", estateProduct._id.toString());

    // 2. Find transactions with "Opygen Real Estate CRM" or without productId
    const transactionsToUpdate = await db.collection("transactions").find({
        $or: [
            { productName: { $regex: /real estate crm/i } },
            {
                category: "product",
                productName: { $regex: /^Opygen Estate$/i },
                $or: [
                    { productId: { $exists: false } },
                    { productId: null }
                ]
            }
        ]
    }).toArray();

    console.log(`Found ${transactionsToUpdate.length} transactions to update:`);
    transactionsToUpdate.forEach(t => {
        console.log(`- ID: ${t._id}, Desc: ${t.description}, Amount: ${t.amount}, Current Prod: ${t.productName}`);
    });

    // 3. Update them
    const result = await db.collection("transactions").updateMany(
        {
            $or: [
                { productName: { $regex: /real estate crm/i } },
                {
                    category: "product",
                    productName: { $regex: /^Opygen Estate$/i },
                    $or: [
                        { productId: { $exists: false } },
                        { productId: null }
                    ]
                }
            ]
        },
        {
            $set: {
                productName: estateProduct.name, // "Opygen Estate"
                productId: estateProduct._id,
            }
        }
    );

    console.log(`Updated ${result.modifiedCount} transactions.`);

    // 4. Verify updated transactions
    const updated = await db.collection("transactions").find({
        _id: { $in: transactionsToUpdate.map(t => t._id) }
    }).toArray();

    console.log("\nVerification:");
    updated.forEach(t => {
        console.log(`- ID: ${t._id}, Desc: ${t.description}, Amount: ${t.amount}, Product: ${t.productName}, ProductId: ${t.productId}`);
    });

    await mongoose.disconnect();
    console.log("Migration complete!");
}

runMigration().catch(console.error);

