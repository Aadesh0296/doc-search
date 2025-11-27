# 📘 DocSearch

**Document-First Knowledge Graph Search Engine**  
Full-text semantic search + keyword graph + document ingestion pipeline.

Built with **Spring Boot + Elasticsearch + React (Vite)**.

---

## 🚀 Features

### ✅ Document Upload & Parsing
- Upload **PDF, DOCX, PPTX, TXT**
- Extract text using **Apache Tika**
- Automatic keyword extraction & tagging

### 🔍 Full-Text Search
- Modern **Elasticsearch 8.x** powered search
- Highlighting + scoring
- Filters: file type, tags, date range

### 🧠 Knowledge Graph
- Auto-generated relationships: **keywords ↔ documents**
- Interactive graph visualization (**Cytoscape.js**)

### 🎯 Autocomplete Suggestions
- Instant search suggestions (documents + tags)

### 🖥️ Clean Modern Frontend
- **TailwindCSS**
- Vite + React for smooth UI & animations

---

## 🏗️ Tech Stack

### Backend
- Java 17  
- Spring Boot 3.4.12  
- Spring Data Elasticsearch  
- Apache Tika  
- Maven  

### Search Engine
- Elasticsearch 8.14.1 (Docker recommended)

### Frontend
- React + Vite  
- TailwindCSS  
- Cytoscape.js  
- Axios  

---

## 📁 Repository Structure

📁 Repository Structure
doc-search/
├── doc-search-backend/
│   ├── src/main/java/com/aadesh/docsearch/
│   ├── src/main/resources/
│   └── pom.xml
├── doc-search-frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md


---

## 📦 Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| Node | 18+ |
| npm | latest |
| Docker Desktop | Recommended |
| Elasticsearch | 8.x |

---

## 🐳 Start Elasticsearch (Docker)

```bash
docker run --name es-dev -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms1g -Xmx1g" \
  -v esdata:/usr/share/elasticsearch/data \
  --ulimit memlock=-1:-1 \
  --restart unless-stopped \
  docker.elastic.co/elasticsearch/elasticsearch:8.14.1

```

Verify:
```
curl http://localhost:9200/
```

## ⚙️ Backend Setup
Run the backend
```
cd doc-search-backend
mvn spring-boot:run
```

Backend runs at:
👉 http://localhost:5001

## application.properties
server.port=5001

spring.elasticsearch.uris=http://localhost:9200

file.storage-dir=./uploaded_files

file.max-size-mb=100

## 🌐 Frontend Setup (React + Vite)
```
Install & start
cd doc-search-frontend
npm install
npm run dev
```

Runs at:
👉 http://localhost:3000

Optional .env:
VITE_API_BASE=http://localhost:5001

## 🔥 API Reference

### ▶ Upload File

**POST** `/api/files/upload`

Content-Type: `multipart/form-data`  
Field: `file`

**Response**
```json
{
  "id": "83b5c6a9-....",
  "filename": "sample.pdf",
  "fileType": "pdf",
  "size": 123400,
  "uploadedAt": "2025-11-24T11:38:31.463Z",
  "tags": ["java", "programming"],
  "downloadUrl": "/api/files/download/83b5..."
}
```

### ▶ Full Search (v2)

**GET** `/api/search/v2?q=neural+network&page=0&size=10`

**Response**:
```json
{
  "total": 10,
  "results": [...],
  "graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### ▶ Suggestions

**GET** `/api/search/suggest?q=jav&limit=8`

**Response:**
```json
{ "suggestions": ["java","javanotes.pdf"] }
```

### ▶ Graph

**GET** `/api/search/graph?q=ai&size=30`

## 🧩 Document Model
public class DocumentEntity {
    String id;
    String filename;
    String fileType;
    long size;
    Instant uploadedAt;
    List<String> tags;
    String content;
    Map<String,Object> metadata;
    String downloadUrl;
}

## 🛠️ Troubleshooting
| Issue                         | Fix                                                 |
| ----------------------------- | --------------------------------------------------- |
| Elasticsearch decoding errors | Register JavaTimeModule                             |
| Connection refused            | Ensure ES on 9200, check config                     |
| CORS issues                   | Vite dev handles automatically; configure on deploy |


## 🚚 Deployment Suggestions
Backend

Use Docker + Jib

Host on Render / Railway / AWS ECS

Use Elastic Cloud for managed Elasticsearch

Frontend

Deploy Vite build output on

Netlify

Vercel

Cloudflare Pages

## 📄 License

MIT License

## 👨‍💻 Author

**Aadesh Sachin Lawange**  
Senior Software Developer  

📧 Email: [aadesh.lawange123@gmail.com](mailto:aadesh.lawange123@gmail.com)  
📍 Pune, MH, India  

GitHub: [github.com/Aadesh0296](https://github.com/Aadesh0296)  
LinkedIn: [linkedin.com/in/aadeshlawange](https://linkedin.com/in/aadeshlawange)
