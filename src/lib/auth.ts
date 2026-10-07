import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dbConnect from "./db";
import User from "@/models/User";
import Session from "@/models/Session";
import { UserStatus } from "@/types";

// In-memory cache for active session validity (TTL 60s) to avoid hammering MongoDB on every single request
interface CachedSessionCheck {
    valid: boolean;
    checkedAt: number;
    lastActiveTouched: number;
}
const sessionCache = new Map<string, CachedSessionCheck>();

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please enter your email and password");
                }

                await dbConnect();

                const user = await User.findOne({
                    email: credentials.email.toLowerCase().trim(),
                });

                if (!user) {
                    throw new Error("No user found with that email");
                }

                if (user.status === UserStatus.BLOCKED) {
                    throw new Error("Your account has been blocked. Please contact an administrator.");
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash,
                );

                if (!isValid) {
                    throw new Error("Incorrect password");
                }

                // Enforce max 3 sessions (before adding this new one, keep at most 2)
                const activeSessions = await Session.find({ userId: user._id }).sort({ createdAt: -1 });
                if (activeSessions.length >= 3) {
                    const sessionsToDelete = activeSessions.slice(2); // Keep indices 0 and 1, delete index 2 and older
                    if (sessionsToDelete.length > 0) {
                        const deleteIds = sessionsToDelete.map(s => s._id);
                        await Session.deleteMany({ _id: { $in: deleteIds } });
                    }
                }

                const sessionToken = crypto.randomUUID();
                const userAgent = req?.headers?.["user-agent"] || "Unknown";
                const ipAddress = req?.headers?.["x-forwarded-for"] || "127.0.0.1";

                await Session.create({
                    userId: user._id,
                    sessionToken,
                    userAgent,
                    ipAddress,
                });

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    avatarUrl: user.avatarUrl || "",
                    role: user.role,
                    status: user.status,
                    needPasswordChange: user.needPasswordChange,
                    mobileNumber: user.mobileNumber || "",
                    title: user.title || [],
                    sessionToken,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.status = user.status;
                token.avatarUrl = user.avatarUrl;
                token.needPasswordChange = user.needPasswordChange;
                token.sessionToken = user.sessionToken;
                token.mobileNumber = user.mobileNumber;
                token.title = user.title;
            }
            if (trigger === "update" && session) {
                token.name = session.name || token.name;
                if (session.avatarUrl !== undefined) {
                    token.avatarUrl = session.avatarUrl;
                }
                if (session.needPasswordChange !== undefined) {
                    token.needPasswordChange = session.needPasswordChange;
                }
                if (session.role !== undefined) {
                    token.role = session.role;
                }
                if (session.status !== undefined) {
                    token.status = session.status;
                }
                if (session.mobileNumber !== undefined) {
                    token.mobileNumber = session.mobileNumber;
                }
                if (session.title !== undefined) {
                    token.title = session.title;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                const sToken = token.sessionToken as string | undefined;

                if (sToken) {
                    const now = Date.now();
                    const cachedCheck = sessionCache.get(sToken);

                    let isValid = true; // Default to true if JWT is authentic

                    if (cachedCheck && now - cachedCheck.checkedAt < 300_000) {
                        isValid = cachedCheck.valid;
                    } else {
                        try {
                            await dbConnect();
                            const activeSession = await Session.findOne({ sessionToken: sToken })
                                .select("_id lastActive")
                                .lean()
                                .maxTimeMS(2500);

                            // Only mark invalid if DB successfully responded and session explicitly does not exist
                            isValid = !!activeSession;
                            sessionCache.set(sToken, {
                                valid: isValid,
                                checkedAt: now,
                                lastActiveTouched: cachedCheck?.lastActiveTouched || now,
                            });
                        } catch (dbErr) {
                            console.warn("Session DB verification fallback warning:", dbErr);
                            // On DB timeout/connection lag, preserve JWT validity to prevent intermittent 401
                            isValid = true;
                        }
                    }

                    if (!isValid) {
                        return {
                            ...session,
                            user: null as any,
                            expires: "1970-01-01T00:00:00.000Z",
                        };
                    }

                    // Throttle lastActive updates to at most once every 5 minutes in background (non-blocking)
                    const lastTouch = sessionCache.get(sToken)?.lastActiveTouched || 0;
                    if (now - lastTouch > 5 * 60 * 1000) {
                        if (sessionCache.has(sToken)) {
                            sessionCache.get(sToken)!.lastActiveTouched = now;
                        }
                        Session.updateOne({ sessionToken: sToken }, { $set: { lastActive: new Date() } }).catch(() => {});
                    }
                }

                session.user.id = token.id;
                session.user.role = token.role;
                session.user.status = token.status;
                session.user.avatarUrl = token.avatarUrl;
                session.user.needPasswordChange = token.needPasswordChange;
                session.user.sessionToken = token.sessionToken;
                session.user.mobileNumber = token.mobileNumber;
                session.user.title = token.title;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
