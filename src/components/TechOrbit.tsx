import { useEffect, useState } from 'react';

type TechObject = {
  label: string;
  tone: 'cyan' | 'lime' | 'white';
  x: string;
  y: string;
  delay: string;
};

const objects: TechObject[] = [
  { label: 'K8s', tone: 'cyan', x: '9%', y: '22%', delay: '0s' },
  { label: 'IaC', tone: 'lime', x: '74%', y: '18%', delay: '-2s' },
  { label: 'TLS', tone: 'white', x: '82%', y: '68%', delay: '-4s' },
  { label: 'CLI', tone: 'cyan', x: '18%', y: '74%', delay: '-1s' },
];

export default function TechOrbit() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % objects.length), 2400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="tech-orbit pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15" />
      <div className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/20 [animation:spin_24s_linear_infinite]" />
      {objects.map((item, index) => (
        <span
          key={item.label}
          className={`absolute rounded-full border px-3 py-2 font-mono text-xs shadow-lg shadow-cyan-950/30 [animation:float_7s_ease-in-out_infinite] ${item.tone === 'cyan' ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : item.tone === 'lime' ? 'border-lime-300/50 bg-lime-300/10 text-lime-100' : 'border-white/30 bg-white/10 text-white'}`}
          style={{ left: item.x, top: item.y, animationDelay: item.delay, opacity: active === index ? 1 : 0.62 }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}