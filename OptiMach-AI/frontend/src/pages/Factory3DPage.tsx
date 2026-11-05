import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Box,
  Eye,
  AlertTriangle,
  RotateCcw,
  Zap,
  Activity,
  Gauge,
  Sliders,
  Wrench,
  CheckCircle,
  AlertOctagon,
  Thermometer,
  Layers,
  ChevronRight,
  Maximize2,
  Scan,
} from 'lucide-react';
import { Machine } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CircularGauge } from '../components/CircularGauge';
import { playClickSound } from '../utils/audio';

interface Factory3DPageProps {
  machines: Machine[];
  onSelectMachineForPredict: (machine: Machine) => void;
  onNavigateToLive: (machineId: string) => void;
  onOpenMaintenanceModal: (machineId: string) => void;
}

export const Factory3DPage: React.FC<Factory3DPageProps> = ({
  machines,
  onSelectMachineForPredict,
  onNavigateToLive,
  onOpenMaintenanceModal,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('MCH-04');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [activeCameraAngle, setActiveCameraAngle] = useState<string>('conveyor');

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const machineMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const holographicRingRef = useRef<THREE.Mesh | null>(null);

  const animatedPartsRef = useRef<{
    motorShaft?: THREE.Mesh;
    coolingFan?: THREE.Mesh;
    conveyorRollers?: THREE.Mesh[];
    conveyorPallets?: THREE.Mesh[];
    pumpImpeller?: THREE.Mesh;
    beacons?: { mesh: THREE.Mesh; color: string; isFlashing: boolean }[];
    conduitLines?: THREE.Line[];
  }>({});

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x080808);
    scene.fog = new THREE.FogExp2(0x080808, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 7, 14); // default focused on MCH-04 conveyor

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 5;
    controls.maxDistance = 65;
    controls.target.set(0, 1.5, 4);

    // 3. Dynamic Industrial Lighting
    const ambientLight = new THREE.AmbientLight(0x1a1a1a, 2.0);
    scene.add(ambientLight);

    const mainDirectional = new THREE.DirectionalLight(0xffd700, 1.8);
    mainDirectional.position.set(16, 26, 14);
    mainDirectional.castShadow = true;
    mainDirectional.shadow.mapSize.width = 2048;
    mainDirectional.shadow.mapSize.height = 2048;
    mainDirectional.shadow.camera.near = 0.5;
    mainDirectional.shadow.camera.far = 90;
    const d = 26;
    mainDirectional.shadow.camera.left = -d;
    mainDirectional.shadow.camera.right = d;
    mainDirectional.shadow.camera.top = d;
    mainDirectional.shadow.camera.bottom = -d;
    scene.add(mainDirectional);

    const fillLight = new THREE.DirectionalLight(0xd4af37, 1.0);
    fillLight.position.set(-16, 16, -16);
    scene.add(fillLight);

    // 4. Industrial Floor with Reflective Finish & Grid
    const floorSize = 52;
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x121212,
      roughness: 0.7,
      metalness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Overlay
    const grid = new THREE.GridHelper(floorSize, 52, 0x66521a, 0x1a1a1a);
    grid.position.y = 0.02;
    scene.add(grid);

    // Glowing Neon Energy Conduit Bus Lines along floor
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xd4af37, linewidth: 2 });
    const conduitPoints = [
      new THREE.Vector3(-10, 0.05, 6),
      new THREE.Vector3(-10, 0.05, -6),
      new THREE.Vector3(-8, 0.05, -6),
      new THREE.Vector3(0, 0.05, 4),
      new THREE.Vector3(8, 0.05, -6),
      new THREE.Vector3(10, 0.05, 6),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(conduitPoints);
    const conduitLine = new THREE.Line(lineGeo, lineMaterial);
    scene.add(conduitLine);

    // Structural Pillars with safety warning bands
    const pillarGeo = new THREE.BoxGeometry(0.8, 12, 0.8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.4 });
    const pillarPositions = [
      [-20, 6, -20],
      [20, 6, -20],
      [-20, 6, 20],
      [20, 6, 20],
    ];
    pillarPositions.forEach(([x, y, z]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(x, y, z);
      p.castShadow = true;
      scene.add(p);
    });

    // Holographic Target Selection Ring
    const holoGeo = new THREE.RingGeometry(2.4, 2.6, 32);
    const holoMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const holoRing = new THREE.Mesh(holoGeo, holoMat);
    holoRing.rotation.x = -Math.PI / 2;
    holoRing.position.set(0, 0.08, 4);
    scene.add(holoRing);
    holographicRingRef.current = holoRing;

    // 5. Build Procedural Industrial Machinery
    const animated: typeof animatedPartsRef.current = {
      conveyorRollers: [],
      conveyorPallets: [],
      beacons: [],
    };

    const getStatusColorHex = (status: string) => {
      switch (status) {
        case 'Healthy':
          return 0x10b981;
        case 'Warning':
          return 0xf59e0b;
        case 'High Risk':
          return 0xf97316;
        case 'Critical':
          return 0xef4444;
        default:
          return 0x38bdf8;
      }
    };

    const addBeacon = (parent: THREE.Group, yPos: number, status: string, machineId: string) => {
      const beaconGroup = new THREE.Group();
      const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 0.45;
      beaconGroup.add(mast);

      const lightColor = getStatusColorHex(status);
      const bulbGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: lightColor,
        emissive: lightColor,
        emissiveIntensity: 2.0,
        roughness: 0.1,
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 0.95;
      beaconGroup.add(bulb);

      const pointLight = new THREE.PointLight(lightColor, 1.8, 7);
      pointLight.position.y = 0.95;
      beaconGroup.add(pointLight);

      beaconGroup.position.set(0, yPos, 0);
      parent.add(beaconGroup);

      animated.beacons?.push({
        mesh: bulb,
        color: status,
        isFlashing: status === 'Critical' || status === 'High Risk',
      });
    };

    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

    // Machine 1: Heavy Duty Induction Motor (MCH-01)
    const m1 = new THREE.Group();
    m1.userData = { id: 'MCH-01', name: 'Heavy Duty Induction Motor' };
    m1.position.set(-8, 0, -6);

    const m1Skid = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 2.2), darkMetalMat);
    m1Skid.position.y = 0.2;
    m1Skid.castShadow = true;
    m1.add(m1Skid);

    const statorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.65, roughness: 0.35 });
    const stator = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.2, 24), statorMat);
    stator.rotation.z = Math.PI / 2;
    stator.position.set(0, 1.4, 0);
    stator.castShadow = true;
    m1.add(stator);

    // Stator cooling ribs
    for (let i = -0.8; i <= 0.8; i += 0.3) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.05, 8, 24), statorMat);
      rib.rotation.y = Math.PI / 2;
      rib.position.set(i, 1.4, 0);
      m1.add(rib);
    }

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 16), chromeMat);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(1.5, 1.4, 0);
    m1.add(shaft);
    animated.motorShaft = shaft;

    const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 20), darkMetalMat);
    pulley.rotation.z = Math.PI / 2;
    pulley.position.set(1.9, 1.4, 0);
    m1.add(pulley);

    const m1Status = machines.find((m) => m.id === 'MCH-01')?.status || 'Healthy';
    addBeacon(m1, 2.7, m1Status, 'MCH-01');
    scene.add(m1);
    machineMeshesRef.current.set('MCH-01', m1);

    // Machine 2: 5-Axis CNC Milling Center (MCH-02)
    const m2 = new THREE.Group();
    m2.userData = { id: 'MCH-02', name: '5-Axis CNC Milling Center' };
    m2.position.set(8, 0, -6);

    const m2Base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, 3.6), darkMetalMat);
    m2Base.position.y = 0.5;
    m2.add(m2Base);

    const m2Cabinet = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.5, 3.4), darkMetalMat);
    m2Cabinet.position.y = 2.75;
    m2.add(m2Cabinet);

    // Glass safety view window
    const m2Glass = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.8, 0.1),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transmission: 0.85, transparent: true, opacity: 0.8 })
    );
    m2Glass.position.set(0, 2.8, 1.72);
    m2.add(m2Glass);

    // Operator console display
    const m2Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.7), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    m2Screen.position.set(2.4, 2.9, 1.51);
    m2.add(m2Screen);

    const m2Status = machines.find((m) => m.id === 'MCH-02')?.status || 'Healthy';
    addBeacon(m2, 4.5, m2Status, 'MCH-02');
    scene.add(m2);
    machineMeshesRef.current.set('MCH-02', m2);

    // Machine 4: Industrial Conveyor System (MCH-04 - CRITICAL!)
    const m4 = new THREE.Group();
    m4.userData = { id: 'MCH-04', name: 'Industrial Conveyor Drive System' };
    m4.position.set(0, 0, 4);

    const bed = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.3, 2.2), darkMetalMat);
    bed.position.y = 1.6;
    bed.castShadow = true;
    m4.add(bed);

    // Legs
    [-4.5, -1.5, 1.5, 4.5].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 2.1), darkMetalMat);
      leg.position.set(x, 0.75, 0);
      m4.add(leg);
    });

    const belt = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.05, 1.8), new THREE.MeshStandardMaterial({ color: 0x090f1d, roughness: 0.9 }));
    belt.position.y = 1.78;
    m4.add(belt);

    // Drive Motor attached (colored red for critical alert)
    const cMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6 }));
    cMotor.rotation.z = Math.PI / 2;
    cMotor.position.set(5.8, 1.6, 0);
    m4.add(cMotor);

    // Rollers
    for (let rx = -5.0; rx <= 5.0; rx += 1.0) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.9, 12), chromeMat);
      roller.rotation.x = Math.PI / 2;
      roller.position.set(rx, 1.7, 0);
      m4.add(roller);
      animated.conveyorRollers?.push(roller);
    }

    // Moving Pallets
    const palletGeo = new THREE.BoxGeometry(0.9, 0.6, 0.9);
    const palletColors = [0x0284c7, 0x6366f1, 0x0d9488];
    [-3.5, 0.2, 3.8].forEach((px, i) => {
      const pallet = new THREE.Mesh(palletGeo, new THREE.MeshStandardMaterial({ color: palletColors[i % 3], metalness: 0.3 }));
      pallet.position.set(px, 2.1, 0);
      pallet.castShadow = true;
      m4.add(pallet);
      animated.conveyorPallets?.push(pallet);
    });

    const m4Status = machines.find((m) => m.id === 'MCH-04')?.status || 'Critical';
    addBeacon(m4, 2.8, m4Status, 'MCH-04');
    scene.add(m4);
    machineMeshesRef.current.set('MCH-04', m4);

    // Machine 5: Centrifugal Slurry Turbopump (MCH-05)
    const m5 = new THREE.Group();
    m5.userData = { id: 'MCH-05', name: 'Centrifugal Slurry Turbopump' };
    m5.position.set(-10, 0, 6);

    const m5Skid = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 2.2), darkMetalMat);
    m5Skid.position.y = 0.18;
    m5.add(m5Skid);

    const pumpVolute = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.45, 16, 24), new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.7 }));
    pumpVolute.position.set(0, 1.4, 0);
    m5.add(pumpVolute);

    const discharge = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.0, 16), darkMetalMat);
    discharge.position.set(0.9, 2.2, 0);
    m5.add(discharge);

    const m5Status = machines.find((m) => m.id === 'MCH-05')?.status || 'High Risk';
    addBeacon(m5, 3.5, m5Status, 'MCH-05');
    scene.add(m5);
    machineMeshesRef.current.set('MCH-05', m5);

    // Machine 3: High-Pressure Rotary Compressor (MCH-03)
    const m3 = new THREE.Group();
    m3.userData = { id: 'MCH-03', name: 'High-Pressure Rotary Compressor' };
    m3.position.set(10, 0, 6);

    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.8, 20), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7 }));
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0, 1.5, 0);
    m3.add(tank);

    const m3Status = machines.find((m) => m.id === 'MCH-03')?.status || 'Warning';
    addBeacon(m3, 3.1, m3Status, 'MCH-03');
    scene.add(m3);
    machineMeshesRef.current.set('MCH-03', m3);

    animatedPartsRef.current = animated;

    // 6. Raycast Machine Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const machineGroups = Array.from(machineMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(machineGroups, true);

      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && curr.parent && curr.parent !== scene) {
          if (curr.userData && curr.userData.id) {
            playClickSound();
            setSelectedMachineId(curr.userData.id);
            // Move holographic ring to this machine position
            if (holographicRingRef.current) {
              holographicRingRef.current.position.set(curr.position.x, 0.08, curr.position.z);
            }
            break;
          }
          curr = curr.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 7. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Spin motor shaft
      if (animated.motorShaft) {
        animated.motorShaft.rotation.x += 18 * delta;
      }

      // Spin conveyor rollers
      if (animated.conveyorRollers) {
        animated.conveyorRollers.forEach((r) => {
          r.rotation.y += 10 * delta;
        });
      }

      // Move pallets along belt
      if (animated.conveyorPallets) {
        animated.conveyorPallets.forEach((pallet) => {
          pallet.position.x += 1.8 * delta;
          if (pallet.position.x > 5.0) {
            pallet.position.x = -5.0;
          }
        });
      }

      // Rotate holographic selection ring
      if (holographicRingRef.current) {
        holographicRingRef.current.rotation.z += 1.5 * delta;
      }

      // Flashing / Pulsing beacons
      if (animated.beacons) {
        animated.beacons.forEach((b) => {
          if (b.isFlashing) {
            const intensity = Math.sin(time * 9) > 0 ? 3.5 : 0.3;
            (b.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
          } else {
            (b.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + 0.6 * Math.sin(time * 3);
          }
        });
      }

      if (isAutoRotate) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;
      } else {
        controls.autoRotate = false;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [machines, isAutoRotate]);

  // Sync ring with selectedMachineId
  useEffect(() => {
    const mesh = machineMeshesRef.current.get(selectedMachineId);
    if (mesh && holographicRingRef.current) {
      holographicRingRef.current.position.set(mesh.position.x, 0.08, mesh.position.z);
    }
  }, [selectedMachineId]);

  // Camera Presets
  const setCameraPreset = (preset: 'overview' | 'conveyor' | 'motor' | 'cnc' | 'pump' | 'top') => {
    playClickSound();
    setActiveCameraAngle(preset);
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (preset) {
      case 'overview':
        camera.position.set(18, 14, 22);
        controls.target.set(0, 1.5, 0);
        break;
      case 'conveyor':
        camera.position.set(0, 6, 12);
        controls.target.set(0, 1.5, 4);
        setSelectedMachineId('MCH-04');
        break;
      case 'motor':
        camera.position.set(-6, 4, 0);
        controls.target.set(-8, 1.4, -6);
        setSelectedMachineId('MCH-01');
        break;
      case 'cnc':
        camera.position.set(6, 6, 0);
        controls.target.set(8, 2.5, -6);
        setSelectedMachineId('MCH-02');
        break;
      case 'pump':
        camera.position.set(-8, 5, 12);
        controls.target.set(-10, 1.5, 6);
        setSelectedMachineId('MCH-05');
        break;
      case 'top':
        camera.position.set(0, 32, 0.1);
        controls.target.set(0, 0, 0);
        break;
    }
    controls.update();
  };

  // Estimated physical calculations for Digital Twin HUD
  const estimatedTemp = Math.round(45 + (selectedMachine.vibration / 60) * 40 + (selectedMachine.pressure > 110 ? 12 : 0));
  const estimatedBearingLife = Math.max(8, Math.round(100 - (selectedMachine.vibration / 65) * 85));

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#080808]">
      {/* 3D Viewport Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#080808]/95 border-b border-[#66521A]/70 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-sm font-black text-[#F5F5F5] uppercase tracking-wider font-mono">
              Industrial Digital Twin Floor
            </h2>
          </div>
          <span className="hidden md:inline-block text-xs text-[#A0A0A0] border-l border-[#66521A]/60 pl-3">
            Real-Time 3D Spatial Model • Click any machine to inspect live telemetry
          </span>
        </div>

        {/* Camera Views Toolbar */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#66521A]/60 text-xs">
            <button
              onClick={() => setCameraPreset('overview')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeCameraAngle === 'overview' ? 'bg-[#1A1A1A] text-[#FFD700] font-bold border border-[#D4AF37]' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCameraPreset('conveyor')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                activeCameraAngle === 'conveyor' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/50' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              Conveyor (MCH-04)
            </button>
            <button
              onClick={() => setCameraPreset('motor')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeCameraAngle === 'motor' ? 'bg-[#1A1A1A] text-[#FFD700] font-bold border border-[#D4AF37]' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              Motor MCH-01
            </button>
            <button
              onClick={() => setCameraPreset('cnc')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeCameraAngle === 'cnc' ? 'bg-[#1A1A1A] text-[#FFD700] font-bold border border-[#D4AF37]' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              CNC MCH-02
            </button>
            <button
              onClick={() => setCameraPreset('pump')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeCameraAngle === 'pump' ? 'bg-[#1A1A1A] text-[#FFD700] font-bold border border-[#D4AF37]' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              Turbopump MCH-05
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeCameraAngle === 'top' ? 'bg-[#1A1A1A] text-[#FFD700] font-bold border border-[#D4AF37]' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              Top-Down
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => {
              playClickSound();
              setIsAutoRotate(!isAutoRotate);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isAutoRotate
                ? 'bg-[#1A1A1A] text-[#FFD700] border-[#D4AF37] shadow-sm'
                : 'bg-[#121212] text-[#A0A0A0] border-[#66521A]/60 hover:text-[#F5F5F5]'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Auto-Orbit</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Viewport Control Instructions */}
        <div className="absolute top-4 left-4 pointer-events-none bg-[#080808]/90 backdrop-blur-md border border-[#66521A]/70 rounded-2xl p-3 text-[11px] text-[#A0A0A0] max-w-xs shadow-2xl space-y-1">
          <div className="font-bold text-[#F5F5F5] flex items-center gap-1.5 font-mono text-xs">
            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
            3D NAVIGATION HUD
          </div>
          <p>• Left Click + Drag: Orbit Camera</p>
          <p>• Right Click + Drag: Pan Factory Floor</p>
          <p>• Scroll Wheel: Dynamic Zoom In/Out</p>
          <p>• Click Machine: Select for Telemetry</p>
        </div>

        {/* Machine Quick Selection Badges Floating Bottom-Left */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 max-w-xl">
          {machines.slice(0, 5).map((m) => (
            <button
              key={m.id}
              onClick={() => {
                playClickSound();
                setSelectedMachineId(m.id);
                if (m.id === 'MCH-04') setCameraPreset('conveyor');
                else if (m.id === 'MCH-01') setCameraPreset('motor');
                else if (m.id === 'MCH-02') setCameraPreset('cnc');
                else if (m.id === 'MCH-05') setCameraPreset('pump');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-md flex items-center gap-2 transition-all ${
                selectedMachineId === m.id
                  ? 'bg-[#1A1A1A] border-[#D4AF37] text-[#FFD700] shadow-lg shadow-[#D4AF37]/20 scale-105'
                  : 'bg-[#121212]/90 border-[#66521A]/60 text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#F5F5F5]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  m.status === 'Critical'
                    ? 'bg-rose-500 animate-ping'
                    : m.status === 'Warning' || m.status === 'High Risk'
                    ? 'bg-[#D4AF37]'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="font-mono font-bold">{m.id}</span>
              <span className="text-[10px] text-[#A0A0A0] hidden sm:inline truncate max-w-[100px]">
                {m.type}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Machine Digital Twin Inspector HUD (Right Drawer) */}
        {selectedMachine && (
          <div className="absolute top-4 right-4 bottom-4 w-96 max-w-[calc(100vw-32px)] bg-[#121212]/95 backdrop-blur-2xl border border-[#66521A] rounded-2xl shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-20 space-y-4">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#66521A]/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#1A1A1A] text-[#FFD700] text-xs font-mono font-bold border border-[#66521A]">
                      {selectedMachine.id}
                    </span>
                    <StatusBadge status={selectedMachine.status} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-[#F5F5F5] mt-1 leading-snug">
                    {selectedMachine.name}
                  </h3>
                  <p className="text-xs text-[#A0A0A0]">{selectedMachine.location}</p>
                </div>
              </div>

              {/* Health Score & Failure Probability Gauges */}
              <div className="grid grid-cols-2 gap-3 my-3">
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#66521A]/60 flex flex-col items-center text-center shadow-inner">
                  <CircularGauge
                    value={selectedMachine.health_score}
                    size={80}
                    strokeWidth={7}
                    label="Health"
                    isRisk={false}
                  />
                  <span className="text-[10px] text-[#A0A0A0] mt-1 font-semibold">Equipment Health</span>
                </div>

                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#66521A]/60 flex flex-col items-center text-center shadow-inner">
                  <CircularGauge
                    value={selectedMachine.failure_prob * 100}
                    size={80}
                    strokeWidth={7}
                    label="7d Hazard"
                    isRisk={true}
                  />
                  <span className="text-[10px] text-[#A0A0A0] mt-1 font-semibold">Failure Probability</span>
                </div>
              </div>

              {/* Digital Twin Sensor Telemetry */}
              <div className="space-y-2 mb-3">
                <div className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider font-mono">
                  Telemetry Parameters
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#66521A]/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#A0A0A0] block">Voltage</span>
                      <span className="font-mono font-bold text-[#F5F5F5]">
                        {selectedMachine.volt.toFixed(1)} V
                      </span>
                    </div>
                    <Zap className="w-4 h-4 text-[#D4AF37] opacity-90" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#66521A]/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#A0A0A0] block">Rotation</span>
                      <span className="font-mono font-bold text-[#F5F5F5]">
                        {selectedMachine.rotate.toFixed(0)} RPM
                      </span>
                    </div>
                    <Activity className="w-4 h-4 text-[#FFD700] opacity-90" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#66521A]/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#A0A0A0] block">Pressure</span>
                      <span className="font-mono font-bold text-[#F5F5F5]">
                        {selectedMachine.pressure.toFixed(1)} psi
                      </span>
                    </div>
                    <Gauge className="w-4 h-4 text-[#D4AF37] opacity-90" />
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      selectedMachine.vibration > 45.0
                        ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
                        : 'bg-[#1A1A1A] border-[#66521A]/50 text-[#F5F5F5]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-[#A0A0A0] block">Vibration</span>
                      <span className="font-mono font-bold">
                        {selectedMachine.vibration.toFixed(1)} mm/s
                      </span>
                    </div>
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        selectedMachine.vibration > 45.0 ? 'text-rose-400 animate-pulse' : 'text-[#D4AF37]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Physical Estimations: Temperature & Bearing Life */}
              <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#66521A]/60 space-y-2 text-xs mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#A0A0A0] flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Estimated Winding Temp:
                  </span>
                  <span className={`font-mono font-bold ${estimatedTemp > 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {estimatedTemp} °C
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#A0A0A0] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#FFD700]" />
                    Bearing L10h Life Index:
                  </span>
                  <span className={`font-mono font-bold ${estimatedBearingLife < 35 ? 'text-rose-400' : 'text-[#D4AF37]'}`}>
                    {estimatedBearingLife}%
                  </span>
                </div>
              </div>

              {/* Critical Alert Note */}
              {selectedMachine.status === 'Critical' && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs mb-3 flex items-start gap-2.5 animate-pulse">
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-300">CRITICAL MECHANICAL TRIP RISK</span>
                    <span>
                      High vibration ({selectedMachine.vibration.toFixed(1)} mm/s) indicates drive bearing spalling. Immediate replacement required within 48h.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Workflow Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#66521A]/50">
              <button
                onClick={() => {
                  playClickSound();
                  onSelectMachineForPredict(selectedMachine);
                }}
                className="w-full btn-gold-primary flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-98"
              >
                <Sliders className="w-4 h-4" />
                Run AI Predictive Diagnostics
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    playClickSound();
                    onNavigateToLive(selectedMachine.id);
                  }}
                  className="btn-gold-secondary flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                >
                  <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Live Stream
                </button>

                <button
                  onClick={() => {
                    playClickSound();
                    onOpenMaintenanceModal(selectedMachine.id);
                  }}
                  className="btn-gold-secondary flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                >
                  <Wrench className="w-3.5 h-3.5 text-[#FFD700]" />
                  Work Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
