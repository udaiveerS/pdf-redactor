# PDF Scanner Python Server

A FastAPI-based Python server for PDF processing, analysis, and redacting capabilities.

## Features

- PDF parsing and text extraction
- PDF redacting functionality
- ClickHouse database integration
- RESTful API endpoints
- CORS support for React frontend

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode
```bash
python main.py
```

### Using Uvicorn directly
```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

The server will start on `http://localhost:8080`

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/python-server-status` - Server status and capabilities

## Integration with React App

The server is configured to work with the React app running on `http://localhost:3000`. The React app's proxy configuration in `src/setupProxy.js` forwards all `/api` requests to this Python server.

## Future Endpoints

- PDF upload and processing
- Text extraction from PDFs
- PDF redacting operations
- ClickHouse data storage and retrieval 