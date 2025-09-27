/**
 * Folder.js
 *
 * @description :: A model definition for folders in the file system
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

    parent_id: {
      type: 'number',
      allowNull: true,
      columnName: 'parent_id',
      description: 'Parent folder ID for hierarchical structure'
    },

    account_id: {
      type: 'number',
      required: true,
      columnName: 'account_id',
      description: 'Account this folder belongs to'
    },

    owner_id: {
      type: 'number',
      required: true,
      columnName: 'owner_id',
      description: 'User who created this folder'
    },

    allow_all_brands: {
      type: 'boolean',
      defaultsTo: false,
      columnName: 'allow_all_brands',
      description: 'Whether all brands can access this folder'
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
