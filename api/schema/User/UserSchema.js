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