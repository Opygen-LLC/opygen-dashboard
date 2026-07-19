import fs from "fs";
import path from "path";
import crypto from "crypto";

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

async function testUpload() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log("Cloudinary Config:", { cloudName, apiKey, apiSecret: apiSecret ? "SET" : "MISSING" });

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Missing credentials");
    return;
  }

  // Base64 1x1 transparent GIF
  const base64Image = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  const folder = 'opydash';
  
  const signString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signString).digest('hex');

  const formData = new FormData();
  formData.append('file', base64Image);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  try {
    console.log("Sending upload request to Cloudinary...");
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", data);
  } catch (error) {
    console.error("Upload error:", error);
  }
}

testUpload();
