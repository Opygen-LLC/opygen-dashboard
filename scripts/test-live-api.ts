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

async function testLiveApi() {
  const baseUrl = "http://127.0.0.1:3000";
  const email = "syedmohiuddinmeshal24@gmail.com";
  const password = process.env.DEFAULT_PASSWORD || "Opygen@16/4/2026";

  console.log(`Testing authentication against ${baseUrl}...`);

  // 1. Get CSRF Token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  if (!csrfRes.ok) {
    console.error("Failed to fetch CSRF token. Status:", csrfRes.status);
    console.error("Body:", await csrfRes.text());
    return;
  }
  const { csrfToken } = await csrfRes.json();
  console.log("CSRF Token obtained successfully");

  // Extract cookies from CSRF response to maintain session state
  const csrfCookie = csrfRes.headers.get("set-cookie");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (csrfCookie) {
    headers["Cookie"] = csrfCookie.split(";")[0];
  }

  // 2. Perform Login POST
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      csrfToken,
      email,
      password,
      json: "true"
    })
  });

  console.log("Login HTTP Status:", loginRes.status);
  const loginCookies = loginRes.headers.get("set-cookie");
  if (!loginCookies) {
    console.error("No session cookies returned from login. Headers:", loginRes.headers);
    return;
  }

  // Combine cookies
  const sessionCookie = loginCookies.split(";")[0];
  console.log("Logged in successfully. Session cookie obtained.");

  const authenticatedHeaders = {
    "Content-Type": "application/json",
    "Cookie": `${sessionCookie}`,
  };

  // 3. Test Create User POST
  const newUserEmail = `test_live_api_${Math.random().toString(36).substring(7)}@opygen.com`;
  console.log(`\n--- Test 1: POST /api/users/add with email ${newUserEmail} ---`);
  const createUserRes = await fetch(`${baseUrl}/api/users/add`, {
    method: "POST",
    headers: authenticatedHeaders,
    body: JSON.stringify({
      name: "Live API Test User",
      email: newUserEmail,
      role: "member",
      password: "TemporaryPassword123",
      mobileNumber: "",
    })
  });

  console.log("Create User HTTP Status:", createUserRes.status);
  const createUserData = await createUserRes.json();
  console.log("Create User Response:", createUserData);

  // 4. Test Update Profile PATCH
  console.log(`\n--- Test 2: PATCH /api/users/profile ---`);
  const updateProfileRes = await fetch(`${baseUrl}/api/users/profile`, {
    method: "PATCH",
    headers: authenticatedHeaders,
    body: JSON.stringify({
      name: "Syed Mohiuddin Meshal",
      mobileNumber: "",
      avatarUrl: "",
    })
  });

  console.log("Update Profile HTTP Status:", updateProfileRes.status);
  const updateProfileData = await updateProfileRes.json();
  console.log("Update Profile Response:", updateProfileData);
}

testLiveApi().catch(console.error);
