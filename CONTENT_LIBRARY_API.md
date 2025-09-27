# Content Library API Documentation

## Overview
This document provides comprehensive API documentation for the Content Library system, including folder management, file uploads, and file serving capabilities.

## Authentication
Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Base URL
```
http://localhost:1337
```

---

## 📁 Folder Management APIs

### 1. Create Folder
**Endpoint:** `POST /folders`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Marketing Assets",
  "parentId": 1,
  "allowAllBrands": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "id": 1,
    "name": "Marketing Assets",
    "parent_id": 1,
    "account_id": 1,
    "owner_id": 2,
    "allow_all_brands": false,
    "createdAt": "2025-09-27T15:30:00.000Z",
    "updatedAt": "2025-09-27T15:30:00.000Z"
  }
}
```

**Error Response (Duplicate Folder):**
```json
{
  "success": false,
  "message": "Folder with name \"Marketing Assets\" already exists in this location",
  "timestamp": "2025-09-27T15:30:00.000Z"
}
```

### 2. List Folders
**Endpoint:** `GET /folders`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `parentId` (optional): Filter by parent folder ID

**Example:**
```
GET /folders?parentId=1
```

**Response:**
```json
{
  "success": true,
  "message": "Folders fetched successfully",
  "data": [
    {
      "id": 2,
      "name": "Q1 Campaigns",
      "parent_id": 1,
      "account_id": 1,
      "owner_id": 2,
      "allow_all_brands": false,
      "createdAt": "2025-09-27T15:31:00.000Z",
      "updatedAt": "2025-09-27T15:31:00.000Z"
    }
  ]
}
```

### 3. Get Folder by ID
**Endpoint:** `GET /folders/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Folder fetched successfully",
  "data": {
    "id": 1,
    "name": "Marketing Assets",
    "parent_id": null,
    "account_id": 1,
    "owner_id": 2,
    "allow_all_brands": false,
    "createdAt": "2025-09-27T15:30:00.000Z",
    "updatedAt": "2025-09-27T15:30:00.000Z"
  }
}
```

### 4. Get Folder Contents
**Endpoint:** `GET /folders/:folderId/contents`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Folder contents fetched successfully",
  "data": {
    "folder": {
      "id": 1,
      "name": "Marketing Assets",
      "parent_id": null,
      "account_id": 1,
      "owner_id": 2,
      "allow_all_brands": false,
      "createdAt": "2025-09-27T15:30:00.000Z",
      "updatedAt": "2025-09-27T15:30:00.000Z"
    },
    "subfolders": [
      {
        "id": 2,
        "name": "Q1 Campaigns",
        "parent_id": 1,
        "account_id": 1,
        "owner_id": 2,
        "allow_all_brands": false,
        "createdAt": "2025-09-27T15:31:00.000Z",
        "updatedAt": "2025-09-27T15:31:00.000Z"
      }
    ],
    "files": [
      {
        "id": 789,
        "name": "1758986907199_65b6273e9cc13287.xlsx",
        "original_filename": "campaign-budget.xlsx",
        "folder_id": 1,
        "account_id": 1,
        "owner_id": 2,
        "storage_key": "1758986907199_65b6273e9cc13287.xlsx",
        "file_size": 2048576,
        "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "allow_all_brands": false,
        "fileUrl": "/uploads/files/1758986907199_65b6273e9cc13287.xlsx",
        "createdAt": "2025-09-27T15:33:00.000Z",
        "updatedAt": "2025-09-27T15:33:00.000Z"
      }
    ]
  }
}
```

---

## 📄 File Management APIs

