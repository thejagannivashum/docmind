"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Cpu,
  Database,
  Search,
  ShieldAlert,
  FileText,
  Scissors,
  Binary,
  CheckCircle2,
  Maximize2
} from "lucide-react";

interface PipelineStation {
  id: string;
  name: string;
  tech: string;
  category: string;
  pos: THREE.Vector3;
  cameraOffset: THREE.Vector3;
  color: number;
  colorHex: string;
  mathFormula: string;
  academicDetail: string;
  metric: string;
}

const STATIONS: PipelineStation[] = [
  {
    id: "ingest",
    name: "1. Document Ingestion",
    tech: "PDF/DOCX/TXT Parser",
    category: "INGESTION",
    pos: new THREE.Vector3(-14, 2, -4),
    cameraOffset: new THREE.Vector3(-14, 3.5, 3.5),
    color: 0x06b6d4, // cyan
    colorHex: "#06b6d4",
    mathFormula: "H(Doc) = \\text{SHA-256}(B_0 \\dots B_n)",
    academicDetail: "Extracts text locally without cloud OCR. Hashes document bytes to ensure immutable cryptographic integrity and zero cloud exfiltration.",
    metric: "0.00 Bytes Egress",
  },
  {
    id: "chunk",
    name: "2. Semantic Chunking",
    tech: "Sliding Window + 15% Overlap",
    category: "INGESTION",
    pos: new THREE.Vector3(-10, -0.5, -2),
    cameraOffset: new THREE.Vector3(-10, 1.5, 5),
    color: 0x38bdf8, // sky
    colorHex: "#38bdf8",
    mathFormula: "W_i = [t_{i \\cdot (S - O)}, t_{i \\cdot (S - O) + S}]",
    academicDetail: "Splits token streams into 256-token windows with 15% sliding overlap to preserve boundary context across technical sentence transitions.",
    metric: "256 Token Windows",
  },
  {
    id: "embed",
    name: "3. Local Dense Embedding",
    tech: "all-MiniLM-L6-v2 / Ollama",
    category: "VECTORIZATION",
    pos: new THREE.Vector3(-6, 2.5, 0),
    cameraOffset: new THREE.Vector3(-6, 4, 6.5),
    color: 0x818cf8, // indigo
    colorHex: "#818cf8",
    mathFormula: "\\vec{e} = \\text{MeanPool}(\\text{Transformer}(W_i)) \\in \\mathbb{R}^{384}",
    academicDetail: "Transforms textual chunks into 384-dimensional unit-normalized dense vectors, capturing deep semantic and topical nuance offline.",
    metric: "384-d Dense Vectors",
  },
  {
    id: "index",
    name: "4. ChromaDB HNSW Indexing",
    tech: "Hierarchical Small World Graph",
    category: "VECTORIZATION",
    pos: new THREE.Vector3(-2, -1, 1),
    cameraOffset: new THREE.Vector3(-2, 1.5, 7.5),
    color: 0xa855f7, // purple
    colorHex: "#a855f7",
    mathFormula: "d_{HNSW}(u, v) = 1 - \\frac{u \\cdot v}{\\|u\\| \\|v\\|}",
    academicDetail: "Builds a multi-layer geometric proximity graph enabling logarithmic approximate nearest neighbor (ANN) lookups in sub-millisecond time.",
    metric: "< 1.2ms Lookup",
  },
  {
    id: "retrieve",
    name: "5. Semantic Retrieval",
    tech: "Top-k Cosine Beam Search",
    category: "RETRIEVAL",
    pos: new THREE.Vector3(2, 2.2, 0),
    cameraOffset: new THREE.Vector3(2, 3.8, 6.5),
    color: 0x06b6d4, // cyan
    colorHex: "#06b6d4",
    mathFormula: "\\text{Top-k} = \\operatorname{arg\\,max}_{c \\in \\mathcal{C}}^{(k)} \\cos(\\vec{q}, \\vec{e}_c)",
    academicDetail: "Projects user query into embedding space and calculates cosine similarity to isolate the k=4 most relevant document passages.",
    metric: "k = 4 Chunks Retrieved",
  },
  {
    id: "arbitrate",
    name: "6. Pairwise NLI Conflict Arbiter",
    tech: "cross-encoder/nli-deberta-v3",
    category: "ARBITRATION",
    pos: new THREE.Vector3(6, -0.8, -1),
    cameraOffset: new THREE.Vector3(6, 1.5, 6),
    color: 0xf43f5e, // rose
    colorHex: "#f43f5e",
    mathFormula: "P(\\text{contradiction}) = \\text{Softmax}(\\text{CrossEncoder}(p_i, p_j))_c",
    academicDetail: "Evaluates pairwise premise-hypothesis relations across retrieved passages. Penalizes confidence when opposing factual assertions are discovered.",
    metric: "NLI Cross-Encoder",
  },
  {
    id: "synthesize",
    name: "7. Local LLM Synthesis",
    tech: "Offline Quantized Llama 3",
    category: "GENERATION",
    pos: new THREE.Vector3(10, 2.4, -2.5),
    cameraOffset: new THREE.Vector3(10, 4, 4.5),
    color: 0x10b981, // emerald
    colorHex: "#10b981",
    mathFormula: "y_t \\sim \\text{LLM}(y_t \\mid y_{<t}, \\text{Context}_{\\text{arbitrated}})",
    academicDetail: "Generates grounded answers strictly conditioned on conflict-arbitrated passages without external cloud API calls.",
    metric: "100% On-Device RAM",
  },
  {
    id: "ground",
    name: "8. Calibrated Citations",
    tech: "Grounding Verifier & Citation Graph",
    category: "VERIFICATION",
    pos: new THREE.Vector3(14, 0, -4),
    cameraOffset: new THREE.Vector3(14, 2, 4),
    color: 0x38bdf8, // sky
    colorHex: "#38bdf8",
    mathFormula: "\\text{Confidence} = \\alpha \\cdot \\text{Sim} + \\beta \\cdot (1 - P_{\\text{contra}})",
    academicDetail: "Fuses cosine relevance with NLI non-contradiction certainty to produce an auditable grounding metric with exact passage coordinates.",
    metric: "Calibrated 0-100%",
  },
];

