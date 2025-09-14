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
  auth0Id: Joi.string().required().optional(),
  authentikId: Joi.string().required().optional(),
  authTokens: Joi.array().items(Joi.string()).required().optional(),
  apiKey: Joi.string().required().optional(),
  timezoneName: Joi.string().required().valid(...Object.values(timeZone)),
  userType: Joi.string().required().valid(...Object.values(userType)),
  roleType: Joi.string().required().valid(...Object.values(roleType)),
  allowAllBrands: Joi.boolean().required(),
  allowAllBrandsList: Joi.array().items(Joi.number()).when('allowAllBrands', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  isFirstTimeLogin: Joi.boolean().default(true),
  lastLoginTimestamp: Joi.date().default(null),
  firstLoginTimestamp: Joi.date().default(null),
  useCustomBranding: Joi.boolean().default(false),
  acceptedTermsAndConditions: Joi.boolean().default(false),
  lastReadReleaseNotesVersion: Joi.string().default(null),
  permissions: Joi.array().items(Joi.object({
    permissionType: Joi.string().required().valid(...Object.values(permissionType)),
    accessLevel: Joi.string().required().valid(...Object.values(accessLevel))
  })).required()
});

module.exports = {
  createUserSchema
};