"use strict";

module.exports = {
  // Playlist CRUD operations
  async createPlaylist(values) {
    return await Playlist.create(values).fetch();
  },

  async updatePlaylistById(id, values) {
    return await Playlist.updateOne({ id }).set(values);
  },

  async findOnePlaylist(where) {
    return await Playlist.findOne({ where });
  },

  async findPlaylists(where, options = {}) {
    const query = { where };
    if (options.sort) query.sort = options.sort;
    if (options.limit) query.limit = options.limit;
    if (options.skip) query.skip = options.skip;
    return await Playlist.find(query);
  },

  async deletePlaylistById(id) {
    return await Playlist.destroyOne({ id });
  },

  // PlaylistContent CRUD operations
  async createPlaylistContent(values) {
    return await PlaylistContent.create(values).fetch();
  },

  async updatePlaylistContentById(id, values) {
    return await PlaylistContent.updateOne({ id }).set(values);
  },

  async findOnePlaylistContent(where) {
    return await PlaylistContent.findOne({ where });
  },

  async findPlaylistContents(where, options = {}) {
    const query = { where };
    if (options.sort) query.sort = options.sort;
    if (options.limit) query.limit = options.limit;
    if (options.skip) query.skip = options.skip;
    return await PlaylistContent.find(query);
  },

  async deletePlaylistContentById(id) {
    return await PlaylistContent.destroyOne({ id });
  },

  // Batch operations for playlist content
  async createMultiplePlaylistContents(contents) {
    return await PlaylistContent.createEach(contents).fetch();
  },

  async deletePlaylistContentsByPlaylistId(playlistId) {
    return await PlaylistContent.destroy({ playlist_id: playlistId });
  },

  async reorderPlaylistContents(playlistId, contentOrders) {
    const updates = contentOrders.map(({ id, order_index }) => 
      PlaylistContent.updateOne({ id }).set({ order_index })
    );
    return await Promise.all(updates);
  },

  // Helper functions
  async getPlaylistWithContents(playlistId) {
    const playlist = await this.findOnePlaylist({ id: playlistId });
    if (!playlist) return null;

    const contents = await this.findPlaylistContents(
      { playlist_id: playlistId },
      { sort: 'order_index ASC' }
    );

    return {
      ...playlist,
      contents
    };
  },

  async updatePlaylistStats(playlistId) {
    const contents = await this.findPlaylistContents({ playlist_id: playlistId });
    const totalItems = contents.length;
    const durationSeconds = contents.reduce((total, content) => total + (content.duration_seconds || 0), 0);

    return await this.updatePlaylistById(playlistId, {
      total_items: totalItems,
      duration_seconds: durationSeconds
    });
  },

  async getOwnerNamesByIds(userIds) {
    if (!userIds || userIds.length === 0) return new Map();
    const uniqueIds = Array.from(new Set(userIds));
    const ds = sails.getDatastore();
    const sql = `SELECT id,
      COALESCE(NULLIF(name, ''), NULLIF(concat_ws(' ', first_name, last_name), ''), email) AS owner_name
      FROM "user" WHERE id = ANY($1)`;
    const result = await ds.sendNativeQuery(sql, [uniqueIds]);
    const rows = result && result.rows ? result.rows : [];
    const map = new Map();
    rows.forEach(r => { map.set(r.id, r.owner_name); });
    return map;
  },

  async getAccountDetailsByIds(accountIds) {
    if (!accountIds || accountIds.length === 0) return [];
    const uniqueIds = Array.from(new Set(accountIds));
    const ds = sails.getDatastore();
    const sql = `SELECT id, name FROM account WHERE id = ANY($1) ORDER BY name ASC`;
    const result = await ds.sendNativeQuery(sql, [uniqueIds]);
    const rows = result && result.rows ? result.rows : [];
    return rows.map(row => ({
      accountId: row.id,
      accountName: row.name
    }));
  }
};