# Public Dashboard - Futuristic Theme Reference Guide
# ไฟล์อ้างอิงสำหรับให้ AI สร้างกราฟิกเพิ่มเติม

---

## 1. TECH STACK & DEPENDENCIES

```
React (Vite)
Tailwind CSS v3 (utility-first, NO CSS modules, NO styled-components)
Framer Motion v12 (animation library)
Lucide React (icon library)
Custom inline SVG icons
ไม่ใช้ chart library — กราฟทำจาก CSS ล้วน (div width, conic-gradient)
```

---

## 2. DESIGN SYSTEM (ธีมสี)

### พื้นหลัง (Dark Theme)
```
dark-900: #0a0e27  → พื้นหลักของหน้า
dark-800: #0f1535  → พื้นหลังสลับ section
dark-700: #111642  → พื้นหลังเข้มขึ้น
dark-600: #1a1f4e  → พื้นหลังอ่อนสุด
```

### สี Accent
```
Cyan:   #00BFFF / cyan-400 → สีหลัก accent
Blue:   #3B82F6 / blue-500 → สีรอง
Purple: #A855F7 / purple-500 → สีเสริม
```

### ข้อความ
```
หัวข้อหลัก:      text-white
ข้อความรอง:     text-blue-200/50  (ฟ้าอ่อน โปร่งแสง 50%)
ข้อความจาง:     text-blue-200/30
Label เล็ก:      text-cyan-400 text-sm uppercase tracking-wider
```

### ขอบ / เส้น
```
ขอบการ์ด:       border-white/[0.08]  (ขาวโปร่ง 8%)
ขอบ hover:      border-white/20 หรือ border-cyan-500/30
เส้นตกแต่ง:     bg-gradient-to-r from-transparent to-cyan-400
```

---

## 3. GLASSMORPHISM PATTERN (ใช้ทุกการ์ด)

```jsx
<div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all duration-500">
  {/* เนื้อหาการ์ด */}
</div>
```

---

## 4. SECTION TITLE PATTERN (ใช้ทุก section)

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
  className="text-center mb-12"
>
  <div className="flex items-center justify-center gap-3 mb-2">
    <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400" />
    <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">
      Section Label (English)
    </span>
    <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
  </div>
  <h2 className="text-3xl md:text-4xl font-bold text-white">
    หัวข้อภาษาไทย
  </h2>
</motion.div>
```

---

## 5. ANIMATION PATTERNS

### Framer Motion - Scroll Entrance (ใช้ทุกการ์ด)
```jsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

### Framer Motion - Hover Effects
```jsx
<motion.div
  whileHover={{ y: -8 }}                    // ยกขึ้น
  whileHover={{ scale: 1.03 }}              // ขยาย
  whileHover={{ boxShadow: `0 0 30px rgba(0,191,255,0.3)` }}  // เรืองแสง
>
```

### CSS Animation (กำหนดใน tailwind.config.js)
```
animate-float       → ลอยขึ้น-ลง 6 วินาที (สำหรับ particles)
animate-float-delay  → ลอยขึ้น-ลง delay 2 วินาที
animate-pulse-glow   → เรืองแสง cyan 2 วินาที
animate-slide-up     → เลื่อนขึ้นเข้าหน้า 0.6 วินาที
animate-fade-in      → จางเข้า 0.8 วินาที
```

---

## 6. DECORATIVE ELEMENTS

### Corner Decorations (มุมการ์ด)
```jsx
<div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/[0.06] rounded-tr-lg" />
<div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/[0.06] rounded-bl-lg" />
```

### Bottom Gradient Line (เส้นล่างการ์ด)
```jsx
<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
```

### Floating Particles
```jsx
{[...Array(6)].map((_, i) => (
  <div
    key={i}
    className="absolute w-2 h-2 rounded-full bg-cyan-400/30 animate-float"
    style={{
      left: `${15 + i * 14}%`,
      top: `${20 + (i % 3) * 25}%`,
      animationDelay: `${i * 0.8}s`,
    }}
  />
))}
```

### Background Glow (hover)
```jsx
<div
  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
  style={{
    background: `radial-gradient(circle at center, rgba(0,191,255,0.2), transparent 70%)`,
  }}
/>
```

