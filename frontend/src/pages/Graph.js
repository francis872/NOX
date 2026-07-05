// Graph.js — Visualización interactiva del grafo de conocimiento NOX
// Simulación de fuerzas nativa (Canvas + rAF), sin dependencias externas.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

// Colores por tipo de nodo
const NODE_COLOR = {
  user: '#7f5af0',
  idea: '#2cb67d',
  module: '#4cc9f0',
  tool: '#f4a261',
  action: '#f72585',
};
const EDGE_COLOR = {
  follows: 'rgba(127,90,240,0.55)',
  created: 'rgba(44,182,125,0.55)',
  reacted: 'rgba(247,37,133,0.5)',
  commented: 'rgba(76,201,240,0.5)',
  dm_sent: 'rgba(244,162,97,0.5)',
  accessed_module: 'rgba(255,255,255,0.22)',
  viewed: 'rgba(255,255,255,0.18)',
};
const NODE_RADIUS = { user: 10, idea: 8, module: 12, tool: 8, action: 6 };

function useForceGraph(rawNodes, rawEdges, canvasRef) {
  const simRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || rawNodes.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let dragging = null;
    let offsetX = 0, offsetY = 0;
    let scale = 1, tx = 0, ty = 0;
    let isPanning = false, panStart = { x: 0, y: 0 };

    // Inicializar posiciones
    const W = canvas.width, H = canvas.height;
    const nodes = rawNodes.map((n, i) => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * 400,
      y: H / 2 + (Math.random() - 0.5) * 400,
      vx: 0, vy: 0,
    }));

    // Mapa id → índice
    const idxMap = {};
    nodes.forEach((n, i) => { idxMap[n.id] = i; });

    const edges = rawEdges
      .map((e) => ({ ...e, si: idxMap[e.from_id], ti: idxMap[e.to_id] }))
      .filter((e) => e.si !== undefined && e.ti !== undefined);

    simRef.current = { nodes, edges };

    const REPULSION = 3000;
    const SPRING = 0.04;
    const REST = 120;
    const DAMPING = 0.82;
    const CENTER_FORCE = 0.004;

    function tick() {
      const { nodes, edges } = simRef.current;
      const N = nodes.length;

      // Repulsión entre todos los pares
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist2 = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(dist2);
          const force = REPULSION / dist2;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx; nodes[i].vy -= fy;
          nodes[j].vx += fx; nodes[j].vy += fy;
        }
      }

      // Atracción por aristas (resorte)
      for (const e of edges) {
        const a = nodes[e.si], b = nodes[e.ti];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - REST) * SPRING * (e.weight || 1);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }

      // Fuerza al centro
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * CENTER_FORCE;
        n.vy += (H / 2 - n.y) * CENTER_FORCE;
      }

      // Integración
      for (const n of nodes) {
        if (n.pinned) continue;
        n.vx *= DAMPING; n.vy *= DAMPING;
        n.x += n.vx; n.y += n.vy;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);

      const { nodes, edges } = simRef.current;

      // Aristas
      for (const e of edges) {
        const a = nodes[e.si], b = nodes[e.ti];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = EDGE_COLOR[e.edge_type] || 'rgba(255,255,255,0.2)';
        ctx.lineWidth = Math.min(0.5 + (e.weight || 1) * 0.3, 4);
        ctx.stroke();
      }

      // Nodos
      for (const n of nodes) {
        const r = NODE_RADIUS[n.type] || 8;
        const color = NODE_COLOR[n.type] || '#94a3b8';

        // Glow
        const grd = ctx.createRadialGradient(n.x, n.y, r * 0.2, n.x, n.y, r * 2.5);
        grd.addColorStop(0, color + 'aa');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Círculo
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        const degree = Number(n.degree) || 0;
        if (degree > 1 || n.type === 'module') {
          ctx.fillStyle = '#e2e8f0';
          ctx.font = `${Math.max(9, Math.min(13, r + 4))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText((n.label || n.entity_id || '').slice(0, 18), n.x, n.y - r - 4);
        }
      }

      ctx.restore();
    }

    function loop() {
      tick();
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    // ── Interactividad ────────────────────────────────
    function getNodeAt(mx, my) {
      const wx = (mx - tx) / scale, wy = (my - ty) / scale;
      const { nodes } = simRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const r = (NODE_RADIUS[n.type] || 8) + 4;
        const dx = wx - n.x, dy = wy - n.y;
        if (dx * dx + dy * dy <= r * r) return i;
      }
      return -1;
    }

    const onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const ni = getNodeAt(mx, my);
      if (ni >= 0) {
        dragging = ni;
        const n = simRef.current.nodes[ni];
        const wx = (mx - tx) / scale, wy = (my - ty) / scale;
        offsetX = wx - n.x; offsetY = wy - n.y;
        n.pinned = true;
      } else {
        isPanning = true;
        panStart = { x: mx - tx, y: my - ty };
      }
    };
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (dragging !== null) {
        const n = simRef.current.nodes[dragging];
        const wx = (mx - tx) / scale, wy = (my - ty) / scale;
        n.x = wx - offsetX; n.y = wy - offsetY;
        n.vx = 0; n.vy = 0;
      } else if (isPanning) {
        tx = mx - panStart.x; ty = my - panStart.y;
      }
    };
    const onMouseUp = () => {
      if (dragging !== null) simRef.current.nodes[dragging].pinned = false;
      dragging = null; isPanning = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.91;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      tx = mx - (mx - tx) * factor;
      ty = my - (my - ty) * factor;
      scale *= factor;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [rawNodes, rawEdges, canvasRef]);
}

export default function GraphPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState(null);
  const [pagerank, setPagerank] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [pathResult, setPathResult] = useState(null);
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');
  const [activeTab, setActiveTab] = useState('grafo');
  const [filter, setFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const canvasRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [fullRes, statsRes, prRes, commRes] = await Promise.all([
        axios.get('/api/graph/full'),
        axios.get('/api/graph/stats'),
        axios.get('/api/graph/pagerank'),
        axios.get('/api/graph/communities'),
      ]);
      setGraphData(fullRes.data);
      setStats(statsRes.data);
      setPagerank(prRes.data);
      setCommunities(commRes.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  // Registrar acceso al módulo 'grafo' en el grafo
  useEffect(() => {
    if (!user?.id) return;
    axios.post('/api/graph/event', {
      from_type: 'user', from_entity: String(user.id), from_label: user.username || '',
      to_type: 'module', to_entity: 'grafo', to_label: 'Grafo',
      edge_type: 'accessed_module',
    }).catch(() => {});
  }, [user?.id]);

  // Filtrar nodos por tipo
  const visibleNodes = filter === 'all'
    ? graphData.nodes
    : graphData.nodes.filter((n) => n.type === filter);
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = graphData.edges.filter(
    (e) => visibleNodeIds.has(e.from_id) && visibleNodeIds.has(e.to_id)
  );

  useForceGraph(visibleNodes, visibleEdges, canvasRef);

  const syncGraph = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/graph/sync');
      await load();
    } catch {} finally { setSyncing(false); }
  };

  const findPath = async () => {
    if (!pathFrom || !pathTo) return;
    try {
      const res = await axios.get(`/api/graph/path?from=${pathFrom}&to=${pathTo}`);
      setPathResult(res.data);
    } catch {}
  };

  const TABS = [
    { key: 'grafo', label: 'Grafo' },
    { key: 'stats', label: 'Stats' },
    { key: 'ranking', label: 'PageRank' },
    { key: 'comunidades', label: 'Comunidades' },
    { key: 'camino', label: 'Camino corto' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingLeft: 60, background: '#0e0e1a', color: '#e2e8f0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '2px', background: 'linear-gradient(135deg,#7f5af0,#4cc9f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              GRAFO NOX
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
              Teoría de grafos · usuarios, ideas, módulos y acciones
            </div>
          </div>
          <button
            onClick={syncGraph}
            disabled={syncing}
            style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(127,90,240,0.4)', background: syncing ? 'rgba(127,90,240,0.1)' : 'rgba(127,90,240,0.18)', color: '#a78bfa', fontWeight: 700, fontSize: 13, cursor: syncing ? 'not-allowed' : 'pointer' }}
          >
            {syncing ? 'Sincronizando…' : '⟳ Sincronizar grafo'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: '8px 16px', border: 'none', background: 'none', color: activeTab === t.key ? '#7f5af0' : '#475569', fontWeight: activeTab === t.key ? 700 : 500, fontSize: 13, cursor: 'pointer', borderBottom: activeTab === t.key ? '2px solid #7f5af0' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── Grafo visual ── */}
        {activeTab === 'grafo' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Filtros de tipo */}
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', 'user', 'idea', 'module'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${filter === f ? NODE_COLOR[f] || '#7f5af0' : 'rgba(255,255,255,0.1)'}`, background: filter === f ? (NODE_COLOR[f] || '#7f5af0') + '33' : 'rgba(10,10,20,0.7)', color: filter === f ? '#e2e8f0' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {f === 'all' ? 'Todo' : f}
                </button>
              ))}
            </div>

            {/* Leyenda */}
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(10,10,20,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {Object.entries(NODE_COLOR).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8' }}>{type}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4, paddingTop: 4, fontSize: 10, color: '#334155' }}>
                {visibleNodes.length} nodos · {visibleEdges.length} aristas
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={window.innerWidth - 60}
              height={window.innerHeight - 120}
              style={{ display: 'block', cursor: 'grab' }}
            />
            {visibleNodes.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#334155' }}>
                <div style={{ fontSize: 48 }}>🕸️</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>El grafo está vacío</div>
                <div style={{ fontSize: 12 }}>Usa "Sincronizar grafo" para importar conexiones existentes</div>
              </div>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        {activeTab === 'stats' && stats && (
          <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Nodos totales', value: stats.total_nodes, color: '#7f5af0' },
                { label: 'Aristas totales', value: stats.total_edges, color: '#2cb67d' },
                { label: 'Tipos de nodo', value: stats.node_types?.length, color: '#4cc9f0' },
                { label: 'Tipos de relación', value: stats.edge_types?.length, color: '#f72585' },
              ].map((s) => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}33`, borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: s.color }}>{s.value ?? '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7f5af0', marginBottom: 10 }}>Nodos por tipo</div>
                {(stats.node_types || []).map((t) => (
                  <div key={t.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: NODE_COLOR[t.type] || '#64748b' }} />
                      <span style={{ fontSize: 13, color: '#cbd5e1' }}>{t.type}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{t.count}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2cb67d', marginBottom: 10 }}>Relaciones por tipo</div>
                {(stats.edge_types || []).map((t) => (
                  <div key={t.edge_type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.edge_type}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>{t.count} aristas</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>peso total {Number(t.sum || 0).toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PageRank ── */}
        {activeTab === 'ranking' && (
          <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Influencia relativa calculada con PageRank (d=0.85, 20 iteraciones). Los usuarios con más conexiones entrantes ponderadas aparecen primero.
            </div>
            {pagerank.length === 0 && (
              <div style={{ color: '#334155', fontSize: 14 }}>Sin datos de PageRank. Sincroniza el grafo primero.</div>
            )}
            {pagerank.map((u, i) => (
              <div key={u.entity_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: i < 3 ? 'rgba(127,90,240,0.08)' : 'rgba(255,255,255,0.02)', border: i < 3 ? '1px solid rgba(127,90,240,0.2)' : '1px solid rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 8 }}>
                <div style={{ width: 28, fontSize: 16, fontWeight: 900, color: i === 0 ? '#f4a261' : i === 1 ? '#94a3b8' : i === 2 ? '#a16207' : '#334155', textAlign: 'center' }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{u.label || u.entity_id}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>user #{u.entity_id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#7f5af0' }}>{(u.score * 100).toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: '#334155' }}>score</div>
                </div>
                {/* Barra de score */}
                <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (u.score / (pagerank[0]?.score || 1)) * 100)}%`, background: 'linear-gradient(90deg,#7f5af0,#2cb67d)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Comunidades ── */}
        {activeTab === 'comunidades' && (
          <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Componentes conectados detectados por BFS. Cada comunidad agrupa usuarios que están conectados entre sí de manera directa o indirecta.
            </div>
            {communities.length === 0 && (
              <div style={{ color: '#334155', fontSize: 14 }}>Sin comunidades. Sincroniza el grafo primero.</div>
            )}
            {communities.map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>Comunidad {i + 1}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{c.length} miembro{c.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.map((m) => (
                    <div key={m.entity_id} style={{ padding: '4px 10px', background: 'rgba(127,90,240,0.12)', border: '1px solid rgba(127,90,240,0.25)', borderRadius: 20, fontSize: 12, color: '#cbd5e1' }}>
                      {m.label || m.entity_id}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Camino más corto ── */}
        {activeTab === 'camino' && (
          <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Encuentra el camino más corto entre dos usuarios usando BFS sobre el grafo de relaciones.
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                value={pathFrom}
                onChange={(e) => setPathFrom(e.target.value)}
                placeholder="ID usuario origen"
                style={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(127,90,240,0.3)', borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
              />
              <input
                value={pathTo}
                onChange={(e) => setPathTo(e.target.value)}
                placeholder="ID usuario destino"
                style={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(127,90,240,0.3)', borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
              />
              <button onClick={findPath}
                style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Buscar
              </button>
            </div>
            {pathResult && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(127,90,240,0.2)', borderRadius: 14, padding: 20 }}>
                {pathResult.path ? (
                  <>
                    <div style={{ fontSize: 13, color: '#7f5af0', fontWeight: 700, marginBottom: 14 }}>
                      Distancia: {pathResult.distance} {pathResult.distance === 1 ? 'salto' : 'saltos'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {pathResult.path.map((entityId, i) => (
                        <React.Fragment key={i}>
                          <div style={{ padding: '6px 14px', background: i === 0 || i === pathResult.path.length - 1 ? 'rgba(127,90,240,0.25)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(127,90,240,0.35)', borderRadius: 20, fontSize: 13, color: '#e2e8f0', fontWeight: 700 }}>
                            Usuario #{entityId}
                          </div>
                          {i < pathResult.path.length - 1 && (
                            <span style={{ color: '#334155', fontSize: 18 }}>→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: 14 }}>No existe camino entre esos dos usuarios en el grafo actual.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
