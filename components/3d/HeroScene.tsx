"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Database, 
  ShieldCheck, 
  Cpu, 
  Maximize2,
  Layers
} from "lucide-react";

interface HeroSceneProps {
  onExploreClick?: () => void;
}

interface DocumentMeta {
  title: string;
  type: string;
  chunks: number;
  dim: string;
  status: string;
  color: number;
  colorHex: string;
  pos: THREE.Vector3;
  desc: string;
  nliScore: string;
}

const DOCUMENTS_METADATA: DocumentMeta[] = [
  {
    title: "Transformer_Attention_v3.pdf",
    type: "RESEARCH PAPER",
    chunks: 48,
    dim: "384-D",
    status: "INDEXED",
    color: 0x06b6d4, // cyan
    colorHex: "#06b6d4",
    pos: new THREE.Vector3(-6.2, 2.4, 2.2),
    desc: "Multi-head attention latency vs context window depth in offline enclaves.",
    nliScore: "98.4% Entailment",
  },
  {
    title: "Conflict_NLI_Clinical_Trial.docx",
    type: "CLINICAL STUDY",
    chunks: 36,
    dim: "384-D",
    status: "CONTRADICTION FLAG",
    color: 0xf43f5e, // rose
    colorHex: "#f43f5e",
    pos: new THREE.Vector3(6.0, 2.0, 1.8),
    desc: "Dosage tolerance disparity between Phase II & Phase III cohorts.",
    nliScore: "91.2% Contradiction",
  },
  {
    title: "Semantic_Chunk_Corpus.idx",
    type: "DOCUMENT INDEX",
    chunks: 192,
    dim: "CHUNK STORE",
    status: "INDEXED",
    color: 0xa855f7, // purple
    colorHex: "#a855f7",
    pos: new THREE.Vector3(-4.8, -3.2, 3.2),
    desc: "In-memory indexed passages segmented with 15% sliding window overlap.",
    nliScore: "Calibrated 96%",
  },
  {
    title: "Grounded_Synthesis_Prompt.txt",
    type: "SYNTHESIS CONFIG",
    chunks: 72,
    dim: "SYSTEM PROMPT",
    status: "GROUNDED RAG",
    color: 0x10b981, // emerald
    colorHex: "#10b981",
    pos: new THREE.Vector3(5.2, -2.8, 2.6),
    desc: "Precision generative prompt with verified source citation attribution.",
    nliScore: "Deterministic",
  },
];

