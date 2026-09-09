import fs from "fs";
import path from "path";
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
loadEnv(".env.local");

async function run() {
    try {
        const dbConnect = (await import("../src/lib/db")).default;
        const User = (await import("../src/models/User")).default;

        await dbConnect();

        const email = "syedmohiuddinmeshal24@gmail.com";
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User not found with email: ${email}`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);

        const targetAccount = {
            type: "bank" as const,
            providerName: "Dutch-Bangla Bank (DBBL)",
            accountName: "SYED MOHIUDDIN MESHAL",
            accountNumber: "1271050311559",
            branch: "Barishal Branch",
            routingNumber: "090060289",
            balance: 0,
            balanceInBdt: 0,
        };

        const existingAccounts = user.accounts || [];
        const existingIdx = existingAccounts.findIndex(
            (acc: any) =>
                acc.accountNumber === targetAccount.accountNumber ||
                acc.providerName.toLowerCase().includes("dutch-bangla") ||
                acc.providerName.toLowerCase().includes("dbbl")
        );

        if (existingIdx !== -1) {
            console.log("Updating existing DBBL account...");
            const currentAcc = existingAccounts[existingIdx] as any;
            existingAccounts[existingIdx] = {
                ...(currentAcc.toObject ? currentAcc.toObject() : currentAcc),
                ...targetAccount,
                _id: currentAcc._id,
            };
        } else {
            console.log("Adding new DBBL account...");
            existingAccounts.push(targetAccount as any);
        }

        user.accounts = existingAccounts;
        user.markModified("accounts");
        await user.save();

        console.log("Successfully updated account!");
        console.log("Updated accounts list:", JSON.stringify(user.accounts, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Error updating account:", err);
        process.exit(1);
    }
}

run();
