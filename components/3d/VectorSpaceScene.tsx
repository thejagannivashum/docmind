"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Search, Sparkles, Sliders, Info } from "lucide-react";

interface EmbeddingCluster {
  name: string;
  topic: string;
  baseColor: number;
  center: THREE.Vector3;
  chunks: string[];
}

const CLUSTERS: EmbeddingCluster[] = [
  {
    name: "Transformer Architecture",
    topic: "Attention Mechanisms & Positional Encodings",
    baseColor: 0x06b6d4, // Cyan
    center: new THREE.Vector3(-3.5, 1.5, 0),
    chunks: [
      "Multi-head attention projects queries, keys, and values into h subspaces.",
      "Self-attention connects all pairs of input tokens in O(1) sequential operations.",
      "Positional encodings inject sequence order using sinusoidal frequencies.",
    ],
  },
  {
    name: "NLI Conflict Detection",
    topic: "DeBERTa Cross-Encoder & Contradiction Scoring",
    baseColor: 0xa855f7, // Violet
    center: new THREE.Vector3(3.2, 2.0, -1),
    chunks: [
      "Pairwise cross-encoder scores premise-hypothesis pairs for factual incompatibility.",
      "Calibrated confidence score penalizes conflicting claims before LLM synthesis.",
      "Contradiction detection decouples factual verification from generation.",
    ],
  },
  {
    name: "Distributed Consistency",
    topic: "CAP Theorem, Raft, and Vector Clocks",
    baseColor: 0x10b981, // Emerald
    center: new THREE.Vector3(-1.5, -2.5, 1.5),
    chunks: [
      "Eventual consistency ensures data replica convergence in the absence of new updates.",
      "Strong consistency incurs higher tail latencies during network partition events.",
      "Raft consensus coordinates leader election and log replication securely.",
    ],
  },
  {
    name: "Vector Databases & HNSW",
    topic: "ChromaDB, Approximate Nearest Neighbors",
    baseColor: 0xf59e0b, // Amber
    center: new THREE.Vector3(3.0, -2.0, 1.0),
    chunks: [
      "HNSW graphs achieve logarithmic search time for dense vector retrieval.",
      "Cosine distance measures semantic orientation regardless of document vector length.",
      "Sliding chunk overlap preserves context boundaries across token splits.",
    ],
  },
];

const PRESET_QUERIES = [
  { text: "How does multi-head attention improve contextual representation?", clusterTarget: 0 },
  { text: "How does DocMind detect contradictory claims between sources?", clusterTarget: 1 },
  { text: "What trade-offs exist between eventual and strong consistency?", clusterTarget: 2 },
  { text: "How does HNSW graph indexing accelerate vector similarity retrieval?", clusterTarget: 3 },
];

