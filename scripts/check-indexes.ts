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

async function checkIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI");
    return;
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) {
    console.error("No database connection");
    return;
  }

  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  const usersCollection = db.collection("users");
  const indexes = await usersCollection.indexes();
  console.log("\nIndexes on 'users' collection:");
  console.log(JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
}

checkIndexes().catch(console.error);
