import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName) {
      console.warn("Cloudinary configuration missing. Falling back to local data URI.");
      return NextResponse.json({ url: image });
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    let response;

    if (apiSecret && apiKey) {
      // Signed Upload
      const timestamp = Math.round(new Date().getTime() / 1000).toString();
      const folder = 'opydash';
      
      const signString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      // Cloudinary expects sha1 or sha256. SHA-1 is standard for standard upload endpoints.
      const signature = crypto.createHash('sha1').update(signString).digest('hex');

      const formData = new FormData();
      formData.append('file', image);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
    } else {
      return NextResponse.json({ 
        error: 'Cloudinary credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
      }, { status: 400 });
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("Cloudinary Upload Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    return NextResponse.json({ url: data.secure_url });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || 'Server error during upload' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    await deleteFromCloudinary(url);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Upload Deletion API Error:", error);
    return NextResponse.json({ error: error.message || 'Server error during deletion' }, { status: 500 });
  }
}
