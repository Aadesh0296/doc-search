import React from "react";
import CytoscapeComponent from "react-cytoscapejs";

export default function Graph({ graph }) {
  const elements = [];
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];

  nodes.forEach((n) =>
    elements.push({ data: { id: n.id, label: n.label, type: n.type } })
  );
  edges.forEach((e, i) =>
    elements.push({ data: { id: `e${i}`, source: e.source, target: e.target } })
  );

  const style = [
    {
      selector: 'node[type="keyword"]',
      style: {
        "background-color": "#FFB84D",
        label: "data(label)",
        width: 40,
        height: 40,
      },
    },
    {
      selector: 'node[type="document"]',
      style: {
        "background-color": "#6FB1FC",
        label: "data(label)",
        width: 120,
        height: 30,
        "text-valign": "center",
      },
    },
    { selector: "edge", style: { width: 2, "line-color": "#ccc" } },
  ];

  return (
    <div style={{ width: "100%", height: 500 }}>
      <CytoscapeComponent
        elements={elements}
        stylesheet={style}
        style={{ width: "100%", height: "100%" }}
        layout={{ name: "cose" }}
      />
    </div>
  );
}
