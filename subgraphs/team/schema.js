const { makeExecutableSchema } = require('@graphql-tools/schema');
const readFileSync = require('../../services/read_file_sync');
const schema = readFileSync(__dirname, 'schema.graphql');

// WIP. Need to add DateTime Definition and Resolver to schema
//const {DateTimeTypeDefinition, DateTimeResolver} = require('graphql-scalars')
const { GraphQLScalarType, GraphQLError, Kind } = require('graphql');

const NINTENDO_ID_REGEX = /nin[0-9]{4}/;

const validate = value => {
  if(typeof value !== "string") {
    throw new GraphQLError(`Value is not string: ${value}`);
  }

  if(!NINTENDO_ID_REGEX.test(value)) {
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
  serialize: validate,
  parseValue: validate,
  parseLiteral: parseLiteral
}

const GraphQLNintendoId = new GraphQLScalarType(GraphQLNintendoIdConfig);

const resolvers = {
  NintendoId: GraphQLNintendoId
}

module.exports = makeExecutableSchema({
  typeDefs: schema,
  resolvers
});
