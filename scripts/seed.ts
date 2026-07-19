import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "dns";
import User from "../src/models/User";

if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
}
try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
    console.warn("Failed to set DNS servers:", e);
}

// Execute manual load of environment variables
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

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found in environment");
        process.exit(1);
    }

    console.log("Connecting to database...");
    await mongoose.connect(uri);

    const adminEmail = "syedmohiuddinmeshal24@gmail.com";
    console.log(`Checking if admin user with email ${adminEmail} exists...`);

    const existingAdmin = await User.findOne({ email: adminEmail });
    console.log("existingAdmin found:", existingAdmin);

    if (existingAdmin) {
        console.log("Admin user already exists. Skipping seeding.");
    } else {
        console.log("Admin user does not exist. Creating admin user...");
        const defaultPassword =
            process.env.DEFAULT_PASSWORD || "Opygen@16/4/2026";
        const passwordHash = await bcrypt.hash(defaultPassword, 12);

        await User.create({
            name: "OpyDash Admin",
            email: adminEmail,
            passwordHash,
            role: "admin",
        });
        console.log("Admin user seeded successfully!");
    }

    await mongoose.disconnect();
    console.log("Database connection closed.");
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
