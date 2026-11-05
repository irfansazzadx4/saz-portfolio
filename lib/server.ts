import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export const COOKIE = 'admin_session';
export const TABLE = 'portfolio_state'; // id=1 -> site content, id=2 -> inquiries

const secret = () => process.env.ADMIN_SESSION_SECRET || '';
const adminEmail = () => (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const sign = (payload: string) =>
  createHmac('sha256', secret()).update(payload).digest('hex');

export function makeToken(email: string) {
  const payload = `${email.toLowerCase()}.${Date.now() + 7 * 24 * 3600 * 1000}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString('base64url');
}

export function isAdmin(req: NextRequest): boolean {
  try {
    const raw = req.cookies.get(COOKIE)?.value;
    if (!raw || !secret() || !adminEmail()) return false;
    const decoded = Buffer.from(raw, 'base64url').toString();
    const cut = decoded.lastIndexOf('.');
    const payload = decoded.slice(0, cut);
    const given = Buffer.from(decoded.slice(cut + 1));
    const expected = Buffer.from(sign(payload));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
    const dot = payload.lastIndexOf('.');
    return payload.slice(0, dot) === adminEmail() && Number(payload.slice(dot + 1)) > Date.now();
  } catch {
    return false;
  }
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}