### 1. Upload File
**Endpoint:** `POST /files/upload`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Payload:**
```json
{
  "fileData": "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAIAA...",
  "filename": "campaign-budget.xlsx",
  "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "folderId": 1,
  "allowAllBrands": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 789,
    "name": "1758986907199_65b6273e9cc13287.xlsx",
    "original_filename": "campaign-budget.xlsx",
    "folder_id": 1,
    "account_id": 1,
    "owner_id": 2,
    "storage_key": "folder_1/1758986907199_65b6273e9cc13287.xlsx",
    "file_size": 2048576,
    "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "allow_all_brands": false,
    "fileUrl": "/uploads/files/folder_1/1758986907199_65b6273e9cc13287.xlsx",
    "createdAt": "2025-09-27T15:33:00.000Z",
    "updatedAt": "2025-09-27T15:33:00.000Z"
  }
}
```

**Error Response (Duplicate File):**
```json
{
  "success": false,
  "message": "File with name \"campaign-budget.xlsx\" already exists in this folder",
  "timestamp": "2025-09-27T15:33:00.000Z"
}
```

### 2. List Files
**Endpoint:** `GET /files`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `folderId` (optional): Filter by folder ID

**Example:**
```
GET /files?folderId=1
```

**Response:**
```json
{
  "success": true,
  "message": "Files fetched successfully",
  "data": [
    {
      "id": 789,
      "name": "1758986907199_65b6273e9cc13287.xlsx",
      "original_filename": "campaign-budget.xlsx",
      "folder_id": 1,
      "account_id": 1,
      "owner_id": 2,
      "storage_key": "folder_1/1758986907199_65b6273e9cc13287.xlsx",
      "file_size": 2048576,
      "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "allow_all_brands": false,
      "fileUrl": "/uploads/files/folder_1/1758986907199_65b6273e9cc13287.xlsx",
      "createdAt": "2025-09-27T15:33:00.000Z",
      "updatedAt": "2025-09-27T15:33:00.000Z"
    }
  ]
}
```

### 3. Get Hierarchical Structure
**Endpoint:** `GET /files/hierarchy`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `parentId` (optional): Get hierarchy under specific parent folder

**Example:**
```
GET /files/hierarchy?parentId=1
```

**Response:**
```json
{
  "success": true,
  "message": "Hierarchical structure fetched successfully",
  "data": {
    "folders": [
      {
        "id": 2,
        "name": "Q1 Campaigns",
        "parent_id": 1,
        "account_id": 1,
        "owner_id": 2,
        "allow_all_brands": false,
        "createdAt": "2025-09-27T15:31:00.000Z",
        "updatedAt": "2025-09-27T15:31:00.000Z"
      }
    ],
    "files": [
      {
        "id": 789,
        "name": "1758986907199_65b6273e9cc13287.xlsx",
        "original_filename": "campaign-budget.xlsx",
        "folder_id": 1,
        "account_id": 1,
        "owner_id": 2,
        "storage_key": "folder_1/1758986907199_65b6273e9cc13287.xlsx",
        "file_size": 2048576,
        "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "allow_all_brands": false,
        "fileUrl": "/uploads/files/folder_1/1758986907199_65b6273e9cc13287.xlsx",
        "createdAt": "2025-09-27T15:33:00.000Z",
        "updatedAt": "2025-09-27T15:33:00.000Z"
      }
    ]
  }
}
```

### 4. Get All Files and Folders (Flat List)
**Endpoint:** `GET /files/all`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "All folders and files with parent info fetched successfully",
  "data": {
    "items": [
      {
        "id": 1,
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
        "id": 2,
        "name": "Q1 Campaigns",
        "type": "folder",
        "parentId": 1,
        "parentName": "Marketing Assets",
        "accountId": 1,
        "ownerId": 2,
        "allowAllBrands": false,
        "createdAt": "2025-09-27T15:31:00.000Z",
        "updatedAt": "2025-09-27T15:31:00.000Z"
      },
      {
        "id": 789,
        "name": "1758986907199_65b6273e9cc13287.xlsx",
        "originalFilename": "campaign-budget.xlsx",
        "type": "file",
        "folderId": 1,
        "folderName": "Marketing Assets",
        "accountId": 1,
        "ownerId": 2,
        "fileSize": 2048576,
        "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "allowAllBrands": false,
        "fileUrl": "/uploads/files/folder_1/1758986907199_65b6273e9cc13287.xlsx",
        "createdAt": "2025-09-27T15:33:00.000Z",
        "updatedAt": "2025-09-27T15:33:00.000Z"
      }
    ],
    "summary": {
      "totalFolders": 2,
      "totalFiles": 1,
      "totalItems": 3
    }
  }
}
```

---

## 🎯 File Serving APIs

### 1. Serve File by ID (NEW - RECOMMENDED)
**Endpoint:** `GET /files/:fileId/download`

**Headers:** None required (Public access)

**Example:**
```
GET /files/789/download
```

**Response:** 
- **Content-Type:** Based on file type (e.g., `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- **Content-Disposition:** `inline; filename="campaign-budget.xlsx"`
- **Body:** The actual file content (binary)

