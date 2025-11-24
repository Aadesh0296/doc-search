package com.aadesh.docsearch.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName = "documents")
public class DocumentEntity {

    @Id
    private String id;

    @Field(type = FieldType.Text)
    private String filename;

    @Field(type = FieldType.Text)
    private String content;

    @Field(type = FieldType.Object)
    private Map<String, String> metadata;

    @Field(type = FieldType.Keyword)
    private String fileType;

    @Field(type = FieldType.Date)
    private Instant uploadedAt;

    @Field(type = FieldType.Long)
    private Long size;

    @Field(type = FieldType.Keyword)
    private List<String> tags;

    private String downloadUrl;

    public DocumentEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }

    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public String getDownloadUrl() { return downloadUrl; }
    public void setDownloadUrl(String downloadUrl) { this.downloadUrl = downloadUrl; }
}
