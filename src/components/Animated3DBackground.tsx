'use client';

import { motion, useReducedMotion } from 'framer-motion';

const floatingOrbs = [
  {
    className: 'left-[6%] top-[12%] h-44 w-44 bg-cyan-400/30',
    duration: 12,
    delay: 0,
    drift: 28,
  },
  {
    className: 'right-[8%] top-[18%] h-56 w-56 bg-emerald-400/25',
    duration: 16,
    delay: 1.5,
    drift: 36,
  },
  {
    className: 'left-[18%] bottom-[12%] h-36 w-36 bg-violet-400/25',
    duration: 14,
    delay: 0.8,
    drift: 22,
  },
];

export default function Animated3DBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#050816]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.15),_transparent_30%),linear-gradient(180deg,_#050816_0%,_#07111f_55%,_#02060f_100%)]" />

      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black_35%,transparent_88%)]" />

      <div className="absolute inset-0 [perspective:1600px]">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  rotateX: [68, 72, 68],
                  rotateY: [0, 8, 0],
                  translateY: [18, -6, 18],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 18,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="absolute inset-x-[-20%] bottom-[-10%] h-[58vh] origin-bottom [transform-style:preserve-3d]"
        >
          <div className="absolute inset-0 rounded-[48px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(6,182,212,0.06),rgba(15,23,42,0.12))] shadow-[0_0_120px_rgba(34,197,94,0.08)] backdrop-blur-[2px]" />
          <div className="absolute inset-0 rounded-[48px] bg-[repeating-linear-gradient(90deg,rgba(34,197,94,0.15)_0,rgba(34,197,94,0.15)_1px,transparent_1px,transparent_72px),repeating-linear-gradient(0deg,rgba(34,197,94,0.12)_0,rgba(34,197,94,0.12)_1px,transparent_1px,transparent_72px)] [mask-image:linear-gradient(180deg,transparent_0%,black_18%,black_78%,transparent_100%)]" />
        </motion.div>
      </div>

      {floatingOrbs.map((orb) => (
        <motion.div
          key={orb.className}
          className={`absolute ${orb.className} rounded-full blur-3xl`}
          animate={
            reduceMotion
              ? { opacity: 0.6 }
              : {
                  x: [0, orb.drift, 0, -orb.drift],
                  y: [0, -orb.drift / 2, 0, orb.drift / 3],
                  scale: [1, 1.15, 1],
                  rotate: [0, 12, 0, -12],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: orb.duration,
                  delay: orb.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/20 shadow-[0_0_140px_rgba(16,185,129,0.18)]"
        animate={reduceMotion ? { opacity: 0.5 } : { rotate: 360, scale: [0.94, 1.04, 0.94] }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 24,
                repeat: Infinity,
                ease: 'linear',
              }
        }
      />

      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.25),rgba(2,6,23,0.7))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,rgba(2,6,23,0.2)_72%,rgba(2,6,23,0.48)_100%)]" />
    </div>
  );
}
