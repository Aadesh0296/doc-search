package com.aadesh.docsearch.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.aadesh.docsearch.repository")
public class ElasticsearchConfig {
    // placeholder if you need custom client beans later
}