export default function VectorSpaceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedQuery, setSelectedQuery] = useState(PRESET_QUERIES[0]);
  const [customQuery, setCustomQuery] = useState("");
  const [topRetrieved, setTopRetrieved] = useState<
    Array<{ text: string; cluster: string; similarity: number }>
  >([]);

  const sceneRef = useRef<{
    queryMesh: THREE.Mesh | null;
    beamLines: THREE.Line[];
    pointsMesh: THREE.Points | null;
    positions: Float32Array;
    colors: Float32Array;
    clusterIndices: number[];
  }>({
    queryMesh: null,
    beamLines: [],
    pointsMesh: null,
    positions: new Float32Array(),
    colors: new Float32Array(),
    clusterIndices: [],
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 500;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.04);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Coordinate Grid Planes
    const gridHelper = new THREE.GridHelper(12, 12, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -3.8;
    scene.add(gridHelper);

    // Embedding Point Cloud Generation
    const totalPoints = 320;
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    const clusterIndices: number[] = [];

    let pIdx = 0;
    CLUSTERS.forEach((cluster, cIdx) => {
      const pointsPerCluster = totalPoints / CLUSTERS.length;
      const cColor = new THREE.Color(cluster.baseColor);

      for (let i = 0; i < pointsPerCluster; i++) {
        // Gaussian spread around cluster center
        const u1 = Math.random();
        const u2 = Math.random();
        const r = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * 1.1;
        const theta = 2.0 * Math.PI * u2;

        const x = cluster.center.x + r * Math.cos(theta);
        const y = cluster.center.y + (Math.random() - 0.5) * 1.8;
        const z = cluster.center.z + r * Math.sin(theta);

        positions[pIdx * 3] = x;
        positions[pIdx * 3 + 1] = y;
        positions[pIdx * 3 + 2] = z;

        colors[pIdx * 3] = cColor.r;
        colors[pIdx * 3 + 1] = cColor.g;
        colors[pIdx * 3 + 2] = cColor.b;

        clusterIndices.push(cIdx);
        pIdx++;
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const pointsMesh = new THREE.Points(geo, mat);
    scene.add(pointsMesh);

    // Glowing Query Point Marker
    const queryGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const queryMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const queryMesh = new THREE.Mesh(queryGeo, queryMat);
    scene.add(queryMesh);

    // Query Aura Ring
    const auraGeo = new THREE.RingGeometry(0.35, 0.42, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const auraRing = new THREE.Mesh(auraGeo, auraMat);
    queryMesh.add(auraRing);

    sceneRef.current = {
      queryMesh,
      beamLines: [],
      pointsMesh,
      positions,
      colors,
      clusterIndices,
    };

    // Mouse tilt & rotation
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      targetRotY = x * 0.6;
      targetRotX = y * 0.4;
    };

    container.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      camera.position.x = Math.sin(rotY) * 11;
      camera.position.z = Math.cos(rotY) * 11;
      camera.position.y = -rotX * 6;
      camera.lookAt(0, 0, 0);

      // Pulse query marker
      if (queryMesh) {
        const s = 1 + Math.sin(elapsed * 4) * 0.15;
        queryMesh.scale.set(s, s, s);
        auraRing.rotation.z = elapsed * 1.5;
      }

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
        renderer.setSize(w, height);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Query and Cosine Similarity Beams whenever selected query changes
  useEffect(() => {
    const { queryMesh, pointsMesh, positions, colors, clusterIndices } = sceneRef.current;
    if (!queryMesh || !pointsMesh) return;

    const targetCluster = CLUSTERS[selectedQuery.clusterTarget];
    // Position query point near target cluster center with small offset
    const qPos = targetCluster.center.clone().add(new THREE.Vector3(0.5, 0.4, 0.6));
    queryMesh.position.copy(qPos);

    // Remove old beam lines
    sceneRef.current.beamLines.forEach((line) => {
      line.parent?.remove(line);
    });
    sceneRef.current.beamLines = [];

    // Recompute brightness / distance for points
    const totalPoints = positions.length / 3;
    const colorAttr = pointsMesh.geometry.getAttribute("color") as THREE.BufferAttribute;

    const distances: Array<{ idx: number; dist: number; cIdx: number }> = [];

    for (let i = 0; i < totalPoints; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];
      const d = Math.hypot(px - qPos.x, py - qPos.y, pz - qPos.z);
      distances.push({ idx: i, dist: d, cIdx: clusterIndices[i] });

      const cluster = CLUSTERS[clusterIndices[i]];
      const baseCol = new THREE.Color(cluster.baseColor);

      if (clusterIndices[i] === selectedQuery.clusterTarget) {
        // Illuminate target cluster
        const factor = Math.max(0.3, 1.2 - d * 0.3);
        colors[i * 3] = baseCol.r * factor;
        colors[i * 3 + 1] = baseCol.g * factor;
        colors[i * 3 + 2] = baseCol.b * factor;
      } else {
        // Dim irrelevant clusters
        colors[i * 3] = baseCol.r * 0.15;
        colors[i * 3 + 1] = baseCol.g * 0.15;
        colors[i * 3 + 2] = baseCol.b * 0.15;
      }
    }
    colorAttr.needsUpdate = true;

    // Draw retrieval beam lines to top 4 nearest neighbors
    distances.sort((a, b) => a.dist - b.dist);
    const topK = distances.slice(0, 4);

    const parent = pointsMesh.parent;
    if (parent) {
      topK.forEach((item) => {
        const ptPos = new THREE.Vector3(
          positions[item.idx * 3],
          positions[item.idx * 3 + 1],
          positions[item.idx * 3 + 2]
        );
        const lineGeo = new THREE.BufferGeometry().setFromPoints([qPos, ptPos]);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.75,
          linewidth: 2,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        parent.add(line);
        sceneRef.current.beamLines.push(line);
      });
    }

    // Set top retrieved chunks for UI display
    setTopRetrieved(
      targetCluster.chunks.map((chunk, i) => ({
        text: chunk,
        cluster: targetCluster.name,
        similarity: Math.round((0.95 - i * 0.05) * 100) / 100,
      }))
    );
  }, [selectedQuery]);

  const handleApplyCustomQuery = () => {
    if (!customQuery.trim()) return;
    const lower = customQuery.toLowerCase();
    let clusterIdx = 0;
    if (lower.includes("conflict") || lower.includes("disagree") || lower.includes("nli") || lower.includes("verify")) {
      clusterIdx = 1;
    } else if (lower.includes("distribute") || lower.includes("raft") || lower.includes("paxos") || lower.includes("cap")) {
      clusterIdx = 2;
    } else if (lower.includes("chroma") || lower.includes("hnsw") || lower.includes("vector") || lower.includes("index")) {
      clusterIdx = 3;
    }
    setSelectedQuery({ text: customQuery, clusterTarget: clusterIdx });
  };

  return (
    <div className="relative rounded-3xl border border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl p-6 md:p-8 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.06)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 mb-2">
            <Search className="w-3.5 h-3.5" />
            3D DENSE VECTOR SPACE
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Semantic Retrieval &amp; Geometric Projection
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Visual representation of how high-dimensional document chunks cluster by topic and illuminate relative to user queries.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-950/40 text-purple-300">
            VISUAL SIMULATION
          </span>
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-xl">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>DRAG TO ORBIT</span>
          </div>
        </div>
      </div>

      {/* Query Selector Bar */}
      <div className="space-y-3 mb-6">
        <label className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Select a Query to Project into Embedding Space
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedQuery(q)}
              className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                selectedQuery.text === q.text
                  ? "border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <span className="font-mono text-cyan-500 mt-0.5">Q0{idx + 1}</span>
              <span className="leading-snug">{q.text}</span>
            </button>
          ))}
        </div>

        {/* Custom Query Input */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyCustomQuery()}
            placeholder="Or type a custom research query (e.g., 'Transformer multi-head projections')..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleApplyCustomQuery}
            className="px-5 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 text-xs font-mono hover:bg-cyan-500/30 transition-all"
          >
            PROJECT VECTOR
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        data-threescene="true"
        className="canvas-3d-container relative w-full h-[460px] rounded-2xl border border-slate-800/80 bg-slate-950/90 overflow-hidden mb-6"
      >
        <div ref={containerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
          {CLUSTERS.map((c, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-mono backdrop-blur-md ${
                i === selectedQuery.clusterTarget
                  ? "border-cyan-400/80 bg-cyan-950/70 text-cyan-300"
                  : "border-slate-800 bg-slate-950/60 text-slate-500"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: `#${c.baseColor.toString(16).padStart(6, "0")}` }}
              />
              {c.name}
            </div>
          ))}
        </div>

        {/* Active Query HUD indicator */}
        <div className="absolute bottom-4 right-4 z-10 px-3.5 py-1.5 rounded-xl border border-cyan-500/40 bg-slate-950/80 backdrop-blur-md text-xs font-mono text-cyan-300 pointer-events-none">
          QUERY EMBEDDING: <span className="text-white font-bold">[ACTIVE PROJECTION]</span>
        </div>
      </div>

      {/* Retrieved Chunks Display */}
      <div>
        <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Retrieved Top-k Chunks (Ranked by Cosine Proximity)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topRetrieved.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between"
            >
              <p className="text-xs text-slate-300 leading-relaxed italic mb-3">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono border-t border-white/5 pt-2">
                <span className="text-slate-400">{item.cluster}</span>
                <span className="text-emerald-400 font-bold">
                  {(item.similarity * 100).toFixed(0)}% MATCH
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
