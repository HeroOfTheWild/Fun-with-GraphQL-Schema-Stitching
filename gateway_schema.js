const readFileSync = require('./services/read_file_sync');
const gatewaySchema = readFileSync(__dirname, 'gateway_schema.graphql');

module.exports = gatewaySchema;