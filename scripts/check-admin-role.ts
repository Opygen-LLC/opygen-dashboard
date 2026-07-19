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

async function checkAdmin() {
  const dbConnect = (await import("../src/lib/db")).default;
  const User = (await import("../src/models/User")).default;

  await dbConnect();
  const adminEmail = "syedmohiuddinmeshal24@gmail.com";
  const user = await User.findOne({ email: adminEmail });

  if (user) {
    console.log("Current user details in database:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    if (user.role !== 'admin' || user.status !== 'active') {
      console.log("Forcing user role to 'admin' and status to 'active'...");
      user.role = 'admin';
      user.status = 'active';
      await user.save();
      console.log("Updated user details successfully!");
    } else {
      console.log("User already has correct admin role and active status.");
    }
  } else {
    console.log(`No user found with email ${adminEmail}`);
  }
}

checkAdmin();
