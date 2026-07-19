import crypto from 'crypto';

export function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;

  try {
    // A standard Cloudinary URL looks like:
    // https://res.cloudinary.com/cloud_name/image/upload/v12345678/folder/public_id.jpg
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;

    const pathAfterUpload = parts[1];
    
    // Remove the version segment (e.g. "v12345678/") if present
    const cleanPath = pathAfterUpload.replace(/^v\d+\//, '');

    // Remove file extension
    const publicIdWithExtension = cleanPath.split('?')[0]; // strip query parameters
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    if (lastDotIndex === -1) return publicIdWithExtension;

    return publicIdWithExtension.substring(0, lastDotIndex);
  } catch (error) {
    console.error('Error extracting public ID from Cloudinary URL:', error);
    return null;
  }
}

export async function deleteFromCloudinary(url: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("Cloudinary credentials missing. Skipping image deletion.");
    return;
  }

  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;

  try {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    const signString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signString).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const res = await fetch(destroyUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.result === 'ok') {
      console.log(`Successfully deleted Cloudinary resource: ${publicId}`);
    } else {
      console.error(`Failed to delete Cloudinary resource: ${publicId}. Result:`, data);
    }
  } catch (error) {
    console.error(`Error deleting Cloudinary resource: ${publicId}:`, error);
  }
}
