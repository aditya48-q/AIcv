import { Canvas } from '@react-three/fiber';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FloatingNavbar } from './components/FloatingNavbar';
import { GlassCard } from './components/GlassCard';
import { MagneticButton } from './components/MagneticButton';
import { SectionHeading } from './components/SectionHeading';
import {
  achievementEntries,
  contactLinks,
  education,
  experienceEntries,
  heroTitles,
  journeyMilestones,
  projects,
  skillCards,
} from './constants/content';
import { useLenis } from './hooks/useLenis';
import { useThemeMode } from './hooks/useThemeMode';
import { BlackHoleCore } from './three/BlackHoleCore';
import { GlacierCore } from './three/GlacierCore';

function AnimatedSection({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      id={id}
      data-scene-section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function useSectionFocus(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? 'home');

  useEffect(() => {
    const sections = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        const sortedEntries = visibleEntries.length ? visibleEntries : entries;
        const topEntry = [...sortedEntries].sort(
          (left, right) => right.intersectionRatio - left.intersectionRatio || left.boundingClientRect.top - right.boundingClientRect.top,
        )[0];

        if (topEntry?.target?.id) {
          setActiveSection(topEntry.target.id);
        }
      },
      {
        root: null,
        threshold: [0.18, 0.32, 0.5, 0.68],
        rootMargin: '-14% 0px -34% 0px',
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
}

function SceneSection({
  id,
  title,
  activeSection,
  children,
  className = '',
}: {
  id: string;
  title?: string;
  activeSection: string;
  children: React.ReactNode;
  className?: string;
}) {
  const active = activeSection === id;

  return (
    <AnimatedSection id={id} className={className}>
      <div className="relative">
        <div
          className={`pointer-events-none absolute -inset-x-4 -inset-y-6 rounded-[2.8rem] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.13),transparent_34%),radial-gradient(circle_at_bottom,rgba(124,58,237,0.12),transparent_30%)] blur-3xl transition-opacity duration-700 ${
            active ? 'opacity-100' : 'opacity-30'
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent transition-opacity duration-700 ${
            active ? 'opacity-100' : 'opacity-30'
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-aurora/50 to-transparent transition-opacity duration-700 ${
            active ? 'opacity-100' : 'opacity-20'
          }`}
        />
        <div className={`relative transition-[filter,opacity] duration-700 ${active ? 'opacity-100 saturate-125' : 'opacity-95'}`}>{children}</div>
      </div>
    </AnimatedSection>
  );
}

function OrbitingIcons() {
  const icons = ['React', 'JS', 'C++', 'HTML', 'CSS', 'AI'];
  return (
    <div className="absolute inset-0">
      {icons.map((icon, index) => {
        const angle = (index / icons.length) * Math.PI * 2;
        const x = Math.cos(angle) * 165;
        const y = Math.sin(angle) * 165;

        return (
          <motion.div
            key={icon}
            className="orbit-badge absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-white/8 text-[10px] font-semibold text-ice backdrop-blur-md"
            animate={{ x: [x, x + 12, x], y: [y, y - 10, y], rotate: [0, 180, 360] }}
            transition={{ duration: 10 + index, repeat: Infinity, ease: 'easeInOut' }}
          >
            {icon}
          </motion.div>
        );
      })}
    </div>
  );
}

type SceneTuning = {
  energy: number;
  glow: number;
};

const SCENE_TUNING: Record<string, SceneTuning> = {
  home: { energy: 1.1, glow: 1.12 },
  about: { energy: 0.86, glow: 0.9 },
  journey: { energy: 0.92, glow: 0.96 },
  education: { energy: 0.88, glow: 0.92 },
  skills: { energy: 0.98, glow: 1 },
  projects: { energy: 1.08, glow: 1.08 },
  experience: { energy: 0.94, glow: 0.98 },
  achievements: { energy: 0.9, glow: 0.94 },
  contact: { energy: 0.82, glow: 0.88 },
};

function getSceneTuning(section: string) {
  return SCENE_TUNING[section] ?? SCENE_TUNING.home;
}

function IconMark({ kind }: { kind: string }) {
  const common = 'h-6 w-6 text-cyan';

  if (kind === 'email') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  if (kind === 'github') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path
          d="M12 3a9 9 0 0 0-2.84 17.54c.45.08.62-.2.62-.44v-1.56c-2.54.55-3.07-1.08-3.07-1.08-.4-1.01-.98-1.28-.98-1.28-.8-.55.06-.54.06-.54.88.06 1.34.9 1.34.9.78 1.33 2.05.95 2.55.73.08-.57.31-.95.56-1.17-2.03-.23-4.16-1.01-4.16-4.49 0-.99.35-1.8.92-2.43-.09-.23-.4-1.14.08-2.37 0 0 .75-.24 2.48.93A8.5 8.5 0 0 1 12 7.02c.76 0 1.53.1 2.25.3 1.73-1.17 2.48-.93 2.48-.93.48 1.23.17 2.14.08 2.37.57.63.92 1.44.92 2.43 0 3.49-2.13 4.26-4.16 4.49.32.28.62.83.62 1.67v2.48c0 .24.17.53.63.44A9 9 0 0 0 12 3Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (kind === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <rect x="5.5" y="5.5" width="13" height="13" rx="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path
        d="M6.5 8.5c0-1.1.9-2 2-2h7c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2h-7c-1.1 0-2-.9-2-2v-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M8.5 10.5h7M8.5 13h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PremiumCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.015 }}
      className={`group relative overflow-hidden rounded-[2rem] border border-white/8 bg-[rgba(255,255,255,0.045)] backdrop-blur-[12px] ${className}`}
      onMouseMove={(event) => {
        const element = cardRef.current;
        if (!element) return;
        const bounds = element.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        element.style.setProperty('--spot-x', `${x}%`);
        element.style.setProperty('--spot-y', `${y}%`);
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--spot-x,50%)_var(--spot-y,30%),rgba(6,182,212,0.1),transparent_42%),linear-gradient(135deg,rgba(124,58,237,0.08),rgba(6,182,212,0.05))] opacity-80 transition duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />
        <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function SkillCard({ title, icon, items, span }: { title: string; icon: string; items: string[]; span: string }) {
  const levelMap: Record<string, number> = {
    Programming: 84,
    Frontend: 92,
    'Core Concepts': 86,
    'AI & Productivity': 80,
    Communication: 88,
  };

  const level = levelMap[title] ?? 82;

  return (
    <PremiumCard className={`${span} min-h-[240px] p-6 sm:p-7`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <motion.div
            animate={{ rotate: [0, -1, 0], y: [0, -1, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-ice shadow-[inset_0_0_20px_rgba(255,255,255,0.06)]"
          >
            {icon}
          </motion.div>
          <h3 className="mt-5 text-xl font-semibold tracking-tight text-ice">{title}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan shadow-glacier-soft">
          <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_18px_rgba(6,182,212,0.8)]" />
        </div>
      </div>

      <div className="my-5 h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10" />

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-mist">
          <span>Presence</span>
          <span>{level}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/5">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(124,58,237,0.9),rgba(6,182,212,0.95))] shadow-[0_0_18px_rgba(6,182,212,0.35)]"
            initial={{ width: 0 }}
            whileInView={{ width: `${level}%` }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <motion.span
            key={item}
            whileHover={{ scale: 1.03, y: -1 }}
            className="rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(6,182,212,0.14))] px-3.5 py-2 text-xs font-medium tracking-wide text-ice shadow-[0_0_20px_rgba(6,182,212,0.08)]"
          >
            {item}
          </motion.span>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 flex gap-1 opacity-40">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan/80" />
        <span className="h-1.5 w-1.5 rounded-full bg-aurora/80" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
      </div>
    </PremiumCard>
  );
}

function AboutInfoCard({
  title,
  icon,
  delay = 0,
}: {
  title: string;
  icon: 'education' | 'monitor' | 'ai' | 'logic';
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const iconNode =
    icon === 'education' ? (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-cyan" aria-hidden="true">
        <path d="M3.5 9.5 12 5l8.5 4.5L12 14 3.5 9.5Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6 11.3V15c0 1.3 2.7 2.7 6 2.7s6-1.4 6-2.7v-3.7" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ) : icon === 'monitor' ? (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-cyan" aria-hidden="true">
        <rect x="4.5" y="5.5" width="15" height="10.5" rx="2.4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 19h6M12 16v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 9.5h8M8 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ) : icon === 'ai' ? (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-cyan" aria-hidden="true">
        <circle cx="12" cy="12" r="5.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="m8.2 8.2 1.5 1.5M14.3 14.3l1.5 1.5M14.3 9.7l1.5-1.5M8.2 15.8l1.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-cyan" aria-hidden="true">
        <path d="M8.5 8.5 5 12l3.5 3.5M15.5 8.5 19 12l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m11 17 2-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22, delay }}
      animate={{ y: [0, -6, 0] }}
      whileHover={{ y: -10, scale: 1.03, rotateX: 4, rotateY: -4 }}
      className="group relative min-h-[170px] overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(255,255,255,0.045)] p-5 backdrop-blur-[12px]"
      onMouseMove={(event) => {
        const element = cardRef.current;
        if (!element) return;
        const bounds = element.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        element.style.setProperty('--spot-x', `${x}%`);
        element.style.setProperty('--spot-y', `${y}%`);
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--spot-x,50%)_var(--spot-y,35%),rgba(6,182,212,0.1),transparent_42%),linear-gradient(135deg,rgba(124,58,237,0.08),rgba(6,182,212,0.04))] opacity-80 transition duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-aurora/60 to-transparent" />
        <div className="absolute -left-8 top-4 h-20 w-20 rounded-full bg-cyan/10 blur-2xl" />
        <div className="absolute -right-8 bottom-2 h-20 w-20 rounded-full bg-aurora/10 blur-2xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <motion.div
            animate={{ rotate: [0, 3, 0], y: [0, -1, 0] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_0_20px_rgba(255,255,255,0.06)]"
          >
            {iconNode}
          </motion.div>
          <div className="flex gap-1.5 opacity-70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan/80" />
            <span className="h-1.5 w-1.5 rounded-full bg-aurora/80" />
          </div>
        </div>

        <div className="my-5 h-px bg-gradient-to-r from-white/10 via-white/25 to-white/10" />

        <h3 className="text-lg font-semibold tracking-tight text-ice">{title}</h3>
        <p className="mt-3 text-xs uppercase tracking-[0.34em] text-mist">Independent feature card</p>
      </div>
    </motion.div>
  );
}

function FrontendScenePanel() {
  return (
    <div className="mb-6 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[rgba(7,17,31,0.58)] p-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/90" />
        </div>
        <div className="h-2.5 w-24 rounded-full bg-white/10" />
      </div>
      <div className="mt-3 grid gap-3">
        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-24 rounded-full bg-cyan/70" />
            <motion.div
              animate={{ opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_12px_rgba(6,182,212,0.55)]"
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="h-16 rounded-xl bg-[linear-gradient(180deg,rgba(124,58,237,0.24),rgba(255,255,255,0.04))]" />
            <div className="col-span-2 grid gap-2">
              <div className="h-5 rounded-full bg-white/8" />
              <div className="h-5 rounded-full bg-white/8 w-4/5" />
              <div className="h-5 rounded-full bg-cyan/10 w-3/5" />
            </div>
          </div>
        </div>

        <motion.div
          animate={{ x: [0, 3, 0], y: [0, -2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-2xl border border-cyan/15 bg-[rgba(7,17,31,0.68)] p-3"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-mist">
            <span>Responsive layout</span>
            <span>1280 / 768</span>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-16 w-10 rounded-xl border border-white/10 bg-white/5" />
            <div className="h-16 flex-1 rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(6,182,212,0.12),rgba(124,58,237,0.1))]" />
            <div className="h-16 w-16 rounded-xl border border-white/10 bg-white/5" />
          </div>
        </motion.div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-mist backdrop-blur-md">
        <span>Cursor live</span>
        <span className="flex items-center gap-2 text-cyan">
          <motion.span animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="h-2 w-2 rounded-full bg-cyan" />
          responsive
        </span>
      </div>
    </div>
  );
}

function AiScenePanel() {
  return (
    <div className="mb-6 rounded-[1.6rem] border border-white/10 bg-[rgba(7,17,31,0.58)] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(124,58,237,0.24),transparent_42%),radial-gradient(circle_at_50%_65%,rgba(6,182,212,0.18),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent)] opacity-60" />

      <div className="relative mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center">
        <motion.div
          aria-hidden
          className="absolute h-[86%] w-[86%] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.35),rgba(6,182,212,0.08)_55%,transparent_75%)] blur-2xl"
          animate={{ scale: [0.98, 1.03, 0.98], opacity: [0.55, 0.82, 0.55] }}
          transition={{ duration: 6.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-3 rounded-full border border-cyan/25"
        />
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-8 rounded-full border border-aurora/20"
        />

        <motion.div
          animate={{ y: [0, -4, 0], rotate: [0, 1.5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-[54%] w-[54%] items-center justify-center rounded-full border border-white/12 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.16),rgba(255,255,255,0.05)_40%,rgba(6,182,212,0.08)_72%,transparent_100%)] shadow-[0_0_42px_rgba(6,182,212,0.2)]"
        >
          <span className="absolute inset-0 rounded-full border border-white/10" />
          <motion.span
            className="absolute h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.5),rgba(124,58,237,0.15),transparent_72%)] blur-xl"
            animate={{ opacity: [0.45, 0.8, 0.45] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative text-center">
            <div className="text-[10px] uppercase tracking-[0.45em] text-cyan/80">AI</div>
            <div className="mt-2 text-2xl font-semibold text-ice">Orb</div>
          </div>
        </motion.div>

        {[
          { top: '18%', left: '24%' },
          { top: '26%', right: '18%' },
          { bottom: '24%', left: '18%' },
          { bottom: '16%', right: '24%' },
        ].map((position, index) => (
          <motion.span
            key={index}
            className="absolute h-2 w-2 rounded-full bg-cyan shadow-[0_0_16px_rgba(6,182,212,0.9)]"
            style={position}
            animate={{ y: [0, -5, 0], opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 3.8 + index * 0.35, repeat: Infinity, ease: 'easeInOut', delay: index * 0.25 }}
          />
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[rgba(2,6,23,0.8)] p-4 font-mono text-[10px] text-ice/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 text-[9px] uppercase tracking-[0.3em] text-mist">
          <span>Prompt Terminal</span>
          <span>AI-04</span>
        </div>
        <div className="space-y-2">
          <motion.p animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}>
            &gt; optimize workflow with ai tools
          </motion.p>
          <motion.p animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}>
            &gt; generate faster interface concepts
          </motion.p>
          <motion.p animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}>
            &gt; boost iteration speed and quality
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function JourneySection({ activeSection }: { activeSection: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 75%', 'end 25%'] });
  const beamScale = useTransform(scrollYProgress, [0, 1], [0.18, 1]);

  return (
    <SceneSection
      id="journey"
      activeSection={activeSection}
      className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8"
    >
      <div ref={sectionRef} className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:84px_84px] opacity-35" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(7,17,31,0.8),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,rgba(7,17,31,0.8),transparent)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 lg:block">
          <div className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(124,58,237,0.25),rgba(6,182,212,0.9),rgba(124,58,237,0.25))] opacity-40 blur-[1px]" />
          <motion.div
            style={{ scaleY: beamScale }}
            className="absolute inset-0 origin-top rounded-full bg-[linear-gradient(180deg,rgba(124,58,237,0.95),rgba(6,182,212,0.95))] shadow-[0_0_40px_rgba(6,182,212,0.35),0_0_80px_rgba(124,58,237,0.22)]"
          />
          <motion.div
            className="absolute left-1/2 top-0 h-full w-6 -translate-x-1/2 bg-[radial-gradient(circle,rgba(255,255,255,0.95),transparent_65%)] blur-2xl"
            animate={{ opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10">
          <SectionHeading
            eyebrow="Journey"
            title="Journey Through Code & Creativity"
            description="From programming fundamentals to immersive frontend experiences and AI-assisted development."
          />

          <div className="mt-12 grid gap-10 lg:gap-12">
            {journeyMilestones.map((milestone, index) => {
              const leftSide = index % 2 === 0;
              const active = activeSection === 'journey';

              return (
                <div key={milestone.title} className="relative grid items-center gap-6 lg:grid-cols-[1fr_120px_1fr]">
                  <div className={`flex ${leftSide ? 'lg:justify-end' : 'lg:order-3 lg:justify-start'} justify-center`}>
                    <div className="w-full max-w-2xl">
                      {leftSide ? (
                        <motion.div
                          initial={{ opacity: 0, x: -24 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.4 }}
                          whileHover={{ y: -8, scale: 1.015 }}
                          className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.05)] p-6 sm:p-7 backdrop-blur-2xl ${
                            active ? 'shadow-[0_24px_90px_rgba(6,182,212,0.18)]' : 'shadow-glacier'
                          }`}
                        >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--spot-x,50%)_var(--spot-y,30%),rgba(6,182,212,0.15),transparent_42%),linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.08))] opacity-90 transition duration-500 group-hover:opacity-100" />
                          <div className="relative space-y-5">
                            {index === 1 ? <FrontendScenePanel /> : null}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[11px] uppercase tracking-[0.45em] text-cyan/80">{milestone.phase}</p>
                              <motion.div
                                animate={{ rotate: [0, -6, 0], y: [0, -2, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-ice shadow-[0_0_28px_rgba(6,182,212,0.35)]"
                              >
                                {milestone.icon}
                              </motion.div>
                            </div>
                            <h3 className="text-2xl font-semibold tracking-tight text-ice sm:text-[1.7rem]">{milestone.title}</h3>
                            <div className="h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
                            <p className="max-w-xl text-sm leading-7 text-mist sm:text-[0.96rem]">{milestone.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {milestone.tags.map((tag) => (
                                <motion.span
                                  key={tag}
                                  whileHover={{ scale: 1.03, y: -1 }}
                                  className="rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(6,182,212,0.14))] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.26em] text-ice"
                                >
                                  {tag}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative mx-auto hidden h-full w-full items-center justify-center lg:flex">
                    <div className={`h-4 w-4 rounded-full border border-white/20 bg-white/80 shadow-[0_0_30px_rgba(6,182,212,0.9)] transition duration-500 ${active ? 'scale-110' : 'scale-90 opacity-70'}`} />
                    <div className={`absolute h-24 w-px rounded-full bg-[linear-gradient(180deg,rgba(124,58,237,0.2),rgba(6,182,212,0.9),rgba(124,58,237,0.2))] blur-[1px] transition duration-500 ${active ? 'opacity-100' : 'opacity-50'}`} />
                  </div>

                  <div className={`flex ${leftSide ? 'lg:order-3 lg:justify-start' : 'lg:justify-end'} justify-center`}>
                    <div className="w-full max-w-2xl">
                      {!leftSide ? (
                        <motion.div
                          initial={{ opacity: 0, x: 24 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.4 }}
                          whileHover={{ y: -8, scale: 1.015 }}
                          className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.05)] p-6 sm:p-7 backdrop-blur-2xl ${
                            active ? 'shadow-[0_24px_90px_rgba(6,182,212,0.18)]' : 'shadow-glacier'
                          }`}
                        >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--spot-x,50%)_var(--spot-y,30%),rgba(6,182,212,0.15),transparent_42%),linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.08))] opacity-90 transition duration-500 group-hover:opacity-100" />
                          <div className="relative space-y-5">
                            {index === 3 ? <AiScenePanel /> : null}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[11px] uppercase tracking-[0.45em] text-cyan/80">{milestone.phase}</p>
                              <motion.div
                                animate={{ rotate: [0, 6, 0], y: [0, -2, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-ice shadow-[0_0_28px_rgba(6,182,212,0.35)]"
                              >
                                {milestone.icon}
                              </motion.div>
                            </div>
                            <h3 className="text-2xl font-semibold tracking-tight text-ice sm:text-[1.7rem]">{milestone.title}</h3>
                            <div className="h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
                            <p className="max-w-xl text-sm leading-7 text-mist sm:text-[0.96rem]">{milestone.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {milestone.tags.map((tag) => (
                                <motion.span
                                  key={tag}
                                  whileHover={{ scale: 1.03, y: -1 }}
                                  className="rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(6,182,212,0.14))] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.26em] text-ice"
                                >
                                  {tag}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SceneSection>
  );
}

function ExperienceSection({ activeSection }: { activeSection: string }) {
  return (
    <SceneSection id="experience" activeSection={activeSection} className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Experience"
            title="Experience"
            description="Hands-on project building across UI systems, frontend prototyping, and AI-assisted workflows."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {experienceEntries.map((entry, index) => (
              <PremiumCard key={entry.title} className={`${index === 2 ? 'sm:col-span-2' : ''} p-5 sm:p-6`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-cyan/80">{entry.phase}</p>
                  <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_14px_rgba(6,182,212,0.85)]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-ice">{entry.title}</h3>
                <p className="mt-3 text-sm leading-7 text-mist">{entry.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-ice/80">
                      {tag}
                    </span>
                  ))}
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>

        <PremiumCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-cyan/80">Workflow</p>
              <h3 className="mt-3 text-2xl font-semibold text-ice">Real build process</h3>
            </div>
            <div className="h-12 w-12 rounded-full border border-white/10 bg-white/5 shadow-glacier-soft" />
          </div>
          <div className="mt-6 grid gap-4">
            {[
              'Rapid component iteration with Framer Motion',
              'Glassmorphism layout systems tuned for clarity',
              'Three.js scenes kept lightweight and atmospheric',
              'Lenis used for smooth premium page motion',
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan/20 bg-cyan/10 text-xs font-semibold text-cyan">
                  0{index + 1}
                </div>
                <p className="text-sm text-ice">{item}</p>
              </motion.div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </SceneSection>
  );
}

function AchievementsSection({ activeSection }: { activeSection: string }) {
  return (
    <SceneSection id="achievements" activeSection={activeSection} className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="Achievements"
          title="Achievements"
          description="A snapshot of shipping, experimentation, and technical growth."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {achievementEntries.map((entry, index) => (
            <PremiumCard key={entry.title} className="p-5 sm:p-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.08 }}
              >
                <p className="text-4xl font-semibold tracking-tight text-ice">{entry.value}</p>
                <p className="mt-4 text-sm font-medium text-cyan/90">{entry.title}</p>
                <p className="mt-3 text-sm leading-7 text-mist">{entry.description}</p>
              </motion.div>
            </PremiumCard>
          ))}
        </div>
      </div>
    </SceneSection>
  );
}

function ProfileVisual() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center">
      <motion.div
        aria-hidden
        className="absolute h-[86%] w-[86%] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.24),rgba(6,182,212,0.08)_48%,transparent_72%)] blur-2xl"
        animate={{ scale: [1, 1.06, 1], opacity: [0.58, 0.85, 0.58] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-[78%] w-[78%] items-center justify-center rounded-full border border-white/12 bg-[rgba(255,255,255,0.05)] p-4 shadow-glacier backdrop-blur-2xl"
      >
        <div className="absolute inset-2 rounded-full border border-cyan/30 opacity-70" />
        <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0.03)_40%,rgba(6,182,212,0.08)_70%,transparent_100%)]" />
        <div className="absolute inset-0 rounded-full border border-white/10 shadow-[inset_0_0_40px_rgba(255,255,255,0.12)]" />
        <div className="relative z-10 flex h-[72%] w-[72%] items-center justify-center overflow-hidden rounded-full border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))] text-center shadow-[inset_0_0_50px_rgba(255,255,255,0.08)]">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1a-nHQZMmyZdXKypbFqUqXbxRGvmORRRRLQ&s"
            alt="Aditya Gupta"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <OrbitingIcons />
      </motion.div>
    </div>
  );
}

export default function App() {
  useLenis();
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionIds = useMemo(
    () => ['home', 'about', 'journey', 'education', 'skills', 'projects', 'experience', 'achievements', 'contact'],
    [],
  );
  const activeSection = useSectionFocus(sectionIds);
  const { mode, toggleMode } = useThemeMode();
  const isNightMode = mode === 'dark';
  const { scrollYProgress: pageScrollProgress } = useScroll();
  const { scrollYProgress: heroScrollProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroGlow = useTransform(heroScrollProgress, [0, 1], [1, 0.35]);
  const [typedHeroLine, setTypedHeroLine] = useState('');

  useEffect(() => {
    document.documentElement.dataset.scene = activeSection;
    const tuning = getSceneTuning(activeSection);
    const energy = tuning.energy * (isNightMode ? 1.12 : 1);
    const glow = tuning.glow * (isNightMode ? 1.18 : 1);
    document.documentElement.style.setProperty('--scene-energy', energy.toFixed(2));
    document.documentElement.style.setProperty('--scene-glow', glow.toFixed(2));
  }, [activeSection, isNightMode]);

  useEffect(() => {
    const fullText = 'Building cinematic interfaces with React, Framer Motion, and Three.js.';
    let index = 0;
    setTypedHeroLine('');

    const timer = window.setInterval(() => {
      index += 1;
      setTypedHeroLine(fullText.slice(0, index));

      if (index >= fullText.length) {
        window.clearInterval(timer);
      }
    }, 28);

    return () => window.clearInterval(timer);
  }, []);

  const downloadResume = () => {
    const pdfBody = [
      'BT /F1 24 Tf 72 720 Td (Aditya Gupta) Tj ET',
      'BT /F1 12 Tf 72 690 Td (Computer Science Student | AI-Assisted Developer | Frontend & UI Enthusiast) Tj ET',
      'BT /F1 12 Tf 72 662 Td (Email: adityagupta86548@gmail.com) Tj ET',
      'BT /F1 12 Tf 72 644 Td (GitHub: github.com/aditya48-q) Tj ET',
      'BT /F1 12 Tf 72 626 Td (LinkedIn: linkedin.com/in/aditya-gupta-89a359368) Tj ET',
    ].join('\n');

    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
      `5 0 obj\n<< /Length ${pdfBody.length} >>\nstream\n${pdfBody}\nendstream\nendobj\n`,
    ];

    const header = '%PDF-1.4\n';
    let offset = header.length;
    const offsets = objects.map((object) => {
      const currentOffset = offset;
      offset += object.length;
      return currentOffset;
    });

    const xrefStart = offset;
    const xref = [
      'xref\n0 6\n',
      '0000000000 65535 f \n',
      ...offsets.map((objectOffset) => `${String(objectOffset).padStart(10, '0')} 00000 n \n`),
      `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`,
    ].join('');

    const pdf = `${header}${objects.join('')}${xref}`;
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'Aditya-Gupta-Resume.pdf';
    link.click();
    window.URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="glacier-shell min-h-screen">
      <div className="pointer-events-none fixed right-4 top-1/2 z-40 hidden h-56 -translate-y-1/2 lg:block">
        <div className="relative h-full w-px overflow-hidden rounded-full bg-white/10">
          <motion.div
            style={{ scaleY: pageScrollProgress }}
            className="absolute inset-0 origin-top rounded-full bg-[linear-gradient(180deg,rgba(124,58,237,0.9),rgba(6,182,212,0.95))] shadow-[0_0_24px_rgba(6,182,212,0.25)]"
          />
        </div>
      </div>

      <FloatingNavbar onDownloadResume={downloadResume} mode={mode} onToggleMode={toggleMode} />

      <main className="relative">
        <section id="home" ref={heroRef} className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-36 lg:pt-16">
          <motion.div style={{ opacity: heroGlow }} className="absolute inset-x-0 top-0 h-[54rem] bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_30%),radial-gradient(circle_at_70%_18%,rgba(6,182,212,0.16),transparent_20%)] blur-3xl" />
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative z-10 space-y-8"
            >
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-mist backdrop-blur-md">
                GLACIER / Futuristic Developer Portfolio
              </div>
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.45em] text-cyan/80">Aditya Gupta</p>
                <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-ice sm:text-6xl lg:text-7xl xl:text-8xl">
                  A cinematic portfolio for an <span className="bg-aurora bg-clip-text text-transparent">AI-assisted</span> developer.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-mist sm:text-lg">
                  Motivated Computer Science student passionate about AI-assisted development, modern frontend engineering,
                  immersive UI systems, and futuristic digital experiences.
                </p>
                <div className="flex items-center gap-3 text-sm text-cyan/90">
                  <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_18px_rgba(6,182,212,0.9)]" />
                  <span className="font-mono tracking-[0.16em]">{typedHeroLine}</span>
                  <motion.span
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-5 w-[2px] rounded-full bg-cyan"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <MagneticButton href="#projects">View Projects</MagneticButton>
                <MagneticButton href="#contact" variant="secondary">
                  Contact Me
                </MagneticButton>
                <MagneticButton href="#" variant="secondary" onClick={(event) => { event.preventDefault(); downloadResume(); }}>
                  Download Resume
                </MagneticButton>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {heroTitles.map((title, index) => (
                  <GlassCard key={title} className="p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-mist">0{index + 1}</p>
                    <p className="mt-3 text-sm font-medium text-ice">{title}</p>
                  </GlassCard>
                ))}
              </div>
            </motion.div>

            <div className="relative z-10">
              <div className="absolute inset-x-0 top-1/2 mx-auto h-60 w-60 -translate-y-1/2 rounded-full bg-cyan/10 blur-3xl" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.14),transparent_50%)] animate-glow" />
              <ProfileVisual />
              <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-mist">Focus</p>
                    <p className="mt-2 text-sm text-ice">Frontend + AI</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-mist">Style</p>
                    <p className="mt-2 text-sm text-ice">Cinematic UI</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-mist">Mode</p>
                    <p className="mt-2 text-sm text-ice">Startup-grade</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 h-px w-full frost-divider" />
        </section>

        <SceneSection id="about" activeSection={activeSection} className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionHeading
              eyebrow="About"
              title="Built like a modern founder portfolio, not a student template."
              description="Currently pursuing B.Tech in Computer Science with specialization in Business Systems at IET DAVV. Passionate about frontend engineering, AI-assisted development, interactive design systems, and immersive digital experiences."
            />
            <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 sm:p-6">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
              <div className="pointer-events-none absolute -left-24 top-8 h-52 w-52 rounded-full bg-cyan/10 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 bottom-2 h-56 w-56 rounded-full bg-aurora/10 blur-3xl" />

              <div className="relative grid gap-4 sm:grid-cols-2">
                <AboutInfoCard title="CSBS Student" icon="education" delay={0.05} />
                <AboutInfoCard title="Frontend Learner" icon="monitor" delay={0.1} />
                <AboutInfoCard title="AI Tools Enthusiast" icon="ai" delay={0.15} />
                <AboutInfoCard title="Problem Solver" icon="logic" delay={0.2} />
              </div>
            </div>
          </div>
        </SceneSection>

        <SceneSection id="education" activeSection={activeSection} className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Education"
            title="A clean vertical timeline with cold glow and floating depth."
            description="The path is designed as a glowing sequence, keeping the layout light while preserving the sense of movement and progression."
          />
          <div className="relative mt-12 grid gap-6 lg:grid-cols-2">
            <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-aurora via-cyan to-transparent lg:left-1/2" />
            {education.map((item, index) => (
              <div key={item.school} className={`relative lg:col-span-1 ${index % 2 === 0 ? 'lg:pr-10' : 'lg:col-start-2 lg:pl-10'}`}>
                <div className="absolute left-0 top-8 h-4 w-4 rounded-full bg-cyan shadow-[0_0_24px_rgba(6,182,212,0.6)] lg:left-1/2 lg:-translate-x-1/2" />
                <GlassCard className="p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan/70">0{index + 1}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-ice">{item.school}</h3>
                  <p className="mt-2 text-sm text-mist">{item.degree}</p>
                  <p className="mt-1 text-sm text-mist">{item.focus}</p>
                  <p className="mt-5 text-sm uppercase tracking-[0.3em] text-ice/80">{item.detail}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </SceneSection>

        <JourneySection activeSection={activeSection} />

        <SceneSection id="skills" activeSection={activeSection} className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Skills"
            title="Skills"
          />
          <div className="relative mt-12 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
            <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-cyan/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-aurora/10 blur-3xl" />

            <div className="relative grid gap-5 md:grid-cols-12">
              <SkillCard {...skillCards[0]} />
              <SkillCard {...skillCards[1]} />
              <SkillCard {...skillCards[2]} />
              <SkillCard {...skillCards[3]} />
              <SkillCard {...skillCards[4]} />
            </div>
          </div>
        </SceneSection>

        <SceneSection id="projects" activeSection={activeSection} className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Projects"
            title="Projects"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {projects.map((project) => (
              <motion.div
                key={project.title}
                whileHover={{ y: -10, scale: 1.01 }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.05)] p-7 shadow-glacier backdrop-blur-2xl"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_30%)] opacity-90 transition duration-500 group-hover:opacity-100" />
                <div className="relative space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-cyan/70">Project</p>
                      <h3 className="mt-3 text-2xl font-semibold text-ice">{project.title}</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist">Featured</span>
                  </div>
                  <p className="max-w-xl text-sm leading-7 text-mist">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-ice/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2">
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-[linear-gradient(135deg,rgba(124,58,237,0.28),rgba(6,182,212,0.2))] px-4 py-2.5 text-sm font-medium text-ice shadow-[0_0_24px_rgba(6,182,212,0.12)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan/50 hover:shadow-[0_0_34px_rgba(6,182,212,0.22)]"
                    >
                      <span className="relative h-2 w-2 rounded-full bg-cyan shadow-[0_0_14px_rgba(6,182,212,0.9)]">
                        <span className="absolute inset-0 animate-ping rounded-full bg-cyan/70" />
                      </span>
                      Live Link
                      <span className="text-base transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SceneSection>

        <ExperienceSection activeSection={activeSection} />

        <AchievementsSection activeSection={activeSection} />

        <SceneSection id="contact" activeSection={activeSection} className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <SectionHeading
                eyebrow="Contact"
                title="Contact"
              />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {contactLinks.map((contact) => (
                  <motion.a
                    key={contact.title}
                    href={contact.href}
                    target={contact.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={contact.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(6,182,212,0.16))] px-5 py-4 text-sm font-medium text-ice shadow-[0_0_24px_rgba(6,182,212,0.08)] backdrop-blur-2xl transition duration-300 hover:border-cyan/50 hover:shadow-[0_0_34px_rgba(124,58,237,0.22),0_0_28px_rgba(6,182,212,0.18)]"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 shadow-[inset_0_0_16px_rgba(255,255,255,0.06)]">
                      <IconMark kind={contact.icon} />
                    </span>
                    <span className="text-sm font-medium text-ice">{contact.title}</span>
                    <span className="ml-auto text-base transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
                  </motion.a>
                ))}
              </div>
            </div>

            <PremiumCard className="p-5 sm:p-7 lg:p-8">
              <form
                className="grid gap-4 sm:gap-5"
                action="https://formspree.io/f/xjgjzjzk"
                method="POST"
              >
                {['Name', 'Email', 'Project'].map((label) => (
                  <label key={label} className="group grid gap-2 text-sm text-mist">
                    <span className="text-[11px] uppercase tracking-[0.34em] text-mist/90">{label}</span>
                    <div className="relative">
                      <input
                        type={label === 'Email' ? 'email' : 'text'}
                        name={label.toLowerCase()}
                        required
                        placeholder=" "
                        className="peer w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-ice outline-none transition placeholder-transparent hover:bg-white/[0.07] focus:border-cyan/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_1px_rgba(6,182,212,0.18),0_0_0_4px_rgba(6,182,212,0.06)]"
                      />
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-mist transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.34em] peer-focus:text-cyan peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.34em]">
                        Your {label.toLowerCase()}
                      </span>
                    </div>
                  </label>
                ))}
                <label className="group grid gap-2 text-sm text-mist">
                  <span className="text-[11px] uppercase tracking-[0.34em] text-mist/90">Message</span>
                  <div className="relative">
                    <textarea
                      rows={6}
                      name="message"
                      required
                      placeholder=" "
                      className="peer w-full rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-4 text-ice outline-none transition placeholder-transparent hover:bg-white/[0.07] focus:border-cyan/50 focus:bg-white/[0.08] focus:shadow-[0_0_0_1px_rgba(6,182,212,0.18),0_0_0_4px_rgba(6,182,212,0.06)]"
                    />
                    <span className="pointer-events-none absolute left-4 top-4 text-sm text-mist transition-all duration-200 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.34em] peer-focus:text-cyan peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.34em]">
                      Tell me about the product, portfolio, or interface you want to build...
                    </span>
                  </div>
                </label>
                <MagneticButton as="button" type="submit" className="w-full justify-center text-sm sm:text-base">
                  Send Message
                </MagneticButton>
              </form>
            </PremiumCard>
          </div>
        </SceneSection>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="h-px w-full frost-divider" />
        <div className="flex flex-col gap-4 py-6 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>Built with React + Framer Motion + Three.js</p>
          <p>Aditya Gupta · GLACIER design system</p>
        </div>
      </footer>

      <div className="pointer-events-auto fixed inset-0 -z-10">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5.15], fov: 46 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.36} />
          <directionalLight position={[4, 6, 6]} intensity={1.05} color="#06b6d4" />
          <pointLight position={[-4, -2, 4]} intensity={0.75} color="#7c3aed" />
          <GlacierCore activeSection={activeSection} isActive={!isNightMode} />
          <BlackHoleCore activeSection={activeSection} isActive={isNightMode} />
        </Canvas>
      </div>
    </div>
  );
}
