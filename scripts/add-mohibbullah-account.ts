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

        const email = "developermohibbullah@gmail.com";
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User not found with email: ${email}`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current mobile: ${user.mobileNumber}`);
        console.log(`Current accounts:`, JSON.stringify(user.accounts, null, 2));

        const existingAccounts = user.accounts || [];
        const existingNagadIdx = existingAccounts.findIndex(
            (acc: any) =>
                acc.providerName?.toLowerCase()?.includes("nagad") ||
                (acc.type === "mobile_banking" && acc.providerName?.toLowerCase()?.includes("nagad"))
        );

        let accountNumber = user.mobileNumber || "01700000000";
        if (existingNagadIdx !== -1 && existingAccounts[existingNagadIdx].accountNumber) {
            accountNumber = existingAccounts[existingNagadIdx].accountNumber;
        }

        const targetAccount = {
            type: "mobile_banking" as const,
            providerName: "Nagad",
            accountName: "Mohibbullah Khan",
            accountNumber: accountNumber,
            routingNumber: "",
            branch: "",
            balance: 8,
            balanceInBdt: 1631.65,
        };

        if (existingNagadIdx !== -1) {
            console.log("Updating existing Nagad account...");
            const currentAcc = existingAccounts[existingNagadIdx] as any;
            existingAccounts[existingNagadIdx] = {
                ...(currentAcc.toObject ? currentAcc.toObject() : currentAcc),
                ...targetAccount,
                _id: currentAcc._id,
            };
        } else {
            console.log("Adding new Nagad account...");
            existingAccounts.push(targetAccount as any);
        }

        user.accounts = existingAccounts;
        user.markModified("accounts");
        await user.save();

        console.log("Successfully added/updated Mohibbullah Khan's Nagad account!");
        console.log("Updated accounts:", JSON.stringify(user.accounts, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Error updating account:", err);
        process.exit(1);
    }
}

run();
