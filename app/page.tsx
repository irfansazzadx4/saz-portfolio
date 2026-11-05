// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Camera,
  Sparkles,
  Grid,
  Image as ImageIcon,
  User,
  Mail,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Globe,
  Heart,
  Eye,
  FolderPlus,
  Settings,
  LayoutDashboard,
  LogOut,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Play,
  Pause,
  MapPin,
  Calendar,
  Aperture,
  Code2,
  Copy,
  Database,
  ShieldCheck,
  RefreshCw,
  Search,
  Send,
  Inbox,
  Star,
  Replace
} from 'lucide-react';

// Custom Social Icons
const Instagram = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Facebook = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// ============================================================================
// CLOUD HELPERS (Cloudinary upload + API calls)
// ============================================================================
async function apiFetch(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', ...options, signal: controller.signal });
    let json = {};
    try { json = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Signed direct upload to Cloudinary (file: File | data-URL string) -> permanent https URL
async function uploadImage(source, folder = 'portfolio') {
  const sign = await apiFetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ folder }),
  });
  if (!sign.ok) throw new Error(sign.json.error || 'Upload not authorized (login again)');
  const { cloudName, apiKey, timestamp, signature, folder: f } = sign.json;
  const form = new FormData();
  form.append('file', source);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', f);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const out = await res.json();
  if (!res.ok) throw new Error((out.error && out.error.message) || 'Cloudinary upload failed');
  return { url: out.secure_url, publicId: out.public_id, width: out.width, height: out.height };
}

// Smaller/faster delivery for Cloudinary images (auto format + quality + width)
function cld(url, w = 1200) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (/\/upload\/(f_|q_|w_|c_)/.test(url)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
}

// Phone photo -> resized JPEG data-URL (max 2400px) + detected orientation
function fileToDataUrl(file, maxSide = 2400) {
  return new Promise((resolve, reject) => {
    const objUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objUrl);
      const ratio = w / h;
      resolve({
        url: canvas.toDataURL('image/jpeg', 0.88),
        aspectRatio: ratio > 1.15 ? 'landscape' : ratio < 0.87 ? 'portrait' : 'square',
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error('Could not read ' + file.name));
    };
    img.src = objUrl;
  });
}

// ============================================================================
// INITIAL CURATED DATA (Inspired by Md Sazzad Sarker — Elevated Editorial Style)
// ============================================================================

const INITIAL_PROFILE = {
  siteTitle: 'Md Sazzad Sarker — Visual Archive & Personal Portfolio',
  name: 'Md Sazzad Sarker',
  monogram: 'J·O',
  role: 'Visual Storyteller · Muse & Editorial Portraitist',
  location: 'Cumilla, Bangladesh',
  heroBadge: 'Personal Visual Archive · Curated Editions',
  tagline: 'Capturing quiet grace, golden afternoons, and timeless fragments of life.',
  shortBio:
    'Welcome to my personal visual journal. Every photograph here is an intimate study of light, mood, heritage, and fleeting emotion—preserved in curated chapters.',
  aboutTitle: 'Between Light, Silence & Poetic Nostalgia',
  aboutStory:
    'Photography, for me, has never been merely about documentation—it is about preserving the atmosphere of a moment before it dissolves. From the warm amber glow of late monsoon afternoons in Cumilla to serene solitude by the hills and timeless traditional drapery, this portfolio is a living anthology of my personal portraits and visual memoirs.',
  aboutPhilosophy:
    'I believe in unhurried frames, natural sunlight, and honest expression. Whether draped in heritage jamdani silk or wandering through mist-covered tea gardens, each album is curated to feel like turning the pages of an intimate cinema reel.',
  profilePhoto:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
  secondaryPortrait:
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85',
  email: 'mdsazzadsarker4@gmail.com',
  phone: '+880 1327-291114',
  availability: 'Open for Editorial Collaborations & Creative Features',
  socials: {
    instagram: 'https://instagram.com/__saz__',
    facebook: 'https://facebook.com/irfansazzadx4',
    pinterest: 'https://pinterest.com/Md Sazzad Sarker',
  },
};

const INITIAL_ALBUMS = [
  {
    id: 'alb-golden-hour',
    title: 'Golden Hour Reverie',
    slug: 'golden-hour-reverie',
    category: 'Portraits',
    season: 'Autumn · 2024',
    location: 'Cumilla & Old Town Rooftops',
    description:
      'Intimate portraits bathed in warm amber sunlight—Exploring softness, shadow play, and quiet contemplation as day turns into dusk.',
    coverUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    featured: true,
    createdAt: '2024-11-12',
  },
  {
    id: 'alb-velvet-saree',
    title: 'Heritage in Silk & Jamdani',
    slug: 'heritage-in-silk-jamdani',
    category: 'Traditional',
    season: 'Winter · 2024',
    location: 'Panam Nagar & Heritage Courtyards',
    description:
      'A celebration of timeless Bengali elegance, heirloom weaves, floral adornments, and classic portraiture rooted in cultural grace.',
    coverUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    featured: true,
    createdAt: '2024-12-04',
  },
  {
    id: 'alb-monsoon-letters',
    title: 'Monsoon Letters & Cafe Days',
    slug: 'monsoon-letters-cafe-days',
    category: 'Lifestyle',
    season: 'Monsoon · 2024',
    location: 'Gulshan & Dhanmondi Art Cafes',
    description:
      'Rain-streaked glass, warm espresso, handwritten notes, and candid moments captured across quiet afternoons in the city.',
    coverUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
    featured: true,
    createdAt: '2024-08-19',
  },
  {
    id: 'alb-wanderlust-hills',
    title: 'Whispers of Sylhet & The Sea',
    slug: 'whispers-of-sylhet',
    category: 'Travel Diaries',
    season: 'Spring · 2025',
    location: 'Srimangal Tea Estates & Cox’s Bazar',
    description:
      'Wandering through emerald tea valleys, coastal winds, and mist-draped mornings far away from the city rush.',
    coverUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85',
    featured: true,
    createdAt: '2025-01-22',
  },
  {
    id: 'alb-noir-editorial',
    title: 'Monochrome & Velvet Shadows',
    slug: 'monochrome-velvet-shadows',
    category: 'Editorial',
    season: 'Winter · 2025',
    location: 'Studio Noir, Cumilla',
    description:
      'High-contrast editorial studies focusing on expression, sculptural lighting, and classic cinema moods.',
    coverUrl:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
    featured: false,
    createdAt: '2025-02-10',
  },
];

const INITIAL_PHOTOS = [
  // Album 1: Golden Hour Reverie
  {
    id: 'ph-101',
    albumId: 'alb-golden-hour',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    caption: 'Amber light filtering through the terrace lattice at 4:45 PM.',
    aspectRatio: 'portrait',
    camera: 'Sony A7R V · 85mm f/1.4 GM',
    location: 'Cumilla',
    date: 'Nov 2024',
    featured: true,
    order: 1,
  },
  {
    id: 'ph-102',
    albumId: 'alb-golden-hour',
    url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=85',
    caption: 'Soft breeze and golden hour glow before twilight.',
    aspectRatio: 'portrait',
    camera: 'Sony A7R V · 50mm f/1.2 GM',
    location: 'Cumilla',
    date: 'Nov 2024',
    featured: true,
    order: 2,
  },
  {
    id: 'ph-103',
    albumId: 'alb-golden-hour',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    caption: 'Warmlinen tones and elongated evening shadows.',
    aspectRatio: 'portrait',
    camera: 'Leica Q3 · 28mm Summilux',
    location: 'Banani',
    date: 'Nov 2024',
    featured: false,
    order: 3,
  },
  {
    id: 'ph-104',
    albumId: 'alb-golden-hour',
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=85',
    caption: 'Horizon study — where open skies meet quiet reflection.',
    aspectRatio: 'landscape',
    camera: 'Sony A7R V · 35mm f/1.4 GM',
    location: 'Purbachal',
    date: 'Nov 2024',
    featured: true,
    order: 4,
  },
  {
    id: 'ph-105',
    albumId: 'alb-golden-hour',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=85',
    caption: 'Close-up study in natural window illumination.',
    aspectRatio: 'square',
    camera: 'Sony A7R V · 85mm f/1.4 GM',
    location: 'Cumilla',
    date: 'Nov 2024',
    featured: true,
    order: 5,
  },

  // Album 2: Heritage in Silk & Jamdani
  {
    id: 'ph-201',
    albumId: 'alb-velvet-saree',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    caption: 'Ivory and gold threads — afternoon light in the courtyard.',
    aspectRatio: 'portrait',
    camera: 'Canon EOS R5 · 85mm f/1.2L',
    location: 'Panam Nagar',
    date: 'Dec 2024',
    featured: true,
    order: 1,
  },
  {
    id: 'ph-202',
    albumId: 'alb-velvet-saree',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=85',
    caption: 'Grace in stillness — heirloom portraiture.',
    aspectRatio: 'portrait',
    camera: 'Canon EOS R5 · 50mm f/1.2L',
    location: 'Old Cumilla',
    date: 'Dec 2024',
    featured: true,
    order: 2,
  },
  {
    id: 'ph-203',
    albumId: 'alb-velvet-saree',
    url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=85',
    caption: 'Archways and heritage textures of centuries past.',
    aspectRatio: 'landscape',
    camera: 'Canon EOS R5 · 35mm f/1.4L',
    location: 'Sonargaon',
    date: 'Dec 2024',
    featured: false,
    order: 3,
  },
  {
    id: 'ph-204',
    albumId: 'alb-velvet-saree',
    url: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1200&q=85',
    caption: 'Soft floral accents and twilight serenity.',
    aspectRatio: 'portrait',
    camera: 'Canon EOS R5 · 85mm f/1.2L',
    location: 'Cumilla',
    date: 'Dec 2024',
    featured: false,
    order: 4,
  },

  // Album 3: Monsoon Letters & Cafe Days
  {
    id: 'ph-301',
    albumId: 'alb-monsoon-letters',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
    caption: 'Corner table by the rain-washed window.',
    aspectRatio: 'portrait',
    camera: 'Fujifilm GFX 100 II · 55mm f/1.7',
    location: 'Gulshan 2',
    date: 'Aug 2024',
    featured: true,
    order: 1,
  },
  {
    id: 'ph-302',
    albumId: 'alb-monsoon-letters',
    url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=1200&q=85',
    caption: 'Pages of poetry, warm roast coffee, and unhurried hours.',
    aspectRatio: 'square',
    camera: 'Leica Q3 · 28mm f/1.7',
    location: 'Dhanmondi',
    date: 'Aug 2024',
    featured: false,
    order: 2,
  },
  {
    id: 'ph-303',
    albumId: 'alb-monsoon-letters',
    url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=85',
    caption: 'Candid laughter between monsoon showers.',
    aspectRatio: 'portrait',
    camera: 'Fujifilm GFX 100 II · 80mm f/1.7',
    location: 'Cumilla',
    date: 'Aug 2024',
    featured: true,
    order: 3,
  },

  // Album 4: Whispers of Sylhet & The Sea
  {
    id: 'ph-401',
    albumId: 'alb-wanderlust-hills',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85',
    caption: 'First light over the misty tea valleys of Srimangal.',
    aspectRatio: 'portrait',
    camera: 'Sony A7R V · 50mm f/1.2 GM',
    location: 'Sylhet',
    date: 'Jan 2025',
    featured: true,
    order: 1,
  },
  {
    id: 'ph-402',
    albumId: 'alb-wanderlust-hills',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
    caption: 'Salt wind and silver waves along the quiet southern coast.',
    aspectRatio: 'landscape',
    camera: 'Leica SL3 · 35mm APO',
    location: 'Inani Beach',
    date: 'Jan 2025',
    featured: false,
    order: 2,
  },
  {
    id: 'ph-403',
    albumId: 'alb-wanderlust-hills',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
    caption: 'Dusk silhouettes by the water.',
    aspectRatio: 'portrait',
    camera: 'Sony A7R V · 85mm f/1.4 GM',
    location: 'Cox’s Bazar',
    date: 'Jan 2025',
    featured: false,
    order: 3,
  },

  // Album 5: Monochrome & Velvet Shadows
  {
    id: 'ph-501',
    albumId: 'alb-noir-editorial',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
    caption: 'Study in chiaroscuro and quiet poise.',
    aspectRatio: 'portrait',
    camera: 'Hasselblad X2D 100C · 90mm V',
    location: 'Studio Noir',
    date: 'Feb 2025',
    featured: true,
    order: 1,
  },
  {
    id: 'ph-502',
    albumId: 'alb-noir-editorial',
    url: 'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?auto=format&fit=crop&w=1200&q=85',
    caption: 'Minimalist framing, timeless expression.',
    aspectRatio: 'portrait',
    camera: 'Hasselblad X2D 100C · 55mm V',
    location: 'Studio Noir',
    date: 'Feb 2025',
    featured: false,
    order: 2,
  },
];

const PRESET_CURATED_PHOTOS = [
  {
    label: 'Editorial Silk Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    aspect: 'portrait',
  },
  {
    label: 'Golden Sunlit Muse',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
    aspect: 'portrait',
  },
  {
    label: 'Autumn Cafe Reverie',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
    aspect: 'portrait',
  },
  {
    label: 'Coastal Horizon Study',
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=85',
    aspect: 'landscape',
  },
  {
    label: 'Velvet Evening Portrait',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=85',
    aspect: 'square',
  },
  {
    label: 'Soft Breeze Close-Up',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=85',
    aspect: 'portrait',
  },
];

const INITIAL_INQUIRIES = [
  {
    id: 'inq-1',
    name: 'Arafat Rahman — Vogue South Asia',
    email: 'arafat@editorial-studio.com',
    subject: 'Spring Heritage Editorial Feature',
    message:
      'Hello Jannatul, we loved your "Heritage in Silk & Jamdani" series and would love to invite you for an upcoming print and digital feature in Cumilla.',
    date: '2 days ago',
    read: false,
  },
  {
    id: 'inq-2',
    name: 'Nusrat Jahan',
    email: 'nusrat.art@gmail.com',
    subject: 'Creative Portrait Collaboration',
    message:
      'Your golden hour portraits are breathtaking! Reaching out to inquire about your availability next month for a boutique brand story.',
    date: '5 days ago',
    read: true,
  },
];

