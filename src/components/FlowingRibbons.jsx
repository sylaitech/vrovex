import { useEffect, useRef } from 'react';

function catmullRom2bezier(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function buildRibbonPoints(t, config) {
  const { phase, baseY, amp, freq, steps = 28, width = 1.4 } = config;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const x = progress * 1400 - 120;
    const wave =
      Math.sin(progress * Math.PI * freq + t + phase) * amp +
      Math.sin(progress * Math.PI * (freq * 0.45) + t * 0.65 + phase * 1.3) * amp * 0.35;
    const y = baseY + wave + Math.sin(t * 0.4 + phase) * 12 * width;
    pts.push([x, y]);
  }
  return pts;
}

export default function FlowingRibbons() {
  const pathRef1 = useRef(null);
  const pathRef2 = useRef(null);
  const pathRef3 = useRef(null);
  const glowRef1 = useRef(null);
  const glowRef2 = useRef(null);
  const groupRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const applyPaths = (t) => {
      const d1 = catmullRom2bezier(
        buildRibbonPoints(t, { phase: 0, baseY: 280, amp: 140, freq: 2.1 })
      );
      const d2 = catmullRom2bezier(
        buildRibbonPoints(t, { phase: 2.4, baseY: 520, amp: 110, freq: 2.6, width: 0.9 })
      );
      const d3 = catmullRom2bezier(
        buildRibbonPoints(t, { phase: 4.2, baseY: 400, amp: 85, freq: 3.2, width: 0.7 })
      );

      if (pathRef1.current) pathRef1.current.setAttribute('d', d1);
      if (pathRef2.current) pathRef2.current.setAttribute('d', d2);
      if (pathRef3.current) pathRef3.current.setAttribute('d', d3);
      if (glowRef1.current) glowRef1.current.setAttribute('d', d1);
      if (glowRef2.current) glowRef2.current.setAttribute('d', d2);

      if (groupRef.current) {
        const driftX = Math.sin(t * 0.35) * 18;
        const driftY = Math.cos(t * 0.28) * 14;
        const rot = Math.sin(t * 0.15) * 1.2;
        groupRef.current.setAttribute(
          'transform',
          `translate(${driftX}, ${driftY}) rotate(${rot} 700 400)`
        );
      }
    };

    applyPaths(0);

    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const t = (now - startRef.current) * 0.00012;

      applyPaths(t);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="flow-ribbons" aria-hidden="true">
      <svg
        className="flow-ribbons-svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ribbonOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#70dcd3" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#00ade4" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#0092e4" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#5a8a80" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3d5248" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="ribbonCore" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#70dcd3" stopOpacity="0.2" />
            <stop offset="30%" stopColor="#b8a8c8" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#70dcd3" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#00ade4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5a7268" stopOpacity="0.25" />
          </linearGradient>
          <filter id="ribbonBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.44
                      0 0 0 0 0.86
                      0 0 0 0 0.83
                      0 0 0 0.45 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="ribbonSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <g ref={groupRef} className="flow-ribbons-group">
          <path
            ref={glowRef1}
            fill="none"
            stroke="url(#ribbonOuter)"
            strokeWidth="72"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.22"
            filter="url(#ribbonBlur)"
          />
          <path
            ref={glowRef2}
            fill="none"
            stroke="url(#ribbonCore)"
            strokeWidth="52"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.18"
            filter="url(#ribbonBlur)"
          />
          <path
            ref={pathRef3}
            fill="none"
            stroke="url(#ribbonCore)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
            filter="url(#ribbonSoftGlow)"
            className="ribbon-dash ribbon-dash-slow"
          />
          <path
            ref={pathRef1}
            fill="none"
            stroke="url(#ribbonOuter)"
            strokeWidth="38"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.42"
            filter="url(#ribbonSoftGlow)"
            className="ribbon-dash"
          />
          <path
            ref={pathRef2}
            fill="none"
            stroke="url(#ribbonOuter)"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.32"
            className="ribbon-dash ribbon-dash-alt"
          />
        </g>
      </svg>
    </div>
  );
}
