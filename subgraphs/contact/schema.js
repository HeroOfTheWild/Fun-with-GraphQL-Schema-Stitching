const { makeExecutableSchema } = require('@graphql-tools/schema');
const readFileSync = require('../../services/read_file_sync');
const typeDefs = readFileSync(__dirname, 'schema.graphql');
/**
 * NOTE: The schema.graphql and schema.js for the contact service are not being used by the Stitched Gateway.
 * This is because we are retrieving the schema definition directly using Introspection. 
 */
module.exports = makeExecutableSchema({
  typeDefs
});
