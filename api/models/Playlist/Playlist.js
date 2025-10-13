/**
 * Playlist.js
 *
 * @description :: A model definition for playlists in the content management system
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'playlist',

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚╝╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    name: {
      type: 'string',
      required: true,
      maxLength: 255,
      description: 'Name of the playlist'
    },

    description: {
      type: 'string',
      allowNull: true,
      description: 'Description of the playlist'
    },

    metadata: {
      type: 'json',
      description: 'Additional metadata for the playlist'
    },

    thumbnail_url: {
      type: 'string',
      allowNull: true,
      columnName: 'thumbnail_url',
      description: 'URL of the playlist thumbnail image'
    },

    status: {
      type: 'string',
      defaultsTo: 'active',
      isIn: ['active', 'inactive', 'archived', 'deleted'],
      description: 'Status of the playlist'
    },

    total_items: {
      type: 'number',
      defaultsTo: 0,
      columnName: 'total_items',
      description: 'Total number of items in the playlist'
    },

    duration_seconds: {
      type: 'number',
      defaultsTo: 0,
      columnName: 'duration_seconds',
      description: 'Total duration of the playlist in seconds'
    },

    account_id: {
      type: 'number',
      required: true,
      columnName: 'account_id',
      description: 'Account this playlist belongs to'
    },

    user_id: {
      type: 'number',
      required: true,
      columnName: 'user_id',
      description: 'User who created this playlist'
    },

    deleted_at: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'deleted_at',
      description: 'Timestamp when the playlist was soft deleted',
    },

    created_at: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'created_at',
      description: 'Timestamp when the playlist was created',
      autoCreatedAt: true
    },

    updated_at: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'updated_at',
      description: 'Timestamp when the playlist was last updated',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝
    // n/a

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    // n/a

  },

};