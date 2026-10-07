import mongoose from "mongoose";
import dns from "dns";
import { Resolver } from "dns/promises";

const isDev = process.env.NODE_ENV !== "production";
const isWindows = process.platform === "win32";

// Custom DNS overrides are only safe and needed on local Windows machines with SRV issues.
// In production serverless (Vercel/AWS Lambda), setting external DNS servers causes 5s timeouts or blocked UDP packets.
if (isDev && isWindows) {
    if (typeof dns.setDefaultResultOrder === "function") {
        dns.setDefaultResultOrder("ipv4first");
    }
    try {
        dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    } catch (e) {
        console.warn("Failed to set DNS servers in local dev:", e);
    }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local",
    );
}

let cachedResolvedUri: string | null = null;

async function resolveMongoUri(uri: string): Promise<string> {
    // In production, MongoDB Node driver resolves SRV natively via system libc in <10ms.
    if (!isDev || !isWindows) {
        return uri;
    }

    if (cachedResolvedUri) return cachedResolvedUri;
    if (!uri.startsWith("mongodb+srv://")) {
        cachedResolvedUri = uri;
        return uri;
    }
    try {
        const resolver = new Resolver();
        resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
        const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)\?(.*)$/);
        if (!match) {
            cachedResolvedUri = uri;
            return uri;
        }
        const [, user, pass, host, db, queryParams] = match;
        const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
        if (!srvRecords || srvRecords.length === 0) {
            cachedResolvedUri = uri;
            return uri;
        }
        const hostList = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
        const resolved = `mongodb://${user}:${pass}@${hostList}/${db}?ssl=true&authSource=admin&${queryParams}`;
        cachedResolvedUri = resolved;
        return resolved;
    } catch (e) {
        console.warn("SRV resolution fallback warning:", e);
        cachedResolvedUri = uri;
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
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts: mongoose.ConnectOptions = {
            bufferCommands: false,
            maxPoolSize: 10,
            minPoolSize: 0,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 5000,
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
        cached.conn = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
