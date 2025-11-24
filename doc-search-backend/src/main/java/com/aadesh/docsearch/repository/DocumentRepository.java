package com.aadesh.docsearch.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import com.aadesh.docsearch.model.DocumentEntity;

@Repository
public interface DocumentRepository extends ElasticsearchRepository<DocumentEntity, String> {
    // Custom queries here if needed
}