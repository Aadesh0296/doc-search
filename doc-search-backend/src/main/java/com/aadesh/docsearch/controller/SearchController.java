package com.aadesh.docsearch.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aadesh.docsearch.model.DocumentEntity;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.HighlightField;
import co.elastic.clients.elasticsearch.core.search.Hit;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final ElasticsearchOperations operations;
    private final ElasticsearchClient esClient;

    public SearchController(ElasticsearchOperations operations, ElasticsearchClient esClient) {
        this.operations = operations;
        this.esClient = esClient;
    }

    // existing lightweight search (keeps backward compatibility)
    @GetMapping
    public ResponseEntity<?> search(@RequestParam("q") String q,
                                    @RequestParam(value = "page", defaultValue = "0") int page,
                                    @RequestParam(value = "size", defaultValue = "10") int size) {
        if (q == null || q.isBlank()) return ResponseEntity.badRequest().body("Query required");

        Query multiMatchQuery = QueryBuilders.multiMatch(m -> m
                .query(q)
                .fields("content", "filename")
                .type(TextQueryType.BestFields)
        );

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(multiMatchQuery)
                .withPageable(PageRequest.of(page, size))
                .build();

        SearchHits<DocumentEntity> hits = operations.search(nativeQuery, DocumentEntity.class);

        List<Map<String, Object>> results = hits.getSearchHits().stream()
                .map(sh -> {
                    DocumentEntity d = sh.getContent();
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", d.getId());
                    map.put("filename", d.getFilename());
                    map.put("tags", d.getTags());
                    map.put("uploadedAt", d.getUploadedAt());
                    String snippet = d.getContent() == null ? "" : d.getContent().substring(0, Math.min(250, d.getContent().length()));
                    map.put("snippet", snippet);
                    map.put("downloadUrl", d.getDownloadUrl());
                    return map;
                }).toList();

        Map<String, Object> resp = new HashMap<>();
        resp.put("total", hits.getTotalHits());
        resp.put("page", page);
        resp.put("size", size);
        resp.put("results", results);
        return ResponseEntity.ok(resp);
    }

    // NEW: ES-client search with highlighting and snippet prioritization
    @GetMapping("/v2")
    public ResponseEntity<?> searchV2(@RequestParam("q") String q,
                                      @RequestParam(value = "page", defaultValue = "0") int page,
                                      @RequestParam(value = "size", defaultValue = "10") int size) {
        if (q == null || q.isBlank()) return ResponseEntity.badRequest().body("Query required");

        try {
            SearchResponse<DocumentEntity> resp = esClient.search(s -> s
                            .index("documents")
                            .from(page * size)
                            .size(size)
                            .query(qb -> qb
                                    .multiMatch(mm -> mm
                                            .query(q)
                                            .fields("content", "filename")
                                            .type(TextQueryType.BestFields)
                                    )
                            )
                            .highlight(h -> h
                            		.preTags("<mark>")
                            		.postTags("</mark>")
                                    .fields("content", HighlightField.of(hf -> hf.fragmentSize(250).numberOfFragments(3)))
                                    .fields("filename", HighlightField.of(hf -> hf.fragmentSize(150).numberOfFragments(1)))
                            ),
                    DocumentEntity.class
            );

            long total = resp.hits().total() != null ? resp.hits().total().value() : resp.hits().hits().size();
            List<Map<String, Object>> results = new ArrayList<>();

            for (Hit<DocumentEntity> hit : resp.hits().hits()) {
                DocumentEntity d = hit.source();
                Map<String, Object> r = new HashMap<>();
                r.put("id", d.getId());
                r.put("filename", d.getFilename());
                r.put("tags", d.getTags());
                r.put("uploadedAt", d.getUploadedAt());
                r.put("downloadUrl", d.getDownloadUrl());
                r.put("score", hit.score());

                // collect highlights (prefer content highlight; fallback to filename; fallback to stored snippet)
                List<String> highlights = new ArrayList<>();
                if (hit.highlight() != null) {
                    hit.highlight().forEach((field, frags) -> {
                        if (frags != null) highlights.addAll(frags);
                    });
                }

                String snippet = null;
                if (!highlights.isEmpty()) {
                    // pick the first highlight as snippet
                    snippet = highlights.get(0);
                } else if (d.getContent() != null && !d.getContent().isBlank()) {
                    snippet = d.getContent().substring(0, Math.min(250, d.getContent().length()));
                } else snippet = "";

                r.put("snippet", snippet);
                r.put("highlights", highlights);
                results.add(r);
            }

            Map<String, Object> out = new HashMap<>();
            out.put("total", total);
            out.put("page", page);
            out.put("size", size);
            out.put("results", results);
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
