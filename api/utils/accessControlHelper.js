/**
 * Access Control Helper
 * 
 * This helper provides functions to check user access to files and folders
 * based on brand access permissions.
 */

/**
 * Get user's accessible brand IDs
 * @param {number} userId - User ID
 * @param {number} accountId - Account ID
 * @returns {Promise<Array>} Array of brand IDs the user can access
 */
async function getUserAccessibleBrands(userId, accountId) {
  try {
    // Get user's brand access from UserAccountBrand table
    // The table uses user_brand_access_id which references user_account(id)
    const userBrandAccess = await UserAccountBrand.find({
      where: {
        userBrandAccessId: userId
      }
    });

    // Extract brand IDs
    const accessibleBrandIds = userBrandAccess.map(access => access.brandId);
    
    // If user has no specific brand access records, they have access to all brands
    // This is the default behavior when no restrictions are set
    if (accessibleBrandIds.length === 0) {
      
      return []; // Empty array means access to all brands
    }
    
    return accessibleBrandIds;
  } catch (error) {
    console.error('Error getting user accessible brands:', error);
    // If there's an error (e.g., table doesn't exist), assume access to all brands
    
    return []; // Empty array means access to all brands
  }
}

/**
 * Check if user has access to a specific brand
 * @param {number} userId - User ID
 * @param {number} accountId - Account ID
 * @param {number} brandId - Brand ID to check
 * @returns {Promise<boolean>} True if user has access to the brand
 */
async function userHasBrandAccess(userId, accountId, brandId) {
  try {
    const accessibleBrands = await getUserAccessibleBrands(userId, accountId);
    return accessibleBrands.includes(brandId);
  } catch (error) {
    console.error('Error checking user brand access:', error);
    return false;
  }
}

/**
 * Check if user has access to a file
 * @param {number} userId - User ID
 * @param {number} accountId - Account ID
 * @param {Object} file - File object with allow_all_brands and brand access info
 * @returns {Promise<boolean>} True if user has access to the file
 */
async function userHasFileAccess(userId, accountId, file) {
  try {
    // If file allows all brands, user has access
    if (file.allow_all_brands) {
      return true;
    }

    // Get user's brand access
    const userBrands = await getUserAccessibleBrands(userId, accountId);
    
    // If user has access to all brands (no specific brand restrictions), they can see the file
    if (userBrands.length === 0) {
      return true;
    }

    // Get file's brand access using native query (table may not expose PK id)
    let fileBrandIds = [];
    try {
      const ds = sails.getDatastore();
      const result = await ds.sendNativeQuery('SELECT brand_id FROM file_brand_access WHERE file_id = $1', [file.id]);
      const rows = result && result.rows ? result.rows : [];
      fileBrandIds = rows.map(r => r.brand_id);
    } catch (error) {
      console.error('Error getting file brand access:', error);
      fileBrandIds = [];
    }

    // If no specific brand access is set, deny access
    if (fileBrandIds.length === 0) {
      return false;
    }

    // Check if user has access to any of the file's brands
    return fileBrandIds.some(brandId => userBrands.includes(brandId));

  } catch (error) {
    console.error('Error checking file access:', error);
    return false;
  }
}

/**
 * Check if user has access to a folder
 * @param {number} userId - User ID
 * @param {number} accountId - Account ID
 * @param {Object} folder - Folder object with allow_all_brands and brand access info
 * @returns {Promise<boolean>} True if user has access to the folder
 */
async function userHasFolderAccess(userId, accountId, folder) {
  try {
    // If folder allows all brands, user has access
    if (folder.allow_all_brands) {
      return true;
    }

    // Get user's brand access
    const userBrands = await getUserAccessibleBrands(userId, accountId);
    
    // If user has access to all brands (no specific brand restrictions), they can see the folder
    if (userBrands.length === 0) {
      return true;
    }

    // Get folder's brand access using native query (table has no PK id)
    let folderBrandIds = [];
    try {
      const ds = sails.getDatastore();
      const result = await ds.sendNativeQuery('SELECT brand_id FROM folder_brand_access WHERE folder_id = $1', [folder.id]);
      const rows = result && result.rows ? result.rows : [];
      folderBrandIds = rows.map(r => r.brand_id);
    } catch (error) {
      console.error('Error getting folder brand access:', error);
      folderBrandIds = [];
    }

    // If no specific brand access is set, deny access
    if (folderBrandIds.length === 0) {
      return false;
    }

    // Check if user has access to any of the folder's brands
    return folderBrandIds.some(brandId => userBrands.includes(brandId));

  } catch (error) {
    console.error('Error checking folder access:', error);
    return false;
  }
}

/**
 * Filter files based on user's brand access
 * @param {number} userId - User ID
 * @param {number} accountId - Account ID
 * @param {Array} files - Array of file objects
 * @returns {Promise<Array>} Filtered array of files user has access to
 */
async function filterFilesByAccess(userId, accountId, files) {
  try {
    const accessibleFiles = [];

    for (const file of files) {
      const hasAccess = await userHasFileAccess(userId, accountId, file);
      if (hasAccess) {
        accessibleFiles.push(file);
      }
    }

    return accessibleFiles;
  } catch (error) {
    console.error('Error filtering files by access:', error);
    return [];
  }
}

/**
 * Filter folders based on user's brand access
 * @param {number} userId - User ID
 * @param {number} accountId - Account ID
 * @param {Array} folders - Array of folder objects
 * @returns {Promise<Array>} Filtered array of folders user has access to
 */
async function filterFoldersByAccess(userId, accountId, folders) {
  try {
    const accessibleFolders = [];

    for (const folder of folders) {
      const hasAccess = await userHasFolderAccess(userId, accountId, folder);
      if (hasAccess) {
        accessibleFolders.push(folder);
      }
    }

    return accessibleFolders;
  } catch (error) {
    console.error('Error filtering folders by access:', error);
    return [];
  }
}

/**
 * Get user's brand access summary
 * @param {number} userId - User ID
 * @param {number} accountId - Account ID
 * @returns {Promise<Object>} Object with user's brand access info
 */
async function getUserBrandAccessSummary(userId, accountId) {
  try {
    const accessibleBrands = await getUserAccessibleBrands(userId, accountId);
    
    // For now, we'll assume that if a user has no specific brand access records,
    // they have access to all brands. This might need to be adjusted based on your business logic.
    const hasAccessToAllBrands = accessibleBrands.length === 0;
    
    return {
      userId,
      accountId,
      accessibleBrandIds: accessibleBrands,
      hasAccessToAllBrands: hasAccessToAllBrands,
      totalAccessibleBrands: accessibleBrands.length
    };
  } catch (error) {
    console.error('Error getting user brand access summary:', error);
    return {
      userId,
      accountId,
      accessibleBrandIds: [],
      hasAccessToAllBrands: false,
      totalAccessibleBrands: 0
    };
  }
}

module.exports = {
  getUserAccessibleBrands,
  userHasBrandAccess,
  userHasFileAccess,
  userHasFolderAccess,
  filterFilesByAccess,
  filterFoldersByAccess,
  getUserBrandAccessSummary
};
