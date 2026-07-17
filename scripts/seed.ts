import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User";
import Project from "../src/models/Project";
import ActivityLog from "../src/models/ActivityLog";

// Execute manual load of .env.local variables
const envPath = path.join(process.cwd(), ".env.local");
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

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found in environment");
        process.exit(1);
    }

    console.log("Connecting to database...");
    await mongoose.connect(uri);

    console.log("Clearing existing database entries...");
    await User.deleteMany({});
    await Project.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log("Hashing passwords...");
    const passwordHash = await bcrypt.hash("Opygen@16/4/2026", 10);

    const founders = [
        {
            name: "Syed Mohiuddin Meshal",
            email: "syedmohiuddinmeshal24@gmail.com",
            passwordHash,
            role: "admin",
        },
    ];

    console.log("Seeding co-founders...");
    const createdUsers = await User.insertMany(founders);
    console.log(`Seeded ${createdUsers.length} users successfully.`);

    const aliceId = createdUsers[0]._id;
    const bobId = createdUsers[1]._id;
    const charlieId = createdUsers[2]._id;
    const dianaId = createdUsers[3]._id;

    const projects = [
        {
            title: "Initialize OpyDash Codebase",
            description:
                "Set up the Next.js scaffold, Mongoose connection, and NextAuth credentials provider.",
            status: "completed",
            priority: "high",
            assignees: [aliceId, bobId],
            createdBy: aliceId,
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
            title: "Design UI Wireframes & Mockups",
            description:
                "Design key screens including the Stats Dashboard, Kanban Board, and Project Details sheet.",
            status: "in_progress",
            priority: "medium",
            assignees: [bobId, charlieId],
            createdBy: aliceId,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        },
        {
            title: "Implement Recharts & Framer Motion",
            description:
                "Add satisfying animations and workload charts for the co-founders dashboard.",
            status: "todo",
            priority: "high",
            assignees: [charlieId, dianaId],
            createdBy: bobId,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
        {
            title: "Conduct Security Auditing",
            description:
                "Perform validation checks and review permission levels for the admin user.",
            status: "on_hold",
            priority: "urgent",
            assignees: [aliceId, dianaId],
            createdBy: dianaId,
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        },
        {
            title: "Fix Session Refresh Issues",
            description: "Resolve token refresh mismatch on profile updates.",
            status: "in_review",
            priority: "low",
            assignees: [aliceId],
            createdBy: bobId,
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        },
        {
            title: "Overdue Maintenance Task",
            description:
                "This is a sample overdue task to test our overdue calculations.",
            status: "in_progress",
            priority: "high",
            assignees: [dianaId],
            createdBy: aliceId,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
    ];

    console.log("Seeding sample projects...");
    const createdProjects = await Project.insertMany(projects);
    console.log(`Seeded ${createdProjects.length} projects successfully.`);

    const logs = [];
    for (const p of createdProjects) {
        logs.push({
            project: p._id,
            user: p.createdBy,
            type: "details_change",
            message: `created the project "${p.title}"`,
            createdAt: p.createdAt,
        });

        if (p.status === "completed") {
            logs.push({
                project: p._id,
                user: p.assignees[0] || p.createdBy,
                type: "status_change",
                message: "marked the project as completed",
                createdAt: new Date(p.createdAt.getTime() + 60 * 60 * 1000),
            });
        }
    }

    console.log("Seeding activity logs...");
    await ActivityLog.insertMany(logs);
    console.log("Successfully seeded ActivityLogs!");

    await mongoose.disconnect();
    console.log("Database seeding completed successfully!");
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
