/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {

  /***************************************************************************
  *                                                                          *
  * Any other custom config this Sails app should use during development.    *
  *                                                                          *
  ***************************************************************************/
  // sendgridSecret: 'SG.fake.3e0Bn0qSQVnwb1E4qNPz9JZP5vLZYqjh7sn8S93oSHU',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …

  /***************************************************************************
  *                                                                          *
  * File Storage Configuration                                               *
  *                                                                          *
  ***************************************************************************/
  
  // Storage provider: 'local', 's3', or 'minio'
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  
  // AWS S3 Configuration (only used when storageProvider is 's3')
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3BucketName: process.env.S3_BUCKET_NAME
  },

  // MinIO Configuration (only used when storageProvider is 'minio')
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucketName: process.env.MINIO_BUCKET_NAME,
    region: process.env.MINIO_REGION || 'us-east-1'
  },

  // File upload limits
  fileUpload: {
    maxFileSize: {
      image: 10 * 1024 * 1024,      // 10MB
      document: 25 * 1024 * 1024,   // 25MB
      video: 100 * 1024 * 1024,     // 100MB
      audio: 50 * 1024 * 1024,      // 50MB
      archive: 50 * 1024 * 1024     // 50MB
    },
    maxFilesPerUpload: 10,
    allowedMimeTypes: {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/json',
        'application/xml'
      ],
      video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
      audio: ['audio/mpeg', 'audio/wav'],
      archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
    }
  }

};
