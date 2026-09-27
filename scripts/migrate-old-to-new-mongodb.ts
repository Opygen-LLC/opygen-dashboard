import { MongoClient } from "mongodb";
import { Resolver } from "dns/promises";
import * as dotenv from "dotenv";
dotenv.config();

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

async function migrateData() {
    const oldUriRaw = process.env.OLD_MONGODB_URI;
    const newUriRaw = process.env.MONGODB_URI;

    if (!oldUriRaw || !newUriRaw) {
        throw new Error("Both OLD_MONGODB_URI and MONGODB_URI must be set in .env");
    }

    console.log("Connecting to Old and New MongoDB clusters...");
    const oldUri = await resolveMongoUri(oldUriRaw);
    const newUri = await resolveMongoUri(newUriRaw);

    const oldClient = new MongoClient(oldUri);
    const newClient = new MongoClient(newUri);

    await oldClient.connect();
    await newClient.connect();

    const oldDb = oldClient.db("opygen-dashboard");
    const newDb = newClient.db("opygen-dashboard");

    console.log(`Connected to Old DB: ${oldDb.databaseName}`);
    console.log(`Connected to New DB: ${newDb.databaseName}`);

    const oldCols = await oldDb.listCollections().toArray();
    console.log(`Found ${oldCols.length} collections in Old DB.`);

    const report: Array<{
        collection: string;
        oldTotal: number;
        newBefore: number;
        upserted: number;
        modified: number;
        matched: number;
        newAfter: number;
    }> = [];

    for (const colInfo of oldCols) {
        const colName = colInfo.name;
        const oldCol = oldDb.collection(colName);
        const newCol = newDb.collection(colName);

        const oldDocs = await oldCol.find({}).toArray();
        const newBeforeCount = await newCol.countDocuments();

        let totalUpserted = 0;
        let totalModified = 0;
        let totalMatched = 0;

        if (oldDocs.length > 0) {
            const batchSize = 500;
            for (let i = 0; i < oldDocs.length; i += batchSize) {
                const batch = oldDocs.slice(i, i + batchSize);
                const ops = batch.map((doc) => ({
                    replaceOne: {
                        filter: { _id: doc._id },
                        replacement: doc,
                        upsert: true,
                    },
                }));

                const result = await newCol.bulkWrite(ops, { ordered: false });
                totalUpserted += result.upsertedCount;
                totalModified += result.modifiedCount;
                totalMatched += result.matchedCount;
            }
        }

        // Sync missing indexes if any
        try {
            const oldIndexes = await oldCol.indexes();
            const newIndexes = await newCol.indexes();
            const newIndexNames = new Set(newIndexes.map((idx) => idx.name));

            for (const idx of oldIndexes) {
                if (idx.name && idx.name !== "_id_" && !newIndexNames.has(idx.name)) {
                    console.log(`[${colName}] Creating missing index: ${idx.name}`);
                    const { key, name, unique, sparse, expireAfterSeconds } = idx as any;
                    await newCol.createIndex(key, {
                        name,
                        unique,
                        sparse,
                        expireAfterSeconds,
                    });
                }
            }
        } catch (indexErr) {
            console.warn(`[${colName}] Index sync note:`, indexErr);
        }

        const newAfterCount = await newCol.countDocuments();

        report.push({
            collection: colName,
            oldTotal: oldDocs.length,
            newBefore: newBeforeCount,
            upserted: totalUpserted,
            modified: totalModified,
            matched: totalMatched,
            newAfter: newAfterCount,
        });
    }

    console.log("\n=================== MIGRATION REPORT ===================");
    console.table(report);

    await oldClient.close();
    await newClient.close();
    console.log("\nMigration completed successfully!");
}

migrateData().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
