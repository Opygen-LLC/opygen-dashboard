import fs from "fs";
import path from "path";

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

import bcrypt from 'bcryptjs';

async function testAddUser() {
  const dbConnect = (await import("../src/lib/db")).default;
  const User = (await import("../src/models/User")).default;
  const { UserStatus } = await import("../src/types");

  await dbConnect();
  console.log("Connected to database successfully!");

  const email = "test_cofounder_" + Math.random().toString(36).substring(7) + "@opygen.com";
  const password = "TemporaryPassword123";
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  try {
    const newUser = await User.create({
      name: "Test Co-founder",
      email: email,
      passwordHash: passwordHash,
      role: "member",
      mobileNumber: "+1234567890",
      status: UserStatus.PENDING,
      needPasswordChange: true,
    });
    console.log("Successfully created test user:", newUser);
  } catch (error) {
    console.error("Mongoose insertion error:", error);
  }
}

testAddUser();
