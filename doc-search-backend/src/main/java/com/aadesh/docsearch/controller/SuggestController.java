package com.aadesh.docsearch.controller;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import com.aadesh.docsearch.model.DocumentEntity;

@RestController
@RequestMapping("/api/search")
public class SuggestController {

    private final ElasticsearchClient esClient;
    private final String indexName = "documents";

    public SuggestController(ElasticsearchClient esClient) {
        this.esClient = esClient;
    }

    /**
     * Suggest endpoint: returns up to `limit` suggestions for the given query prefix.
     * Suggestions are gathered from filename and tags fields.
     */
    @GetMapping("/suggest")
    public ResponseEntity<?> suggest(@RequestParam("q") String q,
                                     @RequestParam(value = "limit", defaultValue = "8") int limit) {
        try {
            if (q == null || q.trim().isEmpty()) {
                return ResponseEntity.ok(Map.of("suggestions", Collections.emptyList()));
            }
            String query = q.trim();

            // Use bool_prefix (good for autocompletion) on filename, tags and content as fallback
            Query multi = Query.of(m -> m.multiMatch(mm -> mm
                    .query(query)
                    .type(TextQueryType.BoolPrefix)
                    .fields("filename^3", "tags^5", "content")
            ));

            SearchResponse<DocumentEntity> resp = esClient.search(s -> s
                    .index(indexName)
                    .size(50) // get some hits to extract suggestions from
                    .query(multi),
                DocumentEntity.class
            );

            // collect candidate suggestions
            LinkedHashSet<String> suggestions = new LinkedHashSet<>();
            String qLower = query.toLowerCase();

            for (Hit<DocumentEntity> hit : resp.hits().hits()) {
                DocumentEntity d = hit.source();
                if (d == null) continue;

                // filename suggestion: if starts with prefix OR contains word starting with prefix
                String fn = d.getFilename();
                if (fn != null) {
                    String fnLower = fn.toLowerCase();
                    if (fnLower.startsWith(qLower)) {
                        suggestions.add(fn);
                    } else {
                        // try split words
                        for (String part : fn.split("[\\s_\\-/.]+")) {
                            if (part.toLowerCase().startsWith(qLower)) {
                                suggestions.add(fn);
                                break;
                            }
                        }
                    }
                }

                // tags suggestion: include tags that start with prefix
                List<String> tags = d.getTags();
                if (tags != null) {
                    for (String t : tags) {
                        if (t == null) continue;
                        if (t.toLowerCase().startsWith(qLower)) {
                            suggestions.add(t);
                        }
                    }
                }

                // optional: extract significant tokens from content (very light)
                if (suggestions.size() >= limit) break;
            }

            // If we still have few suggestions, try to include hits' filenames (partial matches)
            if (suggestions.size() < limit) {
                for (Hit<DocumentEntity> hit : resp.hits().hits()) {
                    DocumentEntity d = hit.source();
                    if (d == null) continue;
                    if (d.getFilename() != null && suggestions.size() < limit) suggestions.add(d.getFilename());
                }
            }

            List<String> out = new ArrayList<>(suggestions);
            if (out.size() > limit) out = out.subList(0, limit);

            return ResponseEntity.ok(Map.of("suggestions", out));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
