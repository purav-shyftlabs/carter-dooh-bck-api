/**
 * File.js
 *
 * @description :: A model definition for files in the file system
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚╝╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    name: {
      type: 'string',
      required: true,
      maxLength: 255
    },

    original_filename: {
      type: 'string',
      required: true,
      columnName: 'original_filename',
      maxLength: 255
    },

    folder_id: {
      type: 'number',
      allowNull: true,
      columnName: 'folder_id',
      description: 'Folder this file belongs to (null for root)'
    },

    account_id: {
      type: 'number',
      required: true,
      columnName: 'account_id',
      description: 'Account this file belongs to'
    },

    owner_id: {
      type: 'number',
      required: true,
      columnName: 'owner_id',
      description: 'User who uploaded this file'
    },

    storage_key: {
      type: 'string',
      allowNull: true,
      columnName: 'storage_key',
      description: 'Storage path/key for the file'
    },

    file_size: {
      type: 'number',
      allowNull: true,
      columnName: 'file_size',
      description: 'File size in bytes'
    },

    content_type: {
      type: 'string',
      allowNull: true,
      columnName: 'content_type',
      description: 'MIME type of the file'
    },

    allow_all_brands: {
      type: 'boolean',
      defaultsTo: false,
      columnName: 'allow_all_brands',
      description: 'Whether all brands can access this file'
    },

    metadata: {
      type: 'json',
      defaultsTo: {},
      description: 'Additional file metadata'
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
