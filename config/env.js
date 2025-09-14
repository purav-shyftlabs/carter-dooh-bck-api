require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  datastoreUrl: process.env.DATASTORE_URL,
  datastoreConnectionLimit: process.env.DATASTORE_CONNECTION_LIMIT,
  baseUrl: process.env.BASE_URL,
};