package com.aadesh.docsearch.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ElasticsearchConfig {

    @Value("${spring.data.elasticsearch.client.endpoints:localhost:9200}")
    private String endpoints;

    @Bean
    public ElasticsearchClient elasticsearchClient() {
        // parse first host:port
        String first = endpoints.split(",")[0].trim();
        String host = first;
        int port = 9200;
        if (first.contains(":")) {
            String[] parts = first.split(":");
            host = parts[0];
            try { port = Integer.parseInt(parts[1]); } catch (Exception ignored) {}
        }

        // Create RestClient
        RestClient restClient = RestClient.builder(new HttpHost(host, port)).build();

        // Create ObjectMapper and register JavaTimeModule and tolerant settings
        ObjectMapper mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                // optional: write dates as ISO strings if you ever serialize
                // .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
                ;

        // Create JacksonJsonpMapper from the configured ObjectMapper
        JacksonJsonpMapper jsonpMapper = new JacksonJsonpMapper(mapper);

        RestClientTransport transport = new RestClientTransport(restClient, jsonpMapper);
        return new ElasticsearchClient(transport);
    }
}
