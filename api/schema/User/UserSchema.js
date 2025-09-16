// api/validations/user.js
// api/controllers/UserController.js
const Joi = require('joi');
const timeZone = require('../../enums/timeZone');
const userType = require('../../enums/userType');
const roleType = require('../../enums/roleType');
const permissionType = require('../../enums/permissionType');
const accessLevel = require('../../enums/accessLevel');

// Schema for User model (up to apiKey)
const createUserSchema = Joi.object({
  currentAccountId: Joi.number().required(),
  name: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().required(),
  timezoneName: Joi.string().required().valid(...Object.values(timeZone)),

  userType: Joi.string().required().valid(...Object.values(userType)),
  allowAllBrands: Joi.boolean().required(),
  allowAllBrandsList: Joi.array().items(Joi.number()).when('allowAllBrands', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  roleType: Joi.string().required().valid(...Object.values(roleType)),
  permissions: Joi.array().items(Joi.object({
    permissionType: Joi.string().required().valid(...Object.values(permissionType)),
    accessLevel: Joi.string().required().valid(...Object.values(accessLevel))
  })).required()
});

module.exports = {
  createUserSchema
};

// Schema for editing a user: mirror create schema but all fields optional
const editUserSchema = Joi.object({
  // User fields
  name: Joi.string().optional(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().optional(),
  currentAccountId: Joi.number().optional(),

  // UserAccount fields
  roleType: Joi.string().optional().valid(...Object.values(roleType)),
  userType: Joi.string().optional().valid(...Object.values(userType)),
  timeZoneName: Joi.string().optional().valid(...Object.values(timeZone)),
  timezoneName: Joi.string().optional().valid(...Object.values(timeZone)),
  isFirstTimeLogin: Joi.boolean().optional(),
  acceptedTermsAndConditions: Joi.boolean().optional(),
  allowAllAdvertisers: Joi.boolean().optional(),
  useCustomBranding: Joi.boolean().optional(),
  lastReadReleaseNotesVersion: Joi.number().optional(),
  active: Joi.boolean().optional(),
  enableTwoFactorAuthentication: Joi.boolean().optional(),

  // Permissions: each object validates like create, but entire array optional
  permissions: Joi.array().items(Joi.object({
    permissionType: Joi.string().required().valid(...Object.values(permissionType)),
    accessLevel: Joi.string().required().valid(...Object.values(accessLevel))
  })).optional()
}).unknown(false);

module.exports.editUserSchema = editUserSchema;