### Grid Pattern Overlay
```jsx
<div
  className="absolute inset-0 opacity-10"
  style={{
    backgroundImage: `linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)`,
    backgroundSize: '60px 60px',
  }}
/>
```

---

## 7. TAILWIND CONFIG (tailwind.config.js)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
        success: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
        warning: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        danger:  { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
        dark: { 900: '#0a0e27', 800: '#0f1535', 700: '#111642', 600: '#1a1f4e' },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'glow-border': 'glowBorder 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,191,255,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0,191,255,0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        glowBorder: {
          '0%': { boxShadow: '0 0 5px rgba(0,191,255,0.3), inset 0 0 5px rgba(0,191,255,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(0,191,255,0.5), inset 0 0 10px rgba(0,191,255,0.2)' },
          '100%': { boxShadow: '0 0 5px rgba(0,191,255,0.3), inset 0 0 5px rgba(0,191,255,0.1)' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## 8. PAGE STRUCTURE (PublicDashboardNew.jsx)

```
โครงสร้างหน้า (เรียงจากบนลงล่าง):
┌─────────────────────────────────────┐
│  HeroBanner (ไม่รับ props)          │ → แบนเนอร์หลัก gradient + particles
├─────────────────────────────────────┤
│  StatsOverview (data={overview})    │ → ตัวเลขสถิติ 4 ช่อง animated counter
├─────────────────────────────────────┤
│  CategoryCards (categories={...})   │ → การ์ดหมวดหมู่ + custom SVG icons
├─────────────────────────────────────┤
│  CompetitionTimeline (ไม่รับ props) │ → ไทม์ไลน์ 4 ขั้นตอน
├─────────────────────────────────────┤
│  FeatureCards (ไม่รับ props)        │ → ฟีเจอร์ระบบ 4 การ์ด
├─────────────────────────────────────┤
│  RealtimeDashboard (groups, overview)│ → กราฟแท่ง + กราฟโดนัท
├─────────────────────────────────────┤
│  NewsSection (announcements={...})  │ → ข่าวประกาศ 6 ใบ
├─────────────────────────────────────┤
│  DashboardFooter (ไม่รับ props)     │ → ส่วนท้าย 3 คอลัมน์
└─────────────────────────────────────┘
```

### Data Fetching (Promise.all 4 APIs พร้อมกัน):
```jsx
const [overviewRes, groupsRes, competitionsRes, announcementsRes] = await Promise.all([
  api.get('/public/dashboard/overview').catch(() => ({ data: null })),
  api.get('/public/dashboard/groups').catch(() => ({ data: [] })),
  api.get('/public/competitions').catch(() => ({ data: { data: { categories: [] } } })),
  api.get('/announcements/public', { params: { limit: 6 } }).catch(() => ({ data: { data: [] } })),
]);
```

---

## 9. SOURCE CODE (ซอร์สโค้ดทุกไฟล์)

### 9.1 PublicDashboardNew.jsx (หน้าหลัก - Orchestrator)

```jsx
import { useState, useEffect } from 'react';
import api from '@/lib/api';

import HeroBanner from '@/components/public-dashboard/HeroBanner';
import StatsOverview from '@/components/public-dashboard/StatsOverview';
import CategoryCards from '@/components/public-dashboard/CategoryCards';
import CompetitionTimeline from '@/components/public-dashboard/CompetitionTimeline';
import FeatureCards from '@/components/public-dashboard/FeatureCards';
import RealtimeDashboard from '@/components/public-dashboard/RealtimeDashboard';
import NewsSection from '@/components/public-dashboard/NewsSection';
import DashboardFooter from '@/components/public-dashboard/DashboardFooter';

export default function PublicDashboardNew() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, groupsRes, competitionsRes, announcementsRes] = await Promise.all([
        api.get('/public/dashboard/overview').catch(() => ({ data: null })),
        api.get('/public/dashboard/groups').catch(() => ({ data: [] })),
        api.get('/public/competitions').catch(() => ({ data: { data: { categories: [] } } })),
        api.get('/announcements/public', { params: { limit: 6 } }).catch(() => ({ data: { data: [] } })),
      ]);

      if (overviewRes.data) setOverview(overviewRes.data.data || overviewRes.data);
      if (groupsRes.data) setGroups(groupsRes.data.data || groupsRes.data || []);
      if (competitionsRes.data) {
        const catData = competitionsRes.data?.data?.categories || competitionsRes.data?.categories || [];
        setCategories(catData);
      }
      if (announcementsRes.data) setAnnouncements(announcementsRes.data?.data || announcementsRes.data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
          </div>
          <p className="text-blue-200/60 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button onClick={fetchAllData}
            className="px-6 py-2 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <HeroBanner />
      <StatsOverview data={overview} />
      <CategoryCards categories={categories} />
      <CompetitionTimeline />
      <FeatureCards />
      <RealtimeDashboard groups={groups} overview={overview} />
      <NewsSection announcements={announcements} />
      <DashboardFooter />
    </div>
  );
}
```

### 9.2 HeroBanner.jsx

```jsx
import { motion } from 'framer-motion';
import { Rocket, Eye } from 'lucide-react';

export default function HeroBanner() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-dark-900">
      {/* Background gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-dark-900 to-dark-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_60%)]" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i}
          className={`absolute w-2 h-2 rounded-full bg-cyan-400/30 ${i % 2 === 0 ? 'animate-float' : 'animate-float-delay'}`}
          style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%`, animationDelay: `${i * 0.8}s` }}
        />
      ))}

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/20" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-cyan-500/20" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/20" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              การแข่งขันศิลปหัตถกรรม
            </span>
            <br />
            <span className="text-white">นักเรียน ครั้งที่ 73</span>
          </h1>
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-blue-200/70 mb-3">
          สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1
        </motion.p>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base md:text-lg text-cyan-300/60 mb-10">
          สู่เวทีนวัตกรรมแห่งอนาคต
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-[0_0_30px_rgba(0,191,255,0.3)] hover:shadow-[0_0_50px_rgba(0,191,255,0.5)]">
            <Rocket className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            เข้าสู่ระบบ
          </a>
          <a href="/public-results"
            className="group inline-flex items-center gap-2 px-8 py-4 border border-cyan-400/40 text-cyan-300 font-semibold rounded-xl hover:bg-cyan-400/10 hover:border-cyan-400/60 transition-all duration-300">
            <Eye className="w-5 h-5" />
            ดูผลการแข่งขัน
          </a>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 to-transparent" />
    </section>
  );
}
```

### 9.3 StatsOverview.jsx

```jsx
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { School, Users, Trophy, Cpu } from 'lucide-react';

