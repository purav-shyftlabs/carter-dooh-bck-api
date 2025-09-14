// api/validations/account.js
const timeZone = require('../../enums/timeZone');
const currency = require('../../enums/currency');
// api/controllers/AccountController.js
const Joi = require('joi');

const createAccountSchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().required().optional(),
  logoUrl: Joi.string().required().optional(),
  timezoneName: Joi.string().required().valid(...Object.values(timeZone)),
  currency: Joi.string().required().valid(...Object.values(currency)),
  isActive: Joi.boolean().default(true),
  approveChangeRequest: Joi.boolean().default(true),
  approveWalletRequest: Joi.boolean().default(true),
  autoApprovalField: Joi.array().items(Joi.string()).default([])
});

module.exports = {
  createAccountSchema
};