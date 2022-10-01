const readFileSync = require('../utilities/read_file_sync');
const gatewaySchema = readFileSync(__dirname, 'schema.graphql');

module.exports = gatewaySchema;