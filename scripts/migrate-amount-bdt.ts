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

async function runMigration() {
    console.log("=== STARTING DATABASE MIGRATION: Shift amountInBdt -> amount ===");
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not defined in environment variables.");
    }

    const resolvedUri = await resolveMongoUri(uri);
    await mongoose.connect(resolvedUri);
    console.log("Connected to MongoDB successfully.");

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("Database instance not available.");
    }

    const transactionsCol = db.collection("transactions");
    const statementsCol = db.collection("statements");
    const usersCol = db.collection("users");

    // Phase 1: Cache transactions mapping (to resolve statement amounts accurately)
    const allTransactions = await transactionsCol.find({}).toArray();
    const txMap = new Map<string, any>();
    for (const tx of allTransactions) {
        txMap.set(tx._id.toString(), tx);
    }
    console.log(`Cached ${allTransactions.length} transactions for reference.`);

    // Phase 2: Migrate Transactions Collection
    console.log("\n--- Migrating Transactions ---");
    let txUpdated = 0;
    for (const tx of allTransactions) {
        // Shift amountInBdt to amount if present, or fallback to current amount
        const newAmount = tx.amountInBdt !== undefined && tx.amountInBdt !== null
            ? Number(tx.amountInBdt)
            : Number(tx.amount || 0);

        await transactionsCol.updateOne(
            { _id: tx._id },
            {
                $set: { amount: newAmount },
                $unset: { amountInBdt: "" },
            }
        );
        txUpdated++;
    }
    console.log(`Updated ${txUpdated} transactions: shifted amountInBdt to amount and unset amountInBdt.`);

    // Phase 3: Migrate Statements Collection
    console.log("\n--- Migrating Statements ---");
    const allStatements = await statementsCol.find({}).toArray();
    let stmtUpdated = 0;
    for (const stmt of allStatements) {
        let bdtAmount: number;

        if (stmt.amountInBdt !== undefined && stmt.amountInBdt !== null && Number(stmt.amountInBdt) > 0) {
            bdtAmount = Number(stmt.amountInBdt);
        } else if (stmt.transaction) {
            const tx = txMap.get(stmt.transaction.toString());
            if (tx && tx.amountInBdt !== undefined && tx.amountInBdt !== null) {
                bdtAmount = Number(tx.amountInBdt);
            } else if (tx && tx.amount !== undefined) {
                bdtAmount = Number(tx.amount);
            } else {
                bdtAmount = Number(stmt.amount || 0);
            }
        } else {
            bdtAmount = Number(stmt.amount || 0);
        }

        await statementsCol.updateOne(
            { _id: stmt._id },
            {
                $set: { amount: bdtAmount },
                $unset: { amountInBdt: "" },
            }
        );
        stmtUpdated++;
    }
    console.log(`Updated ${stmtUpdated} statements: shifted BDT amount to amount and unset amountInBdt.`);

    // Phase 4: Recalculate User Balances from migrated statements
    console.log("\n--- Recalculating User Balances in BDT ---");
    const distinctUsers = await statementsCol.distinct("user");
    for (const userId of distinctUsers) {
        const userStatements = await statementsCol.find({ user: userId }).toArray();
        let calculatedBalanceBdt = 0;

        for (const s of userStatements) {
            const amt = Number(s.amount || 0);
            if (s.type === "+") {
                calculatedBalanceBdt += amt;
            } else {
                calculatedBalanceBdt -= amt;
            }
        }

        calculatedBalanceBdt = Number(calculatedBalanceBdt.toFixed(2));
        await usersCol.updateOne(
            { _id: userId },
            {
                $set: {
                    balance: calculatedBalanceBdt,
                    balanceInBdt: calculatedBalanceBdt,
                },
            }
        );
        console.log(`User ${userId}: set balance to ৳${calculatedBalanceBdt}`);
    }

    // Phase 5: Verification
    console.log("\n--- Verification ---");
    const remainingTxWithAmountInBdt = await transactionsCol.countDocuments({ amountInBdt: { $exists: true } });
    const remainingStmtWithAmountInBdt = await statementsCol.countDocuments({ amountInBdt: { $exists: true } });

    console.log(`Remaining transactions with amountInBdt: ${remainingTxWithAmountInBdt}`);
    console.log(`Remaining statements with amountInBdt: ${remainingStmtWithAmountInBdt}`);

    const sampleTx = await transactionsCol.find({}).limit(3).toArray();
    console.log("\nSample Transactions after migration:");
    sampleTx.forEach((tx, i) => {
        console.log(`  ${i + 1}. [${tx._id}] type=${tx.type}, amount=৳${tx.amount}, amountInBdt=${tx.amountInBdt}`);
    });

    const sampleStmt = await statementsCol.find({}).limit(3).toArray();
    console.log("\nSample Statements after migration:");
    sampleStmt.forEach((stmt, i) => {
        console.log(`  ${i + 1}. [${stmt._id}] type=${stmt.type}, amount=৳${stmt.amount}, amountInBdt=${stmt.amountInBdt}`);
    });

    await mongoose.disconnect();
    console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY ===");
}

runMigration().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