export default function RagPipelineScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHoveredStation, setIsHoveredStation] = useState<number | null>(null);

  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 2, 22));
  const controlsRef = useRef<OrbitControls | null>(null);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STATIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Set camera target when activeStep changes
  useEffect(() => {
    const station = STATIONS[activeStep];
    cameraTargetRef.current.copy(station.pos);
    cameraPosRef.current.copy(station.cameraOffset);
  }, [activeStep]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 580;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.025);

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    camera.position.set(0, 2, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 35;
    controls.minDistance = 4;
    controlsRef.current = controls;

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    keyLight.position.set(10, 20, 15);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa855f7, 1.5);
    fillLight.position.set(-15, -10, 10);
    scene.add(fillLight);

    // 3. Station 3D Meshes & Visual Archetypes
    const stationGroups: THREE.Group[] = [];
    const interactiveMeshes: THREE.Mesh[] = [];

    STATIONS.forEach((station, idx) => {
      const group = new THREE.Group();
      group.position.copy(station.pos);
      group.userData = { index: idx, name: station.name };

      // Base pedestal ring
      const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.25, 32);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.9,
      });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.y = -1.2;
      group.add(pedestal);

      // Outer glowing neon boundary ring
      const ringGeo = new THREE.TorusGeometry(1.8, 0.04, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: station.color });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.05;
      group.add(ring);

      // Station-specific Unique 3D Apparatus:
      if (idx === 0) {
        // Station 1: Document Tablet with Scanning Laser Plane
        const docGeo = new THREE.BoxGeometry(1.6, 2.2, 0.15);
        const docMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          roughness: 0.2,
          metalness: 0.7,
        });
        const doc = new THREE.Mesh(docGeo, docMat);
        doc.userData = { isStationMesh: true, index: idx };
        group.add(doc);
        interactiveMeshes.push(doc);

        // Laser scan plane
        const laserGeo = new THREE.PlaneGeometry(1.9, 0.1);
        const laserMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
        });
        const laser = new THREE.Mesh(laserGeo, laserMat);
        laser.name = "laserScan";
        group.add(laser);
      } else if (idx === 1) {
        // Station 2: Chunking (6 floating voxel cubes with gap spacing)
        const chunkHolder = new THREE.Group();
        chunkHolder.name = "chunkHolder";
        for (let c = 0; c < 6; c++) {
          const cGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
          const cMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.4,
            roughness: 0.2,
            metalness: 0.8,
          });
          const cMesh = new THREE.Mesh(cGeo, cMat);
          const col = c % 2;
          const row = Math.floor(c / 2);
          cMesh.position.set((col - 0.5) * 0.75, (row - 1) * 0.75, 0);
          cMesh.userData = { isStationMesh: true, index: idx };
          chunkHolder.add(cMesh);
          interactiveMeshes.push(cMesh);
        }
        group.add(chunkHolder);
      } else if (idx === 2) {
        // Station 3: Embedding Projection Prism (Octahedron with dense coordinate spikes)
        const prismGeo = new THREE.OctahedronGeometry(1.1, 0);
        const prismMat = new THREE.MeshStandardMaterial({
          color: 0x818cf8,
          emissive: 0x4f46e5,
          emissiveIntensity: 0.6,
          roughness: 0.1,
          metalness: 0.9,
          wireframe: false,
        });
        const prism = new THREE.Mesh(prismGeo, prismMat);
        prism.name = "embeddingPrism";
        prism.userData = { isStationMesh: true, index: idx };
        group.add(prism);
        interactiveMeshes.push(prism);

        // Wireframe outer shell
        const shellGeo = new THREE.IcosahedronGeometry(1.5, 1);
        const shellMat = new THREE.MeshBasicMaterial({
          color: 0x818cf8,
          wireframe: true,
          transparent: true,
          opacity: 0.4,
        });
        group.add(new THREE.Mesh(shellGeo, shellMat));
      } else if (idx === 3) {
        // Station 4: ChromaDB HNSW Multi-layer Spatial Lattice
        const latticeHolder = new THREE.Group();
        latticeHolder.name = "hnswLattice";
        const nodePositions = [
          new THREE.Vector3(0, 1.1, 0),
          new THREE.Vector3(-0.7, 0.3, 0.5),
          new THREE.Vector3(0.7, 0.3, -0.4),
          new THREE.Vector3(-0.8, -0.6, -0.5),
          new THREE.Vector3(0.8, -0.6, 0.5),
          new THREE.Vector3(0, -0.7, 0.8),
        ];
        nodePositions.forEach((np) => {
          const nGeo = new THREE.SphereGeometry(0.2, 16, 16);
          const nMat = new THREE.MeshStandardMaterial({
            color: 0xa855f7,
            emissive: 0x9333ea,
            emissiveIntensity: 0.7,
          });
          const node = new THREE.Mesh(nGeo, nMat);
          node.position.copy(np);
          latticeHolder.add(node);
        });
        // Lattice lines
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          nodePositions[0], nodePositions[1],
          nodePositions[0], nodePositions[2],
          nodePositions[1], nodePositions[3],
          nodePositions[2], nodePositions[4],
          nodePositions[1], nodePositions[5],
          nodePositions[4], nodePositions[5],
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.6 });
        latticeHolder.add(new THREE.LineSegments(lineGeo, lineMat));

        const hitCube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ visible: false }));
        hitCube.userData = { isStationMesh: true, index: idx };
        latticeHolder.add(hitCube);
        interactiveMeshes.push(hitCube);
        group.add(latticeHolder);
      } else if (idx === 4) {
        // Station 5: Semantic Retrieval Query Probe & Radar Scanner
        const probeGeo = new THREE.ConeGeometry(1.2, 2.0, 32, 1, true);
        const probeMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        const probe = new THREE.Mesh(probeGeo, probeMat);
        probe.name = "radarProbe";
        probe.rotation.x = Math.PI;
        group.add(probe);

        const targetSphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 })
        );
        targetSphere.userData = { isStationMesh: true, index: idx };
        group.add(targetSphere);
        interactiveMeshes.push(targetSphere);
      } else if (idx === 5) {
        // Station 6: Pairwise NLI Conflict Arbiter (Dual Collision Reactor)
        const reactorHolder = new THREE.Group();
        reactorHolder.name = "conflictReactor";
        // Premise A ring
        const ringAGeo = new THREE.TorusGeometry(0.85, 0.08, 16, 32);
        const ringAMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.8 });
        const ringA = new THREE.Mesh(ringAGeo, ringAMat);
        ringA.position.x = -0.7;
        reactorHolder.add(ringA);

        // Hypothesis B ring (Contradiction color: rose)
        const ringBGeo = new THREE.TorusGeometry(0.85, 0.08, 16, 32);
        const ringBMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.8 });
        const ringB = new THREE.Mesh(ringBGeo, ringBMat);
        ringB.position.x = 0.7;
        reactorHolder.add(ringB);

        // Center arbitration diamond
        const diaGeo = new THREE.OctahedronGeometry(0.4, 0);
        const diaMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf43f5e, emissiveIntensity: 1.0 });
        const dia = new THREE.Mesh(diaGeo, diaMat);
        dia.userData = { isStationMesh: true, index: idx };
        reactorHolder.add(dia);
        interactiveMeshes.push(dia);

        group.add(reactorHolder);
      } else if (idx === 6) {
        // Station 7: Local LLM Synthesis (Neural Quantum Core)
        const brainGeo = new THREE.IcosahedronGeometry(1.2, 2);
        const brainMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.8,
          wireframe: true,
        });
        const brain = new THREE.Mesh(brainGeo, brainMat);
        brain.name = "llmBrain";
        brain.userData = { isStationMesh: true, index: idx };
        group.add(brain);
        interactiveMeshes.push(brain);

        // Inner glowing core
        const innerGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
        group.add(new THREE.Mesh(innerGeo, innerMat));
      } else if (idx === 7) {
        // Station 8: Calibrated Citations & Verified Answer Tablet
        const answerGeo = new THREE.BoxGeometry(1.7, 2.3, 0.2);
        const answerMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.6,
          roughness: 0.15,
          metalness: 0.85,
        });
        const answer = new THREE.Mesh(answerGeo, answerMat);
        answer.userData = { isStationMesh: true, index: idx };
        group.add(answer);
        interactiveMeshes.push(answer);

        // Verification halo ring
        const haloGeo = new THREE.TorusGeometry(1.4, 0.04, 16, 64);
        const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.rotation.x = Math.PI / 2;
        group.add(halo);
      }

      // Station point light
      const stationLight = new THREE.PointLight(station.color, 2.5, 8);
      stationLight.position.y = 1.5;
      group.add(stationLight);

      scene.add(group);
      stationGroups.push(group);
    });

    // 4. Sweeping Continuous 3D Conduit connecting all stations
    const stationPositions = STATIONS.map((s) => s.pos);
    const splineCurve = new THREE.CatmullRomCurve3(stationPositions);

    const tubeGeo = new THREE.TubeGeometry(splineCurve, 120, 0.08, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const splineTube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(splineTube);

    // Flowing energy data pulses along the 3D pipeline
    const pulseCount = 8;
    const conduitPulses: THREE.Mesh[] = [];
    for (let p = 0; p < pulseCount; p++) {
      const pGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const pMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const pulse = new THREE.Mesh(pGeo, pMat);
      pulse.userData = { offset: p / pulseCount };
      scene.add(pulse);
      conduitPulses.push(pulse);
    }

    // 5. Background Spatial Vector Dust
    const dustCount = 350;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let d = 0; d < dustCount * 3; d += 3) {
      dustPositions[d] = (Math.random() - 0.5) * 45;
      dustPositions[d + 1] = (Math.random() - 0.5) * 20;
      dustPositions[d + 2] = (Math.random() - 0.5) * 25;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.1,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });
    scene.add(new THREE.Points(dustGeo, dustMat));

    // 6. Interactive Raycasting on Stations
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerUp = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const clickCoord = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(clickCoord, camera);
      const hits = raycaster.intersectObjects(interactiveMeshes);
      if (hits.length > 0) {
        const hitIdx = hits[0].object.userData.index;
        if (typeof hitIdx === "number") {
          setActiveStep(hitIdx);
          setIsPlaying(false);
        }
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || window.innerWidth;
        const h = entry.contentRect.height || 580;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // 7. Animation Loop with Smooth Camera Dolly Physics
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation towards active station target
      camera.position.lerp(cameraPosRef.current, 0.05);
      controls.target.lerp(cameraTargetRef.current, 0.06);
      controls.update();

      // Flowing data pulses along spline
      conduitPulses.forEach((p) => {
        const t = (elapsed * 0.12 + p.userData.offset) % 1;
        const pt = splineCurve.getPoint(t);
        p.position.copy(pt);
      });

      // Animate unique station meshes:
      // Station 0 (Laser scan)
      const laser = scene.getObjectByName("laserScan");
      if (laser) {
        laser.position.y = Math.sin(elapsed * 3) * 0.9;
      }

      // Station 1 (Chunk holder hover)
      const chunkHolder = scene.getObjectByName("chunkHolder");
      if (chunkHolder) {
        chunkHolder.rotation.y = elapsed * 0.4;
      }

      // Station 2 (Prism)
      const prism = scene.getObjectByName("embeddingPrism");
      if (prism) {
        prism.rotation.x = elapsed * 0.6;
        prism.rotation.y = elapsed * 0.8;
      }

      // Station 3 (HNSW Lattice)
      const lattice = scene.getObjectByName("hnswLattice");
      if (lattice) {
        lattice.rotation.y = elapsed * 0.3;
      }

      // Station 4 (Radar probe)
      const radar = scene.getObjectByName("radarProbe");
      if (radar) {
        radar.rotation.z = elapsed * 0.7;
      }

      // Station 5 (Conflict reactor)
      const reactor = scene.getObjectByName("conflictReactor");
      if (reactor) {
        reactor.rotation.y = elapsed * 0.5;
        const pulseScale = 1 + Math.sin(elapsed * 5) * 0.1;
        reactor.scale.set(pulseScale, pulseScale, pulseScale);
      }

      // Station 6 (LLM Brain)
      const brain = scene.getObjectByName("llmBrain");
      if (brain) {
        brain.rotation.y = elapsed * 0.4;
        brain.rotation.z = Math.sin(elapsed * 0.5) * 0.2;
      }

      // Active Station highlight pulse
      stationGroups.forEach((sg, idx) => {
        const isActive = idx === activeStep;
        sg.scale.lerp(
          isActive ? new THREE.Vector3(1.15, 1.15, 1.15) : new THREE.Vector3(1, 1, 1),
          0.08
        );
      });

      // Hover detection
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.index;
        setIsHoveredStation(typeof idx === "number" ? idx : null);
        container.style.cursor = "pointer";
      } else {
        setIsHoveredStation(null);
        container.style.cursor = "grab";
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      resizeObserver.disconnect();
      controls.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeStep]);

  const currentStation = STATIONS[activeStep];

  return (
    <div className="relative rounded-3xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-2xl p-6 md:p-8 overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.08)]">
      {/* Top Header Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10 relative z-20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            3D SPATIAL RAG PIPELINE
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            End-to-End Offline Architecture
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5 font-light">
            Genuine 3D WebGL spatial assembly showing the physical stages of offline ingestion, embedding, NLI arbitration, and verified generation.
          </p>
        </div>

        {/* 3D Camera & Step Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : STATIONS.length - 1))}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
            title="Previous 3D station"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all ${
              isPlaying
                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? "AUTO-FLIGHT" : "PAUSED"}</span>
          </button>

          <button
            onClick={() => setActiveStep((prev) => (prev + 1) % STATIONS.length)}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
            title="Next 3D station"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 3D WebGL Stage Container */}
      <div className="relative w-full h-[480px] md:h-[540px] rounded-2xl overflow-hidden border border-slate-800/80 bg-[#030611] select-none">
        {/* Three.js Canvas Element */}
        <div ref={containerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

        {/* 3D Interactive Helper Label */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-slate-950/70 backdrop-blur-md text-[10px] font-mono text-slate-400">
          <Layers size={12} className="text-cyan-400" />
          <span>DRAG TO ROTATE 3D PERSPECTIVE &bull; CLICK ANY 3D STATION TO FLY CAMERA</span>
        </div>

        {/* Floating Real-Time Station Telemetry Card */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-10 p-4 rounded-2xl border border-cyan-500/30 bg-slate-950/85 backdrop-blur-xl text-slate-200 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold uppercase"
              style={{
                color: currentStation.colorHex,
                borderColor: `${currentStation.colorHex}40`,
                backgroundColor: `${currentStation.colorHex}15`,
              }}
            >
              {currentStation.category}
            </span>
            <span className="text-xs font-mono text-cyan-300 font-bold">{currentStation.metric}</span>
          </div>

          <h3 className="text-base font-bold text-white mb-1">{currentStation.name}</h3>
          <p className="text-xs font-mono text-cyan-400 mb-2">{currentStation.tech}</p>
          <p className="text-xs text-slate-300 leading-relaxed font-light mb-3">
            {currentStation.academicDetail}
          </p>

          {/* Mathematical Grounding Formulation */}
          <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">FORMULATION:</span>
            <code>{currentStation.mathFormula}</code>
          </div>
        </div>

        {/* Hover indication tag */}
        {isHoveredStation !== null && isHoveredStation !== activeStep && (
          <div className="absolute top-4 right-4 z-10 pointer-events-none px-3 py-1 rounded-xl border border-cyan-500/40 bg-slate-950/80 text-xs font-mono text-cyan-300 animate-in fade-in">
            TARGET: {STATIONS[isHoveredStation].name}
          </div>
        )}
      </div>

      {/* Synchronized 8-Stage Spatial Scrub Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4">
        {STATIONS.map((station, i) => {
          const isActive = i === activeStep;
          return (
            <button
              key={station.id}
              onClick={() => {
                setActiveStep(i);
                setIsPlaying(false);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? "border-cyan-500 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-slate-400">0{i + 1}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: station.colorHex }}
                />
              </div>
              <p
                className={`text-xs font-semibold truncate ${
                  isActive ? "text-cyan-300 font-bold" : "text-slate-300"
                }`}
              >
                {station.name.split(". ")[1]}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
