# Shared Types & Data Structures

This directory contains TypeScript types and data structures that are shared between the React frontend and Python backend for the PDF Redactor application.

## Overview

The shared types ensure consistency between:
- **Frontend**: React components and API calls
- **Backend**: FastAPI endpoints and data models
- **Database**: ClickHouse schema and data structures

## Core Data Types

### PDF Processing Types
```typescript
interface PDFUpload {
    id: string;
    filename: string;
    uploadDate: string;
    status: 'processing' | 'complete' | 'completed' | 'failed';
    size: string;
    pages: number;
    emails?: string[];
    ssns?: string[];
    processingTime?: number;
    textLength?: number;
    // Redaction fields
    redactionApplied?: boolean;
    redactedFileAvailable?: boolean;
    totalRedactions?: number;
}

interface FindingsData {
    total_pdfs_processed: number;
    total_pii_items: number;
    success_rate: number;
    avg_processing_time: number;
    p95_processing_time: number;
    pii_types: {
        emails: number;
        ssns: number;
    };
    processing_trends: Array<{
        date: string;
        uploads: number;
        avg_time: number;
    }>;
    recent_uploads: Array<{
        upload_id: string;
        filename: string;
        upload_date: string;
        status: string;
        email_count: number;
        ssn_count: number;
        processing_time: number;
        redaction_applied?: boolean;
        redacted_file_available?: boolean;
        total_redactions?: number;
    }>;
}
```

### Processing Status Types
```typescript
type ProcessingStatus = 'uploading' | 'uploaded' | 'processing' | 'complete' | 'failed';

interface ServerStatus {
    status: string;
    message: string;
    server: string;
    version: string;
}

interface ServerInfo {
    status: string;
    server: string;
    port: number;
    endpoints: string[];
    capabilities: string[];
}
```

## Database Schema Mapping

### ClickHouse Schema
```sql
CREATE TABLE pdf_uploads (
    upload_id String,
    filename String,
    file_path String,
    file_size UInt64,
    upload_date DateTime,
    processing_date Nullable(DateTime),
    status String,
    pages_processed UInt32,
    text_length UInt32,
    processing_time Float32,
    emails Array(String),
    ssns Array(String),
    error_message Nullable(String),
    redaction_applied UInt8 DEFAULT 0,
    redacted_file_available UInt8 DEFAULT 0,
    total_redactions UInt32 DEFAULT 0,
    redacted_file_path Nullable(String)
) ENGINE = MergeTree()
ORDER BY (upload_id, upload_date);
```

### Type Mapping
| Database Field | TypeScript Type | Description |
|----------------|-----------------|-------------|
| `upload_id` | `string` | Unique identifier for each upload |
| `filename` | `string` | Original filename |
| `file_size` | `number` | File size in bytes |
| `upload_date` | `string` | ISO timestamp |
| `status` | `ProcessingStatus` | Processing status enum |
| `pages_processed` | `number` | Number of PDF pages |
| `processing_time` | `number` | Processing time in seconds |
| `emails` | `string[]` | Array of detected emails (masked) |
| `ssns` | `string[]` | Array of detected SSNs (masked) |
| `redaction_applied` | `boolean` | Whether redaction was performed |
| `redacted_file_available` | `boolean` | Whether redacted file exists |
| `total_redactions` | `number` | Number of PII items redacted |

## API Response Types

### Upload History Response
```typescript
interface UploadHistoryResponse {
    uploads: PDFUpload[];
    total_count: number;
}
```

### Processing Response
```typescript
interface PDFProcessingResponse {
    upload_id: string;
    status: string;
    emails: string[];
    ssns: string[];
    text_length: number;
    pages_processed: number;
    processing_time: number;
    error?: string;
}
```

### Analytics Response
```typescript
interface FindingsResponse {
    total_pdfs_processed: number;
    total_pii_items: number;
    success_rate: number;
    avg_processing_time: number;
    p95_processing_time: number;
    pii_types: {
        emails: number;
        ssns: number;
    };
    processing_trends: Array<{
        date: string;
        uploads: number;
        avg_time: number;
    }>;
    recent_uploads: Array<{
        upload_id: string;
        filename: string;
        upload_date: string;
        status: string;
        email_count: number;
        ssn_count: number;
        processing_time: number;
        redaction_applied?: boolean;
        redacted_file_available?: boolean;
        total_redactions?: number;
    }>;
}
```

