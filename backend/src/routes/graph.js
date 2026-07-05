// routes/graph.js — API de teoría de grafos para NOX
const express = require('express');
const router = express.Router();
const pool = require('../db');
const {
  shortestPath,
  degreeCentrality,
  pageRank,
  connectedComponents,
  syncFromTables,
  recordEdge,
} = require('../utils/graph');

// ── GET /api/graph/nodes ──────────────────────────────────────────────
// Lista nodos con grado, filtrable por type=user|idea|module|tool|action
router.get('/nodes', async (req, res) => {
  try {
    const { type, limit = 100 } = req.query;
    const cond = type ? `WHERE n.type = $2` : '';
    const params = type ? [Number(limit), type] : [Number(limit)];
    const result = await pool.query(
      `SELECT n.id, n.type, n.entity_id, n.label, n.metadata,
              COUNT(DISTINCT e1.id) AS out_degree,
              COUNT(DISTINCT e2.id) AS in_degree
       FROM graph_nodes n
       LEFT JOIN graph_edges e1 ON e1.from_node_id = n.id
       LEFT JOIN graph_edges e2 ON e2.to_node_id = n.id
       ${cond}
       GROUP BY n.id, n.type, n.entity_id, n.label, n.metadata
       ORDER BY (COUNT(DISTINCT e1.id) + COUNT(DISTINCT e2.id)) DESC
       LIMIT $1`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/edges ──────────────────────────────────────────────
// Lista aristas con info de nodos extremos
router.get('/edges', async (req, res) => {
  try {
    const { edge_type, limit = 200 } = req.query;
    const cond = edge_type ? `WHERE ge.edge_type = $2` : '';
    const params = edge_type ? [Number(limit), edge_type] : [Number(limit)];
    const result = await pool.query(
      `SELECT ge.id, ge.edge_type, ge.weight, ge.created_at,
              gf.type AS from_type, gf.entity_id AS from_entity, gf.label AS from_label,
              gt.type AS to_type, gt.entity_id AS to_entity, gt.label AS to_label
       FROM graph_edges ge
       JOIN graph_nodes gf ON gf.id = ge.from_node_id
       JOIN graph_nodes gt ON gt.id = ge.to_node_id
       ${cond}
       ORDER BY ge.weight DESC
       LIMIT $1`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/user/:id/neighbors ────────────────────────────────
// Vecinos directos (nodos a 1 hop de distancia) del usuario
router.get('/user/:id/neighbors', async (req, res) => {
  try {
    const userNode = await pool.query(
      `SELECT id FROM graph_nodes WHERE type = 'user' AND entity_id = $1`,
      [req.params.id]
    );
    if (!userNode.rows.length) return res.json({ neighbors: [] });
    const nId = userNode.rows[0].id;

    const result = await pool.query(
      `SELECT DISTINCT ON (n.id) n.type, n.entity_id, n.label,
              ge.edge_type, ge.weight
       FROM graph_edges ge
       JOIN graph_nodes n ON (
         CASE WHEN ge.from_node_id = $1 THEN ge.to_node_id ELSE ge.from_node_id END = n.id
       )
       WHERE ge.from_node_id = $1 OR ge.to_node_id = $1
       ORDER BY n.id, ge.weight DESC`,
      [nId]
    );
    res.json({ neighbors: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/path?from=:userId&to=:userId ────────────────────────
// Camino más corto entre dos usuarios (BFS)
router.get('/path', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'Faltan parámetros from y to' });
    const path = await shortestPath(from, to);
    res.json({ path, distance: path ? path.length - 1 : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/centrality ─────────────────────────────────────────
// Top nodos por grado de centralidad
router.get('/centrality', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const result = await degreeCentrality(Number(limit));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/pagerank ────────────────────────────────────────────
// Influencia por PageRank de usuarios
router.get('/pagerank', async (req, res) => {
  try {
    const result = await pageRank();
    res.json(result.slice(0, 30));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/communities ────────────────────────────────────────
// Componentes conectados (comunidades de usuarios)
router.get('/communities', async (req, res) => {
  try {
    const components = await connectedComponents();
    res.json(components.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/stats ───────────────────────────────────────────────
// Resumen general del grafo
router.get('/stats', async (req, res) => {
  try {
    const [nodes, edges, types] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM graph_nodes`),
      pool.query(`SELECT COUNT(*) FROM graph_edges`),
      pool.query(`SELECT type, COUNT(*) FROM graph_nodes GROUP BY type ORDER BY count DESC`),
    ]);
    const [edgeTypes] = await Promise.all([
      pool.query(`SELECT edge_type, COUNT(*), SUM(weight) FROM graph_edges GROUP BY edge_type ORDER BY sum DESC`),
    ]);
    res.json({
      total_nodes: Number(nodes.rows[0].count),
      total_edges: Number(edges.rows[0].count),
      node_types: types.rows,
      edge_types: edgeTypes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/subgraph/:userId ───────────────────────────────────
// Sub-grafo del usuario: él + sus vecinos y las aristas entre ellos
router.get('/subgraph/:userId', async (req, res) => {
  try {
    const nodeRes = await pool.query(
      `SELECT id FROM graph_nodes WHERE type = 'user' AND entity_id = $1`,
      [req.params.userId]
    );
    if (!nodeRes.rows.length) return res.json({ nodes: [], edges: [] });
    const centerId = nodeRes.rows[0].id;

    // Nodos vecinos directos
    const neighborRes = await pool.query(
      `SELECT DISTINCT n.id, n.type, n.entity_id, n.label
       FROM graph_edges ge
       JOIN graph_nodes n ON (
         CASE WHEN ge.from_node_id = $1 THEN ge.to_node_id ELSE ge.from_node_id END = n.id
       )
       WHERE ge.from_node_id = $1 OR ge.to_node_id = $1`,
      [centerId]
    );

    const nodeIds = [centerId, ...neighborRes.rows.map((r) => r.id)];

    const centerNode = await pool.query(
      `SELECT id, type, entity_id, label FROM graph_nodes WHERE id = $1`,
      [centerId]
    );

    // Aristas entre ese conjunto de nodos
    const edgeRes = await pool.query(
      `SELECT ge.id, ge.edge_type, ge.weight,
              gf.entity_id AS from_entity, gf.type AS from_type, gf.label AS from_label,
              gt.entity_id AS to_entity, gt.type AS to_type, gt.label AS to_label
       FROM graph_edges ge
       JOIN graph_nodes gf ON gf.id = ge.from_node_id
       JOIN graph_nodes gt ON gt.id = ge.to_node_id
       WHERE ge.from_node_id = ANY($1) AND ge.to_node_id = ANY($1)`,
      [nodeIds]
    );

    res.json({
      nodes: [...centerNode.rows, ...neighborRes.rows],
      edges: edgeRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/graph/full ────────────────────────────────────────────────
// Grafo completo (nodos + aristas) para visualización (limitado a 300 nodos)
router.get('/full', async (req, res) => {
  try {
    const nodesRes = await pool.query(
      `SELECT n.id, n.type, n.entity_id, n.label,
              COUNT(DISTINCT e1.id) + COUNT(DISTINCT e2.id) AS degree
       FROM graph_nodes n
       LEFT JOIN graph_edges e1 ON e1.from_node_id = n.id
       LEFT JOIN graph_edges e2 ON e2.to_node_id = n.id
       GROUP BY n.id
       ORDER BY degree DESC
       LIMIT 300`
    );
    const nodeIds = nodesRes.rows.map((n) => n.id);
    const edgesRes = await pool.query(
      `SELECT ge.id, ge.edge_type, ge.weight,
              gf.id AS from_id, gf.entity_id AS from_entity, gf.type AS from_type, gf.label AS from_label,
              gt.id AS to_id, gt.entity_id AS to_entity, gt.type AS to_type, gt.label AS to_label
       FROM graph_edges ge
       JOIN graph_nodes gf ON gf.id = ge.from_node_id
       JOIN graph_nodes gt ON gt.id = ge.to_node_id
       WHERE ge.from_node_id = ANY($1) AND ge.to_node_id = ANY($1)
       ORDER BY ge.weight DESC
       LIMIT 600`,
      [nodeIds]
    );
    res.json({ nodes: nodesRes.rows, edges: edgesRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/graph/event ──────────────────────────────────────────────
// Emite una arista manualmente (acceso a módulo, acción personalizada)
router.post('/event', async (req, res) => {
  try {
    const { from_type, from_entity, from_label, to_type, to_entity, to_label, edge_type, weight } = req.body;
    if (!from_type || !from_entity || !to_type || !to_entity || !edge_type) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    await recordEdge(
      { type: from_type, entityId: from_entity, label: from_label || '' },
      { type: to_type, entityId: to_entity, label: to_label || '' },
      edge_type,
      Number(weight) || 1.0,
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/graph/sync ───────────────────────────────────────────────
// Re-sincroniza todo el grafo desde las tablas existentes
router.post('/sync', async (req, res) => {
  try {
    await syncFromTables();
    res.json({ ok: true, message: 'Grafo resincronizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
