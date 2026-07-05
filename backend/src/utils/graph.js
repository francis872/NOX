// graph.js — Utilidades de teoría de grafos para NOX
// Nodos: user | idea | module | tool | action
// Aristas: follows | created | reacted | commented | dm_sent | accessed_module | viewed
const pool = require('../db');

/**
 * Garantiza que un nodo existe en el grafo y retorna su id interno.
 */
async function upsertNode(type, entityId, label = '', metadata = {}) {
  const res = await pool.query(
    `INSERT INTO graph_nodes (type, entity_id, label, metadata)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (type, entity_id)
     DO UPDATE SET label = EXCLUDED.label,
                   metadata = graph_nodes.metadata || EXCLUDED.metadata
     RETURNING id`,
    [type, String(entityId), label, metadata]
  );
  return res.rows[0].id;
}

/**
 * Añade (o incrementa el peso de) una arista entre dos nodos ya registrados.
 */
async function addEdge(fromNodeId, toNodeId, edgeType, weightDelta = 1.0, metadata = {}) {
  await pool.query(
    `INSERT INTO graph_edges (from_node_id, to_node_id, edge_type, weight, metadata)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (from_node_id, to_node_id, edge_type)
     DO UPDATE SET weight = graph_edges.weight + $4,
                   updated_at = NOW(),
                   metadata = graph_edges.metadata || $5`,
    [fromNodeId, toNodeId, edgeType, weightDelta, metadata]
  );
}

/**
 * Helper de alto nivel: registra nodos fuente y destino y emite la arista.
 * nodeA / nodeB = { type, entityId, label, metadata }
 */
async function recordEdge(nodeA, nodeB, edgeType, weightDelta = 1.0, edgeMeta = {}) {
  try {
    const aId = await upsertNode(nodeA.type, nodeA.entityId, nodeA.label || '', nodeA.metadata || {});
    const bId = await upsertNode(nodeB.type, nodeB.entityId, nodeB.label || '', nodeB.metadata || {});
    await addEdge(aId, bId, edgeType, weightDelta, edgeMeta);
  } catch (err) {
    // No interrumpir flujo principal si el grafo falla
    console.warn('[graph] recordEdge error:', err.message);
  }
}

// ── Algoritmos ────────────────────────────────────────────────────────

/**
 * BFS: camino más corto entre dos nodos (por entity_id de tipo 'user').
 * Retorna array de nodos en el camino o null si no existe.
 */
