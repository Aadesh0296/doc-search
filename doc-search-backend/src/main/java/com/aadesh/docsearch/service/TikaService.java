package com.aadesh.docsearch.service;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.apache.tika.Tika;
import org.apache.tika.metadata.Metadata;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TikaService {
    private final Tika tika = new Tika();

    public ParsedResult parse(MultipartFile file) throws Exception {
        Metadata metadata = new Metadata();
        try (InputStream is = file.getInputStream()) {
            String text = tika.parseToString(is, metadata);
            Map<String, String> metaMap = new HashMap<>();
            for (String name : metadata.names()) {
                metaMap.put(name, metadata.get(name));
            }
            return new ParsedResult(text, metaMap);
        }
    }

    public static class ParsedResult {
        public final String text;
        public final Map<String, String> metadata;

        public ParsedResult(String text, Map<String, String> metadata) {
            this.text = text;
            this.metadata = metadata;
        }
    }
}