## Usage Examples

### Frontend (React)
```typescript
import { PDFUpload, FindingsData } from '../../shared/types';

const PDFPage: React.FC = () => {
    const [uploads, setUploads] = useState<PDFUpload[]>([]);
    const [findings, setFindings] = useState<FindingsData | null>(null);
    
    const fetchUploadHistory = async () => {
        const response = await fetch('/api/upload-history');
        const data: UploadHistoryResponse = await response.json();
        setUploads(data.uploads);
    };
    
    const fetchAnalytics = async () => {
        const response = await fetch('/api/findings');
        const data: FindingsData = await response.json();
        setFindings(data);
    };
    
    return (
        // Component JSX using typed data
    );
};
```

### Backend (Python with Type Hints)
```python
from typing import List, Optional
from pydantic import BaseModel

class PDFUpload(BaseModel):
    id: str
    filename: str
    upload_date: str
    status: str
    size: str
    pages: int
    emails: Optional[List[str]] = []
    ssns: Optional[List[str]] = []
    processing_time: Optional[float] = None
    redaction_applied: Optional[bool] = False
    redacted_file_available: Optional[bool] = False
    total_redactions: Optional[int] = 0

class FindingsData(BaseModel):
    total_pdfs_processed: int
    total_pii_items: int
    success_rate: float
    avg_processing_time: float
    p95_processing_time: float
    pii_types: dict
    processing_trends: List[dict]
    recent_uploads: List[dict]
```

## Data Flow Integration

### 1. Upload Process
```typescript
// Frontend uploads PDF
const uploadPDF = async (file: File): Promise<PDFUpload> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
};
```

### 2. Analytics Dashboard
```typescript
// Frontend fetches analytics
const fetchAnalytics = async (): Promise<FindingsData> => {
    const response = await fetch('/api/findings');
    return await response.json();
};
```

### 3. Download Management
```typescript
// Frontend downloads files
const downloadPDF = async (uploadId: string, filename: string) => {
    const response = await fetch(`/api/download-pdf/${uploadId}`);
    const blob = await response.blob();
    // Handle download...
};

const downloadRedactedPDF = async (uploadId: string, filename: string) => {
    const response = await fetch(`/api/download-redacted-pdf/${uploadId}`);
    const blob = await response.blob();
    // Handle download...
};
```

## Benefits

1. **Type Safety**: Ensures consistent data structures across frontend and backend
2. **Single Source of Truth**: Changes to types are reflected everywhere
3. **Better IDE Support**: Autocomplete and error checking for API responses
4. **Collaboration**: Multiple developers can work with the same data contracts
5. **Documentation**: Types serve as living documentation of the API
6. **Validation**: Pydantic models provide automatic validation on the backend

## Configuration

The shared types are configured in:
- **Frontend**: `tsconfig.json` includes `"shared"`
- **Backend**: Python models mirror TypeScript interfaces
- **Database**: ClickHouse schema matches the data structures

This ensures consistency across the entire application stack.

## Performance Considerations

### Type Optimization
- **Minimal interfaces**: Only include necessary fields
- **Optional fields**: Use optional types for non-essential data
- **Efficient serialization**: Optimize for JSON serialization/deserialization

### Database Optimization
- **Indexed fields**: Primary keys and frequently queried fields
- **Materialized views**: Fast lookups for analytics
- **Columnar storage**: ClickHouse optimizations for analytics queries

## Security Features

### PII Protection
- **Masked data**: Sensitive information is masked in API responses
- **Type safety**: Prevents accidental exposure of raw PII data
- **Validation**: Input validation prevents malicious data injection

### Data Integrity
- **Consistent types**: Ensures data consistency across the application
- **Validation**: Both frontend and backend validate data structures
- **Error handling**: Proper error types for different failure scenarios 