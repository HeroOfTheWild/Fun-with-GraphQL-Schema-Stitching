const { makeExecutableSchema } = require('@graphql-tools/schema');

const readFileSync  = require('../../services/read_file_sync');
const schema        = readFileSync(__dirname, 'schema.graphql');

const {GraphQLNintendoId, GraphQLNintendoTeamId } = require('../../resolvers/nintendo_scalars');

const resolvers = {
  NintendoId: GraphQLNintendoId,
  NintendoTeamId: GraphQLNintendoTeamId
}

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