function AnimatedCounter({ value, duration = 2 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!value || started.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime = null;
          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

const statItems = [
  { key: 'schools', icon: School, label: 'โรงเรียนเข้าร่วม', suffix: '+', color: 'from-cyan-400 to-cyan-600', glow: 'rgba(0,191,255,0.3)' },
  { key: 'registrations', icon: Users, label: 'นักเรียนเข้าร่วม', suffix: '+', color: 'from-purple-400 to-purple-600', glow: 'rgba(168,85,247,0.3)' },
  { key: 'competitions', icon: Trophy, label: 'รายการแข่งขัน', suffix: '', color: 'from-amber-400 to-amber-600', glow: 'rgba(251,191,36,0.3)' },
  { key: 'groups', icon: Cpu, label: 'กลุ่มโรงเรียน', suffix: '', color: 'from-emerald-400 to-emerald-600', glow: 'rgba(52,211,153,0.3)' },
];

export default function StatsOverview({ data }) {
  if (!data) return null;
  const values = {
    schools: data.total_groups ? data.total_groups * 30 : 0,
    registrations: data.total_registrations || 0,
    competitions: data.total_competitions || 0,
    groups: data.total_groups || 0,
  };

  return (
    <section className="py-16 px-4 bg-dark-900">
      <div className="max-w-7xl mx-auto">
        {/* Section title — ใช้ pattern มาตรฐาน */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">Smart Competition Overview</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">ภาพรวมการแข่งขัน</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            const val = values[item.key];
            return (
              <motion.div key={item.key}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
                style={{ boxShadow: `0 0 0px ${item.glow}` }}
                whileHover={{ boxShadow: `0 0 30px ${item.glow}` }}>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter value={val} />
                  <span className="text-cyan-400">{item.suffix}</span>
                </div>
                <p className="text-blue-200/60 text-sm">{item.label}</p>
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 rounded-tr-2xl" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

### 9.4 CategoryCards.jsx (มี custom SVG icons 10 แบบ)

```jsx
import { motion } from 'framer-motion';

/* ── Custom SVG Icons (Futuristic Style) ──────── */
const CategoryIcon = ({ type, className = '' }) => {
  const svgProps = { viewBox: '0 0 64 64', className: `w-full h-full ${className}`, fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

  switch (type) {
    case 'music':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          <path d="M24 42V22l20-6v20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="42" r="4" fill="currentColor" opacity="0.8" />
          <circle cx="40" cy="36" r="4" fill="currentColor" opacity="0.8" />
          <path d="M24 28l20-6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <path d="M48 14c2-2 4-1 4 1s-2 3-4 3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <circle cx="48" cy="18" r="1.5" fill="currentColor" opacity="0.3" />
        </svg>
      );
    case 'thai':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M18 44V24c0-4 4-8 8-8h4c4 0 6 3 6 6s-2 6-6 6H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 44V28c0-3 2-5 5-5h3c3 0 5 2 5 5v16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="42" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <rect x="10" y="46" width="44" height="4" rx="2" fill="currentColor" opacity="0.15" />
        </svg>
      );
    case 'math':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M16 20h32M22 20v28M38 20c0 12-2 20-8 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 10v8M46 14h8" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          <path d="M8 38h6M8 42h6" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <circle cx="52" cy="44" r="2" fill="currentColor" opacity="0.3" />
        </svg>
      );
    case 'science':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M24 12h16M26 12v14l-10 22a4 4 0 004 4h24a4 4 0 004-4L38 26V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 42c4-4 8 2 12-2s8 2 12-2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <circle cx="28" cy="38" r="2" fill="currentColor" opacity="0.3" />
          <circle cx="35" cy="34" r="1.5" fill="currentColor" opacity="0.25" />
          <circle cx="32" cy="42" r="1" fill="currentColor" opacity="0.2" />
          <ellipse cx="50" cy="14" rx="6" ry="3" stroke="currentColor" strokeWidth="0.8" opacity="0.3" transform="rotate(30 50 14)" />
          <circle cx="50" cy="14" r="1.5" fill="currentColor" opacity="0.3" />
        </svg>
      );
    case 'art':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M32 8C18 8 8 18 8 32c0 8 4 15 10 19 2 1 4-1 4-3v-4c0-4 6-4 6 0v6c0 2 2 4 4 4 14 0 24-10 24-24C56 18 46 8 32 8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="20" cy="28" r="3" fill="currentColor" opacity="0.7" />
          <circle cx="28" cy="18" r="3" fill="currentColor" opacity="0.5" />
          <circle cx="40" cy="18" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="44" cy="28" r="3" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'music_art':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M32 8v40M28 16c-8 4-12 12-8 20 2 4 8 6 12 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="28" cy="40" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M14 22h36M14 30h36M14 38h36" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
          <circle cx="46" cy="22" r="2.5" fill="currentColor" opacity="0.4" />
          <path d="M48.5 22V14" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );
    case 'health':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="36" cy="14" r="4" fill="currentColor" opacity="0.7" />
          <path d="M28 24l8 4 6-6M36 28l-4 12-6 6M36 28l2 12 8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 36c0-3 2-5 5-5s5 2 5 5c0 6-5 10-5 10s-5-4-5-10z" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="currentColor" fillOpacity="0.15" />
          <path d="M44 44h4l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'foreign':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="32" cy="32" rx="8" ry="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <path d="M14 32h36M16 22h32M16 42h32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <text x="20" y="12" fill="currentColor" fontSize="8" fontWeight="bold" opacity="0.4">A</text>
          <text x="42" y="58" fill="currentColor" fontSize="8" fontWeight="bold" opacity="0.4">B</text>
        </svg>
      );
    case 'social':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M32 10l16 14H16L32 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <rect x="20" y="24" width="24" height="20" stroke="currentColor" strokeWidth="2" />
          <rect x="28" y="32" width="8" height="12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M24 24v20M40 24v20" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <rect x="16" y="44" width="32" height="4" rx="1" fill="currentColor" opacity="0.15" />
          <circle cx="32" cy="18" r="2" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        </svg>
      );
    case 'career':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="26" cy="26" r="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="26" cy="26" r="4" fill="currentColor" opacity="0.3" />
          <path d="M26 14v4M26 34v4M14 26h4M34 26h4M18 18l3 3M31 31l3 3M18 34l3-3M31 21l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 38l12 12M48 38l-10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="52" cy="52" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );
    default:
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <polygon points="32,10 40,26 56,28 44,40 47,56 32,48 17,56 20,40 8,28 24,26" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.3" />
        </svg>
      );
  }
};

/* ── Category keyword matching ────────────────── */
const matchCategory = (name) => {
  if (!name) return 'default';
  const n = name.toLowerCase();
  if (n.includes('ศิลปะ-ดนตรี') || (n.includes('ดนตรี') && n.includes('ศิลปะ'))) return 'music_art';
  if (n.includes('ทัศนศิลป์') || n.includes('นาฏศิลป์')) return 'art';
  if (n.includes('ดนตรี') || n.includes('เพลง') || n.includes('ขับร้อง') || n.includes('ลูกทุ่ง')) return 'music';
  if (n.includes('ภาษาไทย')) return 'thai';
  if (n.includes('คณิตศาสตร์')) return 'math';
  if (n.includes('วิทยาศาสตร์') || n.includes('เทคโนโลยี')) return 'science';
  if (n.includes('สุขศึกษา') || n.includes('พลศึกษา')) return 'health';
  if (n.includes('ภาษาต่างประเทศ') || n.includes('อังกฤษ') || n.includes('จีน')) return 'foreign';
  if (n.includes('สังคม') || n.includes('ศาสนา')) return 'social';
  if (n.includes('การงาน') || n.includes('อาชีพ') || n.includes('คอมพิวเตอร์')) return 'career';
  if (n.includes('ศิลปะ')) return 'art';
  return 'default';
};

/* ── Color schemes per type ───────────────────── */
const colorSchemes = {
  music:     { gradient: 'from-violet-600 via-purple-600 to-fuchsia-600', glow: 'rgba(139,92,246,0.35)', particle: '#a78bfa' },
  thai:      { gradient: 'from-blue-600 via-indigo-600 to-blue-700', glow: 'rgba(59,130,246,0.35)', particle: '#60a5fa' },
  math:      { gradient: 'from-emerald-600 via-green-600 to-teal-600', glow: 'rgba(16,185,129,0.35)', particle: '#34d399' },
  science:   { gradient: 'from-cyan-600 via-sky-600 to-blue-600', glow: 'rgba(6,182,212,0.35)', particle: '#22d3ee' },
  art:       { gradient: 'from-pink-600 via-rose-600 to-red-600', glow: 'rgba(236,72,153,0.35)', particle: '#f472b6' },
  music_art: { gradient: 'from-amber-600 via-orange-600 to-yellow-600', glow: 'rgba(245,158,11,0.35)', particle: '#fbbf24' },
  health:    { gradient: 'from-red-600 via-rose-600 to-pink-600', glow: 'rgba(239,68,68,0.35)', particle: '#f87171' },
  foreign:   { gradient: 'from-sky-600 via-cyan-600 to-teal-600', glow: 'rgba(14,165,233,0.35)', particle: '#38bdf8' },
  social:    { gradient: 'from-indigo-600 via-blue-700 to-violet-700', glow: 'rgba(99,102,241,0.35)', particle: '#818cf8' },
  career:    { gradient: 'from-orange-600 via-amber-600 to-yellow-600', glow: 'rgba(234,88,12,0.35)', particle: '#fb923c' },
  default:   { gradient: 'from-gray-600 via-slate-600 to-gray-700', glow: 'rgba(148,163,184,0.35)', particle: '#94a3b8' },
};

/* ── Main Component ───────────────────────────── */
export default function CategoryCards({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0f1535 0%, #0a0e27 50%, #0f1535 100%)' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(6,182,212,0.4) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(139,92,246,0.4) 0%, transparent 50%)`,
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <span className="text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase">Category Section</span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">หมวดหมู่การแข่งขัน</h2>
          <p className="text-blue-200/40 text-sm max-w-lg mx-auto">
            กิจกรรมการแข่งขันศิลปหัตถกรรมนักเรียน แบ่งตามกลุ่มสาระการเรียนรู้
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6">
          {categories.slice(0, 10).map((cat, idx) => {
            const type = matchCategory(cat.category);
            const scheme = colorSchemes[type] || colorSchemes.default;
            const count = cat.count || cat.competitions?.length || 0;
            return (
              <motion.div key={cat.category || idx}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.07 }} whileHover={{ y: -10, scale: 1.03 }}
                className="group relative cursor-default">
                <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-5 pt-16 text-center overflow-hidden transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06]">
                  {/* Animated glow on hover */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                    style={{ background: `radial-gradient(circle at 50% 30%, ${scheme.glow}, transparent 70%)` }} />

                  {/* Floating particles */}
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                      style={{ backgroundColor: scheme.particle, left: `${20 + i * 25}%`, top: `${15 + i * 20}%`,
                        animation: `float ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
                  ))}

                  {/* Icon */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                    <motion.div whileHover={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.5 }}
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${scheme.gradient} p-3 shadow-2xl`}
                      style={{ boxShadow: `0 8px 32px ${scheme.glow}, 0 0 0 1px rgba(255,255,255,0.1)` }}>
                      <CategoryIcon type={type} className="text-white drop-shadow-lg" />
                    </motion.div>
                  </div>

                  {/* Scan line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10 mt-2">
                    <h3 className="text-white font-bold text-sm md:text-base mb-3 line-clamp-2 min-h-[2.5rem] leading-tight">{cat.category}</h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: scheme.particle }} />
                      <span className="text-blue-200/60 text-xs font-medium">{count} รายการ</span>
                    </div>
                  </div>

                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${scheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Corner decorations */}
                  <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/[0.06] rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/[0.06] rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

### 9.5 CompetitionTimeline.jsx

```jsx
import { motion } from 'framer-motion';
import { UserPlus, Send, Scale, Award } from 'lucide-react';

const steps = [
  { icon: UserPlus, title: 'เปิดรับสมัคร', desc: 'โรงเรียนลงทะเบียนเข้าร่วม', color: 'from-cyan-400 to-cyan-600' },
  { icon: Send, title: 'ส่งผลงาน', desc: 'ส่งรายชื่อนักเรียนและครู', color: 'from-blue-400 to-blue-600' },
  { icon: Scale, title: 'ตัดสิน', desc: 'คณะกรรมการให้คะแนน', color: 'from-purple-400 to-purple-600' },
  { icon: Award, title: 'ประกาศผล', desc: 'ประกาศผลและมอบเหรียญ', color: 'from-amber-400 to-amber-600' },
];

export default function CompetitionTimeline() {
  return (
    <section className="py-16 px-4 bg-dark-900">
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">Competition Timeline</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">ขั้นตอนการแข่งขัน</h2>
        </motion.div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 -translate-y-1/2" />
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }} className="relative flex flex-col items-center text-center z-10">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-4 border-4 border-dark-900`}>
                  <Icon className="w-9 h-9 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-dark-900 border-2 border-cyan-400 flex items-center justify-center">
                  <span className="text-cyan-400 text-xs font-bold">{idx + 1}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-blue-200/50 text-sm max-w-[140px]">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

### 9.6 FeatureCards.jsx

```jsx
import { motion } from 'framer-motion';
import { BrainCircuit, Database, BarChart3, BadgeCheck } from 'lucide-react';

const features = [
  { icon: BrainCircuit, title: 'AI ประมวลผลข้อมูล', desc: 'ระบบจัดการข้อมูลอัจฉริยะ ประมวลผลคะแนนอัตโนมัติ', color: 'from-cyan-400 to-blue-500', glow: 'rgba(0,191,255,0.2)' },
  { icon: Database, title: 'คลังข้อมูลครบถ้วน', desc: 'ฐานข้อมูลโรงเรียน นักเรียน ครู และกิจกรรมทั้งหมด', color: 'from-purple-400 to-violet-500', glow: 'rgba(168,85,247,0.2)' },
  { icon: BarChart3, title: 'คะแนนเรียลไทม์', desc: 'ติดตามผลคะแนนแบบ Real-time ดูผลได้ทันที', color: 'from-emerald-400 to-green-500', glow: 'rgba(52,211,153,0.2)' },
  { icon: BadgeCheck, title: 'e-Certificate', desc: 'ออกเกียรติบัตรอิเล็กทรอนิกส์อัตโนมัติ', color: 'from-amber-400 to-orange-500', glow: 'rgba(251,191,36,0.2)' },
];

export default function FeatureCards() {
  return (
    <section className="py-16 px-4 bg-dark-800">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">High-Tech System</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">ระบบเทคโนโลยีขั้นสูง</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }} whileHover={{ y: -8 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at center, ${feat.glow}, transparent 70%)` }} />
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="relative text-white font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="relative text-blue-200/50 text-sm leading-relaxed">{feat.desc}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

### 9.7 RealtimeDashboard.jsx

```jsx
import { motion } from 'framer-motion';
import { BarChart3, PieChart } from 'lucide-react';

function BarChartSection({ groups }) {
  if (!groups || groups.length === 0) return null;
  const sorted = [...groups]
    .map((g) => ({ name: g.name || g.code || 'กลุ่ม', value: g.stats?.registrations || g.registrations || 0, medals: g.medals || {} }))
    .sort((a, b) => b.value - a.value).slice(0, 8);
  const maxVal = Math.max(...sorted.map((g) => g.value), 1);
  const barColors = [
    'from-cyan-400 to-cyan-600', 'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600',
    'from-emerald-400 to-emerald-600', 'from-amber-400 to-amber-600', 'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600', 'from-teal-400 to-teal-600',
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold text-lg">Top Schools Groups</h3>
      </div>
      <div className="space-y-3">
        {sorted.map((g, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-200/70 text-sm truncate max-w-[60%]">{g.name}</span>
              <span className="text-white font-semibold text-sm">{g.value}</span>
            </div>
            <div className="h-5 bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${(g.value / maxVal) * 100}%` }} viewport={{ once: true }}
                transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${barColors[idx % barColors.length]} shadow-lg`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChartSection({ overview }) {
  const gold = overview?.total_gold || 0;
  const silver = overview?.total_silver || 0;
  const bronze = overview?.total_bronze || 0;
  const participant = overview?.total_participant || 0;
  const total = gold + silver + bronze + participant || 1;
  const goldDeg = (gold / total) * 360;
  const silverDeg = goldDeg + (silver / total) * 360;
  const bronzeDeg = silverDeg + (bronze / total) * 360;
  const items = [
    { label: 'ทอง', count: gold, color: '#FFD700', emoji: '🥇' },
    { label: 'เงิน', count: silver, color: '#C0C0C0', emoji: '🥈' },
    { label: 'ทองแดง', count: bronze, color: '#CD7F32', emoji: '🥉' },
    { label: 'เข้าร่วม', count: participant, color: '#60A5FA', emoji: '🎖️' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold text-lg">สรุปเหรียญ</h3>
      </div>
      <div className="flex flex-col items-center">
        <motion.div initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }} className="relative w-48 h-48 rounded-full mb-6"
          style={{
            background: total > 1
              ? `conic-gradient(#FFD700 0deg ${goldDeg}deg, #C0C0C0 ${goldDeg}deg ${silverDeg}deg, #CD7F32 ${silverDeg}deg ${bronzeDeg}deg, #60A5FA ${bronzeDeg}deg 360deg)`
              : 'conic-gradient(#374151 0deg 360deg)',
          }}>
          <div className="absolute inset-5 bg-dark-800 rounded-full flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-blue-200/50 text-xs">รวมทั้งหมด</span>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-lg">{item.emoji}</span>
              <div>
                <div className="text-white text-sm font-semibold">{item.count}</div>
                <div className="text-blue-200/50 text-xs">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RealtimeDashboard({ groups, overview }) {
  return (
    <section className="py-16 px-4 bg-dark-900">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">Real-Time Dashboard</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">สถิติแบบเรียลไทม์</h2>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <BarChartSection groups={groups} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
            <DonutChartSection overview={overview} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

### 9.8 NewsSection.jsx

```jsx
import { motion } from 'framer-motion';
import { Megaphone, ExternalLink, Calendar } from 'lucide-react';

const cardColors = [
  { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/20', icon: 'text-red-400' },
  { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', icon: 'text-amber-400' },
  { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
  { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', icon: 'text-blue-400' },
  { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20', icon: 'text-purple-400' },
  { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/20', icon: 'text-cyan-400' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

export default function NewsSection({ announcements }) {
  if (!announcements || announcements.length === 0) return null;
  const items = announcements.slice(0, 6);

  return (
    <section className="py-16 px-4 bg-dark-800">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">News & Announcements</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">ข่าวประกาศ</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((news, idx) => {
            const color = cardColors[idx % cardColors.length];
            return (
              <motion.div key={news.id || idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }} whileHover={{ y: -5 }}
                className={`group relative bg-gradient-to-br ${color.bg} backdrop-blur-xl border ${color.border} rounded-2xl p-6 hover:border-white/20 transition-all duration-300 overflow-hidden`}>
                <div className={`${color.icon} mb-4`}><Megaphone className="w-8 h-8" /></div>
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{news.title}</h3>
                {news.content && <p className="text-blue-200/50 text-sm line-clamp-2 mb-4">{news.content}</p>}
                <div className="flex items-center justify-between mt-auto">
                  {news.published_at && (
                    <div className="flex items-center gap-1 text-blue-200/40 text-xs">
                      <Calendar className="w-3 h-3" />{formatDate(news.published_at)}
                    </div>
                  )}
                  {news.link_url && (
                    <a href={news.link_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
                      ดูเพิ่มเติม<ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color.bg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

### 9.9 DashboardFooter.jsx

```jsx
export default function DashboardFooter() {
  return (
    <footer className="bg-dark-900 border-t border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3">CompetManager</h3>
            <p className="text-blue-200/50 text-sm leading-relaxed">
              ระบบบริหารจัดการแข่งขัน<br />ศิลปหัตถกรรมนักเรียน ครั้งที่ 73<br />สพป.นครปฐม เขต 1
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">ลิงก์ที่เกี่ยวข้อง</h4>
            <ul className="space-y-2 text-sm text-blue-200/50">
              <li><a href="/public-results" className="hover:text-cyan-400 transition-colors">ผลการแข่งขัน</a></li>
              <li><a href="/login" className="hover:text-cyan-400 transition-colors">เข้าสู่ระบบ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">ติดต่อ</h4>
            <p className="text-sm text-blue-200/50 leading-relaxed">สำนักงานเขตพื้นที่การศึกษา<br />ประถมศึกษานครปฐม เขต 1</p>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 text-center">
          <p className="text-blue-200/30 text-sm">&copy; {new Date().getFullYear()} ศิลปหัตถกรรมนักเรียน | สพป.นครปฐม เขต 1</p>
        </div>
      </div>
    </footer>
  );
}
```

---

## 10. PROMPT TEMPLATE สำหรับสั่ง AI สร้าง Component ใหม่

คัดลอก prompt นี้แล้วแก้ส่วน [xxx] ตามต้องการ:

```
สร้าง React component ชื่อ [ComponentName].jsx สำหรับหน้า Public Dashboard

## Tech Stack:
- React (functional component, hooks)
- Tailwind CSS v3 (utility classes only, NO CSS modules)
- Framer Motion v12 (animation)
- Lucide React (icons)

## Design System:
- ธีม: Dark Futuristic
- พื้นหลัง: bg-dark-900 (#0a0e27) หรือ bg-dark-800 (#0f1535)
- การ์ด: Glassmorphism (bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08])
- สี Accent: Cyan (#00BFFF), Blue (#3B82F6), Purple (#A855F7)
- ข้อความ: text-white (หลัก), text-blue-200/50 (รอง)
- Animation: whileInView entrance, whileHover effects

## Props ที่รับ:
- [บอก props ที่ component จะรับ]

## ต้องการแสดง:
- [อธิบายว่าต้องการแสดงอะไร]

## ตัวอย่าง Pattern (อ้างอิง):
[วาง pattern code จาก section 3-6 ของไฟล์นี้]
```
