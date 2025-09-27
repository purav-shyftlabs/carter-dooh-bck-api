/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function(done) {

  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return;
  // }
  //
  // await User.createEach([
  //   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
  //   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
  //   // etc.
  // ]);
  // ```

  if (sails.config.models.loadModuleModels) {
    sails.config.models.loadModuleModels(sails);
  }

  // Simple working upload endpoint that bypasses Sails.js body parsing
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() });

  sails.hooks.http.app.post('/api/upload-file', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Get user from JWT
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
      const { userId, selectedAccount } = decoded;

      // Import services
      const fileValidationService = require('../api/services/file/fileValidationService');
      const fileService = require('../api/services/file/fileService');
      const storageService = require('../api/services/storage/storageService');

      // Validate file
      const validation = fileValidationService.validateFile(req.file);
      if (!validation.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: `File validation failed: ${validation.errors.join(', ')}` 
        });
      }

      // Generate storage key and upload
      const storageKey = fileValidationService.generateSecureFilename(
        req.file.originalname, selectedAccount, userId
      );
      
      const uploadResult = await storageService.putObject(req.file.buffer, storageKey, {
        contentType: req.file.mimetype,
        contentLength: req.file.size,
        originalName: req.file.originalname
      });

      // Create database record
      const fileRecord = {
        accountId: selectedAccount,
        ownerId: userId,
        name: req.file.originalname,
        originalFilename: req.file.originalname,
        metadata: {
          originalName: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          uploadedAt: new Date().toISOString()
        },
        allowAllBrands: req.body.allowAllBrands === 'true',
        storageKey: storageKey,
        fileSize: req.file.size,
        contentType: req.file.mimetype,
        etag: uploadResult.etag
      };

      const createdFile = await fileService.create(fileRecord, { 
        currentUserId: userId, 
        accountId: selectedAccount 
      });

      return res.status(201).json({
        success: true,
        data: createdFile,
        message: 'File uploaded successfully'
      });

    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        success: false,
        message: `Upload failed: ${error.message}`
      });
    }
  });

  console.log('Working upload endpoint ready at /api/upload-file');
  return done();

};
