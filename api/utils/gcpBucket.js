const {Storage} = require('@google-cloud/storage');
const bucketName = 'carter_ooh';
const keyFilename = 'gcp-key.json';
const storage = keyFilename ? new Storage({keyFilename}) : new Storage();
const publicBaseUrl = 'https://storage.googleapis.com/carter_ooh/dev';

console.log('[GCP] Config => bucketName:', bucketName, 'keyFilename:', keyFilename, 'publicBaseUrl:', publicBaseUrl);

module.exports = {

    /**
     * Upload file to GCP.
     *
     * @param {Object} file - Filepath
     * @returns {Promise<string>}
     */
    uploadFileToGCP: async (file) => {

        try {
            console.log('[GCP] uploadFileToGCP called');
            const filename = file[0].fd;
            console.log('[GCP] uploading local file:', filename, 'to bucket:', bucketName);

            const result = await storage.bucket(bucketName).upload(filename, {

                gzip: true,

                metadata: {cacheControl: 'public'}
            });

            const objectName = result && result[1] && result[1].name;
            const url = `${publicBaseUrl}/${objectName}`;
            console.log('[GCP] uploadFileToGCP success => object:', objectName, 'url:', url);
            return url;

        } catch (exception) {
            console.error('[GCP] uploadFileToGCP error:', exception);
            return '';
        }
    },

    uploadFileFromPath: async (bufferData) => {
        try {
            console.log('[GCP] uploadFileFromPath called with path:', bufferData, 'to bucket:', bucketName);

            const result = await storage.bucket(bucketName).upload(bufferData, {

                gzip: true,

                metadata: {cacheControl: 'public'}
            });

            const objectName = result && result[1] && result[1].name;
            const url = `${publicBaseUrl}/${objectName}`;
            console.log('[GCP] uploadFileFromPath success => object:', objectName, 'url:', url);
            return url;

        } catch (exception) {
            console.error('[GCP] uploadFileFromPath error:', exception);
            return '';
        }
    },

    /**
     * Check if a file exists in Google Cloud Storage.
     * @param {string} filePath - The path of the file in the GCP bucket.
     * @returns {Promise<boolean>} - Returns true if the file exists, false otherwise.
     */
    fileExists: async (filePath) => {
        try {
            console.log('[GCP] fileExists check for:', filePath, 'in bucket:', bucketName);
            const file = storage.bucket(bucketName).file(filePath);
            const [exists] = await file.exists();
            console.log('[GCP] fileExists result for', filePath, '=>', exists);
            return exists;
        } catch (error) {
            console.error('Error checking if file exists:', error);
            return false;
        }
    },
};