// import React, { useMemo } from "react";
// import CytoscapeComponent from "react-cytoscapejs";

// export default function GraphView({ graph }) {
//   const elements = useMemo(() => {
//     if (!graph) return [];
//     const nodes = (graph.nodes || []).map((n) => ({
//       data: { id: n.id, label: n.label, type: n.type },
//     }));
//     const edges = (graph.edges || []).map((e, i) => ({
//       data: { id: "e" + i, source: e.source, target: e.target },
//     }));
//     return [...nodes, ...edges];
//   }, [graph]);

//   const style = [
//     {
//       selector: 'node[type="keyword"]',
//       style: {
//         "background-color": "#FFD166",
//         label: "data(label)",
//         "text-valign": "center",
//         "text-halign": "center",
//       },
//     },
//     {
//       selector: 'node[type="document"]',
//       style: {
//         "background-color": "#6C5CE7",
//         label: "data(label)",
//         shape: "roundrectangle",
//         width: 140,
//       },
//     },
//     { selector: "edge", style: { width: 2, "line-color": "#E5E7EB" } },
//   ];

//   return (
//     <div className="w-full h-full rounded-lg overflow-hidden bg-white">
//       <CytoscapeComponent
//         elements={elements}
//         stylesheet={style}
//         style={{ width: "100%", height: "100%" }}
//         layout={{ name: "cose" }}
//       />
//     </div>
//   );
// }

import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import cola from "cytoscape-cola";
import coseBilkent from "cytoscape-cose-bilkent";
import axios from "axios";
import {
  Save,
  ZoomIn,
  ZoomOut,
  Search as SearchIcon,
  RefreshCw,
} from "lucide-react";

cytoscape.use(dagre);
cytoscape.use(cola);
cytoscape.use(coseBilkent);

/**
 * GraphView
 * Props:
 *  - query (string) optional: fetch graph for this query
 *  - onNodeClick(node) : callback when a node is clicked (document node -> emit id or keyword)
 */
