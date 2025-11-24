package com.aadesh.docsearch.service;

import com.aadesh.docsearch.model.DocumentEntity;
import com.aadesh.docsearch.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class IndexService {

    private final DocumentRepository repo;
    private final TikaService tikaService;
    private final Path storageDir;
    private final int topKeywords;

    public IndexService(DocumentRepository repo, TikaService tikaService,
                        @Value("${file.storage-dir:./uploaded_files}") String storageDirPath,
                        @Value("${docsearch.top-keywords:10}") int topKeywords) {
        this.repo = repo;
        this.tikaService = tikaService;
        this.storageDir = Paths.get(storageDirPath);
        this.topKeywords = topKeywords;
        try {
            Files.createDirectories(this.storageDir);
        } catch (Exception e) {
            // ignore for now
        }
    }

    public DocumentEntity indexFile(MultipartFile file) throws Exception {
        String id = UUID.randomUUID().toString();
        String originalName = Objects.requireNonNull(file.getOriginalFilename());
        Path target = storageDir.resolve(id + "-" + originalName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        TikaService.ParsedResult parsed = tikaService.parse(file);
        String text = parsed.text == null ? "" : parsed.text;

        List<String> tags = extractTopKeywords(text, topKeywords);

        DocumentEntity doc = new DocumentEntity();
        doc.setId(id);
        doc.setFilename(originalName);
        doc.setContent(text);
        doc.setMetadata(parsed.metadata);
        doc.setFileType(getExtension(originalName));
        doc.setUploadedAt(Instant.now());
        doc.setSize(file.getSize());
        doc.setTags(tags);
        doc.setDownloadUrl("/api/files/download/" + target.getFileName().toString());

        return repo.save(doc);
    }

    private String getExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx >= 0 && idx < filename.length() - 1) return filename.substring(idx + 1).toLowerCase();
        return "";
    }

    private List<String> extractTopKeywords(String text, int topN) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        String cleaned = text.replaceAll("[^\\p{L}\\p{Nd}\\s]+", " ").toLowerCase();
        String[] tokens = cleaned.split("\\s+");
        Set<String> stopwords = getDefaultStopwords();
        Map<String, Integer> freq = new HashMap<>();
        for (String t : tokens) {
            if (t.length() <= 2) continue;
            if (stopwords.contains(t)) continue;
            freq.put(t, freq.getOrDefault(t, 0) + 1);
        }
        return freq.entrySet().stream()
                .sorted((e1, e2) -> Integer.compare(e2.getValue(), e1.getValue()))
                .limit(topN)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private Set<String> getDefaultStopwords() {
        return Set.of("the","and","for","that","this","with","from","have","are","was","were","their","which","when","what","where","how","not","but","you","your","can","will","our","they","all","any","has","had","been","its","also");
    }
}
