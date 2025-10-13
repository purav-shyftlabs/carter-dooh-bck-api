const responseHelper = require('../../utils/responseHelper');
const playlistService = require('../../services/playlist/playlistService');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
  // Create a new playlist
  create: withController(async (req, res) => {
    const result = await playlistService.createPlaylist({ reqUser: req.user, body: req.body });
    return responseHelper.success(res, result, 'Playlist created successfully', 201);
  }, { action: 'PlaylistController.create' }),

  // Get playlist by ID with contents
  getById: withController(async (req, res) => {
    const result = await playlistService.getPlaylistById({ reqUser: req.user, params: req.params });
    return responseHelper.success(res, result, 'Playlist fetched successfully');
  }, { action: 'PlaylistController.getById' }),

  // List all playlists for the account
  list: withController(async (req, res) => {
    const result = await playlistService.listPlaylists({ reqUser: req.user, query: req.query });
    return responseHelper.success(res, result, 'Playlists fetched successfully');
  }, { action: 'PlaylistController.list' }),

  // Update playlist
  update: withController(async (req, res) => {
    const result = await playlistService.updatePlaylist({ reqUser: req.user, params: req.params, body: req.body });
    return responseHelper.success(res, result, 'Playlist updated successfully');
  }, { action: 'PlaylistController.update' }),

  // Delete playlist (soft delete)
  delete: withController(async (req, res) => {
    const result = await playlistService.deletePlaylist({ reqUser: req.user, params: req.params });
    return responseHelper.success(res, result, 'Playlist deleted successfully');
  }, { action: 'PlaylistController.delete' }),

  // Add contents to playlist
  addContents: withController(async (req, res) => {
    const result = await playlistService.addPlaylistContents({ reqUser: req.user, body: req.body });
    return responseHelper.success(res, result, 'Contents added to playlist successfully');
  }, { action: 'PlaylistController.addContents' }),

  // Update playlist content
  updateContent: withController(async (req, res) => {
    const result = await playlistService.updatePlaylistContent({ reqUser: req.user, params: req.params, body: req.body });
    return responseHelper.success(res, result, 'Content updated successfully');
  }, { action: 'PlaylistController.updateContent' }),

  // Delete playlist content
  deleteContent: withController(async (req, res) => {
    const result = await playlistService.deletePlaylistContent({ reqUser: req.user, params: req.params });
    return responseHelper.success(res, result, 'Content deleted successfully');
  }, { action: 'PlaylistController.deleteContent' }),

  // Reorder playlist contents
  reorderContents: withController(async (req, res) => {
    const result = await playlistService.reorderPlaylistContents({ reqUser: req.user, params: req.params, body: req.body });
    return responseHelper.success(res, result, 'Contents reordered successfully');
  }, { action: 'PlaylistController.reorderContents' })
};