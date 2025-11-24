package com.aadesh.docsearch.controller;

import com.aadesh.docsearch.model.DocumentEntity;
import com.aadesh.docsearch.repository.DocumentRepository;
import com.aadesh.docsearch.service.IndexService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final IndexService indexService;
    private final DocumentRepository repo;
    @Value("${file.storage-dir:./uploaded_files}")
    private String storageDir;

    public FileController(IndexService indexService, DocumentRepository repo) {
        this.indexService = indexService;
        this.repo = repo;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) return ResponseEntity.badRequest().body("No file uploaded");
            long maxBytes = (long) (50 * 1024 * 1024); // align with app props
            if (file.getSize() > maxBytes) return ResponseEntity.status(413).body("File too large");
            DocumentEntity saved = indexService.indexFile(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<Resource> download(@PathVariable String filename) {
        try {
            Path file = Paths.get(storageDir).resolve(filename);
            Resource resource = new PathResource(file.toAbsolutePath());
            if (!resource.exists()) return ResponseEntity.notFound().build();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentDisposition(ContentDisposition.builder("attachment").filename(resource.getFilename()).build());
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(resource.contentLength())
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDoc(@PathVariable String id) {
        Optional<DocumentEntity> doc = repo.findById(id);
        return doc.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
