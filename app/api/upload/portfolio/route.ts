import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isAdmin, TABLE } from '@/lib/server';

export const dynamic = 'force-dynamic';

type SB = NonNullable<ReturnType<typeof getSupabase>>;

async function readRow(sb: SB, id: number) {
  const { data, error } = await sb.from(TABLE).select('data').eq('id', id).maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}

const writeRow = (sb: SB, id: number, data: unknown) =>
  sb.from(TABLE).upsert({ id, data, updated_at: new Date().toISOString() });

// PUBLIC: every visitor on every device reads the same saved portfolio
export async function GET(req: NextRequest) {
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ data: null, configured: false });
  try {
    const data = await readRow(sb, 1);
    const body: Record<string, unknown> = { data, configured: true };
    if (isAdmin(req)) body.inquiries = (await readRow(sb, 2)) ?? [];
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ data: null, configured: false, error: e.message });
  }
}

// ADMIN ONLY: save albums / photos / profile, or inquiries
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
  const body = await req.json();
  if (body.content) {
    const { error } = await writeRow(sb, 1, body.content);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (Array.isArray(body.inquiries)) {
    const { error } = await writeRow(sb, 2, body.inquiries);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// PUBLIC: contact form -> stored in database so the admin can read it
export async function POST(req: NextRequest) {
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const { inquiry } = await req.json();
  const clip = (v: unknown, n: number) => String(v ?? '').slice(0, n).trim();
  const item = {
    id: `inq-${Date.now()}`,
    name: clip(inquiry?.name, 120),
    email: clip(inquiry?.email, 160),
    subject: clip(inquiry?.subject, 200),
    message: clip(inquiry?.message, 3000),
    date: new Date().toISOString().slice(0, 10),
    read: false,
  };
  if (!item.name || !item.email || !item.message)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  try {
    const list = ((await readRow(sb, 2)) as unknown[]) ?? [];
    const { error } = await writeRow(sb, 2, [item, ...list].slice(0, 200));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}