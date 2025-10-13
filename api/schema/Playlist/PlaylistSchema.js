const Joi = require('joi');

const VALID_STATUSES = ['active', 'inactive', 'archived', 'deleted'];
const VALID_CONTENT_TYPES = ['image', 'video', 'audio', 'website', 'text'];

// Schema for creating a playlist
const createPlaylistSchema = Joi.object({
  name: Joi.string().required().max(255).trim(),
  description: Joi.string().optional().allow('').allow(null).trim(),
  metadata: Joi.object().optional().allow(null),
  thumbnail_url: Joi.string().uri().optional().allow('').allow(null),
  status: Joi.string().valid(...VALID_STATUSES).optional().default('active'),
  contents: Joi.array().items(
    Joi.object({
      type: Joi.string().valid(...VALID_CONTENT_TYPES).required(),
      name: Joi.string().required().max(255).trim(),
      image_url: Joi.string().uri().optional().allow(''),
      video_url: Joi.string().uri().optional().allow(''),
      audio_url: Joi.string().uri().optional().allow(''),
      website_url: Joi.string().uri().optional().allow(''),
      duration_seconds: Joi.number().integer().min(0).optional().default(0),
      order_index: Joi.number().integer().min(1).optional(),
      metadata: Joi.object().optional()
    }).custom((value, helpers) => {
      // Validate that at least one URL is provided based on type
      const hasValidUrl = (value.type === 'image' && value.image_url) ||
                         (value.type === 'video' && value.video_url) ||
                         (value.type === 'audio' && value.audio_url) ||
                         (value.type === 'website' && value.website_url) ||
                         (value.type === 'text');

      if (!hasValidUrl) {
        return helpers.error('custom.urlRequired', { type: value.type });
      }
      return value;
    }, 'URL validation')
  ).optional().default([])
}).unknown(false);

// Schema for updating a playlist
const updatePlaylistSchema = Joi.object({
  name: Joi.string().optional().max(255).trim(),
  description: Joi.string().optional().allow('').allow(null).trim(),
  metadata: Joi.object().optional().allow(null),
  thumbnail_url: Joi.string().uri().optional().allow('').allow(null),
  status: Joi.string().valid(...VALID_STATUSES).optional(),
  contents: Joi.array().items(
    Joi.object({
      type: Joi.string().valid(...VALID_CONTENT_TYPES).required(),
      name: Joi.string().required().max(255).trim(),
      image_url: Joi.string().uri().optional().allow(''),
      video_url: Joi.string().uri().optional().allow(''),
      audio_url: Joi.string().uri().optional().allow(''),
      website_url: Joi.string().uri().optional().allow(''),
      duration_seconds: Joi.number().integer().min(0).optional().default(0),
      order_index: Joi.number().integer().min(1).optional(),
      metadata: Joi.object().optional()
    }).custom((value, helpers) => {
      // Validate that at least one URL is provided based on type
      const hasValidUrl = (value.type === 'image' && value.image_url) ||
                         (value.type === 'video' && value.video_url) ||
                         (value.type === 'audio' && value.audio_url) ||
                         (value.type === 'website' && value.website_url) ||
                         (value.type === 'text');

      if (!hasValidUrl) {
        return helpers.error('custom.urlRequired', { type: value.type });
      }
      return value;
    }, 'URL validation')
  ).optional()
}).unknown(false);

// Schema for adding contents to a playlist
const addPlaylistContentsSchema = Joi.object({
  playlistId: Joi.number().integer().positive().required(),
  contents: Joi.array().items(
    Joi.object({
      type: Joi.string().valid(...VALID_CONTENT_TYPES).required(),
      name: Joi.string().required().max(255).trim(),
      image_url: Joi.string().uri().optional().allow(''),
      video_url: Joi.string().uri().optional().allow(''),
      audio_url: Joi.string().uri().optional().allow(''),
      website_url: Joi.string().uri().optional().allow(''),
      duration_seconds: Joi.number().integer().min(0).optional().default(0),
      order_index: Joi.number().integer().min(1).optional(),
      metadata: Joi.object().optional()
    }).custom((value, helpers) => {
      // Validate that at least one URL is provided based on type
      const hasValidUrl = (value.type === 'image' && value.image_url) ||
                         (value.type === 'video' && value.video_url) ||
                         (value.type === 'audio' && value.audio_url) ||
                         (value.type === 'website' && value.website_url) ||
                         (value.type === 'text');

      if (!hasValidUrl) {
        return helpers.error('custom.urlRequired', { type: value.type });
      }
      return value;
    }, 'URL validation')
  ).required().min(1)
}).unknown(false);

// Schema for updating playlist content
const updatePlaylistContentSchema = Joi.object({
  type: Joi.string().valid(...VALID_CONTENT_TYPES).optional(),
  name: Joi.string().optional().max(255).trim(),
  image_url: Joi.string().uri().optional().allow(''),
  video_url: Joi.string().uri().optional().allow(''),
  audio_url: Joi.string().uri().optional().allow(''),
  website_url: Joi.string().uri().optional().allow(''),
  duration_seconds: Joi.number().integer().min(0).optional(),
  metadata: Joi.object().optional(),
  order_index: Joi.number().integer().min(1).optional()
}).unknown(false);

// Schema for reordering playlist contents
const reorderPlaylistContentsSchema = Joi.object({
  contentOrders: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().positive().required(),
      order_index: Joi.number().integer().min(1).required()
    })
  ).required().min(1)
}).unknown(false);

// Schema for listing playlists query parameters
const listPlaylistsQuerySchema = Joi.object({
  status: Joi.string().valid(...VALID_STATUSES).optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
  skip: Joi.number().integer().min(0).optional().default(0),
  sort: Joi.string().optional().default('created_at DESC')
}).unknown(false);

module.exports = {
  createPlaylistSchema,
  updatePlaylistSchema,
  addPlaylistContentsSchema,
  updatePlaylistContentSchema,
  reorderPlaylistContentsSchema,
  listPlaylistsQuerySchema
};