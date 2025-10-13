"use strict";

const repository = require('./playlistRepository');

const VALID_STATUSES = ['active', 'inactive', 'archived', 'deleted'];
const VALID_CONTENT_TYPES = ['image', 'video', 'audio', 'website', 'text'];

module.exports = {
  async createPlaylist({ reqUser, body }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { name, description, metadata, thumbnail_url, status = 'active', contents = [] } = body;
    if (!name) throw Object.assign(new Error('Playlist name is required'), { status: 400 });

    if (!VALID_STATUSES.includes(status)) {
      throw Object.assign(new Error('Invalid status. Must be one of: ' + VALID_STATUSES.join(', ')), { status: 400 });
    }

    // Check if playlist with same name exists for this account
    const existing = await repository.findOnePlaylist({ 
      account_id: selectedAccount, 
      name,
      deleted_at: null 
    });
    if (existing) {
      throw Object.assign(new Error(`Playlist with name "${name}" already exists`), { status: 409 });
    }

    // Validate contents first before creating playlist
    if (contents && contents.length > 0) {
      this.validateContents(contents);
    }

    // Use database transaction to ensure both playlist and contents are created together
    const ds = sails.getDatastore();
    const result = await ds.transaction(async (db) => {
      // Create the playlist
      const playlist = await repository.createPlaylist({
        name,
        description: description || null,
        metadata: metadata || null,
        thumbnail_url: thumbnail_url || null,
        status,
        account_id: selectedAccount,
        user_id: userId,
        total_items: 0,
        duration_seconds: 0
      });

      // Add contents if provided
      if (contents && contents.length > 0) {
        const validContents = this.prepareContents(playlist.id, contents);
        await repository.createMultiplePlaylistContents(validContents);
        
        // Update playlist stats
        await repository.updatePlaylistStats(playlist.id);
      }

      return playlist;
    });

    // Get the complete playlist with contents
    const completePlaylist = await repository.getPlaylistWithContents(result.id);
    return completePlaylist;
  },

  async getPlaylistById({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { id } = params;
    const playlist = await repository.getPlaylistWithContents(id);
    
    if (!playlist) {
      throw Object.assign(new Error('Playlist not found'), { status: 404 });
    }

    console.log("PLAYLIST ACC ID", playlist.account_id);
    console.log("SELECTED ACCOUNT", selectedAccount);
    // Check if user has access to this playlist (belongs to their account)
    if (playlist.account_id != selectedAccount) {
      throw Object.assign(new Error('Access denied to this playlist'+playlist.account_id+ " "+ selectedAccount), { status: 403 });
    }

    return playlist;
  },

  async listPlaylists({ reqUser, query }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { status, limit = 50, skip = 0, sort = 'created_at DESC' } = query;
    
    const where = { 
      account_id: selectedAccount,
      deleted_at: null 
    };
    
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    const playlists = await repository.findPlaylists(where, { 
      sort, 
      limit: parseInt(limit), 
      skip: parseInt(skip) 
    });

    // Get owner names for display
    const ownerIds = playlists.map(p => p.user_id).filter(Boolean);
    const ownerNames = await repository.getOwnerNamesByIds(ownerIds);

    const playlistsWithOwners = playlists.map(playlist => ({
      ...playlist,
      ownerName: ownerNames.get(playlist.user_id)
    }));

    return playlistsWithOwners;
  },

  async updatePlaylist({ reqUser, params, body }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { id } = params;
    const { name, description, metadata, thumbnail_url, status, contents } = body;

    // Check if playlist exists and user has access
    const existingPlaylist = await repository.findOnePlaylist({ 
      id, 
      account_id: selectedAccount,
      deleted_at: null 
    });
    
    if (!existingPlaylist) {
      throw Object.assign(new Error('Playlist not found or access denied'), { status: 404 });
    }

    // Check if new name conflicts with existing playlists
    if (name && name !== existingPlaylist.name) {
      const nameConflict = await repository.findOnePlaylist({ 
        account_id: selectedAccount, 
        name,
        id: { '!=': id },
        deleted_at: null 
      });
      if (nameConflict) {
        throw Object.assign(new Error(`Playlist with name "${name}" already exists`), { status: 409 });
      }
    }

    if (status && !VALID_STATUSES.includes(status)) {
      throw Object.assign(new Error('Invalid status. Must be one of: ' + VALID_STATUSES.join(', ')), { status: 400 });
    }

    // Validate contents if provided
    if (contents !== undefined) {
      if (contents.length > 0) {
        this.validateContents(contents);
      }
    }

    // Use database transaction to ensure all updates succeed or fail together
    const ds = sails.getDatastore();
    await ds.transaction(async (db) => {
      // Update the playlist metadata
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description || null;
      if (metadata !== undefined) updateData.metadata = metadata || null;
      if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url || null;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length > 0) {
        await repository.updatePlaylistById(id, updateData);
      }

      // Handle contents update if provided
      if (contents !== undefined) {
        console.log('Updating contents for playlist:', id, 'Contents:', contents);
        
        // Delete existing contents
        await repository.deletePlaylistContentsByPlaylistId(id);
        console.log('Deleted existing contents');
        
        // Create new contents if any provided
        if (contents.length > 0) {
          const validContents = this.prepareContents(id, contents);
          console.log('Prepared contents:', validContents);
          await repository.createMultiplePlaylistContents(validContents);
          console.log('Created new contents');
        }
        
        // Update playlist stats
        await repository.updatePlaylistStats(id);
        console.log('Updated playlist stats');
      }
    });

    // Return updated playlist with contents
    return await repository.getPlaylistWithContents(id);
  },

  async deletePlaylist({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { id } = params;

    // Check if playlist exists and user has access
    const playlist = await repository.findOnePlaylist({ 
      id, 
      account_id: selectedAccount,
      deleted_at: null 
    });
    
    if (!playlist) {
      throw Object.assign(new Error('Playlist not found or access denied'), { status: 404 });
    }

    // Soft delete by setting deleted_at timestamp
    await repository.updatePlaylistById(id, { 
      status: 'deleted',
      deleted_at: new Date()
    });

    return { message: 'Playlist deleted successfully' };
  },

  async addPlaylistContents({ reqUser, body }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { playlistId, contents } = body;
    if (!playlistId) throw Object.assign(new Error('Playlist ID is required'), { status: 400 });
    if (!contents || !Array.isArray(contents)) {
      throw Object.assign(new Error('Contents array is required'), { status: 400 });
    }

    // Check if playlist exists and user has access
    const playlist = await repository.findOnePlaylist({ 
      id: playlistId, 
      account_id: selectedAccount
    });
    
    if (!playlist) {
      throw Object.assign(new Error('Playlist not found or access denied'), { status: 404 });
    }

    // Check if playlist is deleted
    if (playlist.deleted_at) {
      throw Object.assign(new Error('Playlist has been deleted'), { status: 404 });
    }

    // Validate and prepare content items
    const validContents = [];
    const existingContents = await repository.findPlaylistContents({ playlist_id: playlistId });
    const maxOrder = existingContents.length > 0 ? Math.max(...existingContents.map(c => c.order_index)) : 0;
    
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      const { type, name, image_url, video_url, audio_url, website_url, duration_seconds = 0, metadata, order_index } = content;

      if (!type || !VALID_CONTENT_TYPES.includes(type)) {
        throw Object.assign(new Error(`Invalid content type at index ${i}. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}`), { status: 400 });
      }

      if (!name) {
        throw Object.assign(new Error(`Content name is required at index ${i}`), { status: 400 });
      }

      // Validate that at least one URL is provided based on type
      const hasValidUrl = (type === 'image' && image_url) ||
                         (type === 'video' && video_url) ||
                         (type === 'audio' && audio_url) ||
                         (type === 'website' && website_url) ||
                         (type === 'text');

      if (!hasValidUrl) {
        throw Object.assign(new Error(`Valid URL is required for content type "${type}" at index ${i}`), { status: 400 });
      }

      // Use provided order_index or auto-generate
      const finalOrderIndex = order_index !== undefined ? parseInt(order_index) : maxOrder + i + 1;
      
      if (finalOrderIndex < 1) {
        throw Object.assign(new Error(`Invalid order_index at index ${i}. Must be a positive integer`), { status: 400 });
      }

      validContents.push({
        playlist_id: playlistId,
        order_index: finalOrderIndex,
        type,
        name,
        image_url: type === 'image' ? image_url : null,
        video_url: type === 'video' ? video_url : null,
        audio_url: type === 'audio' ? audio_url : null,
        website_url: type === 'website' ? website_url : null,
        duration_seconds: parseInt(duration_seconds) || 0,
        metadata
      });
    }

    // Create all content items
    const createdContents = await repository.createMultiplePlaylistContents(validContents);

    // Update playlist stats
    await repository.updatePlaylistStats(playlistId);

    return createdContents;
  },

  async updatePlaylistContent({ reqUser, params, body }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { id } = params;
    const { type, name, image_url, video_url, audio_url, website_url, duration_seconds, metadata, order_index } = body;

    // Check if content exists and user has access to the playlist
    const content = await repository.findOnePlaylistContent({ id });
    if (!content) {
      throw Object.assign(new Error('Content not found'), { status: 404 });
    }

    const playlist = await repository.findOnePlaylist({ 
      id: content.playlist_id, 
      account_id: selectedAccount,
      deleted_at: null 
    });
    
    if (!playlist) {
      throw Object.assign(new Error('Access denied to this content'), { status: 403 });
    }

    if (type && !VALID_CONTENT_TYPES.includes(type)) {
      throw Object.assign(new Error('Invalid content type. Must be one of: ' + VALID_CONTENT_TYPES.join(', ')), { status: 400 });
    }

    // Validate URL based on type
    const finalType = type || content.type;
    const hasValidUrl = (finalType === 'image' && (image_url || content.image_url)) ||
                       (finalType === 'video' && (video_url || content.video_url)) ||
                       (finalType === 'audio' && (audio_url || content.audio_url)) ||
                       (finalType === 'website' && (website_url || content.website_url)) ||
                       (finalType === 'text');

    if (!hasValidUrl) {
      throw Object.assign(new Error(`Valid URL is required for content type "${finalType}"`), { status: 400 });
    }

    // Update the content
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (video_url !== undefined) updateData.video_url = video_url;
    if (audio_url !== undefined) updateData.audio_url = audio_url;
    if (website_url !== undefined) updateData.website_url = website_url;
    if (duration_seconds !== undefined) updateData.duration_seconds = parseInt(duration_seconds) || 0;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (order_index !== undefined) updateData.order_index = parseInt(order_index);

    const updatedContent = await repository.updatePlaylistContentById(id, updateData);

    // Update playlist stats if duration changed
    if (duration_seconds !== undefined) {
      await repository.updatePlaylistStats(content.playlist_id);
    }

    return updatedContent;
  },

  async deletePlaylistContent({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { id } = params;

    // Check if content exists and user has access to the playlist
    const content = await repository.findOnePlaylistContent({ id });
    if (!content) {
      throw Object.assign(new Error('Content not found'), { status: 404 });
    }

    const playlist = await repository.findOnePlaylist({ 
      id: content.playlist_id, 
      account_id: selectedAccount,
      deleted_at: null 
    });
    
    if (!playlist) {
      throw Object.assign(new Error('Access denied to this content'), { status: 403 });
    }

    // Delete the content
    await repository.deletePlaylistContentById(id);

    // Update playlist stats
    await repository.updatePlaylistStats(content.playlist_id);

    return { message: 'Content deleted successfully' };
  },

  async reorderPlaylistContents({ reqUser, params, body }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { playlistId } = params;
    const { contentOrders } = body;

    if (!contentOrders || !Array.isArray(contentOrders)) {
      throw Object.assign(new Error('Content orders array is required'), { status: 400 });
    }

    // Check if playlist exists and user has access
    const playlist = await repository.findOnePlaylist({ 
      id: playlistId, 
      account_id: selectedAccount,
      deleted_at: null 
    });
    
    if (!playlist) {
      throw Object.assign(new Error('Playlist not found or access denied'), { status: 404 });
    }

    // Validate that all content IDs belong to this playlist
    const existingContents = await repository.findPlaylistContents({ playlist_id: playlistId });
    const existingContentIds = existingContents.map(c => c.id);
    
    for (const order of contentOrders) {
      if (!existingContentIds.includes(order.id)) {
        throw Object.assign(new Error(`Content with ID ${order.id} does not belong to this playlist`), { status: 400 });
      }
    }

    // Reorder the contents
    await repository.reorderPlaylistContents(playlistId, contentOrders);

    return { message: 'Contents reordered successfully' };
  },

  // Helper method to validate contents
  validateContents(contents) {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      const { type, name } = content;

      if (!type || !VALID_CONTENT_TYPES.includes(type)) {
        throw Object.assign(new Error(`Invalid content type at index ${i}. Must be one of: ${VALID_CONTENT_TYPES.join(', ')}`), { status: 400 });
      }

      if (!name) {
        throw Object.assign(new Error(`Content name is required at index ${i}`), { status: 400 });
      }

      // Validate that at least one URL is provided based on type
      const { image_url, video_url, audio_url, website_url } = content;
      const hasValidUrl = (type === 'image' && image_url) ||
                         (type === 'video' && video_url) ||
                         (type === 'audio' && audio_url) ||
                         (type === 'website' && website_url) ||
                         (type === 'text');

      if (!hasValidUrl) {
        throw Object.assign(new Error(`Valid URL is required for content type "${type}" at index ${i}`), { status: 400 });
      }
    }
  },

  // Helper method to prepare contents for database insertion
  prepareContents(playlistId, contents) {
    return contents.map((content, index) => {
      const { type, name, image_url, video_url, audio_url, website_url, duration_seconds = 0, metadata, order_index } = content;
      
      // Use provided order_index or auto-generate
      const finalOrderIndex = order_index !== undefined ? parseInt(order_index) : index + 1;
      
      if (finalOrderIndex < 1) {
        throw Object.assign(new Error(`Invalid order_index at index ${index}. Must be a positive integer`), { status: 400 });
      }

      return {
        playlist_id: playlistId,
        order_index: finalOrderIndex,
        type,
        name,
        image_url: type === 'image' ? image_url : null,
        video_url: type === 'video' ? video_url : null,
        audio_url: type === 'audio' ? audio_url : null,
        website_url: type === 'website' ? website_url : null,
        duration_seconds: parseInt(duration_seconds) || 0,
        metadata
      };
    });
  }
};