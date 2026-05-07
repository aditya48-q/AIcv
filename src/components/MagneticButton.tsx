import { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

type MagneticButtonProps =
  | (AnchorHTMLAttributes<HTMLAnchorElement> & {
      as?: 'a';
      variant?: 'primary' | 'secondary';
    })
  | (ButtonHTMLAttributes<HTMLButtonElement> & {
      as: 'button';
      variant?: 'primary' | 'secondary';
    });

export function MagneticButton({ as = 'a', variant = 'primary', className = '', children, ...props }: MagneticButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-300';
  const variants =
    variant === 'primary'
      ? 'bg-aurora text-white shadow-glacier hover:shadow-glacier-soft'
      : 'border border-white/10 bg-white/5 text-ice backdrop-blur-md hover:bg-white/10';
  const MotionAnchor = motion.a as any;
  const MotionButton = motion.button as any;

  if (as === 'button') {
    return (
      <MotionButton
        type="button"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`${base} ${variants} ${className}`}
        {...props}
      >
        {children}
      </MotionButton>
    );
  }

  return (
    <MotionAnchor
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${variants} ${className}`}
      {...props}
    >
      {children}
    </MotionAnchor>
  );
}
