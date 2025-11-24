package com.aadesh.docsearch.controller;

import com.aadesh.docsearch.model.DocumentEntity;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final ElasticsearchOperations operations;

    public SearchController(ElasticsearchOperations operations) {
        this.operations = operations;
    }

    @GetMapping
    public ResponseEntity<?> search(@RequestParam("q") String q,
                                    @RequestParam(value = "page", defaultValue = "0") int page,
                                    @RequestParam(value = "size", defaultValue = "10") int size) {

        if (q == null || q.isBlank()) return ResponseEntity.badRequest().body("Query required");

        Query multiMatchQuery = QueryBuilders.multiMatch(m -> m
                .query(q)
                .fields("content", "filename")
                .type(co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType.BestFields)
        );

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(multiMatchQuery)
                .withPageable(PageRequest.of(page, size))
                .build();

        SearchHits<DocumentEntity> hits = operations.search(nativeQuery, DocumentEntity.class);

        List<Map<String, Object>> results = hits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .map(d -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", d.getId());
                    map.put("filename", d.getFilename());
                    map.put("tags", d.getTags());
                    map.put("uploadedAt", d.getUploadedAt());
                    String snippet = d.getContent() == null ? "" : d.getContent().substring(0, Math.min(250, d.getContent().length()));
                    map.put("snippet", snippet);
                    map.put("downloadUrl", d.getDownloadUrl());
                    return map;
                })
                .collect(Collectors.toList());

        // compute related keywords safely
        Map<String, Integer> tagCount = new HashMap<>();
        for (Map<String, Object> r : results) {
            Object tagsObj = r.get("tags");
            if (tagsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<String> tags = (List<String>) tagsObj;
                for (String t : tags) tagCount.put(t, tagCount.getOrDefault(t, 0) + 1);
            }
        }

        List<Map<String,Object>> topTags = tagCount.entrySet().stream()
                .sorted((e1,e2)->Integer.compare(e2.getValue(), e1.getValue()))
                .limit(10)
                .map(e -> {
                    Map<String,Object> m = new HashMap<>();
                    m.put("keyword", e.getKey());
                    m.put("score", e.getValue());
                    return m;
                }).collect(Collectors.toList());

        // Build graph
        List<Map<String,Object>> nodes = new ArrayList<>();
        Set<String> includedTags = topTags.stream().map(m -> (String)m.get("keyword")).collect(Collectors.toSet());
        for (String tag : includedTags) {
            Map<String,Object> n = new HashMap<>();
            n.put("id", tag);
            n.put("label", tag);
            n.put("type", "keyword");
            nodes.add(n);
        }
        for (Map<String,Object> r : results) {
            Map<String,Object> n = new HashMap<>();
            n.put("id", String.valueOf(r.get("id")));
            n.put("label", String.valueOf(r.get("filename")));
            n.put("type", "document");
            nodes.add(n);
        }
        List<Map<String,Object>> edges = new ArrayList<>();
        for (Map<String,Object> r : results) {
            String docId = String.valueOf(r.get("id"));
            Object tagsObj = r.get("tags");
            if (!(tagsObj instanceof List)) continue;
            @SuppressWarnings("unchecked")
            List<String> tags = (List<String>) tagsObj;
            for (String t : tags) {
                if (!includedTags.contains(t)) continue;
                Map<String,Object> e = new HashMap<>();
                e.put("source", t);
                e.put("target", docId);
                e.put("weight", 1);
                edges.add(e);
            }
        }

        Map<String,Object> response = new HashMap<>();
        response.put("total", hits.getTotalHits());
        response.put("page", page);
        response.put("size", size);
        response.put("results", results);
        response.put("relatedKeywords", topTags);
        Map<String,Object> graph = new HashMap<>();
        graph.put("nodes", nodes);
        graph.put("edges", edges);
        response.put("graph", graph);

        return ResponseEntity.ok(response);
    }
}
