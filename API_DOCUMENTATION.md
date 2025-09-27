# File Storage API Documentation

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
  "allowAllBrands": false,
  "brandIds": [1, 2, 3]
}
```

#### Response (201 Created)
```json
{
  "status": "success",
  "message": "Folder created successfully",
  "data": {
    "id": 456,
    "account_id": 1,
    "owner_id": 2,
    "parent_id": 123,
    "name": "Marketing Assets",
    "allow_all_brands": false,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. List Folders
**GET** `/folders?page=1&limit=20&parentId=123`

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `parentId` (optional): Parent folder ID (null for root folders)

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Folders fetched successfully",
  "data": {
    "items": [
      {
        "id": 456,
        "account_id": 1,
        "owner_id": 2,
        "parent_id": 123,
        "name": "Marketing Assets",
        "allow_all_brands": false,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 3. Get Folder by ID
**GET** `/folders/:id`

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Folder fetched successfully",
  "data": {
    "id": 456,
    "account_id": 1,
    "owner_id": 2,
    "parent_id": 123,
    "name": "Marketing Assets",
    "allow_all_brands": false,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "brandAccess": [
      {
        "folder_id": 456,
        "brand_id": 1,
        "brand_name": "Nike"
      },
      {
        "folder_id": 456,
        "brand_id": 2,
        "brand_name": "Adidas"
      }
    ]
  }
}
```

### 4. Update Folder
**PATCH** `/folders/:id`

#### Request Payload
```json
{
  "name": "Updated Marketing Assets",
  "parentId": 124,
  "allowAllBrands": true
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Folder updated successfully",
  "data": {
    "id": 456,
    "account_id": 1,
    "owner_id": 2,
    "parent_id": 124,
    "name": "Updated Marketing Assets",
    "allow_all_brands": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

### 5. Delete Folder
**DELETE** `/folders/:id`

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Folder deleted successfully",
  "data": {
    "id": 456,
    "account_id": 1,
    "owner_id": 2,
    "parent_id": 124,
    "name": "Updated Marketing Assets",
    "allow_all_brands": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

### 6. Update Folder Brand Access
**PATCH** `/folders/:id/brand-access`

#### Request Payload
```json
{
  "allowAllBrands": false,
  "brandIds": [1, 2, 3, 4]
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Folder brand access updated successfully",
  "data": {
    "id": 456,
    "account_id": 1,
    "owner_id": 2,
    "parent_id": 124,
    "name": "Updated Marketing Assets",
    "allow_all_brands": false,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## 📄 File Management APIs

### 1. Create File (Metadata Only)
**POST** `/files`

#### Request Payload
```json
{
  "name": "banner.jpg",
  "folderId": 456,
  "originalFilename": "marketing-banner.jpg",
  "metadata": {
    "description": "Main banner for campaign",
    "tags": ["marketing", "banner"]
  },
  "allowAllBrands": false,
  "brandIds": [1, 2]
}
```

#### Response (201 Created)
```json
{
  "status": "success",
  "message": "File created successfully",
  "data": {
    "id": 789,
    "account_id": 1,
    "owner_id": 2,
    "folder_id": 456,
    "name": "banner.jpg",
    "original_filename": "marketing-banner.jpg",
    "metadata": {
      "description": "Main banner for campaign",
      "tags": ["marketing", "banner"]
    },
    "allow_all_brands": false,
    "storage_key": null,
    "file_size": null,
    "content_type": null,
    "etag": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Upload Single File
**POST** `/files/upload`

#### Request (multipart/form-data)
```
Content-Type: multipart/form-data

file: [binary file data]
folderId: 456
allowAllBrands: false
brandIds: [1,2,3]
```

#### Response (201 Created)
```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "data": {
    "id": 789,
    "account_id": 1,
    "owner_id": 2,
    "folder_id": 456,
    "name": "banner.jpg",
    "original_filename": "marketing-banner.jpg",
    "metadata": {
      "originalName": "marketing-banner.jpg",
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "storageProvider": "local"
    },
    "allow_all_brands": false,
    "storage_key": "account_1/user_2/1758919485810_5348e5bd71520a05_banner.jpg",
    "file_size": 1048576,
    "content_type": "image/jpeg",
    "etag": "d41d8cd98f00b204e9800998ecf8427e",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "url": "/uploads/files/account_1/user_2/1758919485810_5348e5bd71520a05_banner.jpg",
    "downloadUrl": "/uploads/files/account_1/user_2/1758919485810_5348e5bd71520a05_banner.jpg"
  }
}
```

### 3. Upload Multiple Files
**POST** `/files/upload-multiple`

#### Request (multipart/form-data)
```
Content-Type: multipart/form-data

files: [binary file data 1]
files: [binary file data 2]
files: [binary file data 3]
folderId: 456
allowAllBrands: true
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Uploaded 2 of 3 files successfully",
  "data": {
    "uploaded": [
      {
        "id": 789,
        "account_id": 1,
        "owner_id": 2,
        "folder_id": 456,
        "name": "banner1.jpg",
        "original_filename": "marketing-banner-1.jpg",
        "storage_key": "account_1/user_2/1758919485810_5348e5bd71520a05_banner1.jpg",
        "file_size": 1048576,
        "content_type": "image/jpeg",
        "etag": "d41d8cd98f00b204e9800998ecf8427e",
        "url": "/uploads/files/account_1/user_2/1758919485810_5348e5bd71520a05_banner1.jpg",
        "downloadUrl": "/uploads/files/account_1/user_2/1758919485810_5348e5bd71520a05_banner1.jpg"
      },
      {
        "id": 790,
        "account_id": 1,
        "owner_id": 2,
        "folder_id": 456,
        "name": "banner2.jpg",
        "original_filename": "marketing-banner-2.jpg",
        "storage_key": "account_1/user_2/1758919485820_6348e5bd71520a06_banner2.jpg",
        "file_size": 2097152,
        "content_type": "image/jpeg",
        "etag": "e41d8cd98f00b204e9800998ecf8427f",
        "url": "/uploads/files/account_1/user_2/1758919485820_6348e5bd71520a06_banner2.jpg",
        "downloadUrl": "/uploads/files/account_1/user_2/1758919485820_6348e5bd71520a06_banner2.jpg"
      }
    ],
    "errors": [
      {
        "filename": "large-video.mp4",
        "error": "File size 200MB exceeds maximum allowed size for video files (100MB)"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
    }
  }
}
```

### 4. List Files
**GET** `/files?page=1&limit=20&folderId=456&search=banner`

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `folderId` (optional): Parent folder ID (null for root files)
- `search` (optional): Search term for file names

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "Files fetched successfully",
  "data": {
    "items": [
      {
        "id": 789,
        "account_id": 1,
        "owner_id": 2,
        "folder_id": 456,
        "name": "banner.jpg",
        "original_filename": "marketing-banner.jpg",
        "metadata": {
          "originalName": "marketing-banner.jpg",
          "uploadedAt": "2024-01-15T10:30:00.000Z",
          "storageProvider": "local"
        },
        "allow_all_brands": false,
        "storage_key": "account_1/user_2/1758919485810_5348e5bd71520a05_banner.jpg",
        "file_size": 1048576,
        "content_type": "image/jpeg",
        "etag": "d41d8cd98f00b204e9800998ecf8427e",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 5. Get File by ID
**GET** `/files/:id`

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "File fetched successfully",
  "data": {
    "id": 789,
    "account_id": 1,
    "owner_id": 2,
    "folder_id": 456,
    "name": "banner.jpg",
    "original_filename": "marketing-banner.jpg",
    "metadata": {
      "originalName": "marketing-banner.jpg",
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "storageProvider": "local"
    },
    "allow_all_brands": false,
    "storage_key": "account_1/user_2/1758919485810_5348e5bd71520a05_banner.jpg",
    "file_size": 1048576,
    "content_type": "image/jpeg",
    "etag": "d41d8cd98f00b204e9800998ecf8427e",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "brandAccess": [
      {
        "file_id": 789,
        "brand_id": 1,
        "brand_name": "Nike"
      },
      {
        "file_id": 789,
        "brand_id": 2,
        "brand_name": "Adidas"
      }
    ]
  }
}
```

### 6. Update File
**PATCH** `/files/:id`

#### Request Payload
```json
{
  "name": "updated-banner.jpg",
  "folderId": 457,
  "metadata": {
    "description": "Updated banner for campaign",
    "tags": ["marketing", "banner", "updated"]
  }
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "File updated successfully",
  "data": {
    "id": 789,
    "account_id": 1,
    "owner_id": 2,
    "folder_id": 457,
    "name": "updated-banner.jpg",
    "original_filename": "marketing-banner.jpg",
    "metadata": {
      "description": "Updated banner for campaign",
      "tags": ["marketing", "banner", "updated"]
    },
    "allow_all_brands": false,
    "storage_key": "account_1/user_2/1758919485810_5348e5bd71520a05_banner.jpg",
    "file_size": 1048576,
    "content_type": "image/jpeg",
    "etag": "d41d8cd98f00b204e9800998ecf8427e",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  }
}
```

### 7. Delete File
**DELETE** `/files/:id`

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "File deleted successfully",
  "data": {
    "id": 789,
    "account_id": 1,
    "owner_id": 2,
    "folder_id": 457,
    "name": "updated-banner.jpg",
    "original_filename": "marketing-banner.jpg",
    "metadata": {
      "description": "Updated banner for campaign",
      "tags": ["marketing", "banner", "updated"]
    },
    "allow_all_brands": false,
    "storage_key": "account_1/user_2/1758919485810_5348e5bd71520a05_banner.jpg",
    "file_size": 1048576,
    "content_type": "image/jpeg",
    "etag": "d41d8cd98f00b204e9800998ecf8427e",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  }
}
```

### 8. Update File Brand Access
**PATCH** `/files/:id/brand-access`

#### Request Payload
```json
{
  "allowAllBrands": true
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "message": "File brand access updated successfully",
  "data": {
    "id": 789,
    "account_id": 1,
    "owner_id": 2,
    "folder_id": 457,
    "name": "updated-banner.jpg",
    "original_filename": "marketing-banner.jpg",
    "metadata": {
      "description": "Updated banner for campaign",
      "tags": ["marketing", "banner", "updated"]
    },
    "allow_all_brands": true,
    "storage_key": "account_1/user_2/1758919485810_5348e5bd71520a05_banner.jpg",
    "file_size": 1048576,
    "content_type": "image/jpeg",
    "etag": "d41d8cd98f00b204e9800998ecf8427e",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T12:15:00.000Z"
  }
}
```

### 9. Download File
**GET** `/files/:id/download`

#### Response (200 OK)
```
Content-Type: image/jpeg
Content-Length: 1048576
Content-Disposition: attachment; filename="marketing-banner.jpg"
ETag: "d41d8cd98f00b204e9800998ecf8427e"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT

[binary file data]
```

### 10. Serve File (Inline)
**GET** `/files/:id/serve`

#### Response (200 OK)
```
Content-Type: image/jpeg
Content-Length: 1048576
ETag: "d41d8cd98f00b204e9800998ecf8427e"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT
Cache-Control: public, max-age=3600

[binary file data]
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "File validation failed: File type .exe is not allowed for security reasons",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "Only folder owner can update",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "File not found",
  "statusCode": 404
}
```

### 413 Payload Too Large
```json
{
  "status": "error",
  "message": "File size 100MB exceeds maximum allowed size for image files (10MB)",
  "statusCode": 413
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Failed to upload file: Disk space full",
  "statusCode": 500
}
```

---

## 📋 File Type Restrictions

### Allowed File Types

| Category | Extensions | Max Size | MIME Types |
|----------|------------|----------|------------|
| **Images** | .jpg, .jpeg, .png, .gif, .webp, .svg | 10MB | image/jpeg, image/png, image/gif, image/webp, image/svg+xml |
| **Documents** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv | 25MB | application/pdf, application/msword, text/plain, etc. |
| **Videos** | .mp4, .avi, .mov, .webm | 100MB | video/mp4, video/quicktime, video/webm |
| **Audio** | .mp3, .wav | 50MB | audio/mpeg, audio/wav |
| **Archives** | .zip, .rar, .7z | 50MB | application/zip, application/x-rar-compressed |

### Blocked File Types
- Executables: .exe, .bat, .cmd, .com, .pif, .scr, .vbs, .js, .jar
- Scripts: .php, .asp, .aspx, .jsp, .py, .rb, .pl, .sh, .ps1

---

## 🔐 Brand Access Control

### Publisher Users
- Can set `allowAllBrands: true` OR specific `brandIds`
- Full access to all folders and files they own

### Advertiser Users
- Can ONLY use specific `brandIds` (cannot set `allowAllBrands: true`)
- Limited access to content based on their brand permissions

### Access Rules
1. **Owner Access**: File/folder owners always have full access
2. **Brand Access**: Users can access content if:
   - Content has `allowAllBrands: true` AND user has all brands access
   - Content has specific brands AND user has access to at least one of those brands

---

## 📝 Usage Examples

### JavaScript/Fetch
```javascript
// Upload single file
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folderId', '456');
formData.append('allowAllBrands', 'false');
formData.append('brandIds', JSON.stringify([1, 2, 3]));

const response = await fetch('/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded file:', result.data);
```

### cURL Examples
```bash
# Upload file
curl -X POST http://localhost:1337/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "folderId=456" \
  -F "allowAllBrands=false" \
  -F "brandIds=[1,2,3]"

# Download file
curl -X GET http://localhost:1337/files/789/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded-file.jpg

# List files
curl -X GET "http://localhost:1337/files?page=1&limit=20&folderId=456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### React/JavaScript Upload Component
```javascript
const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (files) => {
    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('folderId', selectedFolderId);
    formData.append('allowAllBrands', 'false');
    formData.append('brandIds', JSON.stringify(selectedBrands));
    
    try {
      const response = await fetch('/files/upload-multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      console.log('Upload result:', result.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <input 
      type="file" 
      multiple 
      onChange={(e) => handleUpload(e.target.files)}
      disabled={uploading}
    />
  );
};
```
