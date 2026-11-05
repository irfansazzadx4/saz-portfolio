import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { COOKIE, getSupabase, isAdmin, makeToken, safeEqual, TABLE } from '../../../lib/server';

export const dynamic = 'force-dynamic';

type Status = { connected: boolean; message: string };

// Session check + LIVE connection status for Cloudinary & Supabase (admin only)
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ authenticated: false });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let cld: Status = {
    connected: false,
    message: 'Env missing: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET',
  };
  if (cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      await cloudinary.api.ping();
      cld = { connected: true, message: `Cloud: ${cloudName}` };
    } catch (e: any) {
      cld = { connected: false, message: e?.error?.message || e?.message || 'Cloudinary rejected the keys' };
    }
  }

  let sup: Status = {
    connected: false,
    message: 'Env missing: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY',
  };
    const sb = getSupabase();
  if (sb) {
    const { error } = await sb
      .from(TABLE)
      .upsert({ id: 0, data: { ping: Date.now() } });
    if (!error) sup = { connected: true, message: 'Read & write OK' };
    else if (/row-level security|permission denied/i.test(error.message))
      sup = {
        connected: false,
        message: 'Write blocked: this is not the service_role key (anon key?)',
      };
    else if (/portfolio_state|schema cache|does not exist/i.test(error.message))
      sup = { connected: false, message: 'Table missing — run supabase.sql' };
    else sup = { connected: false, message: error.message };
  }

  return NextResponse.json({ authenticated: true, cloudinary: cld, supabase: sup });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body.action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(COOKIE);
    return res;
  }

  const email = (process.env.ADMIN_EMAIL || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password || !process.env.ADMIN_SESSION_SECRET)
    return NextResponse.json(
      { error: 'Server env missing: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET' },
      { status: 500 }
    );

  const ok =
    safeEqual(String(body.email || '').trim().toLowerCase(), email.toLowerCase()) &&
    safeEqual(String(body.password || ''), password);
  if (!ok) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600,
  });
  return res;
}