**Usage in Frontend:**
```html
<!-- Display image -->
<img src="/files/789/download" alt="File preview" />

<!-- Download link -->
<a href="/files/789/download" download>Download File</a>

<!-- Embed PDF -->
<iframe src="/files/789/download" width="100%" height="600px"></iframe>
```

### 2. Serve File by URL Path
**Endpoint:** `GET /uploads/files/:filename`

**Headers:** None required (Public access)

**Example:**
```
GET /uploads/files/1758986907199_65b6273e9cc13287.xlsx
```

**Response:** 
- **Content-Type:** Based on file extension
- **Body:** The actual file content (binary)

### 3. Serve File in Folder by URL Path
**Endpoint:** `GET /uploads/files/folder/:folderId/:filename`

**Headers:** None required (Public access)

**Example:**
```
GET /uploads/files/folder/1/1758986907199_65b6273e9cc13287.xlsx
```

**Response:** 
- **Content-Type:** Based on file extension
- **Body:** The actual file content (binary)

---

## 🖼️ Image Management APIs

### 1. Upload Image
**Endpoint:** `POST /images/upload`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Payload:**
```json
{
  "fileData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "filename": "logo.png",
  "mimeType": "image/png"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "id": 1,
    "filename": "1758985836234_f3c5684a4e5f3e32.png",
    "originalName": "logo.png",
    "mimeType": "image/png",
    "size": 245760,
    "imageUrl": "/uploads/images/1758985836234_f3c5684a4e5f3e32.png",
    "createdAt": "2025-09-27T15:25:00.000Z",
    "updatedAt": "2025-09-27T15:25:00.000Z"
  }
}
```

**Error Response (Duplicate File):**
```json
{
  "success": false,
  "message": "File with name \"logo.png\" already exists",
  "timestamp": "2025-09-27T15:25:00.000Z"
}
```

### 2. List Images
**Endpoint:** `GET /images/list`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Images fetched successfully",
  "data": [
    {
      "id": 1,
      "filename": "1758985836234_f3c5684a4e5f3e32.png",
      "originalName": "logo.png",
      "mimeType": "image/png",
      "size": 245760,
      "imageUrl": "/uploads/images/1758985836234_f3c5684a4e5f3e32.png",
      "createdAt": "2025-09-27T15:25:00.000Z",
      "updatedAt": "2025-09-27T15:25:00.000Z"
    }
  ]
}
```

### 3. Serve Image
**Endpoint:** `GET /uploads/images/:filename`

**Headers:** None required (Public access)

**Example:**
```
GET /uploads/images/1758985836234_f3c5684a4e5f3e32.png
```

**Response:** 
- **Content-Type:** `image/png`
- **Body:** The actual image content (binary)

---

## 🚀 Quick Start Examples

### Create a Folder Structure
```bash
# 1. Create root folder
curl -X POST http://localhost:1337/folders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Marketing Assets", "allowAllBrands": false}'

# 2. Create subfolder
curl -X POST http://localhost:1337/folders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Q1 Campaigns", "parentId": 1, "allowAllBrands": false}'
```

### Upload a File
```bash
curl -X POST http://localhost:1337/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileData": "data:application/pdf;base64,JVBERi0xLjQKJcfs...",
    "filename": "campaign-brief.pdf",
    "mimeType": "application/pdf",
    "folderId": 1,
    "allowAllBrands": false
  }'
