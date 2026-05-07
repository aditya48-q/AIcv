import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { navigationItems } from '../constants/content';

interface FloatingNavbarProps {
  onDownloadResume: () => void;
  mode: 'dark' | 'ice';
  onToggleMode: () => void;
}

export function FloatingNavbar({ onDownloadResume, mode, onToggleMode }: FloatingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div
        className={`flex items-center justify-between gap-4 rounded-full border px-4 py-3 backdrop-blur-2xl transition-colors duration-300 sm:px-6 ${
          scrolled ? 'border-white/10 bg-[rgba(7,17,31,0.72)] shadow-glacier' : 'border-white/8 bg-[rgba(7,17,31,0.55)]'
        }`}
      >
        <a href="#home" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-ice shadow-glacier-soft">
            AG
          </span>
          <div>
            <p className="text-sm font-semibold text-ice">Aditya Gupta</p>
            <p className="text-[11px] uppercase tracking-[0.28em] text-mist">GLACIER</p>
          </div>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative rounded-full px-3 py-2 text-sm text-mist transition-colors hover:text-ice"
            >
              {item.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-aurora transition-transform duration-300 hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMode}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-ice transition hover:bg-white/10"
          >
            {mode === 'dark' ? 'Ice Mode' : 'Night Mode'}
          </button>
          <button
            type="button"
            onClick={onDownloadResume}
            className="hidden rounded-full bg-aurora px-4 py-2 text-xs font-medium text-white shadow-glacier-soft transition hover:scale-105 sm:inline-flex"
          >
            Resume
          </button>
        </div>
      </div>
    </motion.header>
  );
}