// ============================================================================
// PRODUCTION CODE BLUEPRINTS (Next.js + Supabase SQL + Cloudinary Signed API)
// ============================================================================
const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- Project: Md Sazzad Sarker Personal Photo Portfolio & Admin CMS
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILE & SITE SETTINGS TABLE (Single-row configuration)
create table public.site_settings (
  id uuid primary key default uuid_generate_v4(),
  site_title text not null default 'Md Sazzad Sarker — Portfolio',
  name text not null default 'Md Sazzad Sarker',
  role text not null,
  tagline text,
  short_bio text,
  about_title text,
  about_story text,
  about_philosophy text,
  profile_photo_url text not null,
  profile_photo_public_id text,
  email text,
  location text,
  instagram_url text,
  facebook_url text,
  pinterest_url text,
  updated_at timestamptz default now()
);

-- 2. PHOTO ALBUMS TABLE
create table public.albums (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  category text not null default 'Portraits',
  season text,
  location text,
  description text,
  cover_url text not null,
  cover_public_id text,
  featured boolean default false,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. PHOTOS TABLE (Linked to Albums with cascade delete)
create table public.photos (
  id uuid primary key default uuid_generate_v4(),
  album_id uuid not null references public.albums(id) on delete cascade,
  url text not null,
  cloudinary_public_id text,
  caption text,
  aspect_ratio text default 'portrait' check (aspect_ratio in ('portrait', 'landscape', 'square')),
  camera_exif text,
  location text,
  taken_date text,
  featured boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.site_settings enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;

-- Public Read Access Policies (Anyone visiting the portfolio can view)
create policy "Public can read site_settings"
  on public.site_settings for select using (true);

create policy "Public can read albums"
  on public.albums for select using (true);

create policy "Public can read photos"
  on public.photos for select using (true);

-- Authenticated Admin Full Access Policies (Only signed-in admins can mutate)
create policy "Admins have full access to site_settings"
  on public.site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admins have full access to albums"
  on public.albums for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admins have full access to photos"
  on public.photos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');`;

const CLOUDINARY_API_CODE = `// ============================================================================
// FILE: app/api/cloudinary/sign/route.ts
// Secure Server-Side Cloudinary Signature Endpoint (Next.js App Router)
// Never exposes CLOUDINARY_API_SECRET to the browser
// ============================================================================
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  // 1. Verify Admin Session via Supabase Auth
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized Admin Access' }, { status: 401 });
  }

  // 2. Generate Signed Upload Parameters
  const body = await request.json();
  const folder = body.folder || 'jannatul-obonty-portfolio';
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, transformation: 'q_auto,f_auto' },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    timestamp,
    folder,
    signature,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  });
}`;

const ENV_EXAMPLE_CODE = `# ============================================================================
# FILE: .env.local (Copy from .env.example)
# ============================================================================

# 1. Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Server-only!

# 2. Cloudinary Image CDN & Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your_private_cloudinary_api_secret" # Server-only!

# 3. Admin Allowed Email
ADMIN_EMAIL="mdsazzadsarker4@gmail.com"`;

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Secret URL /arthur detect kore admin mode e niye jabe
    if (typeof window !== 'undefined' && window.location.pathname === '/arthur') {
      setActivePage('admin');
    }
  }, []);
  // Theme State ('light' = Warm Alabaster Editorial, 'dark' = Obsidian Velvet)
  const [theme, setTheme] = useState('light');

  // Navigation State: 'home' | 'albums' | 'album-detail' | 'about' | 'contact' | 'admin'
  const [activePage, setActivePage] = useState('home');
  const [selectedAlbumId, setSelectedAlbumId] = useState(INITIAL_ALBUMS[0].id);

  // Dynamic Database State (saved in Supabase, shared by all visitors)
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [albums, setAlbums] = useState(INITIAL_ALBUMS);
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [inquiries, setInquiries] = useState(INITIAL_INQUIRIES);

  // Public Gallery Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [albumSearchQuery, setAlbumSearchQuery] = useState('');
  const [detailAspectFilter, setDetailAspectFilter] = useState('all'); // 'all' | 'portrait' | 'landscape' | 'square'
  const [detailLayoutMode, setDetailLayoutMode] = useState('album'); // 'masonry' | 'editorial'
  const [likedPhotos, setLikedPhotos] = useState({});

  // Lightbox State
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    photoList: [],
    currentIndex: 0,
    isZoomed: false,
    isPlaying: false,
  });

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3800);
    
    return () => clearTimeout(timer);
  }, [toast]);

  // Admin Auth & Dashboard State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminTab, setAdminTab] = useState('overview'); // 'overview' | 'albums' | 'photos' | 'profile' | 'inquiries' | 'blueprint'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // Confirmation Modal State (No window.confirm allowed)
  const [confirmDialog, setConfirmDialog] = useState(null);


  // ==========================================================================
  // SERVER SYNC (Supabase DB + Cloudinary) — the fix for "uploads not visible"
  // ==========================================================================
  const [integrations, setIntegrations] = useState(null);
  const [syncState, setSyncState] = useState('idle'); // idle | saving | saved | error
  const loadedRef = useRef(false);
  const lastContentRef = useRef('');
  const lastInquiriesRef = useRef('');

  const buildPayload = (p, a, ph) =>
    JSON.stringify({
      profile: p,
      albums: a.map(({ photos: _x, photoCount: _y, ...rest }) => rest),
      photos: ph,
    });
  const contentPayload = useMemo(
    () => buildPayload(profile, albums, photos),
    [profile, albums, photos]
  );

  const loadPortfolio = useCallback(async () => {
    try {
      const { ok, json } = await apiFetch('/api/portfolio');
      let p = INITIAL_PROFILE;
      let a = INITIAL_ALBUMS;
      let ph = INITIAL_PHOTOS;
      if (json.data) {
        if (json.data.profile) p = { ...INITIAL_PROFILE, ...json.data.profile };
        if (Array.isArray(json.data.albums)) a = json.data.albums;
        if (Array.isArray(json.data.photos)) ph = json.data.photos;
        setProfile(p);
        setAlbums(a);
        setPhotos(ph);
      }
      if (Array.isArray(json.inquiries)) {
        setInquiries(json.inquiries);
        lastInquiriesRef.current = JSON.stringify(json.inquiries);
      }
      lastContentRef.current = buildPayload(p, a, ph);
      loadedRef.current = ok && json.configured !== false;
    } catch (e) {
      loadedRef.current = false;
    }
  }, []);

  const checkAdmin = useCallback(async () => {
    try {
      const { json } = await apiFetch('/api/admin');
      setIsAdminAuthenticated(!!json.authenticated);
      setIntegrations(json.authenticated ? json : null);
      return !!json.authenticated;
    } catch (e) {
      return false;
    }
  }, []);

  // First load: everybody (public + admin) pulls the same data from the server
  useEffect(() => {
    (async () => {
      await loadPortfolio();
      await checkAdmin();
      setIsMounted(true);
    })();
  }, [loadPortfolio, checkAdmin]);

  // Auto-save (admin only) — debounced
  useEffect(() => {
    if (!isAdminAuthenticated || !loadedRef.current) return;
    if (contentPayload === lastContentRef.current) return;
    setSyncState('saving');
    const t = setTimeout(async () => {
      const { ok, json } = await apiFetch('/api/portfolio', {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify({ content: JSON.parse(contentPayload) }),
      }, 30000).catch(() => ({ ok: false, json: { error: 'Network error' } }));
      if (ok) {
        lastContentRef.current = contentPayload;
        setSyncState('saved');
      } else {
        setSyncState('error');
        showToast('Save failed: ' + (json.error || 'unknown error'), 'error');
      }
    }, 700);
    return () => clearTimeout(t);
  }, [contentPayload, isAdminAuthenticated]);

  useEffect(() => {
    if (!isAdminAuthenticated || !loadedRef.current) return;
    const str = JSON.stringify(inquiries);
    if (str === lastInquiriesRef.current) return;
    const t = setTimeout(async () => {
      const { ok } = await apiFetch('/api/portfolio', {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify({ inquiries }),
      }).catch(() => ({ ok: false }));
      if (ok) lastInquiriesRef.current = str;
    }, 500);
    return () => clearTimeout(t);
  }, [inquiries, isAdminAuthenticated]);

  const handleAdminLogin = async (email, password) => {
    try {
      const { ok, json } = await apiFetch('/api/admin', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ action: 'login', email, password }),
      });
      if (!ok) return { ok: false, error: json.error || 'Login failed' };
      await loadPortfolio();
      await checkAdmin();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Network error. Try again.' };
    }
  };

  const handleAdminLogout = async () => {
    await apiFetch('/api/admin', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => {});
    setIsAdminAuthenticated(false);
    setIntegrations(null);
  };

  // Derived Album Counts & Enriched Albums
  const enrichedAlbums = useMemo(() => {
    return albums.map((album) => {
      const albumPhotos = photos
        .filter((p) => p.albumId === album.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      return {
        ...album,
        photoCount: albumPhotos.length,
        photos: albumPhotos,
        coverUrl: album.coverUrl || (albumPhotos[0] ? albumPhotos[0].url : INITIAL_PROFILE.profilePhoto),
      };
    });
  }, [albums, photos]);

  const currentSelectedAlbum = useMemo(() => {
    return (
      enrichedAlbums.find((a) => a.id === selectedAlbumId) ||
      enrichedAlbums[0] ||
      null
    );
  }, [enrichedAlbums, selectedAlbumId]);

  const categories = useMemo(() => {
    const set = new Set(['All']);
    albums.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [albums]);

  // Navigate helper with smooth scroll to top
  const navigateTo = (page, albumId = null) => {
    if (albumId) {
      setSelectedAlbumId(albumId);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Lightbox helper
  const openLightbox = (photoList, index = 0) => {
    if (!photoList || photoList.length === 0) return;
    setLightbox({
      isOpen: true,
      photoList,
      currentIndex: index,
      isZoomed: false,
      isPlaying: false,
    });
  };

  const closeLightbox = useCallback(() => {
    setLightbox((prev) => ({ ...prev, isOpen: false, isZoomed: false, isPlaying: false }));
  }, []);

  const nextLightboxPhoto = useCallback(() => {
    setLightbox((prev) => {
      if (!prev.photoList.length) return prev;
      return {
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.photoList.length,
        isZoomed: false,
      };
    });
  }, []);

  const prevLightboxPhoto = useCallback(() => {
    setLightbox((prev) => {
      if (!prev.photoList.length) return prev;
      return {
        ...prev,
        currentIndex:
          (prev.currentIndex - 1 + prev.photoList.length) % prev.photoList.length,
        isZoomed: false,
      };
    });
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightbox.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxPhoto();
      if (e.key === 'ArrowLeft') prevLightboxPhoto();
      if (e.key === 'z' || e.key === 'Z') {
        setLightbox((prev) => ({ ...prev, isZoomed: !prev.isZoomed }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen, closeLightbox, nextLightboxPhoto, prevLightboxPhoto]);

  // Slideshow autoplay inside Lightbox
  useEffect(() => {
    if (!lightbox.isOpen || !lightbox.isPlaying) return;
    const timer = setInterval(() => {
      nextLightboxPhoto();
    }, 3200);
    return () => clearInterval(timer);
  }, [lightbox.isOpen, lightbox.isPlaying, nextLightboxPhoto]);

  // Reset Demo Data Handler
  const handleResetDemoData = () => {
    setConfirmDialog({
      title: 'Restore Original Curated Portfolio?',
      description:
        'This will reset all albums, photographs, and profile settings back to Md Sazzad Sarker’s default luxury editorial dataset.',
      confirmText: 'Restore Default Data',
      onConfirm: () => {
        setProfile(INITIAL_PROFILE);
        setAlbums(INITIAL_ALBUMS);
        setPhotos(INITIAL_PHOTOS);
        setInquiries(INITIAL_INQUIRIES);
        showToast('Portfolio restored to original curated state.');
        setConfirmDialog(null);
      },
    });
  };

  const isDark = theme === 'dark';
if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0c0d0e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div
      className={`min-h-screen transition-colors duration-500 selection:bg-[#C5A880]/30 ${
        isDark
          ? 'bg-[#0F0E0C] text-[#F5F2EB]'
          : 'bg-[#FAF8F5] text-[#18181B]'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Inject Editorial Google Fonts & Custom Utility Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        .font-serif-editorial {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .font-mono-meta {
          font-family: 'JetBrains Mono', monospace;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: subtleFloat 6s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle Ambient Background Aura */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[780px] h-[420px] rounded-full blur-[130px] transition-opacity duration-700 ${
            isDark
              ? 'bg-[#C5A880]/10 opacity-60'
              : 'bg-[#E6D7C3]/60 opacity-80'
          }`}
        />
      </div>

      {/* ====================================================================
          TOP GLASSMORPHISM NAVIGATION BAR
         ==================================================================== */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${
          isDark
            ? 'bg-[#0F0E0C]/85 border-[#2A2622]'
            : 'bg-[#FAF8F5]/85 border-[#E6DFD5]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <button
            onClick={() => navigateTo('home')}
            className="group flex items-center gap-3.5 text-left focus:outline-none"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#C5A880]/60 shadow-sm flex-shrink-0">
              <img
                src={profile.profilePhoto}
                alt={profile.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div>
              <span className="font-serif-editorial text-xl sm:text-2xl font-semibold tracking-tight block leading-none">
                {profile.name}
              </span>
              <span
                className={`font-mono-meta text-[10px] uppercase tracking-[0.22em] block mt-1 ${
                  isDark ? 'text-[#A8A29E]' : 'text-[#78716C]'
                }`}
              >
                Visual Archive
              </span>
            </div>
          </button>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {[
              { id: 'home', label: 'Home' },
              { id: 'albums', label: `Albums (${albums.length})` },
              { id: 'about', label: 'About Me' },
              { id: 'contact', label: 'Contact' },
            ].map((item) => {
              const isActive =
                activePage === item.id ||
                (item.id === 'albums' && activePage === 'album-detail');
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? isDark
                        ? 'bg-[#F5F2EB] text-[#0F0E0C]'
                        : 'bg-[#18181B] text-[#FAF8F5]'
                      : isDark
                      ? 'text-[#A8A29E] hover:text-[#F5F2EB] hover:bg-white/5'
                      : 'text-[#57534E] hover:text-[#18181B] hover:bg-black/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Only Theme Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? 'Switch to Warm Ivory Mode' : 'Switch to Obsidian Dark Mode'}
              className={`p-2.5 rounded-full border transition-all ${
                isDark
                  ? 'border-[#2A2622] bg-[#181614] text-[#D4AF37] hover:border-[#D4AF37]/50'
                  : 'border-[#E6DFD5] bg-[#F3EFEA] text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Bottom-Row Sub-Navigation */}
        <div
          className={`flex md:hidden items-center justify-around py-2 px-3 border-t text-xs ${
            isDark ? 'border-[#2A2622] bg-[#0F0E0C]' : 'border-[#E6DFD5] bg-[#FAF8F5]'
          }`}
        >
          {[
            { id: 'home', label: 'Home' },
            { id: 'albums', label: `Albums (${albums.length})` },
            { id: 'about', label: 'About' },
            { id: 'contact', label: 'Contact' },
          ].map((item) => {
            const isActive =
              activePage === item.id ||
              (item.id === 'albums' && activePage === 'album-detail');
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-[#F5F2EB] text-[#0F0E0C]'
                      : 'bg-[#18181B] text-[#FAF8F5]'
                    : ' opacity-70'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ====================================================================
          MAIN VIEW ROUTER
         ==================================================================== */}
      <main className="relative z-10">
        {activePage === 'home' && (
          <HomeView
            profile={profile}
            albums={enrichedAlbums}
            photos={photos}
            isDark={isDark}
            onOpenAlbum={(albumId) => navigateTo('album-detail', albumId)}
            onNavigate={navigateTo}
            onOpenLightbox={openLightbox}
            likedPhotos={likedPhotos}
            setLikedPhotos={setLikedPhotos}
          />
        )}

        {activePage === 'albums' && (
          <AlbumsCatalogView
            albums={enrichedAlbums}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={albumSearchQuery}
            setSearchQuery={setAlbumSearchQuery}
            isDark={isDark}
            onOpenAlbum={(albumId) => navigateTo('album-detail', albumId)}
          />
        )}

        {activePage === 'album-detail' && currentSelectedAlbum && (
          <AlbumDetailView
            album={currentSelectedAlbum}
            allAlbums={enrichedAlbums}
            isDark={isDark}
            aspectFilter={detailAspectFilter}
            setAspectFilter={setDetailAspectFilter}
            layoutMode={detailLayoutMode}
            setLayoutMode={setDetailLayoutMode}
            onBack={() => navigateTo('albums')}
            onSelectAlbum={(albumId) => navigateTo('album-detail', albumId)}
            onOpenLightbox={openLightbox}
            likedPhotos={likedPhotos}
            setLikedPhotos={setLikedPhotos}
            onJumpToAdminUpload={() => {
              setAdminTab('photos');
              navigateTo('admin');
            }}
          />
        )}

        {activePage === 'about' && (
          <AboutView
            profile={profile}
            albumsCount={albums.length}
            photosCount={photos.length}
            isDark={isDark}
            onNavigate={navigateTo}
          />
        )}

        {activePage === 'contact' && (
          <ContactView
            profile={profile}
            isDark={isDark}
            onSubmitInquiry={async (newInquiry) => {
              try {
                const { ok } = await apiFetch('/api/portfolio', {
                  method: 'POST',
                  headers: JSON_HEADERS,
                  body: JSON.stringify({ inquiry: newInquiry }),
                });
                if (!ok) throw new Error('failed');
                showToast('Your message has been delivered. Thank you!');
              } catch (e) {
                showToast('Could not send message. Please try again.', 'error');
              }
            }}
          />
        )}

        {activePage === 'admin' && (
          <AdminPortalView
            isAuthenticated={isAdminAuthenticated}
            setIsAuthenticated={setIsAdminAuthenticated}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            integrations={integrations}
            onRecheck={checkAdmin}
            syncState={syncState}
            loginEmail={loginEmail}
            setLoginEmail={setLoginEmail}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            profile={profile}
            setProfile={setProfile}
            albums={enrichedAlbums}
            setAlbums={setAlbums}
            photos={photos}
            setPhotos={setPhotos}
            inquiries={inquiries}
            setInquiries={setInquiries}
            isDark={isDark}
            showToast={showToast}
            setConfirmDialog={setConfirmDialog}
            onViewLiveAlbum={(albumId) => navigateTo('album-detail', albumId)}
            onResetDemo={handleResetDemoData}
          />
        )}
      </main>

      {/* ====================================================================
          EDITORIAL FOOTER
         ==================================================================== */}
      <footer
        className={`relative z-10 border-t mt-24 transition-colors ${
          isDark
            ? 'border-[#2A2622] bg-[#0B0A09] text-[#A8A29E]'
            : 'border-[#E6DFD5] bg-[#F3EFEA]/70 text-[#57534E]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-current/10">
            {/* Left Column: Brand & Bio */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={profile.profilePhoto}
                  alt={profile.name}
                  className="w-11 h-11 rounded-full object-cover border border-[#C5A880]"
                />
                <div>
                  <h3
                    className={`font-serif-editorial text-2xl font-semibold ${
                      isDark ? 'text-[#F5F2EB]' : 'text-[#18181B]'
                    }`}
                  >
                    {profile.name}
                  </h3>
                  <p className="font-mono-meta text-xs uppercase tracking-widest text-[#C5A880]">
                    {profile.location}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                {profile.shortBio}
              </p>
            </div>

            {/* Right Column: Public Navigation Links */}
            <div className="md:col-span-5 space-y-3">
              <p
                className={`font-mono-meta text-xs uppercase tracking-[0.2em] ${
                  isDark ? 'text-[#F5F2EB]' : 'text-[#18181B]'
                }`}
              >
                Navigation
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => navigateTo('home')}
                    className="hover:text-[#C5A880] transition-colors"
                  >
                    Home & Hero Portrait
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('albums')}
                    className="hover:text-[#C5A880] transition-colors"
                  >
                    Photo Albums ({albums.length})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('about')}
                    className="hover:text-[#C5A880] transition-colors"
                  >
                    About & Philosophy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('contact')}
                    className="hover:text-[#C5A880] transition-colors"
                  >
                    Contact & Inquiries
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright & Socials */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>
              © 2026 {profile.name}. All rights reserved. Curated Personal Visual Portfolio.
            </p>
            <div className="flex items-center gap-5">
              <a
                href={profile.socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#C5A880] transition-colors"
              >
                Instagram
              </a>
              <a
                href={profile.socials.facebook}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#C5A880] transition-colors"
              >
                Facebook
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="hover:text-[#C5A880] transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ====================================================================
          FULLSCREEN LIGHTBOX MODAL
         ==================================================================== */}
      {lightbox.isOpen && lightbox.photoList[lightbox.currentIndex] && (
        <LightboxModal
          lightbox={lightbox}
          setLightbox={setLightbox}
          onClose={closeLightbox}
          onNext={nextLightboxPhoto}
          onPrev={prevLightboxPhoto}
        />
      )}

      {/* ====================================================================
          CUSTOM CONFIRMATION DIALOG (No window.confirm)
         ==================================================================== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl space-y-5 ${
              isDark
                ? 'bg-[#181614] border-[#2A2622] text-[#F5F2EB]'
                : 'bg-[#FAF8F5] border-[#E6DFD5] text-[#18181B]'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-full bg-red-500/10 text-red-500 flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-editorial text-2xl font-semibold">
                  {confirmDialog.title}
                </h4>
                <p
                  className={`text-sm mt-1 leading-relaxed ${
                    isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
                  }`}
                >
                  {confirmDialog.description}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className={`px-4 py-2 rounded-full text-xs font-medium border ${
                  isDark
                    ? 'border-[#2A2622] hover:bg-white/5'
                    : 'border-[#D6C7B2] hover:bg-black/5'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 rounded-full text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition"
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TOAST NOTIFICATION
         ==================================================================== */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border bg-[#18181B] text-[#FAF8F5] border-[#C5A880]/50 animate-fade-up">
          <CheckCircle2 className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-white/60 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 1. HOME VIEW (Hero Portrait + Albums Showcase + Curated Highlights)
// ============================================================================
function HomeView({
  profile,
  albums,
  photos,
  isDark,
  onOpenAlbum,
  onNavigate,
  onOpenLightbox,
  likedPhotos,
  setLikedPhotos,
}) {
  const featuredPhotos = useMemo(() => {
    const list = photos.filter((p) => p.featured);
    return list.length > 0 ? list.slice(0, 8) : photos.slice(0, 8);
  }, [photos]);

  return (
    <div className="space-y-24 sm:space-y-32 pb-12">
      {/* ------------------------------------------------------------------
          HERO SECTION (Inspired by jannatul-obonty.vercel.app, Elevated)
         ------------------------------------------------------------------ */}
      <section className="relative pt-8 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-10 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center animate-fade-up">
          {/* Top Editorial Eyebrow Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono-meta uppercase tracking-[0.22em] border mb-8 ${
              isDark
                ? 'bg-[#181614] border-[#2A2622] text-[#D4AF37]'
                : 'bg-[#F3EFEA] border-[#E6DFD5] text-[#78716C]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{profile.heroBadge}</span>
          </div>

          {/* PROMINENT PERSONAL PROFILE PORTRAIT AT THE VERY TOP */}
          <div className="relative group mb-10">
            {/* Decorative Champagne Gold Outer Ring */}
            <div className="absolute -inset-3 rounded-[160px] border border-[#C5A880]/40 pointer-events-none transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute -inset-6 rounded-[180px] border border-[#C5A880]/15 pointer-events-none hidden sm:block" />

            {/* Main Arched Editorial Portrait Container */}
            <div
              onClick={() =>
                onOpenLightbox(
                  [
                    {
                      id: 'hero-portrait',
                      url: profile.profilePhoto,
                      caption: `${profile.name} — ${profile.tagline}`,
                      camera: 'Featured Profile Portrait',
                      location: profile.location,
                    },
                  ],
                  0
                )
              }
              className="relative w-64 h-80 sm:w-80 sm:h-[400px] rounded-[150px] overflow-hidden shadow-2xl border-2 border-[#C5A880]/60 cursor-pointer"
            >
              <img
                src={profile.profilePhoto}
                alt={profile.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-mono-meta">
                  <Maximize2 className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Full Portrait</span>
                </span>
              </div>
            </div>

            {/* Floating Location Pill */}
            <div
              className={`animate-float absolute -bottom-3 -right-4 sm:-right-8 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md flex items-center gap-2 text-xs font-mono-meta ${
                isDark
                  ? 'bg-[#181614]/95 border-[#2A2622] text-[#F5F2EB]'
                  : 'bg-[#FAF8F5]/95 border-[#E6DFD5] text-[#18181B]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{profile.location}</span>
            </div>
          </div>

          {/* ELEGANT TYPOGRAPHY FOR PERSON'S NAME */}
          <h1 className="font-serif-editorial text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight leading-[0.98]">
            {profile.name}
          </h1>

          {/* Subtitle / Role */}
          <p className="font-mono-meta text-xs sm:text-sm uppercase tracking-[0.25em] text-[#C5A880] mt-4">
            {profile.role}
          </p>

          {/* Poetic Tagline & Short Bio */}
          <p className="font-serif-editorial italic text-xl sm:text-2xl mt-5 max-w-2xl opacity-90">
            “{profile.tagline}”
          </p>

          <p
            className={`mt-4 text-sm sm:text-base max-w-xl leading-relaxed ${
              isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
            }`}
          >
            {profile.shortBio}
          </p>

          {/* Social Links & Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={() => {
                const el = document.getElementById('albums-showcase');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else onNavigate('albums');
              }}
              className={`group inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-sm font-medium transition-all shadow-sm ${
                isDark
                  ? 'bg-[#F5F2EB] text-[#0F0E0C] hover:bg-[#C5A880]'
                  : 'bg-[#18181B] text-[#FAF8F5] hover:bg-[#33302E]'
              }`}
            >
              <span>Explore Photo Albums</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onOpenLightbox(photos, 0)}
              className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-medium border transition-all ${
                isDark
                  ? 'border-[#2A2622] bg-[#181614] hover:border-[#C5A880]'
                  : 'border-[#D6C7B2] bg-[#F3EFEA] hover:border-[#18181B]'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Play Visual Reel ({photos.length})</span>
            </button>
          </div>

          {/* Social Icons Row */}
          <div className="mt-8 flex items-center gap-3">
            {[
              {
                label: 'Instagram',
                href: profile.socials.instagram,
                icon: Instagram,
              },
              {
                label: 'Facebook',
                href: profile.socials.facebook,
                icon: Facebook,
              },
              {
                label: 'Pinterest',
                href: profile.socials.pinterest,
                icon: Globe,
              },
              {
                label: 'Email',
                href: `mailto:${profile.email}`,
                icon: Mail,
              },
            ].map((soc) => {
              const IconComp = soc.icon;
              return (
                <a
                  key={soc.label}
                  href={soc.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={soc.label}
                  className={`p-3 rounded-full border transition-all hover:-translate-y-0.5 ${
                    isDark
                      ? 'border-[#2A2622] bg-[#181614] text-[#A8A29E] hover:text-[#F5F2EB] hover:border-[#C5A880]'
                      : 'border-[#E6DFD5] bg-[#F3EFEA] text-[#57534E] hover:text-[#18181B] hover:border-[#C5A880]'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </a>
              );
            })}
          </div>

          {/* Quick Portfolio Metrics Bar */}
          <div
            className={`mt-12 grid grid-cols-3 gap-6 sm:gap-14 px-8 py-5 rounded-3xl border ${
              isDark
                ? 'bg-[#181614]/70 border-[#2A2622]'
                : 'bg-[#F3EFEA]/80 border-[#E6DFD5]'
            }`}
          >
            <div>
              <p className="font-serif-editorial text-3xl sm:text-4xl font-semibold">
                {String(albums.length).padStart(2, '0')}
              </p>
              <p className="font-mono-meta text-[10px] sm:text-xs uppercase tracking-widest opacity-70 mt-0.5">
                Curated Albums
              </p>
            </div>
            <div className="border-x border-current/10 px-6 sm:px-12">
              <p className="font-serif-editorial text-3xl sm:text-4xl font-semibold">
                {String(photos.length).padStart(2, '0')}
              </p>
              <p className="font-mono-meta text-[10px] sm:text-xs uppercase tracking-widest opacity-70 mt-0.5">
                Photographs
              </p>
            </div>
            <div>
              <p className="font-serif-editorial text-3xl sm:text-4xl font-semibold">
                4K
              </p>
              <p className="font-mono-meta text-[10px] sm:text-xs uppercase tracking-widest opacity-70 mt-0.5">
                Editorial Archive
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          CURATED PHOTO ALBUMS SECTION (Most Important Feature)
         ------------------------------------------------------------------ */}
      <section
        id="albums-showcase"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6 border-current/10">
          <div>
            <p className="font-mono-meta text-xs uppercase tracking-[0.25em] text-[#C5A880]">
              01 · Visual Chapters
            </p>
            <h2 className="font-serif-editorial text-4xl sm:text-5xl font-normal mt-2">
              Curated Photo Albums
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p
              className={`text-sm max-w-md ${
                isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
              }`}
            >
              Select any album below to open its complete high-resolution gallery and story.
            </p>
            <button
              onClick={() => onNavigate('albums')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono-meta uppercase tracking-wider border border-[#C5A880]/50 hover:bg-[#C5A880] hover:text-[#0F0E0C] transition whitespace-nowrap"
            >
              <span>All Albums</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Album Editorial Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {albums.map((album, idx) => (
            <AlbumEditorialCard
              key={album.id}
              album={album}
              index={idx}
              isDark={isDark}
              onClick={() => onOpenAlbum(album.id)}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------
          SELECTED FRAMES MASONRY SHOWCASE
         ------------------------------------------------------------------ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6 border-current/10">
          <div>
            <p className="font-mono-meta text-xs uppercase tracking-[0.25em] text-[#C5A880]">
              02 · Selected Highlights
            </p>
            <h2 className="font-serif-editorial text-4xl sm:text-5xl font-normal mt-2">
              Featured Frames & Portraits
            </h2>
          </div>
          <p className="font-mono-meta text-xs uppercase tracking-widest opacity-70">
            Click any photograph for fullscreen lightbox inspection
          </p>
        </div>

        <div className="columns-2 lg:columns-3 gap-3 sm:gap-6 space-y-3 sm:space-y-6">
          {featuredPhotos.map((photo, index) => {
            const parentAlbum = albums.find((a) => a.id === photo.albumId);
            const isLiked = !!likedPhotos[photo.id];
            return (
              <div
                key={photo.id}
                className={`break-inside-avoid group relative rounded-2xl overflow-hidden border transition-all duration-500 ${
                  isDark
                    ? 'bg-[#181614] border-[#2A2622]'
                    : 'bg-[#F3EFEA] border-[#E6DFD5]'
                }`}
              >
                <div
                  onClick={() => onOpenLightbox(featuredPhotos, index)}
                  className="relative overflow-hidden cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    loading="lazy"
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5 text-white">
                    <div className="flex items-center justify-between">
                      {parentAlbum && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAlbum(parentAlbum.id);
                          }}
                          className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-mono-meta uppercase tracking-wider hover:bg-[#C5A880] hover:text-black transition"
                        >
                          {parentAlbum.title}
                        </span>
                      )}
                      <span className="p-2 rounded-full bg-black/50 backdrop-blur-md">
                        <Maximize2 className="w-3.5 h-3.5 text-[#C5A880]" />
                      </span>
                    </div>

                    <div>
                      <p className="font-serif-editorial text-lg leading-snug">
                        {photo.caption}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[11px] font-mono-meta text-white/75">
                        <span>{photo.location || 'Cumilla'}</span>
                        <span>{photo.date || '2025'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle Bottom Meta Strip */}
                <div className="px-4 py-3 flex items-center justify-between text-xs">
                  <span className="truncate opacity-80 font-medium">
                    {photo.caption}
                  </span>
                  <button
                    onClick={() =>
                      setLikedPhotos((prev) => ({
                        ...prev,
                        [photo.id]: !prev[photo.id],
                      }))
                    }
                    className={`ml-2 p-1.5 rounded-full transition ${
                      isLiked
                        ? 'text-rose-500'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------
          EDITORIAL STORY BANNER / ABOUT PREVIEW
         ------------------------------------------------------------------ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div
          className={`rounded-3xl p-8 sm:p-12 lg:p-16 border grid grid-cols-1 lg:grid-cols-12 gap-10 items-center ${
            isDark
              ? 'bg-[#181614] border-[#2A2622]'
              : 'bg-[#F3EFEA] border-[#E6DFD5]'
          }`}
        >
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-[#C5A880]/40 shadow-xl">
              <img
                src={profile.secondaryPortrait || profile.profilePhoto}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <p className="font-mono-meta text-xs uppercase tracking-[0.24em] text-[#C5A880]">
              03 · Behind The Frame
            </p>
            <h3 className="font-serif-editorial text-3xl sm:text-5xl font-normal leading-tight">
              {profile.aboutTitle}
            </h3>
            <p
              className={`text-sm sm:text-base leading-relaxed ${
                isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
              }`}
            >
              {profile.aboutStory}
            </p>
            <blockquote className="border-l-2 border-[#C5A880] pl-5 py-1 font-serif-editorial italic text-xl sm:text-2xl">
              “{profile.aboutPhilosophy}”
            </blockquote>
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('about')}
                className={`px-6 py-3 rounded-full text-xs sm:text-sm font-medium transition ${
                  isDark
                    ? 'bg-[#F5F2EB] text-[#0F0E0C] hover:bg-[#C5A880]'
                    : 'bg-[#18181B] text-[#FAF8F5] hover:bg-[#33302E]'
                }`}
              >
                Read Full Biography
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-medium border border-[#C5A880] hover:bg-[#C5A880]/10 transition"
              >
                Get In Touch
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// REUSABLE EDITORIAL ALBUM CARD COMPONENT
// ============================================================================
function AlbumEditorialCard({ album, index, isDark, onClick }) {
  return (
    <article
      onClick={onClick}
      className={`group cursor-pointer rounded-3xl overflow-hidden border transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between ${
        isDark
          ? 'bg-[#181614] border-[#2A2622] hover:border-[#C5A880]/60 shadow-lg'
          : 'bg-[#F3EFEA]/85 border-[#E6DFD5] hover:border-[#C5A880] shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Cover Image Wrapper */}
      <div>
        <div className="relative aspect-[4/5] overflow-hidden bg-black/10">
          <img
            src={album.coverUrl}
            alt={album.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

          {/* Top Badges: Index + Category + Photo Count */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white">
            <span className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md font-mono-meta text-[11px] uppercase tracking-widest border border-white/15">
              {String(index + 1).padStart(2, '0')} · {album.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md font-mono-meta text-xs text-[#E6D7C3] border border-[#C5A880]/40">
              <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{album.photoCount} Photos</span>
            </span>
          </div>

          {/* Bottom Overlay Title inside Cover */}
          <div className="absolute bottom-5 inset-x-5 text-white">
            <p className="font-mono-meta text-[11px] uppercase tracking-[0.2em] text-[#E6D7C3] mb-1">
              {album.season || 'Curated Series'} · {album.location || 'Cumilla'}
            </p>
            <h3 className="font-serif-editorial text-3xl font-normal leading-tight group-hover:text-[#E6D7C3] transition-colors">
              {album.title}
            </h3>
          </div>
        </div>

        {/* Description Body */}
        <div className="p-6">
          <p
            className={`text-sm line-clamp-2 leading-relaxed ${
              isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
            }`}
          >
            {album.description}
          </p>
        </div>
      </div>

      {/* Card Footer CTA */}
      <div
        className={`px-6 py-4 border-t flex items-center justify-between text-xs font-mono-meta uppercase tracking-widest ${
          isDark ? 'border-[#2A2622]' : 'border-[#E6DFD5]'
        }`}
      >
        <span className="group-hover:text-[#C5A880] transition-colors">
          Open Complete Gallery
        </span>
        <span className="w-8 h-8 rounded-full border border-[#C5A880]/50 flex items-center justify-center group-hover:bg-[#C5A880] group-hover:text-[#0F0E0C] transition-all">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
    </article>
  );
}

// ============================================================================
// 2. ALBUMS CATALOG PAGE VIEW
// ============================================================================
function AlbumsCatalogView({
  albums,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  isDark,
  onOpenAlbum,
}) {
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      const matchesCat =
        selectedCategory === 'All' || album.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (album.description || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (album.location || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [albums, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 space-y-12 animate-fade-up">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <p className="font-mono-meta text-xs uppercase tracking-[0.25em] text-[#C5A880]">
          Portfolio Index · {albums.length} Collections
        </p>
        <h1 className="font-serif-editorial text-5xl sm:text-6xl font-normal">
          The Photo Albums
        </h1>
        <p
          className={`text-sm sm:text-base leading-relaxed ${
            isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
          }`}
        >
          Each album is a self-contained visual chapter—organized by mood, season, and location. Click any collection to enter its full gallery.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-current/10">
        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-mono-meta uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-[#C5A880] text-[#0F0E0C] font-semibold'
                    : isDark
                    ? 'bg-[#181614] text-[#A8A29E] border border-[#2A2622] hover:text-white'
                    : 'bg-[#F3EFEA] text-[#57534E] border border-[#E6DFD5] hover:text-black'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search albums or locations..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-full text-xs border focus:outline-none focus:border-[#C5A880] ${
              isDark
                ? 'bg-[#181614] border-[#2A2622] text-[#F5F2EB]'
                : 'bg-[#F3EFEA] border-[#E6DFD5] text-[#18181B]'
            }`}
          />
        </div>
      </div>

      {/* Grid of Albums */}
      {filteredAlbums.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <p className="font-serif-editorial text-3xl">
            No albums match your filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 rounded-full text-xs bg-[#C5A880] text-[#0F0E0C] font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
          {filteredAlbums.map((album, idx) => (
            <AlbumEditorialCard
              key={album.id}
              album={album}
              index={idx}
              isDark={isDark}
              onClick={() => onOpenAlbum(album.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. ALBUM DETAILS GALLERY VIEW (Masonry + Aspect Filters + Lightbox)
// ============================================================================
// ============================================================================
// ALBUM BOOK — swipe pages on mobile, big stage + thumbnail wall on desktop
// ============================================================================
function AlbumBook({ photos, isDark, onOpen, likedPhotos, setLikedPhotos }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);
  const total = photos.length;
  const safe = Math.min(active, Math.max(total - 1, 0));
  const current = photos[safe];

  useEffect(() => {
    setActive(0);
    if (trackRef.current) trackRef.current.scrollTo({ left: 0 });
  }, [total]);

  const goTo = (i) => {
    if (!total) return;
    const n = (i + total) % total;
    setActive(n);
    const el = trackRef.current;
    if (el && el.clientWidth) el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };
  const onScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / (el.clientWidth || 1));
    if (i !== active && i >= 0 && i < total) setActive(i);
  };
  const toggleLike = (id) => setLikedPhotos((prev) => ({ ...prev, [id]: !prev[id] }));

  if (!current) return null;
  const Stage = ({ photo, className = '' }) => (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <img src={cld(photo.url, 400)} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-50" />
      <img src={cld(photo.url, 1600)} alt={photo.caption} className="relative w-full h-full object-contain" />
    </div>
  );

  return (
    <div>
      {/* ---------- MOBILE: swipeable album pages ---------- */}
      <div className="md:hidden space-y-3">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl"
        >
          {photos.map((p, i) => (
            <div key={p.id} className="w-full shrink-0 snap-center" onClick={() => onOpen(i)}>
              <Stage photo={p} className="aspect-[4/5] rounded-2xl" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="font-mono-meta text-[11px] text-[#C5A880]">
              {String(safe + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </p>
            <p className="font-serif-editorial text-xl leading-snug truncate">{current.caption}</p>
          </div>
          <button
            onClick={() => toggleLike(current.id)}
            className={`p-2.5 rounded-full border border-current/15 ${likedPhotos[current.id] ? 'text-rose-500' : 'opacity-60'}`}
            aria-label="Like"
          >
            <Heart className={`w-4 h-4 ${likedPhotos[current.id] ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => goTo(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${i === safe ? 'border-[#C5A880]' : 'border-transparent opacity-60'}`}
            >
              <img src={cld(p.url, 200)} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* ---------- DESKTOP: stage + thumbnail wall ---------- */}
      <div className="hidden md:grid grid-cols-12 gap-6">
        <div
          className="col-span-8 relative rounded-3xl overflow-hidden h-[72vh] min-h-[480px] cursor-zoom-in group"
          onClick={() => onOpen(safe)}
        >
          <Stage photo={current} className="absolute inset-0" />
          <button
            onClick={(e) => { e.stopPropagation(); goTo(safe - 1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goTo(safe + 1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono-meta text-xs text-[#C5A880]">
                {String(safe + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </p>
              <p className="font-serif-editorial text-2xl truncate">{current.caption}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleLike(current.id); }}
              className={`p-2.5 rounded-full bg-black/50 backdrop-blur-md ${likedPhotos[current.id] ? 'text-rose-500' : 'text-white'}`}
              aria-label="Like"
            >
              <Heart className={`w-4 h-4 ${likedPhotos[current.id] ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="col-span-4 h-[72vh] min-h-[480px] overflow-y-auto pr-1 grid grid-cols-3 gap-2 content-start">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition ${i === safe ? 'border-[#C5A880]' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={cld(p.url, 300)} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlbumDetailView({
  album,
  allAlbums,
  isDark,
  aspectFilter,
  setAspectFilter,
  layoutMode,
  setLayoutMode,
  onBack,
  onSelectAlbum,
  onOpenLightbox,
  likedPhotos,
  setLikedPhotos,
  onJumpToAdminUpload,
}) {
  const filteredPhotos = useMemo(() => {
    if (aspectFilter === 'all') return album.photos;
    return album.photos.filter((p) => p.aspectRatio === aspectFilter);
  }, [album.photos, aspectFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-12 animate-fade-up">
      {/* Top Breadcrumb & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono-meta uppercase tracking-wider border transition ${
            isDark
              ? 'border-[#2A2622] bg-[#181614] hover:border-[#C5A880]'
              : 'border-[#E6DFD5] bg-[#F3EFEA] hover:border-[#18181B]'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Albums</span>
        </button>

        {/* Quick Switcher to Other Albums */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
          {allAlbums.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectAlbum(a.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition ${
                a.id === album.id
                  ? 'bg-[#C5A880] text-[#0F0E0C] font-medium'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              {a.title} ({a.photoCount})
            </button>
          ))}
        </div>
      </div>

      {/* Album Editorial Hero Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-10 border grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
          isDark
            ? 'bg-[#181614] border-[#2A2622]'
            : 'bg-[#F3EFEA] border-[#E6DFD5]'
        }`}
      >
        <div className="lg:col-span-4">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-[#C5A880]/40 shadow-lg">
            <img
              src={album.coverUrl}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono-meta uppercase tracking-widest text-[#C5A880]">
            <span>{album.category}</span>
            <span>•</span>
            <span>{album.season || '2026'}</span>
            <span>•</span>
            <span>{album.location || 'Cumilla'}</span>
          </div>

          <h1 className="font-serif-editorial text-4xl sm:text-6xl font-normal leading-tight">
            {album.title}
          </h1>

          <p
            className={`text-sm sm:text-base leading-relaxed max-w-2xl ${
              isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
            }`}
          >
            {album.description}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onOpenLightbox(filteredPhotos, 0)}
              disabled={filteredPhotos.length === 0}
              className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs sm:text-sm font-medium transition ${
                isDark
                  ? 'bg-[#F5F2EB] text-[#0F0E0C] hover:bg-[#C5A880]'
                  : 'bg-[#18181B] text-[#FAF8F5] hover:bg-[#33302E]'
              } disabled:opacity-40`}
            >
              <Maximize2 className="w-4 h-4" />
              <span>Open Fullscreen Lightbox ({filteredPhotos.length} Photos)</span>
            </button>

        
          </div>
        </div>
      </div>

      {/* Gallery Controls Bar (Orientation Filter + Layout Mode) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-current/10">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: `All Frames (${album.photos.length})` },
            { id: 'portrait', label: 'Portrait' },
            { id: 'landscape', label: 'Landscape' },
            { id: 'square', label: 'Square' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAspectFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono-meta uppercase tracking-wider transition ${
                aspectFilter === tab.id
                  ? 'bg-[#C5A880] text-[#0F0E0C] font-semibold'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono-meta text-xs opacity-60 mr-1">View:</span>
          <button
            onClick={() => setLayoutMode('album')}
            className={`px-3 py-1.5 rounded-full text-xs font-mono-meta ${
              layoutMode === 'album'
                ? 'bg-[#C5A880] text-[#0F0E0C]'
                : 'opacity-60'
            }`}
          >
            Album
          </button>
          <button
            onClick={() => setLayoutMode('masonry')}
            className={`px-3 py-1.5 rounded-full text-xs font-mono-meta ${
              layoutMode === 'masonry'
                ? 'bg-[#C5A880] text-[#0F0E0C]'
                : 'opacity-60'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setLayoutMode('editorial')}
            className={`px-3 py-1.5 rounded-full text-xs font-mono-meta ${
              layoutMode === 'editorial'
                ? 'bg-[#C5A880] text-[#0F0E0C]'
                : 'opacity-60'
            }`}
          >
            Editorial Grid
          </button>
        </div>
      </div>

      {/* Photo Gallery Display */}
      {filteredPhotos.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <p className="font-serif-editorial text-3xl">
            No photographs in this orientation yet.
          </p>
          <button
            onClick={() => setAspectFilter('all')}
            className="px-5 py-2 rounded-full text-xs bg-[#C5A880] text-[#0F0E0C]"
          >
            Show All Album Photos
          </button>
        </div>
      ) : layoutMode === 'album' ? (
        <AlbumBook
          photos={filteredPhotos}
          isDark={isDark}
          onOpen={(i) => onOpenLightbox(filteredPhotos, i)}
          likedPhotos={likedPhotos}
          setLikedPhotos={setLikedPhotos}
        />
      ) : layoutMode === 'masonry' ? (
        <div className="columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-5 space-y-3 sm:space-y-5">
          {filteredPhotos.map((photo, idx) => (
            <PhotoCardItem
              key={photo.id}
              photo={photo}
              index={idx}
              isDark={isDark}
              isLiked={!!likedPhotos[photo.id]}
              onToggleLike={() =>
                setLikedPhotos((prev) => ({
                  ...prev,
                  [photo.id]: !prev[photo.id],
                }))
              }
              onOpen={() => onOpenLightbox(filteredPhotos, idx)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-8">
          {filteredPhotos.map((photo, idx) => (
            <PhotoCardItem
              key={photo.id}
              photo={photo}
              index={idx}
              isDark={isDark}
              isLiked={!!likedPhotos[photo.id]}
              onToggleLike={() =>
                setLikedPhotos((prev) => ({
                  ...prev,
                  [photo.id]: !prev[photo.id],
                }))
              }
              onOpen={() => onOpenLightbox(filteredPhotos, idx)}
              editorialSize
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCardItem({
  photo,
  index,
  isDark,
  isLiked,
  onToggleLike,
  onOpen,
  editorialSize = false,
}) {
  return (
    <div
      className={`break-inside-avoid group rounded-2xl overflow-hidden border transition-all duration-500 ${
        isDark
          ? 'bg-[#181614] border-[#2A2622] hover:border-[#C5A880]/60'
          : 'bg-[#F3EFEA] border-[#E6DFD5] hover:border-[#C5A880]'
      }`}
    >
      <div
        onClick={onOpen}
        className={`relative overflow-hidden cursor-pointer ${
          editorialSize ? 'aspect-[4/5]' : ''
        }`}
      >
        <img
          src={cld(photo.url, 900)}
          alt={photo.caption}
          loading="lazy"
          className={`w-full ${
            editorialSize ? 'h-full' : 'h-auto'
          } object-cover transition-transform duration-700 group-hover:scale-105`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="font-mono-meta text-xs px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md">
              #{String(index + 1).padStart(2, '0')} · {photo.aspectRatio}
            </span>
            <span className="p-2 rounded-full bg-black/50 backdrop-blur-md text-[#C5A880]">
              <Maximize2 className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="font-serif-editorial text-xl leading-snug">
              {photo.caption}
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono-meta text-white/75">
              <span className="flex items-center gap-1">
                <Aperture className="w-3 h-3 text-[#C5A880]" />
                {photo.camera || 'Editorial Prime'}
              </span>
              <span>{photo.date || '2025'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between text-xs">
        <div className="truncate pr-2">
          <span className="font-mono-meta text-[10px] text-[#C5A880] mr-2">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="opacity-85">{photo.caption}</span>
        </div>
        <button
          onClick={onToggleLike}
          className={`p-1.5 rounded-full transition ${
            isLiked ? 'text-rose-500' : 'opacity-50 hover:opacity-100'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 4. FULLSCREEN LIGHTBOX MODAL
// ============================================================================
function LightboxModal({ lightbox, setLightbox, onClose, onNext, onPrev }) {
  const currentPhoto = lightbox.photoList[lightbox.currentIndex];
  if (!currentPhoto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between text-white select-none">
      {/* Top Lightbox Controls */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="font-mono-meta text-xs uppercase tracking-widest text-[#C5A880]">
            {String(lightbox.currentIndex + 1).padStart(2, '0')} /{' '}
            {String(lightbox.photoList.length).padStart(2, '0')}
          </span>
          <span className="hidden sm:inline text-xs text-white/70 truncate max-w-md">
            {currentPhoto.caption}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setLightbox((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
            }
            className={`px-3 py-1.5 rounded-full text-xs font-mono-meta flex items-center gap-1.5 border ${
              lightbox.isPlaying
                ? 'bg-[#C5A880] text-black border-[#C5A880]'
                : 'border-white/20 hover:bg-white/10'
            }`}
          >
            {lightbox.isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Slideshow</span>
              </>
            )}
          </button>

          <button
            onClick={() =>
              setLightbox((prev) => ({ ...prev, isZoomed: !prev.isZoomed }))
            }
            className="p-2 rounded-full border border-white/20 hover:bg-white/10 transition"
            title="Toggle Zoom (Z)"
          >
            {lightbox.isZoomed ? (
              <ZoomOut className="w-4 h-4" />
            ) : (
              <ZoomIn className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full border border-white/20 hover:bg-white/20 transition"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Image Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-16 py-4">
        {lightbox.photoList.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-4 sm:left-8 z-20 p-3.5 rounded-full bg-black/60 border border-white/20 hover:border-[#C5A880] text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div className="max-h-full max-w-full flex flex-col items-center justify-center overflow-auto">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption}
            onClick={() =>
              setLightbox((prev) => ({ ...prev, isZoomed: !prev.isZoomed }))
            }
            className={`max-h-[72vh] w-auto object-contain rounded-lg shadow-2xl transition-transform duration-500 cursor-zoom-in ${
              lightbox.isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
            }`}
          />
        </div>

        {lightbox.photoList.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 sm:right-8 z-20 p-3.5 rounded-full bg-black/60 border border-white/20 hover:border-[#C5A880] text-white transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom Caption & Filmstrip Scrubber */}
      <div className="px-4 sm:px-8 py-4 border-t border-white/10 bg-black/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="font-serif-editorial text-xl text-white">
            {currentPhoto.caption}
          </p>
          <div className="flex items-center gap-4 text-xs font-mono-meta text-white/60">
            <span>{currentPhoto.camera || 'Editorial Portrait'}</span>
            <span>•</span>
            <span>{currentPhoto.location || 'Cumilla'}</span>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {lightbox.photoList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {lightbox.photoList.map((item, idx) => (
              <button
                key={item.id || idx}
                onClick={() =>
                  setLightbox((prev) => ({
                    ...prev,
                    currentIndex: idx,
                    isZoomed: false,
                  }))
                }
                className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                  idx === lightbox.currentIndex
                    ? 'border-[#C5A880] scale-105'
                    : 'border-transparent opacity-45 hover:opacity-80'
                }`}
              >
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 5. ABOUT ME PAGE VIEW
// ============================================================================
function AboutView({ profile, albumsCount, photosCount, isDark, onNavigate }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-14 space-y-20 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Framed Portrait */}
        <div className="lg:col-span-5">
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border-2 border-[#C5A880]/60 shadow-2xl">
              <img
                src={profile.profilePhoto}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className={`mt-4 p-4 rounded-2xl border flex items-center justify-between text-xs font-mono-meta ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <span>{profile.name}</span>
              <span className="text-[#C5A880]">{profile.location}</span>
            </div>
          </div>
        </div>

        {/* Right Editorial Biography */}
        <div className="lg:col-span-7 space-y-6">
          <p className="font-mono-meta text-xs uppercase tracking-[0.25em] text-[#C5A880]">
            About The Muse & Storyteller
          </p>
          <h1 className="font-serif-editorial text-4xl sm:text-6xl font-normal leading-tight">
            {profile.aboutTitle}
          </h1>
          <p
            className={`text-base leading-relaxed ${
              isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
            }`}
          >
            {profile.aboutStory}
          </p>
          <blockquote className="p-6 rounded-2xl border border-[#C5A880]/40 bg-[#C5A880]/5 font-serif-editorial italic text-2xl leading-relaxed">
            “{profile.aboutPhilosophy}”
          </blockquote>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
            <div
              className={`p-4 rounded-2xl border ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <p className="font-serif-editorial text-3xl font-semibold">
                {albumsCount}
              </p>
              <p className="font-mono-meta text-[11px] uppercase tracking-wider opacity-70 mt-1">
                Published Albums
              </p>
            </div>
            <div
              className={`p-4 rounded-2xl border ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <p className="font-serif-editorial text-3xl font-semibold">
                {photosCount}
              </p>
              <p className="font-mono-meta text-[11px] uppercase tracking-wider opacity-70 mt-1">
                Curated Frames
              </p>
            </div>
            <div
              className={`p-4 rounded-2xl border col-span-2 sm:col-span-1 ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <p className="font-serif-editorial text-3xl font-semibold">
                Cumilla
              </p>
              <p className="font-mono-meta text-[11px] uppercase tracking-wider opacity-70 mt-1">
                Home Base
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('albums')}
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-medium bg-[#C5A880] text-[#0F0E0C] hover:opacity-90 transition"
            >
              Browse Visual Archive
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-medium border border-[#C5A880]/60 hover:bg-[#C5A880]/10 transition"
            >
              Contact & Collaborations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. CONTACT PAGE VIEW
// ============================================================================
function ContactView({ profile, isDark, onSubmitInquiry }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    onSubmitInquiry({
      name,
      email,
      subject: subject || 'Portfolio Inquiry',
      message,
    });
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-14 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Direct Details */}
        <div className="lg:col-span-5 space-y-6">
          <p className="font-mono-meta text-xs uppercase tracking-[0.25em] text-[#C5A880]">
            Inquiries & Collaborations
          </p>
          <h1 className="font-serif-editorial text-5xl sm:text-6xl font-normal">
            Let’s Create Together
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-[#A8A29E]' : 'text-[#57534E]'
            }`}
          >
            For editorial features, creative portrait collaborations, press inquiries, or simply to share a note about my visual archive.
          </p>

          <div
            className={`p-6 rounded-2xl border space-y-4 ${
              isDark
                ? 'bg-[#181614] border-[#2A2622]'
                : 'bg-[#F3EFEA] border-[#E6DFD5]'
            }`}
          >
            <div>
              <p className="font-mono-meta text-[11px] uppercase tracking-widest text-[#C5A880]">
                Direct Email
              </p>
              <p className="text-base font-medium mt-1">{profile.email}</p>
            </div>
            <div>
              <p className="font-mono-meta text-[11px] uppercase tracking-widest text-[#C5A880]">
                Location
              </p>
              <p className="text-base font-medium mt-1">{profile.location}</p>
            </div>
            <div>
              <p className="font-mono-meta text-[11px] uppercase tracking-widest text-[#C5A880]">
                Availability
              </p>
              <p className="text-sm mt-1 opacity-85">{profile.availability}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className={`p-8 sm:p-10 rounded-3xl border space-y-5 ${
              isDark
                ? 'bg-[#181614] border-[#2A2622]'
                : 'bg-[#F3EFEA] border-[#E6DFD5]'
            }`}
          >
            <h3 className="font-serif-editorial text-3xl font-normal">
              Send a Direct Message
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono-meta text-xs uppercase tracking-wider mb-2 opacity-75">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Farhan Ahmed"
                  className={`w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:border-[#C5A880] ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>
              <div>
                <label className="block font-mono-meta text-xs uppercase tracking-wider mb-2 opacity-75">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:border-[#C5A880] ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-mono-meta text-xs uppercase tracking-wider mb-2 opacity-75">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Editorial Collaboration / Feature Inquiry"
                className={`w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:border-[#C5A880] ${
                  isDark
                    ? 'bg-[#0F0E0C] border-[#2A2622]'
                    : 'bg-[#FAF8F5] border-[#D6C7B2]'
                }`}
              />
            </div>

            <div>
              <label className="block font-mono-meta text-xs uppercase tracking-wider mb-2 opacity-75">
                Message *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share project details, dates, or thoughts..."
                className={`w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:border-[#C5A880] ${
                  isDark
                    ? 'bg-[#0F0E0C] border-[#2A2622]'
                    : 'bg-[#FAF8F5] border-[#D6C7B2]'
                }`}
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium bg-[#C5A880] text-[#0F0E0C] hover:opacity-95 transition"
            >
              <Send className="w-4 h-4" />
              <span>Deliver Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. PRIVATE ADMIN DASHBOARD (/admin)
// ============================================================================
function AdminPortalView({
  isAuthenticated,
  setIsAuthenticated,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  adminTab,
  setAdminTab,
  profile,
  setProfile,
  albums,
  setAlbums,
  photos,
  setPhotos,
  inquiries,
  setInquiries,
  isDark,
  showToast,
  setConfirmDialog,
  onViewLiveAlbum,
  onResetDemo,
  onLogin,
  onLogout,
  integrations,
  onRecheck,
  syncState,
}) {
  // --- STATE FOR ALBUM MANAGEMENT ---
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumCategory, setNewAlbumCategory] = useState('Portraits');
  const [newAlbumSeason, setNewAlbumSeason] = useState('Spring · 2025');
  const [newAlbumLocation, setNewAlbumLocation] = useState('Cumilla');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [newAlbumCover, setNewAlbumCover] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85'
  );
  const [editingAlbum, setEditingAlbum] = useState(null);

  // --- STATE FOR PHOTO MANAGEMENT & MULTI-UPLOAD ---
  const [targetAlbumId, setTargetAlbumId] = useState(
    albums[0] ? albums[0].id : ''
  );
  const [stagedUploads, setStagedUploads] = useState([]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [filterAdminAlbumId, setFilterAdminAlbumId] = useState('all');
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [editPhotoCaption, setEditPhotoCaption] = useState('');
  const [replacePhotoUrl, setReplacePhotoUrl] = useState('');

  // --- STATE FOR PROFILE MANAGEMENT ---
  const [draftProfile, setDraftProfile] = useState(profile);
  useEffect(() => {
    setDraftProfile(profile);
  }, [profile]);

  const fileInputRef = useRef(null);
  const profileFileInputRef = useRef(null);
  const albumCoverFileInputRef = useRef(null);

  // Handle Local Multi-File Selection (resized in browser, orientation auto-detected)
  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    let added = 0;
    for (const file of files) {
      try {
        const { url, aspectRatio } = await fileToDataUrl(file);
        setStagedUploads((prev) => [
          ...prev,
          {
            tempId: `stg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            url,
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            aspectRatio,
            camera: 'Sony A7R V · 50mm GM',
            location: 'Cumilla',
          },
        ]);
        added++;
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
    if (added) showToast(`${added} photo(s) staged. Press publish to upload.`);
  };

  // Add URL or Preset to Staged Uploads
  const addUrlToStaged = (url, defaultCaption = 'Editorial Portrait Study', aspect = 'portrait') => {
    if (!url.trim()) return;
    setStagedUploads((prev) => [
      ...prev,
      {
        tempId: `stg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url,
        caption: defaultCaption,
        aspectRatio: aspect,
        camera: 'Sony A7R V · 85mm f/1.4 GM',
        location: 'Cumilla',
      },
    ]);
    setCustomImageUrl('');
  };

  // Publish staged photos: upload to Cloudinary, then auto-saved to Supabase
  const handlePublishStagedPhotos = async () => {
    if (!stagedUploads.length) return;
    const albumDest = targetAlbumId || (albums[0] && albums[0].id);
    if (!albumDest) {
      showToast('Please create an album first.', 'error');
      return;
    }
    setIsUploadingToCloud(true);
    const created = [];
    try {
      for (let idx = 0; idx < stagedUploads.length; idx++) {
        const item = stagedUploads[idx];
        const isLocal = item.url.startsWith('data:');
        const up = isLocal ? await uploadImage(item.url) : { url: item.url, publicId: '' };
        created.push({
          id: `ph-${Date.now()}-${idx}`,
          albumId: albumDest,
          url: up.url,
          publicId: up.publicId,
          caption: item.caption || 'Untitled Frame',
          aspectRatio: item.aspectRatio || 'portrait',
          camera: item.camera || 'Editorial Prime',
          location: item.location || 'Cumilla',
          date: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
          featured: true,
          order: photos.length + idx + 1,
        });
      }
      setPhotos((prev) => [...created, ...prev]);
      setStagedUploads([]);
      showToast(`${created.length} photo(s) uploaded to Cloudinary. Saving to Supabase…`);
    } catch (err) {
      if (created.length) setPhotos((prev) => [...created, ...prev]);
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  // Create New Album Handler
  const handleCreateAlbum = (e) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;
    const created = {
      id: `alb-${Date.now()}`,
      title: newAlbumTitle.trim(),
      slug: newAlbumTitle.toLowerCase().replace(/\s+/g, '-'),
      category: newAlbumCategory,
      season: newAlbumSeason,
      location: newAlbumLocation,
      description:
        newAlbumDesc.trim() ||
        'Curated visual story added from the Admin Dashboard.',
      coverUrl: newAlbumCover,
      featured: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setAlbums((prev) => [created, ...prev]);
    setTargetAlbumId(created.id);
    setNewAlbumTitle('');
    setNewAlbumDesc('');
    showToast(`Album "${created.title}" created and published live!`);
  };

  // Delete Album Handler
  const handleDeleteAlbum = (album) => {
    setConfirmDialog({
      title: `Delete "${album.title}"?`,
      description: `This will permanently remove the album and its ${album.photoCount} associated photographs from the live website.`,
      confirmText: 'Delete Album',
      onConfirm: () => {
        setAlbums((prev) => prev.filter((a) => a.id !== album.id));
        setPhotos((prev) => prev.filter((p) => p.albumId !== album.id));
        setConfirmDialog(null);
        showToast(`Deleted album "${album.title}".`);
      },
    });
  };

  // Reorder Photo Up/Down
  const handleMovePhoto = (photoId, direction) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === photoId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((item, i) => ({ ...item, order: i + 1 }));
    });
    showToast('Photo order updated dynamically.');
  };

  // --- ADMIN LOGIN SCREEN (VALIDATION & ERROR HANDLING) ---
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  // পেইজ লোড হলে ইনপুট ফিল্ড দুটি খালি রাখবে
  useEffect(() => {
    setLoginEmail('');
    setLoginPassword('');
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginBusy(true);
    const result = await onLogin(loginEmail.trim(), loginPassword);
    setLoginBusy(false);
    if (result.ok) {
      setLoginError('');
      showToast('Welcome back, Admin!');
    } else {
      setLoginError(result.error);
      showToast(result.error, 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 animate-fade-up">
        <div
          className={`p-8 sm:p-10 rounded-3xl border shadow-2xl space-y-6 ${
            isDark
              ? 'bg-[#181614] border-[#2A2622]'
              : 'bg-[#F3EFEA] border-[#E6DFD5]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono-meta uppercase tracking-widest bg-[#C5A880]/15 text-[#C5A880]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Authentication</span>
            </span>
            <Lock className="w-4 h-4 text-[#C5A880]" />
          </div>

          <div>
            <h1 className="font-serif-editorial text-4xl font-normal">
              Admin Portal
            </h1>
            <p className="text-xs opacity-75 mt-1">
              Enter your credentials to access the management dashboard.
            </p>
          </div>

          {/* ভুল তথ্য দিলে লাল বক্সের এরর মেসেজ */}
          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center gap-2.5 text-xs animate-fade-up">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block font-mono-meta text-[11px] uppercase tracking-wider mb-1.5 opacity-75">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  setLoginError('');
                }}
                placeholder="name@example.com"
                className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[#C5A880] ${
                  isDark
                    ? 'bg-[#0F0E0C] border-[#2A2622] text-[#F5F2EB]'
                    : 'bg-[#FAF8F5] border-[#D6C7B2] text-[#18181B]'
                }`}
              />
            </div>
            <div>
              <label className="block font-mono-meta text-[11px] uppercase tracking-wider mb-1.5 opacity-75">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginError('');
                }}
                placeholder="Enter admin password"
                className={`w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-[#C5A880] ${
                  isDark
                    ? 'bg-[#0F0E0C] border-[#2A2622] text-[#F5F2EB]'
                    : 'bg-[#FAF8F5] border-[#D6C7B2] text-[#18181B]'
                }`}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#C5A880] text-[#0F0E0C] hover:opacity-95 transition"
            >
              {loginBusy ? 'Signing in…' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard Layout
  const adminFilteredPhotos =
    filterAdminAlbumId === 'all'
      ? photos
      : photos.filter((p) => p.albumId === filterAdminAlbumId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-8 animate-fade-up">
      {/* Top Admin Status Header */}
      <div
        className={`p-6 rounded-3xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#181614] border-[#2A2622]'
            : 'bg-[#F3EFEA] border-[#E6DFD5]'
        }`}
      >
        <div className="flex items-center gap-4">
          <img
            src={profile.profilePhoto}
            alt={profile.name}
            className="w-14 h-14 rounded-2xl object-cover border border-[#C5A880]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono-meta text-[11px] uppercase tracking-widest text-[#C5A880]">
                Admin Dashboard · Live Dynamic Sync
              </span>
            </div>
            <h1 className="font-serif-editorial text-3xl sm:text-4xl font-normal">
              Welcome back, {profile.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onResetDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border border-current/20 hover:border-[#C5A880] transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={() => {
              onLogout();
              showToast('Signed out of Admin Dashboard.');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Integration Status: Cloudinary + Supabase + Sync */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Cloudinary · Image Storage', icon: ImageIcon, data: integrations && integrations.cloudinary },
          { label: 'Supabase · Database', icon: Database, data: integrations && integrations.supabase },
        ].map((card) => {
          const Icon = card.icon;
          const state = !card.data ? 'checking' : card.data.connected ? 'ok' : 'bad';
          return (
            <div
              key={card.label}
              className={`p-5 rounded-2xl border flex items-start gap-3 ${
                isDark ? 'bg-[#181614] border-[#2A2622]' : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <span
                className={`mt-0.5 p-2 rounded-xl ${
                  state === 'ok' ? 'bg-emerald-500/15 text-emerald-500' : state === 'bad' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="font-mono-meta text-[11px] uppercase tracking-wider opacity-70">{card.label}</p>
                <p className={`text-sm font-semibold flex items-center gap-1.5 ${state === 'ok' ? 'text-emerald-500' : state === 'bad' ? 'text-red-500' : 'text-amber-500'}`}>
                  {state === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {state === 'ok' ? 'Connected' : state === 'bad' ? 'Not connected' : 'Checking…'}
                </p>
                <p className="text-[11px] opacity-70 mt-0.5 break-words">{card.data ? card.data.message : ''}</p>
              </div>
            </div>
          );
        })}
        <div
          className={`p-5 rounded-2xl border flex items-start justify-between gap-3 ${
            isDark ? 'bg-[#181614] border-[#2A2622]' : 'bg-[#F3EFEA] border-[#E6DFD5]'
          }`}
        >
          <div>
            <p className="font-mono-meta text-[11px] uppercase tracking-wider opacity-70">Live Sync</p>
            <p className={`text-sm font-semibold ${syncState === 'error' ? 'text-red-500' : syncState === 'saving' ? 'text-amber-500' : 'text-emerald-500'}`}>
              {syncState === 'saving' ? 'Saving to Supabase…' : syncState === 'error' ? 'Save failed' : syncState === 'saved' ? 'Saved — live for all visitors' : 'All changes synced'}
            </p>
          </div>
          <button
            type="button"
            onClick={onRecheck}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border border-current/20 hover:border-[#C5A880]"
          >
            <RefreshCw className="w-3 h-3 text-[#C5A880]" />
            <span>Recheck</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-current/10">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          {
            id: 'albums',
            label: `Album Management (${albums.length})`,
            icon: FolderPlus,
          },
          {
            id: 'photos',
            label: `Photo Management (${photos.length})`,
            icon: ImageIcon,
          },
          {
            id: 'profile',
            label: 'Profile & Site Settings',
            icon: Settings,
          },
          {
            id: 'inquiries',
            label: `Client Inquiries (${inquiries.length})`,
            icon: Inbox,
          },
          {
            id: 'blueprint',
            label: 'Supabase SQL & Next.js Code',
            icon: Code2,
          },
        ].map((tab) => {
          const IconComp = tab.icon;
          const active = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? 'bg-[#C5A880] text-[#0F0E0C] shadow-sm font-semibold'
                  : isDark
                  ? 'bg-[#181614] text-[#A8A29E] hover:text-white'
                  : 'bg-[#F3EFEA] text-[#57534E] hover:text-black'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          TAB 1: OVERVIEW
         ==================================================================== */}
      {adminTab === 'overview' && (
        <div className="space-y-8">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div
              className={`p-6 rounded-2xl border ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <p className="font-mono-meta text-xs uppercase tracking-wider text-[#C5A880]">
                Total Albums
              </p>
              <p className="font-serif-editorial text-5xl font-semibold mt-2">
                {albums.length}
              </p>
              <p className="text-xs opacity-70 mt-1">
                Dynamic public collections
              </p>
            </div>

            <div
              className={`p-6 rounded-2xl border ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <p className="font-mono-meta text-xs uppercase tracking-wider text-[#C5A880]">
                Total Photographs
              </p>
              <p className="font-serif-editorial text-5xl font-semibold mt-2">
                {photos.length}
              </p>
              <p className="text-xs opacity-70 mt-1">
                Cloudinary CDN optimized
              </p>
            </div>

            <div
              className={`p-6 rounded-2xl border ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <p className="font-mono-meta text-xs uppercase tracking-wider text-[#C5A880]">
                Featured Frames
              </p>
              <p className="font-serif-editorial text-5xl font-semibold mt-2">
                {photos.filter((p) => p.featured).length}
              </p>
              <p className="text-xs opacity-70 mt-1">
                Highlighted on homepage
              </p>
            </div>

            <div
              className={`p-6 rounded-2xl border ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <p className="font-mono-meta text-xs uppercase tracking-wider text-[#C5A880]">
                Messages & Inquiries
              </p>
              <p className="font-serif-editorial text-5xl font-semibold mt-2">
                {inquiries.length}
              </p>
              <p className="text-xs opacity-70 mt-1">
                Direct from contact page
              </p>
            </div>
          </div>

          {/* Quick Actions & Recent Uploads */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div
              className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <h3 className="font-serif-editorial text-2xl">
                Quick Administrator Actions
              </h3>
              <p className="text-xs opacity-75 leading-relaxed">
                Every change made here immediately updates the public portfolio without touching code or redeploying.
              </p>
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => setAdminTab('photos')}
                  className="w-full py-3 px-4 rounded-xl bg-[#C5A880] text-[#0F0E0C] text-xs font-semibold flex items-center justify-between"
                >
                  <span>Upload New Photographs</span>
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAdminTab('albums')}
                  className={`w-full py-3 px-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    isDark ? 'border-[#2A2622]' : 'border-[#D6C7B2]'
                  }`}
                >
                  <span>Create or Edit Photo Albums</span>
                  <FolderPlus className="w-4 h-4 text-[#C5A880]" />
                </button>
                <button
                  onClick={() => setAdminTab('profile')}
                  className={`w-full py-3 px-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    isDark ? 'border-[#2A2622]' : 'border-[#D6C7B2]'
                  }`}
                >
                  <span>Change Hero Profile Portrait & Bio</span>
                  <User className="w-4 h-4 text-[#C5A880]" />
                </button>
              </div>
            </div>

            <div
              className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif-editorial text-2xl">
                  Recent Uploads
                </h3>
                <button
                  onClick={() => setAdminTab('photos')}
                  className="text-xs font-mono-meta text-[#C5A880] hover:underline"
                >
                  Manage All →
                </button>
              </div>
              <div className="space-y-3">
                {photos.slice(0, 5).map((photo) => {
                  const alb = albums.find((a) => a.id === photo.albumId);
                  return (
                    <div
                      key={photo.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-4 ${
                        isDark
                          ? 'bg-[#0F0E0C] border-[#2A2622]'
                          : 'bg-[#FAF8F5] border-[#E6DFD5]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {photo.caption}
                          </p>
                          <p className="font-mono-meta text-[10px] text-[#C5A880]">
                            Album: {alb ? alb.title : 'Unassigned'} · {photo.aspectRatio}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono-meta text-[10px] opacity-60 whitespace-nowrap">
                        {photo.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: ALBUM MANAGEMENT
         ==================================================================== */}
      {adminTab === 'albums' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Album Form */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleCreateAlbum}
              className={`p-6 sm:p-8 rounded-3xl border space-y-4 sticky top-28 ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <h3 className="font-serif-editorial text-3xl">
                Create New Album
              </h3>
              <div>
                <label className="block font-mono-meta text-[11px] uppercase tracking-wider mb-1 opacity-75">
                  Album Title *
                </label>
                <input
                  type="text"
                  required
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  placeholder="e.g., Winter in Cox’s Bazar"
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-meta text-[11px] uppercase tracking-wider mb-1 opacity-75">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newAlbumCategory}
                    onChange={(e) => setNewAlbumCategory(e.target.value)}
                    placeholder="Portraits / Travel"
                    className={`w-full px-3 py-2.5 rounded-xl text-xs border ${
                      isDark
                        ? 'bg-[#0F0E0C] border-[#2A2622]'
                        : 'bg-[#FAF8F5] border-[#D6C7B2]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-mono-meta text-[11px] uppercase tracking-wider mb-1 opacity-75">
                    Season / Date
                  </label>
                  <input
                    type="text"
                    value={newAlbumSeason}
                    onChange={(e) => setNewAlbumSeason(e.target.value)}
                    placeholder="Spring · 2025"
                    className={`w-full px-3 py-2.5 rounded-xl text-xs border ${
                      isDark
                        ? 'bg-[#0F0E0C] border-[#2A2622]'
                        : 'bg-[#FAF8F5] border-[#D6C7B2]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono-meta text-[11px] uppercase tracking-wider mb-1 opacity-75">
                  Album Description
                </label>
                <textarea
                  rows={3}
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  placeholder="Describe the story, mood, and setting of this album..."
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>

              {/* Cover Photo Selector */}
              <div className="space-y-2">
                <label className="block font-mono-meta text-[11px] uppercase tracking-wider opacity-75">
                  Album Cover Photo (Upload File or URL)
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={newAlbumCover}
                    alt="Cover preview"
                    className="w-14 h-16 rounded-xl object-cover border border-[#C5A880]"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={newAlbumCover}
                      onChange={(e) => setNewAlbumCover(e.target.value)}
                      placeholder="https://..."
                      className={`w-full px-3 py-2 rounded-xl text-xs border ${
                        isDark
                          ? 'bg-[#0F0E0C] border-[#2A2622]'
                          : 'bg-[#FAF8F5] border-[#D6C7B2]'
                      }`}
                    />
                    <input
                      ref={albumCoverFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        showToast('Uploading cover…');
                        uploadImage(file)
                          .then((r) => {
                            setNewAlbumCover(r.url);
                            showToast('Cover uploaded to Cloudinary.');
                          })
                          .catch((err) => showToast('Upload failed: ' + err.message, 'error'));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => albumCoverFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-mono-meta border border-[#C5A880]/50 hover:bg-[#C5A880]/10"
                    >
                      Upload Local Cover Image
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#C5A880] text-[#0F0E0C] hover:opacity-95 transition"
              >
                Create & Publish Album
              </button>
            </form>
          </div>

          {/* Existing Albums List */}
          <div className="lg:col-span-7 space-y-4">
            {albums.map((album) => {
              const isEditing = editingAlbum && editingAlbum.id === album.id;
              return (
                <div
                  key={album.id}
                  className={`p-5 rounded-3xl border transition ${
                    isDark
                      ? 'bg-[#181614] border-[#2A2622]'
                      : 'bg-[#F3EFEA] border-[#E6DFD5]'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editingAlbum.title}
                          onChange={(e) =>
                            setEditingAlbum({
                              ...editingAlbum,
                              title: e.target.value,
                            })
                          }
                          className={`px-3 py-2 rounded-xl text-xs border ${
                            isDark
                              ? 'bg-[#0F0E0C] border-[#2A2622]'
                              : 'bg-[#FAF8F5] border-[#D6C7B2]'
                          }`}
                        />
                        <input
                          type="text"
                          value={editingAlbum.category}
                          onChange={(e) =>
                            setEditingAlbum({
                              ...editingAlbum,
                              category: e.target.value,
                            })
                          }
                          className={`px-3 py-2 rounded-xl text-xs border ${
                            isDark
                              ? 'bg-[#0F0E0C] border-[#2A2622]'
                              : 'bg-[#FAF8F5] border-[#D6C7B2]'
                          }`}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={editingAlbum.description}
                        onChange={(e) =>
                          setEditingAlbum({
                            ...editingAlbum,
                            description: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 rounded-xl text-xs border ${
                          isDark
                            ? 'bg-[#0F0E0C] border-[#2A2622]'
                            : 'bg-[#FAF8F5] border-[#D6C7B2]'
                        }`}
                      />
                      <div>
                        <label className="block font-mono-meta text-[10px] uppercase opacity-70 mb-1">
                          Cover Image URL
                        </label>
                        <input
                          type="text"
                          value={editingAlbum.coverUrl}
                          onChange={(e) =>
                            setEditingAlbum({
                              ...editingAlbum,
                              coverUrl: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 rounded-xl text-xs border ${
                            isDark
                              ? 'bg-[#0F0E0C] border-[#2A2622]'
                              : 'bg-[#FAF8F5] border-[#D6C7B2]'
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            setAlbums((prev) =>
                              prev.map((a) =>
                                a.id === editingAlbum.id ? editingAlbum : a
                              )
                            );
                            setEditingAlbum(null);
                            showToast('Album details updated.');
                          }}
                          className="px-4 py-2 rounded-full text-xs bg-[#C5A880] text-[#0F0E0C] font-semibold"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingAlbum(null)}
                          className="px-4 py-2 rounded-full text-xs border border-current/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-20 h-24 rounded-2xl object-cover border border-[#C5A880]/40 flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-meta text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C5A880]/15 text-[#C5A880]">
                              {album.category}
                            </span>
                            <span className="font-mono-meta text-xs opacity-65">
                              {album.photoCount} Photos
                            </span>
                          </div>
                          <h4 className="font-serif-editorial text-2xl font-medium">
                            {album.title}
                          </h4>
                          <p className="text-xs opacity-75 line-clamp-2 max-w-md">
                            {album.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2">
                        <button
                          onClick={() => onViewLiveAlbum(album.id)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-mono-meta border border-[#C5A880]/50 hover:bg-[#C5A880] hover:text-[#0F0E0C] transition"
                        >
                          View Gallery
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingAlbum(album)}
                            className="p-2 rounded-full border border-current/15 hover:border-[#C5A880]"
                            title="Edit Album"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAlbum(album)}
                            className="p-2 rounded-full border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition"
                            title="Delete Album"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: PHOTO MANAGEMENT (Multi-Upload, Preview, Reorder, Replace, Delete)
         ==================================================================== */}
      {adminTab === 'photos' && (
        <div className="space-y-10">
          {/* Upload & Staging Box */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
              isDark
                ? 'bg-[#181614] border-[#2A2622]'
                : 'bg-[#F3EFEA] border-[#E6DFD5]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-current/10">
              <div>
                <h3 className="font-serif-editorial text-3xl">
                  Upload Photographs to Cloudinary & Supabase
                </h3>
                <p className="text-xs opacity-75">
                  Select a target album, drop multiple files or choose curated portraits, preview & edit captions, then publish live.
                </p>
              </div>

              {/* Select Target Album */}
              <div className="flex items-center gap-2">
                <span className="font-mono-meta text-xs uppercase text-[#C5A880]">
                  Target Album:
                </span>
                <select
                  value={targetAlbumId}
                  onChange={(e) => setTargetAlbumId(e.target.value)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622] text-white'
                      : 'bg-[#FAF8F5] border-[#D6C7B2] text-black'
                  }`}
                >
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title} ({alb.photoCount} photos)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drag and Drop / File Picker + Direct URL Input */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`lg:col-span-6 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDark
                    ? 'border-[#C5A880]/40 hover:border-[#C5A880] bg-[#0F0E0C]/50'
                    : 'border-[#C5A880] hover:bg-[#FAF8F5]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
                <div className="w-12 h-12 rounded-full bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    Click to select multiple photos from your device
                  </p>
                  <p className="text-xs opacity-65 mt-1">
                    Supports high-res JPG, PNG, WEBP · Multi-photo batch staging
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div>
                  <label className="block font-mono-meta text-[11px] uppercase tracking-wider mb-1.5 opacity-75">
                    Or Paste Image URL Directly
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs border ${
                        isDark
                          ? 'bg-[#0F0E0C] border-[#2A2622]'
                          : 'bg-[#FAF8F5] border-[#D6C7B2]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => addUrlToStaged(customImageUrl)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#C5A880] text-[#0F0E0C]"
                    >
                      Stage URL
                    </button>
                  </div>
                </div>

                {/* Quick 1-Click Sample Curated Photos for Fast Testing */}
                <div>
                  <p className="font-mono-meta text-[10px] uppercase tracking-wider opacity-70 mb-2">
                    Quick-Stage Editorial Test Portraits (1-Click):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_CURATED_PHOTOS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          addUrlToStaged(preset.url, preset.label, preset.aspect)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border border-[#C5A880]/40 hover:bg-[#C5A880]/15 transition"
                      >
                        <Plus className="w-3 h-3 text-[#C5A880]" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Staged Photos Preview Before Publishing */}
            {stagedUploads.length > 0 && (
              <div className="pt-4 border-t border-current/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono-meta text-xs uppercase tracking-wider text-[#C5A880]">
                    Staged Preview ({stagedUploads.length} Photo
                    {stagedUploads.length > 1 ? 's' : ''} Ready to Publish)
                  </h4>
                  <button
                    onClick={() => setStagedUploads([])}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Clear Staged Queue
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stagedUploads.map((item, idx) => (
                    <div
                      key={item.tempId}
                      className={`p-3.5 rounded-2xl border flex gap-3.5 items-center ${
                        isDark
                          ? 'bg-[#0F0E0C] border-[#2A2622]'
                          : 'bg-[#FAF8F5] border-[#D6C7B2]'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt="Staged"
                        className="w-16 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.caption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStagedUploads((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, caption: val } : s
                              )
                            );
                          }}
                          placeholder="Photo caption..."
                          className={`w-full px-3 py-1.5 rounded-lg text-xs border ${
                            isDark
                              ? 'bg-[#181614] border-[#2A2622]'
                              : 'bg-white border-[#E6DFD5]'
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={item.aspectRatio}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStagedUploads((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, aspectRatio: val } : s
                                )
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                              isDark
                                ? 'bg-[#181614] border-[#2A2622]'
                                : 'bg-white border-[#E6DFD5]'
                            }`}
                          >
                            <option value="portrait">Portrait (4:5)</option>
                            <option value="landscape">Landscape (16:10)</option>
                            <option value="square">Square (1:1)</option>
                          </select>
                          <button
                            onClick={() =>
                              setStagedUploads((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="ml-auto text-xs text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handlePublishStagedPhotos}
                  disabled={isUploadingToCloud}
                  className="w-full py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-[#C5A880] text-[#0F0E0C] hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isUploadingToCloud
                      ? 'Uploading to Cloudinary & Saving in Supabase...'
                      : `Publish ${stagedUploads.length} Photo(s) to Live Website Now`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Existing Photos Manager (Filter, Reorder, Replace, Edit Caption, Delete) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-serif-editorial text-3xl">
                Manage Published Photographs ({adminFilteredPhotos.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-mono-meta text-xs opacity-70">
                  Filter by Album:
                </span>
                <select
                  value={filterAdminAlbumId}
                  onChange={(e) => setFilterAdminAlbumId(e.target.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#181614] border-[#2A2622]'
                      : 'bg-[#F3EFEA] border-[#D6C7B2]'
                  }`}
                >
                  <option value="all">All Albums ({photos.length})</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.photoCount})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {adminFilteredPhotos.map((photo) => {
                const alb = albums.find((a) => a.id === photo.albumId);
                const isEditingThis = editingPhotoId === photo.id;
                return (
                  <div
                    key={photo.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                      isDark
                        ? 'bg-[#181614] border-[#2A2622]'
                        : 'bg-[#F3EFEA] border-[#E6DFD5]'
                    }`}
                  >
                    <div className="flex gap-3.5">
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-20 h-24 rounded-xl object-cover flex-shrink-0 border border-[#C5A880]/30"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <span className="inline-block font-mono-meta text-[10px] uppercase px-2 py-0.5 rounded bg-[#C5A880]/15 text-[#C5A880] truncate max-w-full">
                          {alb ? alb.title : 'Album'}
                        </span>
                        {isEditingThis ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editPhotoCaption}
                              onChange={(e) =>
                                setEditPhotoCaption(e.target.value)
                              }
                              placeholder="Caption"
                              className={`w-full px-2.5 py-1 rounded text-xs border ${
                                isDark
                                  ? 'bg-[#0F0E0C] border-[#2A2622]'
                                  : 'bg-white border-[#D6C7B2]'
                              }`}
                            />
                            <input
                              type="text"
                              value={replacePhotoUrl}
                              onChange={(e) =>
                                setReplacePhotoUrl(e.target.value)
                              }
                              placeholder="Replace Image URL..."
                              className={`w-full px-2.5 py-1 rounded text-xs border ${
                                isDark
                                  ? 'bg-[#0F0E0C] border-[#2A2622]'
                                  : 'bg-white border-[#D6C7B2]'
                              }`}
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setPhotos((prev) =>
                                    prev.map((p) =>
                                      p.id === photo.id
                                        ? {
                                            ...p,
                                            caption: editPhotoCaption,
                                            url: replacePhotoUrl.trim() || p.url,
                                          }
                                        : p
                                    )
                                  );
                                  setEditingPhotoId(null);
                                  showToast('Photograph updated.');
                                }}
                                className="px-2.5 py-1 rounded text-[11px] bg-[#C5A880] text-black font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPhotoId(null)}
                                className="px-2.5 py-1 rounded text-[11px] border border-current/20"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-medium line-clamp-2">
                              {photo.caption}
                            </p>
                            <p className="font-mono-meta text-[10px] opacity-60">
                              Orientation: {photo.aspectRatio}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar: Move Up/Down, Set as Album Cover, Edit/Replace, Delete */}
                    <div className="pt-2 border-t border-current/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMovePhoto(photo.id, 'up')}
                          title="Move Earlier"
                          className="p-1.5 rounded-lg border border-current/15 hover:border-[#C5A880]"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMovePhoto(photo.id, 'down')}
                          title="Move Later"
                          className="p-1.5 rounded-lg border border-current/15 hover:border-[#C5A880]"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {alb && (
                          <button
                            onClick={() => {
                              setAlbums((prev) =>
                                prev.map((a) =>
                                  a.id === alb.id
                                    ? { ...a, coverUrl: photo.url }
                                    : a
                                )
                              );
                              showToast(
                                `Set as cover photo for "${alb.title}"!`
                              );
                            }}
                            className="px-2 py-1 rounded-lg border border-current/15 hover:border-[#C5A880] font-mono-meta text-[10px]"
                          >
                            Set Cover
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingPhotoId(photo.id);
                            setEditPhotoCaption(photo.caption);
                            setReplacePhotoUrl(photo.url);
                          }}
                          title="Edit Caption or Replace Image"
                          className="p-1.5 rounded-lg border border-current/15 hover:border-[#C5A880]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setPhotos((prev) =>
                              prev.filter((p) => p.id !== photo.id)
                            );
                            showToast('Photograph deleted from album.');
                          }}
                          title="Delete Photo"
                          className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: PROFILE & WEBSITE SETTINGS
         ==================================================================== */}
      {adminTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Hero Profile Portrait Changer */}
          <div
            className={`lg:col-span-5 p-6 sm:p-8 rounded-3xl border space-y-5 ${
              isDark
                ? 'bg-[#181614] border-[#2A2622]'
                : 'bg-[#F3EFEA] border-[#E6DFD5]'
            }`}
          >
            <h3 className="font-serif-editorial text-3xl">
              Hero Profile Portrait
            </h3>
            <p className="text-xs opacity-75">
              This portrait is displayed prominently at the very top of your homepage.
            </p>

            <div className="flex flex-col items-center py-4">
              <div className="w-48 h-60 rounded-[120px] overflow-hidden border-2 border-[#C5A880] shadow-xl">
                <img
                  src={draftProfile.profilePhoto}
                  alt={draftProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-3">
              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  showToast('Uploading profile photo…');
                  uploadImage(file)
                    .then((r) => {
                      setDraftProfile((prev) => ({ ...prev, profilePhoto: r.url }));
                      setProfile((prev) => ({ ...prev, profilePhoto: r.url }));
                      showToast('Profile photo uploaded & saved!');
                    })
                    .catch((err) => showToast('Upload failed: ' + err.message, 'error'));
                }}
              />
              <button
                type="button"
                onClick={() => profileFileInputRef.current?.click()}
                className="w-full py-3 rounded-full text-xs font-semibold bg-[#C5A880] text-[#0F0E0C] flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Profile Photo from Device</span>
              </button>

              <div>
                <label className="block font-mono-meta text-[10px] uppercase opacity-70 mb-1">
                  Or Paste Direct Portrait URL
                </label>
                <input
                  type="text"
                  value={draftProfile.profilePhoto}
                  onChange={(e) =>
                    setDraftProfile({
                      ...draftProfile,
                      profilePhoto: e.target.value,
                    })
                  }
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>

              {/* Preset Profile Portraits */}
              <div>
                <p className="font-mono-meta text-[10px] uppercase opacity-70 mb-2">
                  Quick-Switch Editorial Portraits:
                </p>
                <div className="flex items-center gap-2.5">
                  {PRESET_CURATED_PHOTOS.slice(0, 4).map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDraftProfile({
                          ...draftProfile,
                          profilePhoto: preset.url,
                        });
                        setProfile({
                          ...profile,
                          profilePhoto: preset.url,
                        });
                        showToast('Hero portrait updated live!');
                      }}
                      className="w-12 h-14 rounded-xl overflow-hidden border-2 border-[#C5A880]/50 hover:scale-105 transition"
                    >
                      <img
                        src={preset.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Biography, Socials & Website Metadata Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setProfile(draftProfile);
              showToast('Profile, Biography & Website Settings saved live!');
            }}
            className={`lg:col-span-7 p-6 sm:p-8 rounded-3xl border space-y-4 ${
              isDark
                ? 'bg-[#181614] border-[#2A2622]'
                : 'bg-[#F3EFEA] border-[#E6DFD5]'
            }`}
          >
            <h3 className="font-serif-editorial text-3xl">
              Personal Identity & Website Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono-meta text-[11px] uppercase mb-1 opacity-75">
                  Full Name
                </label>
                <input
                  type="text"
                  value={draftProfile.name}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, name: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>
              <div>
                <label className="block font-mono-meta text-[11px] uppercase mb-1 opacity-75">
                  Role / Subtitle
                </label>
                <input
                  type="text"
                  value={draftProfile.role}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, role: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-mono-meta text-[11px] uppercase mb-1 opacity-75">
                Poetic Hero Tagline
              </label>
              <input
                type="text"
                value={draftProfile.tagline}
                onChange={(e) =>
                  setDraftProfile({ ...draftProfile, tagline: e.target.value })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border ${
                  isDark
                    ? 'bg-[#0F0E0C] border-[#2A2622]'
                    : 'bg-[#FAF8F5] border-[#D6C7B2]'
                }`}
              />
            </div>

            <div>
              <label className="block font-mono-meta text-[11px] uppercase mb-1 opacity-75">
                Hero Introduction / Short Bio
              </label>
              <textarea
                rows={2}
                value={draftProfile.shortBio}
                onChange={(e) =>
                  setDraftProfile({ ...draftProfile, shortBio: e.target.value })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border ${
                  isDark
                    ? 'bg-[#0F0E0C] border-[#2A2622]'
                    : 'bg-[#FAF8F5] border-[#D6C7B2]'
                }`}
              />
            </div>

            <div>
              <label className="block font-mono-meta text-[11px] uppercase mb-1 opacity-75">
                About Me Story
              </label>
              <textarea
                rows={3}
                value={draftProfile.aboutStory}
                onChange={(e) =>
                  setDraftProfile({
                    ...draftProfile,
                    aboutStory: e.target.value,
                  })
                }
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border ${
                  isDark
                    ? 'bg-[#0F0E0C] border-[#2A2622]'
                    : 'bg-[#FAF8F5] border-[#D6C7B2]'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-mono-meta text-[10px] uppercase mb-1 opacity-75">
                  Instagram URL
                </label>
                <input
                  type="text"
                  value={draftProfile.socials.instagram}
                  onChange={(e) =>
                    setDraftProfile({
                      ...draftProfile,
                      socials: {
                        ...draftProfile.socials,
                        instagram: e.target.value,
                      },
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>
              <div>
                <label className="block font-mono-meta text-[10px] uppercase mb-1 opacity-75">
                  Facebook URL
                </label>
                <input
                  type="text"
                  value={draftProfile.socials.facebook}
                  onChange={(e) =>
                    setDraftProfile({
                      ...draftProfile,
                      socials: {
                        ...draftProfile.socials,
                        facebook: e.target.value,
                      },
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>
              <div>
                <label className="block font-mono-meta text-[10px] uppercase mb-1 opacity-75">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={draftProfile.email}
                  onChange={(e) =>
                    setDraftProfile({ ...draftProfile, email: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-[#0F0E0C] border-[#2A2622]'
                      : 'bg-[#FAF8F5] border-[#D6C7B2]'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#C5A880] text-[#0F0E0C] hover:opacity-95 transition"
            >
              Save All Profile & Website Settings
            </button>
          </form>
        </div>
      )}

      {/* ====================================================================
          TAB 5: CLIENT INQUIRIES INBOX
         ==================================================================== */}
      {adminTab === 'inquiries' && (
        <div className="space-y-4">
          <h3 className="font-serif-editorial text-3xl">
            Messages & Collaboration Inquiries ({inquiries.length})
          </h3>
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark
                  ? 'bg-[#181614] border-[#2A2622]'
                  : 'bg-[#F3EFEA] border-[#E6DFD5]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  {!inq.read && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-meta bg-[#C5A880] text-black font-semibold">
                      NEW
                    </span>
                  )}
                  <h4 className="font-semibold text-sm">{inq.subject}</h4>
                  <span className="font-mono-meta text-xs opacity-60">
                    · {inq.date}
                  </span>
                </div>
                <p className="font-mono-meta text-xs text-[#C5A880]">
                  From: {inq.name} ({inq.email})
                </p>
                <p className="text-xs sm:text-sm opacity-85 leading-relaxed max-w-3xl">
                  {inq.message}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setInquiries((prev) =>
                      prev.map((item) =>
                        item.id === inq.id ? { ...item, read: true } : item
                      )
                    )
                  }
                  className="px-3.5 py-1.5 rounded-full text-xs border border-current/20"
                >
                  Mark Read
                </button>
                <button
                  onClick={() =>
                    setInquiries((prev) =>
                      prev.filter((item) => item.id !== inq.id)
                    )
                  }
                  className="p-2 rounded-full text-red-500 border border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          TAB 6: PRODUCTION ARCHITECTURE (Supabase SQL + Cloudinary + Vercel)
         ==================================================================== */}
      {adminTab === 'blueprint' && (
        <div className="space-y-8">
          <div
            className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
              isDark
                ? 'bg-[#181614] border-[#2A2622]'
                : 'bg-[#F3EFEA] border-[#E6DFD5]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono-meta text-xs uppercase tracking-widest text-[#C5A880]">
                  Full-Stack Production Blueprint
                </span>
                <h3 className="font-serif-editorial text-3xl mt-1">
                  Next.js App Router + Supabase RLS + Cloudinary Signed Uploads
                </h3>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(SUPABASE_SQL_SCHEMA);
                  showToast('Supabase SQL Schema copied to clipboard!');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#C5A880] text-[#0F0E0C]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Supabase SQL</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-mono-meta text-xs uppercase tracking-wider text-[#C5A880] mb-2">
                  1. Supabase SQL Schema & Row-Level Security (supabase/schema.sql)
                </h4>
                <pre className="p-4 rounded-2xl bg-[#0B0A09] text-[#E6D7C3] font-mono-meta text-xs overflow-x-auto leading-relaxed border border-white/10">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div>
                <h4 className="font-mono-meta text-xs uppercase tracking-wider text-[#C5A880] mb-2">
                  2. Secure Server-Side Cloudinary Signature Route (app/api/cloudinary/sign/route.ts)
                </h4>
                <pre className="p-4 rounded-2xl bg-[#0B0A09] text-[#E6D7C3] font-mono-meta text-xs overflow-x-auto leading-relaxed border border-white/10">
                  {CLOUDINARY_API_CODE}
                </pre>
              </div>

              <div>
                <h4 className="font-mono-meta text-xs uppercase tracking-wider text-[#C5A880] mb-2">
                  3. Environment Variables (.env.example) & Deployment Steps
                </h4>
                <pre className="p-4 rounded-2xl bg-[#0B0A09] text-[#E6D7C3] font-mono-meta text-xs overflow-x-auto leading-relaxed border border-white/10">
                  {ENV_EXAMPLE_CODE}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}