async function shortestPath(fromUserId, toUserId) {
  // Carga todo el sub-grafo de usuarios (nodos user y sus aristas)
  const nodesRes = await pool.query(
    `SELECT id, entity_id FROM graph_nodes WHERE type = 'user'`
  );
  const edgesRes = await pool.query(
    `SELECT from_node_id, to_node_id FROM graph_edges ge
     JOIN graph_nodes gf ON gf.id = ge.from_node_id AND gf.type = 'user'
     JOIN graph_nodes gt ON gt.id = ge.to_node_id AND gt.type = 'user'`
  );

  const nodeMap = {}; // entity_id → graph node id
  nodesRes.rows.forEach((n) => { nodeMap[n.entity_id] = n.id; });

  const idToEntity = {}; // graph node id → entity_id
  nodesRes.rows.forEach((n) => { idToEntity[n.id] = n.entity_id; });

  const adj = {}; // graph node id → [neighbor graph node ids]
  edgesRes.rows.forEach(({ from_node_id, to_node_id }) => {
    (adj[from_node_id] = adj[from_node_id] || []).push(to_node_id);
    (adj[to_node_id] = adj[to_node_id] || []).push(from_node_id); // undirected
  });

  const startId = nodeMap[String(fromUserId)];
  const endId = nodeMap[String(toUserId)];
  if (!startId || !endId) return null;

  // BFS
  const visited = new Set([startId]);
  const queue = [[startId]];
  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];
    if (node === endId) {
      return path.map((id) => idToEntity[id]);
    }
    for (const neighbor of adj[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null;
}

/**
 * Grado de centralidad para todos los nodos (in + out edges).
 * Retorna top-N nodos con su grado.
 */
async function degreeCentrality(limit = 20) {
  const res = await pool.query(
    `SELECT n.id, n.type, n.entity_id, n.label,
            COUNT(DISTINCT e1.id) AS out_degree,
            COUNT(DISTINCT e2.id) AS in_degree,
            COUNT(DISTINCT e1.id) + COUNT(DISTINCT e2.id) AS total_degree
     FROM graph_nodes n
     LEFT JOIN graph_edges e1 ON e1.from_node_id = n.id
     LEFT JOIN graph_edges e2 ON e2.to_node_id = n.id
     GROUP BY n.id, n.type, n.entity_id, n.label
     ORDER BY total_degree DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}

/**
 * PageRank simplificado (iterativo, 20 iteraciones).
 * Sólo considera nodos de tipo 'user'.
 */
async function pageRank(iterations = 20, dampingFactor = 0.85) {
  const nodesRes = await pool.query(
    `SELECT id, entity_id, label FROM graph_nodes WHERE type = 'user'`
  );
  const edgesRes = await pool.query(
    `SELECT ge.from_node_id, ge.to_node_id, ge.weight
     FROM graph_edges ge
     JOIN graph_nodes gf ON gf.id = ge.from_node_id AND gf.type = 'user'
     JOIN graph_nodes gt ON gt.id = ge.to_node_id AND gt.type = 'user'`
  );

  const nodes = nodesRes.rows;
  const N = nodes.length;
  if (N === 0) return [];

  const rank = {};
  nodes.forEach((n) => { rank[n.id] = 1 / N; });

  const outEdges = {}; // id → [{ to, weight }]
  const outWeight = {}; // id → sum of outgoing weights
  edgesRes.rows.forEach(({ from_node_id, to_node_id, weight }) => {
    (outEdges[from_node_id] = outEdges[from_node_id] || []).push({ to: to_node_id, weight });
    outWeight[from_node_id] = (outWeight[from_node_id] || 0) + weight;
  });

  for (let i = 0; i < iterations; i++) {
    const newRank = {};
    nodes.forEach((n) => { newRank[n.id] = (1 - dampingFactor) / N; });
    edgesRes.rows.forEach(({ from_node_id, to_node_id, weight }) => {
      const share = rank[from_node_id] * (weight / (outWeight[from_node_id] || 1));
      newRank[to_node_id] = (newRank[to_node_id] || 0) + dampingFactor * share;
    });
    Object.assign(rank, newRank);
  }

  return nodes
    .map((n) => ({ entity_id: n.entity_id, label: n.label, score: rank[n.id] }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Comunidades por componentes conectados (BFS, grafo no dirigido de usuarios).
 * Retorna array de comunidades, cada una con sus miembros.
 */
async function connectedComponents() {
  const nodesRes = await pool.query(
    `SELECT id, entity_id, label FROM graph_nodes WHERE type = 'user'`
  );
  const edgesRes = await pool.query(
    `SELECT ge.from_node_id, ge.to_node_id
     FROM graph_edges ge
     JOIN graph_nodes gf ON gf.id = ge.from_node_id AND gf.type = 'user'
     JOIN graph_nodes gt ON gt.id = ge.to_node_id AND gt.type = 'user'`
  );

  const adj = {};
  const nodeInfo = {};
  nodesRes.rows.forEach((n) => {
    adj[n.id] = [];
    nodeInfo[n.id] = n;
  });
  edgesRes.rows.forEach(({ from_node_id, to_node_id }) => {
    adj[from_node_id].push(to_node_id);
    adj[to_node_id].push(from_node_id);
  });

  const visited = new Set();
  const components = [];

  for (const node of nodesRes.rows) {
    if (visited.has(node.id)) continue;
    const component = [];
    const queue = [node.id];
    visited.add(node.id);
    while (queue.length) {
      const curr = queue.shift();
      component.push({ entity_id: nodeInfo[curr].entity_id, label: nodeInfo[curr].label });
      for (const nb of adj[curr]) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
      }
    }
    components.push(component);
  }

  return components.sort((a, b) => b.length - a.length);
}

/**
 * Resincroniza aristas desde tablas reales (followers, ideas, reacciones, mensajes).
 */
async function syncFromTables() {
  // 1. follows → user --follows--> user
  const follows = await pool.query(
    `SELECT u1.id AS fid, u1.username AS fu,
            u2.id AS tid, u2.username AS tu
     FROM followers f
     JOIN users u1 ON u1.id = f.follower_id
     JOIN users u2 ON u2.id = f.user_id`
  );
  for (const row of follows.rows) {
    await recordEdge(
      { type: 'user', entityId: row.fid, label: row.fu },
      { type: 'user', entityId: row.tid, label: row.tu },
      'follows',
    );
  }

  // 2. ideas → user --created--> idea
  const ideas = await pool.query(
    `SELECT i.id AS iid, i.premise AS premise, u.id AS uid, u.username AS uname
     FROM ideas i JOIN users u ON u.id = i.author_id`
  );
  for (const row of ideas.rows) {
    await recordEdge(
      { type: 'user', entityId: row.uid, label: row.uname },
      { type: 'idea', entityId: row.iid, label: (row.premise || '').slice(0, 60) },
      'created',
    );
  }

  // 3. messages → user --dm_sent--> user (una arista por par, peso = cantidad)
  const msgs = await pool.query(
    `SELECT sender_id, receiver_id, COUNT(*) AS cnt,
            u1.username AS su, u2.username AS ru
     FROM messages m
     JOIN users u1 ON u1.id = m.sender_id
     JOIN users u2 ON u2.id = m.receiver_id
     GROUP BY sender_id, receiver_id, u1.username, u2.username`
  );
  for (const row of msgs.rows) {
    await recordEdge(
      { type: 'user', entityId: row.sender_id, label: row.su },
      { type: 'user', entityId: row.receiver_id, label: row.ru },
      'dm_sent',
      Number(row.cnt),
    );
  }

  // 4. Módulos conocidos → module nodes
  const MODULES = [
    'feed', 'explore', 'loop', 'vibes', 'mylink',
    'profile', 'camara', 'insights', 'grafo',
  ];
  for (const m of MODULES) {
    await upsertNode('module', m, m.charAt(0).toUpperCase() + m.slice(1), {});
  }
}

module.exports = { upsertNode, addEdge, recordEdge, shortestPath, degreeCentrality, pageRank, connectedComponents, syncFromTables };
