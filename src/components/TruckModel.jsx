import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';

function StatusMaterial({ info, baseColor = '#004a99' }) {
  const matRef = useRef();
  useFrame((state) => {
    if (matRef.current && info?.pulse) {
      matRef.current.emissiveIntensity = 0.5 + Math.abs(Math.sin(state.clock.getElapsedTime() * 3)) * 1.5;
    }
  });
  return (
    <meshPhysicalMaterial
      ref={matRef}
      color={info ? info.color : baseColor}
      roughness={0.2} metalness={0.6} clearcoat={1.0}
      emissive={info ? info.emissive : '#000000'}
      emissiveIntensity={info ? info.intensity : 0}
    />
  );
}

export default function TruckModel({ truckData }) {
  const group = useRef();

  const getStatusInfo = (val, type) => {
    if (type === 'tire' || type === 'brakes') {
      if (val < 75) return { color: '#f87171', emissive: '#ef4444', intensity: 1.5, pulse: true };
      if (val < 85) return { color: '#fbbf24', emissive: '#f59e0b', intensity: 0.8, pulse: false };
      return null;
    }
    if (type === 'engine') {
      if (val === 'FAULT') return { color: '#f87171', emissive: '#ef4444', intensity: 1.5, pulse: true };
      if (val === 'SERVICE') return { color: '#fbbf24', emissive: '#f59e0b', intensity: 0.8, pulse: false };
      return null;
    }
    return null;
  };

  const tireRLStatus = getStatusInfo(truckData.tireRL, 'tire');
  const engineStatus = getStatusInfo(truckData.engine, 'engine');

  const chromeMat = <meshPhysicalMaterial color="#ffffff" metalness={1.0} roughness={0.05} clearcoat={1.0} envMapIntensity={1.5} />;
  const rubberMat = <meshStandardMaterial color="#0a0a0a" roughness={0.9} />;
  const glassMat = <meshPhysicalMaterial color="#020617" roughness={0} metalness={0.9} transparent opacity={0.6} transmission={0.5} />;
  const frameMat = <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.7} />;

  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.getElapsedTime() * 0.15;
  });

  return (
    <group ref={group} scale={0.8} position={[1.0, -0.6, 0]}>
      <mesh position={[-1.0, 0.4, 0.4]}><boxGeometry args={[11, 0.2, 0.15]} />{frameMat}</mesh>
      <mesh position={[-1.0, 0.4, -0.4]}><boxGeometry args={[11, 0.2, 0.15]} />{frameMat}</mesh>
      <RoundedBox args={[0.3, 0.6, 2.6]} position={[4.4, 0.4, 0]} radius={0.05}>{chromeMat}</RoundedBox>
      <RoundedBox args={[0.1, 1.2, 1.4]} position={[4.1, 1.0, 0]} radius={0.05}>{chromeMat}</RoundedBox>
      <mesh position={[4.16, 1.0, 0]}><boxGeometry args={[0.02, 1.1, 1.2]} /><meshStandardMaterial color="#111" metalness={0.8} /></mesh>
      <group position={[2.5, 1.0, 0]}>
        <RoundedBox args={[1.8, 1.2, 1.8]} radius={0.2} smoothness={4}><StatusMaterial info={engineStatus} /></RoundedBox>
        <mesh position={[0.8, -0.2, 0.7]}><boxGeometry args={[0.1, 0.2, 0.4]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} /></mesh>
        <mesh position={[0.8, -0.2, -0.7]}><boxGeometry args={[0.1, 0.2, 0.4]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} /></mesh>
      </group>
      <group position={[0.8, 1.6, 0]}>
        <RoundedBox args={[2.8, 2.2, 2.2]} radius={0.15}><StatusMaterial info={null} /></RoundedBox>
        <RoundedBox args={[2.4, 1.2, 2.15]} position={[-0.2, 1.2, 0]} radius={0.1}><StatusMaterial info={null} /></RoundedBox>
        <mesh position={[1.0, 0.8, 0]} rotation={[0, 0, -Math.PI/6]}><boxGeometry args={[1.5, 0.8, 2.15]} /><StatusMaterial info={null} /></mesh>
      </group>
      <mesh position={[2.22, 2.2, 0]} rotation={[0, 0, -Math.PI/6]}><planeGeometry args={[1.6, 1.2]} />{glassMat}</mesh>
      <RoundedBox args={[3.2, 1.0, 0.2]} position={[0.8, 0.5, 1.1]} radius={0.05}><StatusMaterial info={null} /></RoundedBox>
      <RoundedBox args={[3.2, 1.0, 0.2]} position={[0.8, 0.5, -1.1]} radius={0.05}><StatusMaterial info={null} /></RoundedBox>
      <group position={[-5.8, 2.4, 0]}>
        <RoundedBox args={[10.2, 3.8, 2.5]} radius={0.05}><meshStandardMaterial color="#f1f5f9" roughness={0.4} metalness={0.1} /></RoundedBox>
        <RoundedBox args={[0.6, 1.2, 1.6]} position={[5.4, 0.2, 0]} radius={0.02}>{frameMat}</RoundedBox>
      </group>
      {[
        [3.6, 0.4, 1.1], [3.6, 0.4, -1.1],
        [0.8, 0.4, 1.15], [0.8, 0.4, 0.75], [0.8, 0.4, -1.15], [0.8, 0.4, -0.75],
        [-0.4, 0.4, 1.15], [-0.4, 0.4, 0.75], [-0.4, 0.4, -1.15], [-0.4, 0.4, -0.75],
        [-7.0, 0.4, 1.15], [-7.0, 0.4, 0.75], [-7.0, 0.4, -1.15], [-7.0, 0.4, -0.75],
        [-8.4, 0.4, 1.15], [-8.4, 0.4, 0.75], [-8.4, 0.4, -1.15], [-8.4, 0.4, -0.75]
      ].map((pos, i) => {
        const isRearLeftTire = pos[0] === 0.8 && pos[2] === 1.15;
        const tireMat = isRearLeftTire && tireRLStatus ? (
          <meshPhysicalMaterial color={tireRLStatus.color} emissive={tireRLStatus.emissive} emissiveIntensity={tireRLStatus.intensity} roughness={0.1} />
        ) : rubberMat;
        return (
          <group key={i} position={pos} rotation={[Math.PI/2, 0, 0]}>
            <mesh><cylinderGeometry args={[0.42, 0.42, 0.35, 32]} />{tireMat}</mesh>
            <mesh position={[0, pos[2]>0?0.18:-0.18, 0]}><cylinderGeometry args={[0.25, 0.2, 0.05, 32]} />{chromeMat}</mesh>
          </group>
        );
      })}
      <mesh position={[-0.6, 2.5, 0.9]}><cylinderGeometry args={[0.08, 0.08, 3.5, 16]} />{frameMat}</mesh>
    </group>
  );
}