```

### Get All Content
```bash
curl -X GET http://localhost:1337/files/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Serve File in Frontend
```html
<!-- Using file ID (recommended) -->
<img src="/files/789/download" alt="File preview" />

<!-- Using direct URL -->
<img src="/uploads/files/folder_1/1758986907199_65b6273e9cc13287.xlsx" alt="File" />
```

---

## 📝 Error Responses

### Common Error Format
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-09-27T15:30:00.000Z"
}
```

### Common Error Codes
- **400**: Bad Request (missing required fields)
- **401**: Unauthorized (invalid or missing JWT token)
- **404**: Not Found (file/folder doesn't exist)
- **500**: Internal Server Error

---

## 🔧 File Type Support

### Supported File Types
- **Images**: JPG, JPEG, PNG, GIF, WebP, SVG
- **Documents**: PDF, TXT, JSON
- **Office**: DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Media**: MP4, MP3
- **Archives**: ZIP

### Content Type Detection
The system automatically detects content types based on:
1. File extension
2. MIME type from upload
3. Database stored content type

## 🚫 Duplicate Prevention

### File Upload Validation
The system prevents duplicate file names in the same location:

- **File Controller**: Checks for duplicate `original_filename` in the same folder within the same account
- **Image Controller**: Checks for duplicate filenames in the images directory

### Folder Creation Validation
The system prevents duplicate folder names in the same location:

- **Folder Controller**: Checks for duplicate `name` in the same parent folder within the same account

### Error Responses
When a duplicate file is detected:
```json
{
  "success": false,
  "message": "File with name \"filename.ext\" already exists in this folder",
  "timestamp": "2025-09-27T15:33:00.000Z"
}
```

When a duplicate folder is detected:
```json
{
  "success": false,
  "message": "Folder with name \"Folder Name\" already exists in this location",
  "timestamp": "2025-09-27T15:33:00.000Z"
}
```

### HTTP Status Code
- **409 Conflict**: Returned when duplicate file or folder is detected

---

## 🎯 Best Practices

### For Frontend Integration
1. **Use file ID for serving**: `/files/:fileId/download` is more reliable than URL paths
2. **Handle different file types**: Check content type to determine how to display
3. **Implement proper error handling**: Handle 404s for missing files
4. **Use caching**: Files are cached for 1 year, implement client-side caching

### For File Uploads
1. **Validate file size**: Check file size before upload
2. **Validate file type**: Ensure file type is supported
3. **Use proper MIME types**: Include correct MIME type in upload
4. **Handle base64 encoding**: Ensure proper base64 encoding for file data

### For Folder Management
1. **Check parent existence**: Verify parent folder exists before creating subfolders
2. **Use meaningful names**: Use descriptive folder and file names
3. **Handle permissions**: Respect `allowAllBrands` settings
4. **Implement hierarchy limits**: Consider depth limits for folder structures

---

## 🔍 API Testing

### Test File Upload
```bash
# Convert file to base64
base64 -i your-file.pdf | tr -d '\n' > file-base64.txt

# Upload file
curl -X POST http://localhost:1337/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"fileData\": \"data:application/pdf;base64,$(cat file-base64.txt)\",
    \"filename\": \"test.pdf\",
    \"mimeType\": \"application/pdf\",
    \"folderId\": 1
  }"
```

### Test File Serving
```bash
# Download file by ID
curl -O http://localhost:1337/files/789/download

# Download file by URL
curl -O http://localhost:1337/uploads/files/folder_1/1758986907199_65b6273e9cc13287.xlsx
```

---

This API provides a complete content library solution with hierarchical folder management, file uploads, and flexible file serving options. The new file serving by ID endpoint (`/files/:fileId/download`) is the recommended approach for frontend integration as it's more reliable and provides better error handling.
