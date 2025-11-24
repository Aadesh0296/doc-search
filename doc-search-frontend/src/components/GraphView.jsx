import React, { useMemo } from "react";
import CytoscapeComponent from "react-cytoscapejs";

export default function GraphView({ graph }) {
  const elements = useMemo(() => {
    if (!graph) return [];
    const nodes = (graph.nodes || []).map((n) => ({
      data: { id: n.id, label: n.label, type: n.type },
    }));
    const edges = (graph.edges || []).map((e, i) => ({
      data: { id: "e" + i, source: e.source, target: e.target },
    }));
    return [...nodes, ...edges];
  }, [graph]);

  const style = [
    {
      selector: 'node[type="keyword"]',
      style: {
        "background-color": "#FFD166",
        label: "data(label)",
        "text-valign": "center",
        "text-halign": "center",
      },
    },
    {
      selector: 'node[type="document"]',
      style: {
        "background-color": "#6C5CE7",
        label: "data(label)",
        shape: "roundrectangle",
        width: 140,
      },
    },
    { selector: "edge", style: { width: 2, "line-color": "#E5E7EB" } },
  ];

  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-white">
      <CytoscapeComponent
        elements={elements}
        stylesheet={style}
        style={{ width: "100%", height: "100%" }}
        layout={{ name: "cose" }}
      />
    </div>
  );
}
