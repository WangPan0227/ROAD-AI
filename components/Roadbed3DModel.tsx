
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, ContactShadows, Instance, Instances, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Roadbed3DModelProps {
  width?: number;
  height?: number;
  slopeRatio?: number;
  diseaseType?: string | null;
  repairMeasure?: string | null;
  viewMode?: 'disaster' | 'repair';
  showParticles?: boolean;
}

// --- Geometries ---

const TrapezoidalPrism: React.FC<{ 
  topWidth: number, 
  bottomWidth: number, 
  height: number, 
  length: number, 
  color: string, 
  opacity?: number,
  deformation?: { y: number, x: number } 
}> = ({ topWidth, bottomWidth, height, length, color, opacity = 1, deformation }) => {
  const mesh = useRef<THREE.Mesh>(null);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const halfTop = topWidth / 2;
    const halfBottom = bottomWidth / 2;
    s.moveTo(-halfBottom, 0);
    s.lineTo(halfBottom, 0);
    s.lineTo(halfTop, height);
    s.lineTo(-halfTop, height);
    s.lineTo(-halfBottom, 0);
    return s;
  }, [topWidth, bottomWidth, height]);

  const extrudeSettings = useMemo(() => ({
    depth: length,
    bevelEnabled: false
  }), [length]);

  useFrame((state) => {
    if (mesh.current && deformation) {
        // Simple deformation animation
        mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, deformation.y, 0.05);
        mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, deformation.x, 0.05);
    }
  });

  return (
    <mesh ref={mesh} rotation={[0, 0, 0]} position={[0, -height/2, -length/2]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
};

// --- Particles for Grouting ---

const GroutingParticles: React.FC<{ count?: number }> = ({ count = 100 }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 2,
        y: 5 + Math.random() * 5,
        z: (Math.random() - 0.5) * 8,
        speed: 0.05 + Math.random() * 0.05
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < 0) particle.y = 5; // Reset
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(0.1);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#3b82f6" />
    </instancedMesh>
  );
};

// --- Piles for Reinforcement ---

const AntiSlidePiles: React.FC<{ count?: number, length?: number }> = ({ count = 5, length = 6 }) => {
    return (
        <group>
            {Array.from({ length: count }).map((_, i) => (
                <mesh key={i} position={[2.5, -length/2 + 1, (i - count/2) * 2]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, length, 16]} />
                    <meshStandardMaterial color="#4b5563" />
                </mesh>
            ))}
        </group>
    )
}

// --- Main Component ---

const Roadbed3DModel: React.FC<Roadbed3DModelProps> = ({ 
  width = 12, 
  height = 6, 
  slopeRatio = 1.5, 
  diseaseType, 
  repairMeasure, 
  viewMode = 'disaster',
  showParticles = false
}) => {
  const topWidth = 10; // Fixed road width for viz
  const bottomWidth = topWidth + 2 * height * slopeRatio;
  
  // Determine deformation based on disease
  const getDeformation = () => {
      if (viewMode === 'disaster') {
          if (diseaseType === 'embankment_settlement') return { y: -1, x: 0 };
          if (diseaseType === 'slope_landslide') return { y: -2, x: 2 };
          if (diseaseType === 'embankment_frost') return { y: 0.5, x: 0 };
      }
      return { y: 0, x: 0 }; // Reset for repair view or normal
  };

  const deformation = getDeformation();

  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-b from-sky-50 to-white rounded-xl overflow-hidden shadow-inner border border-gray-200 relative">
      <Canvas camera={{ position: [15, 10, 15], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        
        <group position={[0, 0, 0]}>
            {/* Base Ground */}
            <mesh position={[0, -height/2 - 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>

            {/* Roadbed Body */}
            <TrapezoidalPrism 
                topWidth={topWidth} 
                bottomWidth={bottomWidth} 
                height={height} 
                length={20} 
                color={viewMode === 'disaster' && diseaseType ? "#ef4444" : "#9ca3af"}
                opacity={viewMode === 'repair' ? 0.6 : 1}
                deformation={deformation}
            />

            {/* Road Surface */}
            <mesh position={[deformation.x, height/2 + deformation.y + 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[topWidth, 20]} />
                <meshStandardMaterial color="#374151" />
            </mesh>

            {/* Repair Visuals */}
            {viewMode === 'repair' && (
                <>
                    {/* Piles */}
                    {(repairMeasure?.includes('抗滑桩') || repairMeasure?.includes('m3')) && (
                        <AntiSlidePiles count={8} length={height + 4} />
                    )}
                    
                    {/* Grouting */}
                    {(repairMeasure?.includes('注浆') || repairMeasure?.includes('nm1')) && (
                        <GroutingParticles count={200} />
                    )}

                    {/* Replacement */}
                    {(repairMeasure?.includes('换填') || repairMeasure?.includes('m1')) && (
                         <mesh position={[0, 0, 0]}>
                            <boxGeometry args={[topWidth, height/2, 20]} />
                            <meshStandardMaterial color="#fcd34d" opacity={0.8} transparent />
                        </mesh>
                    )}
                </>
            )}

            {/* Annotations */}
            <Text position={[0, height/2 + 2, 0]} fontSize={0.5} color="black" anchorX="center" anchorY="bottom">
                {viewMode === 'disaster' ? `病害模拟: ${diseaseType || '无'}` : `加固模拟: ${repairMeasure || '无'}`}
            </Text>
        </group>

        <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} />
        <Environment preset="city" />
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg text-xs space-y-2 pointer-events-none">
          <div className="font-bold text-gray-700 mb-1">图例 (Legend)</div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>路基主体 (Subgrade)</span>
          </div>
          {viewMode === 'disaster' && (
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>受损区域 (Damaged)</span>
              </div>
          )}
          {viewMode === 'repair' && (
              <>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>注浆粒子 (Grouting)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gray-600 rounded"></div>
                    <span>抗滑桩 (Piles)</span>
                </div>
              </>
          )}
      </div>
    </div>
  );
};

export default Roadbed3DModel;
