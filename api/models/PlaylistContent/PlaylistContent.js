/**
 * PlaylistContent.js
 *
 * @description :: A model definition for playlist content items
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'playlist_content',

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚╝╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    order_index: {
      type: 'number',
      required: true,
      columnName: 'order_index',
      description: 'Order of this item in the playlist'
    },

    type: {
      type: 'string',
      required: true,
      isIn: ['image', 'video', 'audio', 'website', 'text'],
      description: 'Type of content item'
    },

    name: {
      type: 'string',
      required: true,
      maxLength: 255,
      description: 'Name of the content item'
    },

    image_url: {
      type: 'string',
      allowNull: true,
      columnName: 'image_url',
      description: 'URL of the image content'
    },

    video_url: {
      type: 'string',
      allowNull: true,
      columnName: 'video_url',
      description: 'URL of the video content'
    },

    audio_url: {
      type: 'string',
      allowNull: true,
      columnName: 'audio_url',
      description: 'URL of the audio content'
    },

    website_url: {
      type: 'string',
      allowNull: true,
      columnName: 'website_url',
      description: 'URL of the website content'
    },

    duration_seconds: {
      type: 'number',
      defaultsTo: 0,
      columnName: 'duration_seconds',
      description: 'Duration of this content item in seconds'
    },

    metadata: {
      type: 'json',
      description: 'Additional metadata for the content item'
    },

    playlist_id: {
      type: 'number',
      required: true,
      columnName: 'playlist_id',
      description: 'ID of the playlist this content belongs to'
    },

    created_at: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'created_at',
      description: 'Timestamp when the content was created'
    },

    updated_at: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'updated_at',
      description: 'Timestamp when the content was last updated'
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