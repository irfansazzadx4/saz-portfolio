import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { isAdmin } from '../../../../lib/server';

export const dynamic = 'force-dynamic';

// Browser uploads straight to Cloudinary (avoids the Vercel 4.5MB body limit).
// Only a logged-in admin can get a signature.
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret)
    return NextResponse.json({ error: 'Cloudinary env missing' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const folder = String(body.folder || 'portfolio').replace(/[^a-zA-Z0-9_\-/]/g, '');
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);
  return NextResponse.json({ timestamp, folder, signature, apiKey, cloudName });
}