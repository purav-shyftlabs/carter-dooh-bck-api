# File Management API Documentation

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Base URL
```
http://localhost:1337
```

---

## 📁 Folder Management APIs

### 1. Create Folder
**POST** `/folders`

#### Request Payload
```json
{
  "name": "Marketing Assets",
  "parentId": 123,
  "allowAllBrands": false
}
```

#### Parameters
- `name` (required): Folder name
- `parentId` (optional): Parent folder ID for nested folders (null for root)
- `allowAllBrands` (optional): Whether all brands can access this folder (default: false)

#### Example cURL
```bash
curl -X POST http://localhost:1337/folders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing Assets",
    "parentId": null,
    "allowAllBrands": false
  }'
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "id": 456,
    "name": "Marketing Assets",
    "parentId": null,
    "accountId": 1,
    "ownerId": 2,
    "allowAllBrands": false,
    "createdAt": "2025-09-27T15:30:00.000Z",
    "updatedAt": "2025-09-27T15:30:00.000Z"
  },
  "timestamp": "2025-09-27T15:30:00.000Z"
}
```

### 2. List Folders
**GET** `/folders?parentId=123`

#### Query Parameters
- `parentId` (optional): Parent folder ID (null for root folders)

#### Example cURL
```bash
curl -X GET "http://localhost:1337/folders?parentId=123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Folders fetched successfully",
  "data": [
    {
      "id": 456,
      "name": "Marketing Assets",
      "parentId": 123,
      "accountId": 1,
      "ownerId": 2,
      "allowAllBrands": false,
      "createdAt": "2025-09-27T15:30:00.000Z",
      "updatedAt": "2025-09-27T15:30:00.000Z"
    }
  ],
  "timestamp": "2025-09-27T15:30:00.000Z"
}
```

### 3. Get Folder with Contents
**GET** `/folders/:id`

#### Example cURL
```bash
curl -X GET http://localhost:1337/folders/456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Folder details fetched successfully",
  "data": {
    "id": 456,
    "name": "Marketing Assets",
    "parentId": 123,
    "accountId": 1,
    "ownerId": 2,
    "allowAllBrands": false,
    "createdAt": "2025-09-27T15:30:00.000Z",
    "updatedAt": "2025-09-27T15:30:00.000Z",
    "subfolders": [
      {
        "id": 457,
        "name": "Banners",
        "parentId": 456,
        "accountId": 1,
        "ownerId": 2,
        "allowAllBrands": false,
        "createdAt": "2025-09-27T15:31:00.000Z",
        "updatedAt": "2025-09-27T15:31:00.000Z"
      }
    ],
    "files": [
      {
        "id": 789,
        "name": "1758985900123_a1b2c3d4e5f6g7h8_banner.jpg",
        "originalFilename": "marketing-banner.jpg",
        "folderId": 456,
        "accountId": 1,
        "ownerId": 2,
        "storageKey": "folder_456/1758985900123_a1b2c3d4e5f6g7h8_banner.jpg",
        "fileSize": 1048576,
        "contentType": "image/jpeg",
        "allowAllBrands": false,
        "metadata": {
          "originalName": "marketing-banner.jpg",
          "uploadedAt": "2025-09-27T15:32:00.000Z",
          "storageProvider": "local"
        },
        "createdAt": "2025-09-27T15:32:00.000Z",
        "updatedAt": "2025-09-27T15:32:00.000Z"
      }
    ]
  },
  "timestamp": "2025-09-27T15:33:00.000Z"
}
```

---

## 📄 File Management APIs

### 1. Upload File to Folder
**POST** `/files/upload`

#### Request Payload
```json
{
  "fileData": "base64_encoded_file_data",
  "filename": "banner.jpg",
  "mimeType": "image/jpeg",
  "folderId": 456,
  "allowAllBrands": false
}
```

#### Parameters
- `fileData` (required): Base64 encoded file data
- `filename` (required): Original filename
- `mimeType` (optional): MIME type of the file
- `folderId` (optional): Folder ID to upload to (null for root)
- `allowAllBrands` (optional): Whether all brands can access this file (default: false)

