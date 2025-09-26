const Joi = require('joi');

const createBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  type: Joi.string().trim().optional(),
  assetUrl: Joi.string().trim().optional(),
  publisherSharePerc: Joi.number().optional(),
  metadata: Joi.object().optional(),
  allowAllProducts: Joi.boolean().optional(),
  parentCompanyId: Joi.number().optional(),
  customId: Joi.string().trim().optional()
});

module.exports = {
  createBrandSchema
};


