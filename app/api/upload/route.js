import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const { fileBase64, folder = 'portfolio' } = await request.json();
    
    if (!fileBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
      folder,
      transformation: [{ quality: 'auto:best', fetch_format: 'auto' }],
    });

    return NextResponse.json({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}