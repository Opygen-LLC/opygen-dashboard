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

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local",
    );
}

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

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
}
const cached = global.mongoose;

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = (async () => {
            const targetUri = await resolveMongoUri(MONGODB_URI!);
            return mongoose.connect(targetUri, opts);
        })();
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
