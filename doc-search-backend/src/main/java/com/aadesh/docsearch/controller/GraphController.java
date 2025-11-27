package com.aadesh.docsearch.controller;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.aadesh.docsearch.model.DocumentEntity;

import java.util.*;

/**
 * Simple graph aggregation endpoint.
 * It searches documents by query q (or returns top documents if empty),
 * extracts keywords/tags and builds a small graph:
 * - document nodes (id -> filename)
 * - keyword nodes (tag or extracted token)
 * - edges (keyword -> document) with weight = frequency (1 if unknown)
 *
 * This is intentionally conservative and runs fast for interactive UI.
 */
@RestController
@RequestMapping("/api/search")
public class GraphController {

    private final ElasticsearchClient esClient;
    private final String indexName = "documents";

    public GraphController(ElasticsearchClient esClient) {
        this.esClient = esClient;
    }

    @GetMapping("/graph")
    public ResponseEntity<?> graph(@RequestParam(value = "q", required = false) String q,
                                   @RequestParam(value = "size", defaultValue = "30") int size) {
        try {
            // Query: if provided, use multi-match boolean prefix / simple match
            String queryText = (q == null) ? "" : q.trim();

            // Use simple multi-match; fall back to match_all
            co.elastic.clients.elasticsearch._types.query_dsl.Query query;
            if (queryText.isEmpty()) {
                query = co.elastic.clients.elasticsearch._types.query_dsl.Query.of(b -> b.matchAll(m -> m));
            } else {
                query = co.elastic.clients.elasticsearch._types.query_dsl.Query.of(m -> m.multiMatch(mm -> mm
                        .query(queryText)
                        .fields("filename^3", "tags^5", "content")
                        .type(co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType.BoolPrefix)
                ));
            }

            SearchResponse<DocumentEntity> resp = esClient.search(s -> s
                            .index(indexName)
                            .size(size)
                            .query(query),
                    DocumentEntity.class
            );

            // Build graph
            Map<String, Map<String, Object>> nodes = new LinkedHashMap<>();
            List<Map<String, Object>> edges = new ArrayList<>();

            for (Hit<DocumentEntity> hit : resp.hits().hits()) {
                DocumentEntity d = hit.source();
                if (d == null) continue;
                String docId = d.getId();
                if (docId == null) continue;

                // add doc node
                Map<String, Object> docNode = new HashMap<>();
                docNode.put("id", docId);
                docNode.put("label", d.getFilename() == null ? docId : d.getFilename());
                docNode.put("type", "document");
                docNode.put("meta", Map.of("size", d.getSize(), "uploadedAt", d.getUploadedAt()));
                nodes.put(docId, docNode);

                // tags -> keyword nodes
                List<String> tags = d.getTags();
                if (tags != null) {
                    for (String t : tags) {
                        if (t == null || t.trim().isEmpty()) continue;
                        String keyId = "kw:" + t.toLowerCase();
                        if (!nodes.containsKey(keyId)) {
                            Map<String, Object> kw = new HashMap<>();
                            kw.put("id", keyId);
                            kw.put("label", t);
                            kw.put("type", "keyword");
                            nodes.put(keyId, kw);
                        }
                        Map<String, Object> edge = Map.of(
                                "source", nodes.get(keyId).get("id"),
                                "target", docId,
                                "weight", 1
                        );
                        edges.add(edge);
                    }
                } else {
                    // fallback: extract top words from filename
                    String fn = d.getFilename() == null ? "" : d.getFilename();
                    for (String part : fn.split("[\\s_\\-/.]+")) {
                        if (part.length() < 3) continue;
                        String keyId = "kw:" + part.toLowerCase();
                        if (!nodes.containsKey(keyId)) {
                            Map<String, Object> kw = new HashMap<>();
                            kw.put("id", keyId);
                            kw.put("label", part);
                            kw.put("type", "keyword");
                            nodes.put(keyId, kw);
                        }
                        Map<String, Object> edge = Map.of(
                                "source", nodes.get(keyId).get("id"),
                                "target", docId,
                                "weight", 1
                        );
                        edges.add(edge);
                    }
                }
            }

            // Convert nodes map to list
            List<Map<String, Object>> nodeList = new ArrayList<>(nodes.values());

            Map<String, Object> result = Map.of(
                    "nodes", nodeList,
                    "edges", edges
            );

            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
