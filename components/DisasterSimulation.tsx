
import React, { useRef, useEffect, useState } from 'react';
import { ReinforcementMeasure } from '../types';

interface SimulationProps {
  width: number;
  height: number;
  disasterType: string;
  subgradeType: string;
  severity: number;
  measures?: ReinforcementMeasure[];
  initialMode?: 'disaster' | 'repair';
}

interface Point3D { x: number; y: number; z: number; }

// Particle for grouting flow
interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
  color: string;
}

const DisasterSimulation: React.FC<SimulationProps> = ({ 
  width, 
  height, 
  disasterType, 
  subgradeType,
  severity,
  measures = [],
  initialMode = 'disaster'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  
  // Camera State
  const [camera, setCamera] = useState({
    pitch: 0.3, 
    yaw: 0.6,   
    distance: 500, 
    panX: 0,
    panY: 0
  });

  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'disaster' | 'repair'>(initialMode);
  const [time, setTime] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Constants
  const FOCAL_LENGTH = 700;
  
  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setDimensions({ w: width, h: height });
        }
    };
    updateSize();
    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = dimensions.w * dpr;
          canvas.height = dimensions.h * dpr;
          canvas.style.width = `${dimensions.w}px`;
          canvas.style.height = `${dimensions.h}px`;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.scale(dpr, dpr);
      }
  }, [dimensions]);

  // Interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setLastMouse({ x: e.clientX, y: e.clientY });
    setCamera(prev => ({
      ...prev,
      yaw: prev.yaw + dx * 0.01,
      pitch: Math.max(-0.5, Math.min(1.0, prev.pitch + dy * 0.01))
    }));
  };
  const handleMouseUp = () => setIsDragging(false);

  // Animation Loop
  const animate = () => {
    setTime(prev => {
      if (prev >= 100) {
        setIsPlaying(false);
        return 100;
      }
      return prev + 1.0; 
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    setTime(0);
    setIsPlaying(true);
    particlesRef.current = [];
  }, [mode, measures, disasterType]);

  // --- 3D Projection Engine ---
  const project = (p: Point3D, cx: number, cy: number): Point3D | null => {
    let x = p.x * Math.cos(camera.yaw) - p.z * Math.sin(camera.yaw);
    let z = p.x * Math.sin(camera.yaw) + p.z * Math.cos(camera.yaw);
    let y = p.y * Math.cos(camera.pitch) - z * Math.sin(camera.pitch);
    let z2 = p.y * Math.sin(camera.pitch) + z * Math.cos(camera.pitch);
    let z_depth = z2 + camera.distance;

    if (z_depth <= 10) return null;
    const scale = FOCAL_LENGTH / z_depth;
    return {
      x: cx + x * scale + camera.panX,
      y: cy + y * scale + camera.panY,
      z: z_depth 
    };
  };

  // --- Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = dimensions.w;
    const H = dimensions.h;
    const CX = W / 2;
    const CY = H / 2;

    // Clear & BG
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#e5e7eb');
    grad.addColorStop(1, '#f3f4f6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // --- Model Definition ---
    const scaleFactor = 10;
    const mW = width * scaleFactor; // Roadbed top width
    const mH = height * scaleFactor; // Height
    const mL = 300; // Length of road segment
    const slope = subgradeType === 'fill' ? 1.5 : (subgradeType === 'cut' ? -0.5 : 0); 
    const bottomW = mW + (mH * slope * 2);

    // Dynamic Deformation Logic
    const progress = time / 100;
    const isRepair = mode === 'repair';
    const effectiveSeverity = isRepair ? severity * (1 - progress) : severity * progress;

    // Helper to draw a polygon
    const drawPoly = (points: Point3D[], color: string, stroke: string = '', alpha: number = 1.0) => {
        const projected = points.map(p => project(p, CX, CY)).filter(p => p !== null) as Point3D[];
        if (projected.length < 3) return;
        
        ctx.beginPath();
        ctx.moveTo(projected[0].x, projected[0].y);
        for(let i=1; i<projected.length; i++) ctx.lineTo(projected[i].x, projected[i].y);
        ctx.closePath();
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();

        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    };

    // Helper: Draw Cylinder (Piles/Anchors)
    const drawCylinder = (start: Point3D, end: Point3D, radius: number, color: string) => {
        const steps = 6;
        const projectedStart = project(start, CX, CY);
        const projectedEnd = project(end, CX, CY);
        if(!projectedStart || !projectedEnd) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = radius * (FOCAL_LENGTH / projectedStart.z);
        ctx.beginPath();
        ctx.moveTo(projectedStart.x, projectedStart.y);
        ctx.lineTo(projectedEnd.x, projectedEnd.y);
        ctx.stroke();
    };

    // --- 1. Draw Internal Features (Voids / Piles) FIRST (Painter's Algoish) ---
    
    // Void / Hollow (路基空洞)
    if (disasterType.includes('空洞') || disasterType.includes('掏空')) {
        const voidSize = 40 * effectiveSeverity;
        if (voidSize > 5) {
            const center = { x: 0, y: mH/2, z: 0 };
            const vPoints = [
                {x: center.x-voidSize, y: center.y-voidSize, z: center.z-voidSize},
                {x: center.x+voidSize, y: center.y-voidSize, z: center.z-voidSize},
                {x: center.x+voidSize, y: center.y+voidSize, z: center.z-voidSize},
                {x: center.x-voidSize, y: center.y+voidSize, z: center.z-voidSize},
            ];
            drawPoly(vPoints, '#374151', '', 0.8); // Dark box inside
        }
    }

    // Piles (抗滑桩) - Solid Cylinders
    if (measures.some(m => m.name.includes('桩') || m.id === 'm3' || m.id === 'nm5')) {
        const pileCount = 6;
        const pileSpacing = mL / (pileCount - 1);
        for(let i=0; i<pileCount; i++) {
            const z = -mL/2 + i*pileSpacing;
            // Draw pile on the slope side
            const x = mW/2 + (mH/2 * slope); 
            drawCylinder(
                {x: x, y: -mH*0.2, z: z}, // Top
                {x: x, y: mH*1.5, z: z},  // Bottom (deep)
                4, '#4b5563'
            );
        }
    }

    // Anchors (锚杆) - Perpendicular to slope
    if (measures.some(m => m.name.includes('锚') || m.name.includes('土钉'))) {
         const anchorCount = 8;
         for(let i=0; i<anchorCount; i++) {
             const z = -mL/2 + Math.random() * mL;
             const y = Math.random() * mH;
             const xSurface = mW/2 + (y * slope); // Approx surface point
             drawCylinder(
                 {x: xSurface, y: y, z: z},
                 {x: xSurface - 60, y: y + 20, z: z}, // Into the soil
                 2, '#dc2626'
             );
         }
    }

    // --- 2. Draw Roadbed Mass (Translucent Trapezoid) ---
    
    // Vertices Definition
    // Top Surface: 4 points
    // y = 0 is top
    const topY = 0;
    const botY = mH;

    // Deformation Functions
    const getDeformation = (x: number, y: number, z: number): {dx:number, dy:number, dz:number} => {
        let dx=0, dy=0, dz=0;

        if (disasterType.includes('不均匀沉降')) {
            // Wavy surface
            if (y === topY) {
                dy = Math.sin(z * 0.05) * 20 * effectiveSeverity;
            }
        } else if (disasterType.includes('冻胀') || disasterType.includes('隆起')) {
            // Upward bulge
            if (y === topY && Math.abs(x) < mW/3) {
                dy = -30 * Math.cos(x/mW * Math.PI) * effectiveSeverity;
            }
        } else if (disasterType.includes('滑移') || disasterType.includes('滑塌')) {
            // Slide slope down and out
            if (x > 0) { // Right side slope
                dx = 30 * effectiveSeverity;
                dy = 30 * effectiveSeverity;
            }
        } 
        // Uniform settlement = no shape change, just position (ignored for visualization clarity as per prompt)

        return {dx, dy, dz};
    };

    const applyDef = (p: Point3D) => {
        const d = getDeformation(p.x, p.y, p.z);
        return { x: p.x + d.dx, y: p.y + d.dy, z: p.z + d.dz };
    };

    // Raw Geometry
    const tL = -mL/2; const tR = mL/2;
    const rawTopLeftBack = {x: -mW/2, y: topY, z: tL};
    const rawTopRightBack = {x: mW/2, y: topY, z: tL};
    const rawTopRightFront = {x: mW/2, y: topY, z: tR};
    const rawTopLeftFront = {x: -mW/2, y: topY, z: tR};

    const rawBotLeftBack = {x: -bottomW/2, y: botY, z: tL};
    const rawBotRightBack = {x: bottomW/2, y: botY, z: tL};
    const rawBotRightFront = {x: bottomW/2, y: botY, z: tR};
    const rawBotLeftFront = {x: -bottomW/2, y: botY, z: tR};

    // Deformed Geometry
    const pTLB = applyDef(rawTopLeftBack);
    const pTRB = applyDef(rawTopRightBack);
    const pTRF = applyDef(rawTopRightFront);
    const pTLF = applyDef(rawTopLeftFront);
    const pBLB = applyDef(rawBotLeftBack);
    const pBRB = applyDef(rawBotRightBack);
    const pBRF = applyDef(rawBotRightFront);
    const pBLF = applyDef(rawBotLeftFront);

    // Draw Faces (Painter's Algo: Back -> Front roughly)
    // Bottom (Hidden mostly)
    drawPoly([pBLB, pBRB, pBRF, pBLF], '#9ca3af', '', 0.3);
    // Back
    drawPoly([pTLB, pTRB, pBRB, pBLB], '#6b7280', '', 0.4);
    // Left
    drawPoly([pTLB, pTLF, pBLF, pBLB], '#4b5563', '#374151', 0.5);
    // Right
    drawPoly([pTRB, pTRF, pBRF, pBRB], '#4b5563', '#374151', 0.5);
    // Front
    drawPoly([pTLF, pTRF, pBRF, pBLF], '#9ca3af', '#374151', 0.3); // Cut section view
    // Top (Road surface)
    drawPoly([pTLB, pTRB, pTRF, pTLF], '#374151', '#1f2937', 0.7);

    // --- 3. Surface Details (Cracks) ---
    if (disasterType.includes('裂') || disasterType.includes('开裂')) {
        const crackCount = 5;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i=0; i<crackCount; i++) {
            const zStart = tL + Math.random() * mL;
            let curr = {x: -mW/4, y: topY, z: zStart};
            const startP = project(applyDef(curr), CX, CY);
            if(startP) ctx.moveTo(startP.x, startP.y);
            
            for(let j=0; j<5; j++) {
                curr.x += mW/10;
                curr.z += (Math.random() - 0.5) * 20;
                const nextP = project(applyDef(curr), CX, CY);
                if(nextP) ctx.lineTo(nextP.x, nextP.y);
            }
        }
        ctx.stroke();
    }

    // --- 4. Particles (Grouting) ---
    if (measures.some(m => m.name.includes('注浆') || m.id === 'nm1')) {
        if (isRepair && isPlaying && time < 80) {
            // Spawn
            for(let i=0; i<5; i++) {
                particlesRef.current.push({
                    x: (Math.random()-0.5) * 10,
                    y: -50,
                    z: (Math.random()-0.5) * 50,
                    vx: (Math.random()-0.5) * 2,
                    vy: 5,
                    vz: (Math.random()-0.5) * 2,
                    life: 1.0,
                    color: '#fbbf24'
                });
            }
        }
        
        // Update & Draw Particles
        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            
            // Collision with inside of roadbed (approx)
            if (p.y > mH/2) {
                p.vy = 0;
                p.vx *= 0.8;
                p.vz *= 0.8;
            }

            const pp = project(p, CX, CY);
            if (pp) {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(pp.x, pp.y, 2000/pp.z, 0, Math.PI*2);
                ctx.fill();
            }
            p.life -= 0.01;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    }

  }, [dimensions, camera, time, mode, disasterType, subgradeType, severity, measures]);

  return (
    <div 
      ref={containerRef}
      className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-300 h-full w-full select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs text-gray-600 shadow-sm pointer-events-none">
         {disasterType} (拖动旋转)
      </div>

      <div className="absolute bottom-2 right-2 flex space-x-2">
         {initialMode !== 'disaster' && (
             <button 
               onClick={() => { setTime(0); setIsPlaying(true); }}
               className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-blue-700"
             >
               重播
             </button>
         )}
      </div>
    </div>
  );
};

export default DisasterSimulation;
