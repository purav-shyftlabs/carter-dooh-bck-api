const Joi = require('joi');

const createParentCompanySchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  customId: Joi.string().trim().optional()
});

const updateParentCompanySchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  customId: Joi.string().trim().allow(null, '').optional()
}).min(1);

module.exports = {
  createParentCompanySchema,
  updateParentCompanySchema
};


