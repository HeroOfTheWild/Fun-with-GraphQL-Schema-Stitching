const { makeExecutableSchema } = require('@graphql-tools/schema');
const readFileSync = require('../../services/read_file_sync');
const schema = readFileSync(__dirname, 'schema.graphql');

const { GraphQLScalarType, GraphQLError, Kind } = require('graphql');

const NINTENDO_ID_REGEX = /nin[0-9]{4}/;
const NINTENDO_TEAM_ID_REGEX = /nintendo[0-9a-zA-Z]{2}/;

const validateNintendoId = value => {
  if(typeof value !== "string") {
    throw new GraphQLError(`Value is not string: ${value}`);
  }

  if(!NINTENDO_ID_REGEX.test(value)) {
    throw new GraphQLError(`Value is not a valid Nintendo ID`);
  }

  return value;
}

const validateTeamId = value => {
  if(typeof value !== "string") {
    throw new GraphQLError(`Value is not string: ${value}`);
  }

  if(!NINTENDO_TEAM_ID_REGEX.test(value)) {
    throw new GraphQLError(`Value is not a valid Nintendo ID`);
  }

  return value;
}

const parseLiteral = ast => {
  if(ast.kind !== Kind.STRING) {
    throw new GraphQLError(
      `Query error: Can only parse strings as Nintendo Ids but got a: ${ast.kind}`
      );
  }

  return validate(ast.value);
}

const GraphQLNintendoIdConfig = {
  name: 'NintendoId',
  description: 'A valid NintendoId',
  serialize: validateNintendoId,
  parseValue: validateNintendoId,
  parseLiteral: parseLiteral
}

const GraphQLNintendoTeamIdConfig = {
  name: 'NintendoTeamId',
  description: 'A valid NintendoId',
  serialize: validateTeamId,
  parseValue: validateTeamId,
  parseLiteral: parseLiteral
}

const GraphQLNintendoId = new GraphQLScalarType(GraphQLNintendoIdConfig);
const GraphQLNintendoTeamId = new GraphQLScalarType(GraphQLNintendoTeamIdConfig);

const resolvers = {
  NintendoId: GraphQLNintendoId,
  NintendoTeamId: GraphQLNintendoTeamId
}

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