#### Example cURL
```bash
curl -X POST http://localhost:1337/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileData": "SGVsbG8gV29ybGQgLSBUZXN0IEZpbGUgVXBsb2FkCg==",
    "filename": "test.txt",
    "mimeType": "text/plain",
    "folderId": 456,
    "allowAllBrands": false
  }'
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 789,
    "name": "1758985900123_a1b2c3d4e5f6g7h8.txt",
    "originalFilename": "test.txt",
    "folderId": 456,
    "accountId": 1,
    "ownerId": 2,
    "storageKey": "folder_456/1758985900123_a1b2c3d4e5f6g7h8.txt",
    "fileSize": 30,
    "contentType": "text/plain",
    "allowAllBrands": false,
    "metadata": {
      "originalName": "test.txt",
      "uploadedAt": "2025-09-27T15:32:00.000Z",
      "storageProvider": "local"
    },
    "createdAt": "2025-09-27T15:32:00.000Z",
    "updatedAt": "2025-09-27T15:32:00.000Z",
    "fileUrl": "/uploads/files/folder_456/1758985900123_a1b2c3d4e5f6g7h8.txt"
  },
  "timestamp": "2025-09-27T15:32:00.000Z"
}
```

### 2. List Files in Folder
**GET** `/files?folderId=456`

#### Query Parameters
- `folderId` (optional): Folder ID to list files from (null for root files)

#### Example cURL
```bash
curl -X GET "http://localhost:1337/files?folderId=456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Files fetched successfully",
  "data": [
    {
      "id": 789,
      "name": "1758985900123_a1b2c3d4e5f6g7h8_banner.jpg",
      "originalFilename": "marketing-banner.jpg",
      "folderId": 456,
      "accountId": 1,
      "ownerId": 2,
      "storageKey": "folder_456/1758985900123_a1b2c3d4e5f6g7h8_banner.jpg",
      "fileSize": 1048576,
      "contentType": "image/jpeg",
      "allowAllBrands": false,
      "metadata": {
        "originalName": "marketing-banner.jpg",
        "uploadedAt": "2025-09-27T15:32:00.000Z",
        "storageProvider": "local"
      },
      "createdAt": "2025-09-27T15:32:00.000Z",
      "updatedAt": "2025-09-27T15:32:00.000Z",
      "fileUrl": "/uploads/files/folder_456/1758985900123_a1b2c3d4e5f6g7h8_banner.jpg"
    }
  ],
  "timestamp": "2025-09-27T15:33:00.000Z"
}
```

### 3. Get Hierarchical Structure
**GET** `/files/hierarchy?parentId=123`

#### Query Parameters
- `parentId` (optional): Parent folder ID to get hierarchy from (null for root)

#### Example cURL
```bash
curl -X GET "http://localhost:1337/files/hierarchy?parentId=123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Hierarchical structure fetched successfully",
  "data": {
    "folders": [
      {
        "id": 456,
        "name": "Marketing Assets",
        "parentId": 123,
        "accountId": 1,
        "ownerId": 2,
        "allowAllBrands": false,
        "createdAt": "2025-09-27T15:30:00.000Z",
        "updatedAt": "2025-09-27T15:30:00.000Z"
      }
    ],
    "files": [
      {
        "id": 789,
        "name": "1758985900123_a1b2c3d4e5f6g7h8_document.pdf",
        "originalFilename": "important-document.pdf",
        "folderId": null,
        "accountId": 1,
        "ownerId": 2,
        "storageKey": "1758985900123_a1b2c3d4e5f6g7h8_document.pdf",
        "fileSize": 2048576,
        "contentType": "application/pdf",
        "allowAllBrands": false,
        "metadata": {
          "originalName": "important-document.pdf",
          "uploadedAt": "2025-09-27T15:32:00.000Z",
          "storageProvider": "local"
        },
        "createdAt": "2025-09-27T15:32:00.000Z",
        "updatedAt": "2025-09-27T15:32:00.000Z",
        "fileUrl": "/uploads/files/1758985900123_a1b2c3d4e5f6g7h8_document.pdf"
      }
    ]
  },
  "timestamp": "2025-09-27T15:33:00.000Z"
}
```

### 4. List All Folders and Files (Simple Flat List)
**GET** `/files/all`