export default function HeroScene({ onExploreClick }: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMeta | null>(null);
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [hasWebGL, setHasWebGL] = useState(true);
  const controlsRef = useRef<OrbitControls | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const hoveredDocRef = useRef<DocumentMeta | null>(null);
  const selectedDocRef = useRef<DocumentMeta | null>(null);

  // Sync state with refs
  useEffect(() => {
    selectedDocRef.current = selectedDoc;
  }, [selectedDoc]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 740;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.028);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const initialCamPos = new THREE.Vector3(0, 1.2, 17.5);
    camera.position.copy(initialCamPos);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x050814, 0);
    container.appendChild(renderer.domElement);

    // OrbitControls for mouse rotation & zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.maxDistance = 28;
    controls.minDistance = 7;
    controls.maxPolarAngle = Math.PI * 0.65;
    controls.minPolarAngle = Math.PI * 0.25;
    controlsRef.current = controls;

    resetCameraRef.current = () => {
      camera.position.copy(initialCamPos);
      controls.target.set(0, 0, 0);
      controls.update();
      selectedDocRef.current = null;
      setSelectedDoc(null);
    };

    // Root world container
    const world = new THREE.Group();
    scene.add(world);

    // 2. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.2);
    scene.add(ambientLight);

    // Dynamic point lights
    const corePointLight = new THREE.PointLight(0x06b6d4, 5.0, 30);
    corePointLight.position.set(0, 0, 0);
    world.add(corePointLight);

    const purplePointLight = new THREE.PointLight(0xa855f7, 4.0, 25);
    purplePointLight.position.set(6, 4, 4);
    world.add(purplePointLight);

    const rosePointLight = new THREE.PointLight(0xf43f5e, 3.5, 25);
    rosePointLight.position.set(-6, -3, 3);
    world.add(rosePointLight);

    const topRimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    topRimLight.position.set(0, 15, 10);
    scene.add(topRimLight);

    // 3. Central Hyperdimensional AI Core
    const coreGroup = new THREE.Group();
    world.add(coreGroup);

    // Layer A: Inner Molten Plasma Core
    const innerCoreGeo = new THREE.SphereGeometry(1.65, 32, 32);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.15,
      metalness: 0.85,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    coreGroup.add(innerCore);

    // Layer B: Geodesic Dual Lattice (Icosahedron wireframe with glowing vertices)
    const latticeGeo = new THREE.IcosahedronGeometry(2.35, 2);
    const latticeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const lattice = new THREE.Mesh(latticeGeo, latticeMat);
    coreGroup.add(lattice);

    // Lattice vertex glowing nodes
    const vertexPositions = latticeGeo.attributes.position;
    const vertexNodeGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const vertexNodeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const vertexInstanced = new THREE.InstancedMesh(vertexNodeGeo, vertexNodeMat, vertexPositions.count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < vertexPositions.count; i++) {
      dummy.position.set(
        vertexPositions.getX(i),
        vertexPositions.getY(i),
        vertexPositions.getZ(i)
      );
      dummy.updateMatrix();
      vertexInstanced.setMatrixAt(i, dummy.matrix);
    }
    coreGroup.add(vertexInstanced);

    // Layer C: Gyroscopic Gimbal Rings with tick markings
    const createGimbalRing = (radius: number, tube: number, color: number, tiltX: number, tiltY: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 120);
      const ringMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.9,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = tiltX;
      ring.rotation.y = tiltY;
      return ring;
    };

    const gimbalRing1 = createGimbalRing(3.2, 0.045, 0x06b6d4, Math.PI / 4, 0);
    const gimbalRing2 = createGimbalRing(3.5, 0.045, 0xa855f7, 0, Math.PI / 3.5);
    const gimbalRing3 = createGimbalRing(3.8, 0.035, 0x38bdf8, Math.PI / 2.5, Math.PI / 4);
    coreGroup.add(gimbalRing1);
    coreGroup.add(gimbalRing2);
    coreGroup.add(gimbalRing3);

    // Layer D: Orbiting Quantum Data Shards around Core
    const coreShardsCount = 18;
    const shardGeo = new THREE.OctahedronGeometry(0.18, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const coreShards: THREE.Mesh[] = [];
    for (let i = 0; i < coreShardsCount; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const radius = 2.6 + (i % 3) * 0.4;
      const angle = (i / coreShardsCount) * Math.PI * 2;
      shard.userData = {
        radius,
        angle,
        speed: 0.6 + (i % 4) * 0.2,
        elev: Math.sin(i * 1.5) * 0.9,
      };
      coreGroup.add(shard);
      coreShards.push(shard);
    }

    // 4. Volumetric 3D Extruded Document Tablets
    const documentObjects: THREE.Group[] = [];
    const interactiveTargets: THREE.Mesh[] = [];

    // Canvas texture generator for realistic holographic card face
    const generateHoloTexture = (doc: DocumentMeta) => {
      const cvs = document.createElement("canvas");
      cvs.width = 600;
      cvs.height = 420;
      const ctx = cvs.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(cvs);

      // Deep cybernetic glass slate
      const grad = ctx.createLinearGradient(0, 0, 600, 420);
      grad.addColorStop(0, "rgba(8, 14, 28, 0.96)");
      grad.addColorStop(1, "rgba(4, 7, 18, 0.98)");
      ctx.fillStyle = grad;
      ctx.roundRect(10, 10, 580, 400, 24);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = doc.colorHex;
      ctx.lineWidth = 4;
      ctx.roundRect(10, 10, 580, 400, 24);
      ctx.stroke();

      // Document Type Chip
      ctx.fillStyle = `${doc.colorHex}33`;
      ctx.roundRect(36, 32, 180, 40, 12);
      ctx.fill();
      ctx.strokeStyle = doc.colorHex;
      ctx.lineWidth = 1.5;
      ctx.roundRect(36, 32, 180, 40, 12);
      ctx.stroke();
      ctx.fillStyle = doc.colorHex;
      ctx.font = "bold 18px monospace";
      ctx.fillText(doc.type, 50, 58);

      // Status Pill on top right
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.roundRect(400, 32, 160, 36, 8);
      ctx.fill();
      ctx.fillStyle = doc.colorHex;
      ctx.font = "bold 15px monospace";
      ctx.fillText(doc.status, 412, 56);

      // Main Document Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px sans-serif";
      const displayTitle = doc.title.length > 24 ? doc.title.slice(0, 24) + "..." : doc.title;
      ctx.fillText(displayTitle, 36, 120);

      // Description
      ctx.fillStyle = "#94a3b8";
      ctx.font = "17px sans-serif";
      ctx.fillText(doc.desc.slice(0, 45) + "...", 36, 155);

      // Metrics Grid
      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.roundRect(36, 185, 528, 100, 14);
      ctx.fill();

      ctx.fillStyle = "#64748b";
      ctx.font = "14px monospace";
      ctx.fillText("SEMANTIC CHUNKS", 54, 215);
      ctx.fillText("EMBEDDING DIM", 230, 215);
      ctx.fillText("NLI ARBITRATION", 400, 215);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 20px monospace";
      ctx.fillText(`${doc.chunks} Blocks`, 54, 250);
      ctx.fillText(doc.dim, 230, 250);
      ctx.fillStyle = doc.colorHex;
      ctx.fillText(doc.nliScore, 400, 250);

      // Animated spectrum mini bar graph
      ctx.fillStyle = doc.colorHex;
      for (let b = 0; b < 24; b++) {
        const barH = 12 + Math.abs(Math.sin(b * 0.75)) * 28;
        ctx.fillRect(36 + b * 22, 380 - barH, 14, barH);
      }

      const tex = new THREE.CanvasTexture(cvs);
      tex.needsUpdate = true;
      return tex;
    };

    // Soft volumetric halo texture generator for glow aura
    const generateHaloTexture = (colorHex: string) => {
      const cvs = document.createElement("canvas");
      cvs.width = 128;
      cvs.height = 128;
      const ctx = cvs.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(cvs);

      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, colorHex);
      grad.addColorStop(0.35, `${colorHex}bb`);
      grad.addColorStop(0.7, `${colorHex}33`);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);

      const tex = new THREE.CanvasTexture(cvs);
      tex.needsUpdate = true;
      return tex;
    };

    DOCUMENTS_METADATA.forEach((doc, idx) => {
      const docGroup = new THREE.Group();
      docGroup.position.copy(doc.pos);

      // Volumetric 3D Tablet Mesh (BoxGeometry with depth 0.22)
      const tabletGeo = new THREE.BoxGeometry(3.4, 2.4, 0.22);

      // Multi-material box: face gets canvas texture, sides & back get dark metallic frame
      const frontMat = new THREE.MeshStandardMaterial({
        map: generateHoloTexture(doc),
        roughness: 0.15,
        metalness: 0.2,
        emissive: new THREE.Color(doc.color),
        emissiveIntensity: 0.05,
      });

      const sideMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.9,
      });

      const materials = [
        sideMat, // right
        sideMat, // left
        sideMat, // top
        sideMat, // bottom
        frontMat, // front (z+)
        sideMat, // back (z-)
      ];

      const tabletMesh = new THREE.Mesh(tabletGeo, materials);
      tabletMesh.userData = { isDocument: true, meta: doc };
      docGroup.add(tabletMesh);
      interactiveTargets.push(tabletMesh);

      // Glowing edge accent lines
      const edgeGeo = new THREE.EdgesGeometry(tabletGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: doc.color,
        linewidth: 2,
        transparent: true,
        opacity: 0.8,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      docGroup.add(edgeLines);

      // Soft Holographic Glow Halo Plane (behind the tablet at z = -0.15)
      const haloGeo = new THREE.PlaneGeometry(5.0, 3.8);
      const haloMat = new THREE.MeshBasicMaterial({
        map: generateHaloTexture(doc.colorHex),
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(0, 0, -0.15);
      docGroup.add(haloMesh);

      // Dedicated PointLight for dynamic hover & selection illumination
      const docLight = new THREE.PointLight(doc.color, 0.8, 10);
      docLight.position.set(0, 0, 1.2);
      docGroup.add(docLight);

      // Orbiting 3D vector chunk shards around each document
      const chunkShardsCount = 4;
      const chunkMeshes: THREE.Mesh[] = [];
      for (let s = 0; s < chunkShardsCount; s++) {
        const chunkGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const chunkMat = new THREE.MeshStandardMaterial({
          color: doc.color,
          emissive: doc.color,
          emissiveIntensity: 0.7,
          roughness: 0.2,
          metalness: 0.8,
        });
        const chunkMesh = new THREE.Mesh(chunkGeo, chunkMat);
        chunkMesh.userData = {
          orbitRadius: 2.2 + s * 0.3,
          orbitSpeed: 1.2 + s * 0.4,
          orbitPhase: (s / chunkShardsCount) * Math.PI * 2,
          chunkMat,
        };
        docGroup.add(chunkMesh);
        chunkMeshes.push(chunkMesh);
      }

      docGroup.userData = {
        meta: doc,
        originalPos: doc.pos.clone(),
        frontMat,
        edgeMat,
        haloMesh,
        haloMat,
        docLight,
        chunkMeshes,
      };

      world.add(docGroup);
      documentObjects.push(docGroup);
    });

    // 5. 3D Spline Conduits & Flowing Data Streams to AI Core
    const splineCurves: THREE.CatmullRomCurve3[] = [];
    const conduitPulses: THREE.Mesh[] = [];

    documentObjects.forEach((docObj, i) => {
      const start = docObj.position;
      const mid = new THREE.Vector3(
        start.x * 0.45,
        start.y * 0.45 + (i % 2 === 0 ? 1.2 : -1.2),
        start.z * 0.45
      );
      const end = new THREE.Vector3(0, 0, 0);

      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      splineCurves.push(curve);

      // Glowing tube line
      const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.025, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: DOCUMENTS_METADATA[i].color,
        transparent: true,
        opacity: 0.35,
      });
      world.add(new THREE.Mesh(tubeGeo, tubeMat));

      // 3 moving energy pulses per curve
      for (let p = 0; p < 3; p++) {
        const pulseGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: DOCUMENTS_METADATA[i].color,
        });
        const pulse = new THREE.Mesh(pulseGeo, pulseMat);
        pulse.userData = { curveIndex: i, offset: p * 0.33 };
        world.add(pulse);
        conduitPulses.push(pulse);
      }
    });

    // 6. 3D Particle Cloud (Spatial Vector Embeddings)
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colors = [
      new THREE.Color(0x06b6d4), // cyan
      new THREE.Color(0xa855f7), // purple
      new THREE.Color(0x38bdf8), // sky
      new THREE.Color(0xf43f5e), // rose
    ];

    for (let p = 0; p < particleCount; p++) {
      const radius = 3.5 + Math.random() * 9.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[p * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[p * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.65;
      particlePositions[p * 3 + 2] = radius * Math.cos(phi);

      const chosenColor = colors[p % colors.length];
      particleColors[p * 3] = chosenColor.r;
      particleColors[p * 3 + 1] = chosenColor.g;
      particleColors[p * 3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particleConstellation = new THREE.Points(particleGeo, particleMat);
    world.add(particleConstellation);

    // 7. Interactive Raycasting & Mouse Tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = false;
      dragStartPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y) > 6) {
        isDragging = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging) return;

      const rect = container.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(clickMouse, camera);
      const intersects = raycaster.intersectObjects(interactiveTargets);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.meta) {
          const docMeta = hit.userData.meta as DocumentMeta;
          selectedDocRef.current = docMeta;
          setSelectedDoc(docMeta);

          // Smoothly animate camera controls target to the clicked document
          controls.target.lerp(docMeta.pos, 0.8);
        }
      } else {
        selectedDocRef.current = null;
        setSelectedDoc(null);
        controls.target.set(0, 0, 0);
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerup", onPointerUp);

    // Responsive Resizing via ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || window.innerWidth;
        const h = entry.contentRect.height || 740;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // 8. Physics-based Animation & Render Loop
    let clock = new THREE.Clock();
    let animId: number;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const elapsed = clock.getElapsedTime();

      // Controls update for smooth damping
      controls.update();

      // Rotation of AI Core
      if (isRotating) {
        coreGroup.rotation.y = elapsed * 0.2;
        lattice.rotation.y = -elapsed * 0.35;
        lattice.rotation.z = elapsed * 0.15;
      }

      // Gyroscopic gimbal differential rotation
      gimbalRing1.rotation.z = elapsed * 0.4;
      gimbalRing2.rotation.x = -elapsed * 0.3;
      gimbalRing3.rotation.y = elapsed * 0.25;

      // Inner core breathing & pulsing light
      const pulse = 1 + Math.sin(elapsed * 2.8) * 0.06;
      innerCore.scale.set(pulse, pulse, pulse);
      corePointLight.intensity = 4.5 + Math.sin(elapsed * 3.2) * 1.5;

      // Orbiting core shards
      coreShards.forEach((s) => {
        const r = s.userData.radius;
        const spd = s.userData.speed;
        const a = s.userData.angle + elapsed * spd;
        s.position.set(
          Math.cos(a) * r,
          s.userData.elev + Math.sin(elapsed * 2 + a) * 0.3,
          Math.sin(a) * r
        );
        s.rotation.x += 0.02;
        s.rotation.y += 0.03;
      });

      // Swirling particle constellation
      particleConstellation.rotation.y = elapsed * 0.04;
      particleConstellation.rotation.x = Math.sin(elapsed * 0.03) * 0.08;

      // Flowing data pulses along conduits
      conduitPulses.forEach((pulseMesh) => {
        const curveIdx = pulseMesh.userData.curveIndex;
        const curve = splineCurves[curveIdx];
        if (curve) {
          const t = (elapsed * 0.35 + pulseMesh.userData.offset) % 1;
          const pt = curve.getPoint(t);
          pulseMesh.position.copy(pt);
          const sc = Math.sin(t * Math.PI) * 1.3;
          pulseMesh.scale.set(sc, sc, sc);
        }
      });

      // Raycast hovering check before updating document tablets
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveTargets);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.meta) {
          const meta = hit.userData.meta as DocumentMeta;
          hoveredDocRef.current = meta;
          setHoveredDoc(meta.title);
          container.style.cursor = "pointer";
        }
      } else {
        hoveredDocRef.current = null;
        setHoveredDoc(null);
        container.style.cursor = "grab";
      }

      // Interactive physical updates for 3D document tablets
      documentObjects.forEach((docGroup, i) => {
        const meta = docGroup.userData.meta as DocumentMeta;
        const orig = docGroup.userData.originalPos as THREE.Vector3;
        const frontMat = docGroup.userData.frontMat as THREE.MeshStandardMaterial;
        const edgeMat = docGroup.userData.edgeMat as THREE.LineBasicMaterial;
        const haloMesh = docGroup.userData.haloMesh as THREE.Mesh;
        const haloMat = docGroup.userData.haloMat as THREE.MeshBasicMaterial;
        const docLight = docGroup.userData.docLight as THREE.PointLight;
        const chunkMeshes = docGroup.userData.chunkMeshes as THREE.Mesh[];

        const isHovered = hoveredDocRef.current?.title === meta.title;
        const isSelected = selectedDocRef.current?.title === meta.title;

        // 1. Organic floating displacement
        const hoverBob = Math.sin(elapsed * 1.2 + i * 1.8) * 0.22;
        const hoverSway = Math.cos(elapsed * 0.8 + i) * 0.12;
        docGroup.position.y = THREE.MathUtils.lerp(docGroup.position.y, orig.y + hoverBob, 0.06);
        docGroup.position.x = THREE.MathUtils.lerp(docGroup.position.x, orig.x + hoverSway, 0.06);

        // 2. Interactive Rotation towards the user & camera
        if (isSelected) {
          // Face camera directly when inspected
          const targetObj = new THREE.Object3D();
          targetObj.position.copy(docGroup.position);
          targetObj.lookAt(camera.position);

          docGroup.quaternion.slerp(targetObj.quaternion, 0.08);
          docGroup.scale.lerp(new THREE.Vector3(1.18, 1.18, 1.18), 0.08);
        } else if (isHovered) {
          // Rotate towards the user with responsive cursor parallax
          const targetObj = new THREE.Object3D();
          targetObj.position.copy(docGroup.position);
          targetObj.lookAt(camera.position);

          // Tilt subtly in response to cursor position on screen
          targetObj.rotateX(-mouse.y * 0.14);
          targetObj.rotateY(mouse.x * 0.14);

          docGroup.quaternion.slerp(targetObj.quaternion, 0.1);
          docGroup.scale.lerp(new THREE.Vector3(1.09, 1.09, 1.09), 0.08);
        } else {
          // Return to gentle floating oscillation
          const restingEuler = new THREE.Euler(
            Math.cos(elapsed * 0.6 + i) * 0.06,
            Math.sin(elapsed * 0.6 + i) * 0.08,
            0
          );
          const restingQuat = new THREE.Quaternion().setFromEuler(restingEuler);
          docGroup.quaternion.slerp(restingQuat, 0.04);
          docGroup.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.06);
        }

        // 3. Dynamic Glow & Optical Illumination Feedback Loop
        let targetLightIntensity = 0.8;
        let targetLightDistance = 10;
        let targetEmissive = 0.05;
        let targetHaloOpacity = 0.15;
        let targetHaloScale = 1.0;
        let targetEdgeOpacity = 0.8;
        let shardSpeedMultiplier = 1.0;
        let shardEmissive = 0.7;

        if (isSelected) {
          // Super-charged radiant glow when selected
          targetLightIntensity = 6.8 + Math.sin(elapsed * 6.0) * 1.6;
          targetLightDistance = 16;
          targetEmissive = 0.65;
          targetHaloOpacity = 0.95;
          targetHaloScale = 1.45;
          targetEdgeOpacity = 1.0;
          shardSpeedMultiplier = 2.6;
          shardEmissive = 1.4;
        } else if (isHovered) {
          // Vibrant flare on mouse hover
          targetLightIntensity = 3.8;
          targetLightDistance = 12;
          targetEmissive = 0.35;
          targetHaloOpacity = 0.65;
          targetHaloScale = 1.25;
          targetEdgeOpacity = 1.0;
          shardSpeedMultiplier = 2.0;
          shardEmissive = 1.1;
        }

        // Smooth physics-based lerp for light & material parameters
        docLight.intensity = THREE.MathUtils.lerp(docLight.intensity, targetLightIntensity, 0.08);
        docLight.distance = THREE.MathUtils.lerp(docLight.distance, targetLightDistance, 0.08);
        frontMat.emissiveIntensity = THREE.MathUtils.lerp(frontMat.emissiveIntensity, targetEmissive, 0.08);
        haloMat.opacity = THREE.MathUtils.lerp(haloMat.opacity, targetHaloOpacity, 0.08);
        haloMesh.scale.lerp(new THREE.Vector3(targetHaloScale, targetHaloScale, 1.0), 0.08);
        edgeMat.opacity = THREE.MathUtils.lerp(edgeMat.opacity, targetEdgeOpacity, 0.08);

        // 4. Orbiting semantic chunk shards around this document with dynamic speed
        chunkMeshes.forEach((chunkMesh) => {
          const or = chunkMesh.userData.orbitRadius * (isHovered || isSelected ? 1.25 : 1.0);
          const ospd = chunkMesh.userData.orbitSpeed * shardSpeedMultiplier;
          const op = chunkMesh.userData.orbitPhase + elapsed * ospd;
          chunkMesh.position.set(
            Math.cos(op) * or,
            Math.sin(op * 0.8) * 0.8,
            Math.sin(op) * (or * 0.5)
          );
          chunkMesh.rotation.x += 0.03 * shardSpeedMultiplier;
          chunkMesh.rotation.y += 0.04 * shardSpeedMultiplier;
          (chunkMesh.userData.chunkMat as THREE.MeshStandardMaterial).emissiveIntensity = THREE.MathUtils.lerp(
            (chunkMesh.userData.chunkMat as THREE.MeshStandardMaterial).emissiveIntensity,
            shardEmissive,
            0.1
          );
        });
      });

      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      resizeObserver.disconnect();
      controls.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating]);

  return (
    <div className="relative w-full h-[680px] md:h-[760px] overflow-hidden select-none bg-gradient-to-b from-[#050814]/40 via-[#050814]/90 to-[#050814]">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Non-WebGL Fallback */}
      {!hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-0">
          <div className="text-center p-8 rounded-2xl border border-cyan-500/30">
            <Cpu className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-mono text-cyan-300">WEBGL GRAPHICS ACCELERATION UNAVAILABLE</p>
          </div>
        </div>
      )}

      {/* Top Left HUD Telemetry Tag */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none flex items-center gap-3">
        <div className="px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-slate-950/70 backdrop-blur-md text-xs font-mono text-cyan-400 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>NEURAL CORE 3D // SPATIAL VECTOR SPACE</span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-slate-950/70 backdrop-blur-md text-xs font-mono text-purple-300">
          <Database size={13} />
          <span>HNSW CHUNKS IN AIR-GAPPED RAM</span>
        </div>
      </div>

      {/* Top Right 3D Controls Deck */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono backdrop-blur-md transition-all flex items-center gap-1.5 ${
            isRotating
              ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
              : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
          }`}
          title="Toggle core auto-rotation"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">{isRotating ? "AUTO-SPIN ON" : "PAUSED"}</span>
        </button>

        <button
          onClick={() => resetCameraRef.current?.()}
          className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 backdrop-blur-md transition-all"
          title="Reset 3D camera orientation"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* 3D Navigation Hint Pill */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-slate-950/60 backdrop-blur-md text-[11px] font-mono text-slate-400">
        <span>Click &amp; Drag to Orbit 3D Space &bull; Scroll to Zoom &bull; Click 3D Document Tablets to Inspect</span>
      </div>

      {/* Hover Readout Tooltip */}
      {hoveredDoc && !selectedDoc && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2 rounded-xl border border-cyan-500/40 bg-slate-950/80 backdrop-blur-xl text-xs font-mono text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in-95">
          TARGET ACQUIRED: <span className="text-white font-bold">{hoveredDoc}</span> &mdash; CLICK TO LOCK FOCUS
        </div>
      )}

      {/* Selected 3D Document Detailed Holographic Inspection Modal */}
      {selectedDoc && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl p-5 rounded-2xl border border-cyan-500/40 bg-slate-950/90 backdrop-blur-2xl text-slate-200 shadow-[0_0_40px_rgba(6,182,212,0.25)] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedDoc.colorHex }}
              />
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                {selectedDoc.type} &bull; 3D INSPECTION
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedDoc(null);
                selectedDocRef.current = null;
                controlsRef.current?.target.set(0, 0, 0);
              }}
              className="text-xs font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded border border-white/10 hover:border-cyan-500/40 transition-colors"
            >
              CLOSE [&times;]
            </button>
          </div>

          <h4 className="text-base font-bold text-white mb-1">{selectedDoc.title}</h4>
          <p className="text-xs text-slate-400 mb-4">{selectedDoc.desc}</p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[10px] text-slate-400 block">DENSE CHUNKS</span>
              <span className="text-sm font-bold text-cyan-300">{selectedDoc.chunks}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[10px] text-slate-400 block">VECTOR DIM</span>
              <span className="text-sm font-bold text-purple-300">{selectedDoc.dim}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-[10px] text-slate-400 block">NLI ARBITRATION</span>
              <span
                className="text-sm font-bold truncate block"
                style={{ color: selectedDoc.colorHex }}
              >
                {selectedDoc.nliScore}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subtle bottom fade to seamlessly blend into page */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#050814] to-transparent pointer-events-none z-10" />
    </div>
  );
}