export default function GraphView({ query = "", onNodeClick }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtered, setFiltered] = useState(false);

  useEffect(() => {
    // init cytoscape once
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: "node[type='document']",
          style: {
            shape: "roundrectangle",
            "background-color": "#2563eb",
            color: "#fff",
            "text-wrap": "wrap",
            "text-max-width": 160,
            label: "data(label)",
            "font-size": 11,
            "text-valign": "center",
            "text-halign": "center",
            "padding-left": 8,
            "padding-right": 8,
            "padding-top": 6,
            "padding-bottom": 6,
            "border-width": 0,
            width: "label",
          },
        },
        {
          selector: "node[type='keyword']",
          style: {
            shape: "ellipse",
            "background-color": "#f59e0b",
            color: "#0f172a",
            label: "data(label)",
            "font-size": 12,
            "text-valign": "center",
            "text-halign": "center",
            width: "label",
            "padding-left": 6,
            "padding-right": 6,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "none",
            "line-color": "#cbd5e1",
            width: "mapData(weight, 1, 10, 1, 4)",
          },
        },
        {
          selector: ".dim",
          style: {
            opacity: 0.12,
          },
        },
        {
          selector: ".highlight",
          style: {
            "overlay-opacity": 0,
            "background-color": "#ef4444",
            "line-color": "#ef4444",
            "transition-property": "background-color,line-color",
            "transition-duration": "200ms",
          },
        },
      ],
      layout: {
        name: "cola",
        animate: true,
        randomize: false,
        maxSimulationTime: 1500,
      },
    });

    // basic interactions
    cy.on("tap", "node", (e) => {
      const n = e.target;
      // pulse
      n.flash = n
        .animation({ style: { "background-color": "#ef4444" }, duration: 240 })
        .play();
      if (onNodeClick) {
        const d = n.data();
        onNodeClick(d);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch graph whenever query changes
  useEffect(() => {
    fetchGraph(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function fetchGraph(q) {
    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_BASE || "http://localhost:5001";
      const res = await axios.get(`${base}/api/search/graph`, {
        params: { q: q || "", size: 40 },
      });
      const payload = res.data;
      setGraphData(payload);
      renderGraph(payload);
    } catch (err) {
      console.error("graph fetch error", err);
    } finally {
      setLoading(false);
    }
  }

  function renderGraph({ nodes = [], edges = [] }) {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().remove();

    // convert to cytoscape elements
    const eles = [];
    for (const n of nodes) {
      eles.push({
        data: { id: n.id, label: n.label, type: n.type, meta: n.meta || {} },
      });
    }
    for (const e of edges) {
      // ensure source/target exist
      if (!e.source || !e.target) continue;
      eles.push({
        data: {
          id: `${e.source}--${e.target}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          source: e.source,
          target: e.target,
          weight: e.weight || 1,
        },
      });
    }

    cy.add(eles);

    // layout: try dagre for readability first, fallback to cose-bilkent for large graphs
    const nodeCount = nodes.length;
    if (nodeCount <= 40) {
      cy.layout({
        name: "dagre",
        animate: true,
        nodeSep: 20,
        edgeSep: 10,
      }).run();
    } else {
      cy.layout({ name: "cose-bilkent", animate: true }).run();
    }

    // fit with padding
    cy.fit(30);

    // hover tooltips (simple)
    cy.nodes().forEach((n) => {
      n.on("mouseover", () => {
        n.addClass("highlight");
      });
      n.on("mouseout", () => {
        n.removeClass("highlight");
      });
    });

    // double click to isolate node
    cy.on("dblclick", "node", (e) => {
      const n = e.target;
      isolateNode(n);
    });
  }

  function isolateNode(node) {
    const cy = cyRef.current;
    if (!cy) return;
    const nid = node.id();
    const neighbors = node.closedNeighborhood().map((x) => x.id());
    cy.elements().addClass("dim");
    cy.elements()
      .filter((ele) => neighbors.includes(ele.id()))
      .removeClass("dim");
    setFiltered(true);
  }

  function resetFilter() {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass("dim");
    setFiltered(false);
  }

  function exportPng() {
    const cy = cyRef.current;
    if (!cy) return;
    const png = cy.png({ full: true, scale: 2 });
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${png}" />`);
    } else {
      // fallback: download
      const a = document.createElement("a");
      a.href = png;
      a.download = "graph.png";
      a.click();
    }
  }

  function zoomIn() {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: cy.zoom() * 1.2,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  }
  function zoomOut() {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: cy.zoom() / 1.2,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  }

  function findNodeByLabel(text) {
    if (!graphData) return;
    const cy = cyRef.current;
    if (!cy) return;
    const term = (text || "").toLowerCase();
    if (!term) return;
    const found = cy
      .nodes()
      .filter((n) => (n.data("label") || "").toLowerCase().includes(term));
    if (found.length > 0) {
      cy.animate({ center: { eles: found }, zoom: 1.6, duration: 400 });
      found.ungrabify();
      found.flash = found
        .animation({ style: { "background-color": "#10b981" }, duration: 300 })
        .play();
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Find node (keyword or filename)..."
          className="px-3 py-2 border rounded flex-1"
        />
        <button
          className="px-2 py-1 border rounded"
          onClick={() => findNodeByLabel(searchTerm)}
          title="Find node"
        >
          <SearchIcon size={16} />
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={zoomIn}
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={zoomOut}
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          className="px-2 py-1 border rounded"
          onClick={resetFilter}
          title="Reset filter"
        >
          <RefreshCw size={16} />
        </button>
        <button
          className="px-2 py-1 bg-accent text-white rounded"
          onClick={exportPng}
          title="Export PNG"
        >
          <Save size={14} />
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "320px",
          borderRadius: 12,
          border: "1px solid #000",
          backgroundColor: "#fff",
        }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/120 p-3 rounded shadow">Loading graph…</div>
        </div>
      )}
    </div>
  );
}