#### Example cURL
```bash
curl -X GET http://localhost:1337/files/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "All folders and files with parent info fetched successfully",
  "data": {
    "items": [
      {
        "id": 456,
        "name": "Marketing Assets",
        "type": "folder",
        "parentId": null,
        "parentName": "Root",
        "accountId": 1,
        "ownerId": 2,
        "allowAllBrands": false,
        "createdAt": "2025-09-27T15:30:00.000Z",
        "updatedAt": "2025-09-27T15:30:00.000Z"
      },
      {
        "id": 457,
        "name": "Banners",
        "type": "folder",
        "parentId": 456,
        "parentName": "Marketing Assets",
        "accountId": 1,
        "ownerId": 2,
        "allowAllBrands": false,
        "createdAt": "2025-09-27T15:31:00.000Z",
        "updatedAt": "2025-09-27T15:31:00.000Z"
      },
      {
        "id": 789,
        "name": "1758985900123_a1b2c3d4e5f6g7h8_banner.jpg",
        "originalFilename": "marketing-banner.jpg",
        "type": "file",
        "folderId": 457,
        "folderName": "Banners",
        "accountId": 1,
        "ownerId": 2,
        "fileSize": 1048576,
        "contentType": "image/jpeg",
        "allowAllBrands": false,
        "fileUrl": "/uploads/files/folder_457/1758985900123_a1b2c3d4e5f6g7h8_banner.jpg",
        "createdAt": "2025-09-27T15:32:00.000Z",
        "updatedAt": "2025-09-27T15:32:00.000Z"
      },
      {
        "id": 790,
        "name": "1758985900123_a1b2c3d4e5f6g7h8_document.pdf",
        "originalFilename": "important-document.pdf",
        "type": "file",
        "folderId": null,
        "folderName": "Root",
        "accountId": 1,
        "ownerId": 2,
        "fileSize": 2048576,
        "contentType": "application/pdf",
        "allowAllBrands": false,
        "fileUrl": "/uploads/files/1758985900123_a1b2c3d4e5f6g7h8_document.pdf",
        "createdAt": "2025-09-27T15:33:00.000Z",
        "updatedAt": "2025-09-27T15:33:00.000Z"
      }
    ],
    "summary": {
      "totalFolders": 2,
      "totalFiles": 2,
      "totalItems": 4
    }
  },
  "timestamp": "2025-09-27T15:34:00.000Z"
}
```

---

## 🔗 File Access APIs

### 1. Serve Root Files
**GET** `/uploads/files/:filename`

#### Example cURL
```bash
curl -X GET http://localhost:1337/uploads/files/document.pdf
```

### 2. Serve Files in Folders
**GET** `/uploads/files/folder/:folderId/:filename`

#### Example cURL
```bash
curl -X GET http://localhost:1337/uploads/files/folder/456/banner.jpg
```

---

## 📋 API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/folders` | Create a new folder |
| GET | `/folders` | List folders (with optional parentId filter) |
| GET | `/folders/:id` | Get folder details with subfolders and files |
| POST | `/files/upload` | Upload file to folder |
| GET | `/files` | List files (with optional folderId filter) |
| GET | `/files/hierarchy` | Get hierarchical structure (folders + files) |
| GET | `/files/all` | Get all folders and files in flat list with parent info |
| GET | `/uploads/files/:filename` | Serve root files |
| GET | `/uploads/files/folder/:folderId/:filename` | Serve files in folders |

---

## 🎯 Key Features

✅ **Hierarchical Structure** - Files organized in nested folders  
✅ **Folder Creation** - Create folders with parent-child relationships  
✅ **File Upload to Folders** - Specify folderId during upload  
✅ **Multiple List Views** - Flat list, hierarchical, or filtered by folder  
✅ **Database Storage** - All metadata stored in database  
✅ **Local File Storage** - Files stored in organized folder structure  
✅ **JWT Authentication** - Secure access to all endpoints  
✅ **Public File Serving** - Direct access to uploaded files  
✅ **Parent Information** - Clear parent-child relationships in responses  

---

## 🔧 Error Responses

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Authorization header missing or invalid",
  "timestamp": "2025-09-27T15:30:00.000Z"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "message": "Folder name is required",
  "timestamp": "2025-09-27T15:30:00.000Z"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Folder not found",
  "timestamp": "2025-09-27T15:30:00.000Z"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Upload failed: Error message here",
  "timestamp": "2025-09-27T15:30:00.000Z"
}
```
