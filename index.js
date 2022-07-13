const express = require('express');

const { graphqlHTTP } = require('express-graphql');
const { stitchSchemas } = require('@graphql-tools/stitch');
const { delegateToSchema } = require('@graphql-tools/delegate')
const { introspectSchema } = require('@graphql-tools/wrap');

const makeRemoteExecutor = require('./services/make_remote_executor');
const individualSchema = require('./subgraphs/team/schema');

async function makeGatewaySchema() {
  // Make remote executors:
  //  These are simple functions that query a remote GraphQL API for JSON.
  const individualExec = makeRemoteExecutor('http://localhost:8081/nintendo/team/graphql');
  const contactExec = makeRemoteExecutor('http://localhost:8082/nintendo/contact/graphql');

  // We are pulling in the schemas locally and using the executor to call the API to retrieve the requested data
  const subSchemaIndividual = { 
    schema: individualSchema, 
    executor: individualExec
  }
  // Here we are pulling the schema remotely using introspection and using the executor to call the API to retrieve the requested data
  const subSchemaContact = { 
    schema: await introspectSchema(contactExec), 
    executor: contactExec
  }


  // Under the hood, `stitchSchemas` is a wrapper for `makeExecutableSchema`,
  // and accepts all of its same options. This allows extra type definitions
  // and resolvers to be added directly into the top-level gateway proxy schema.
  return stitchSchemas({
    // Adding our subSchemas
    subschemas: [subSchemaIndividual, subSchemaContact],
    typeDefs: 
    `
      type Query {
        # Retrieve all employee information associated to a NintendoID
        employeeDataById(id: String!): NintendoEmployee
      }

      type NintendoEmployee {
        nintendoId: String!
        name: Name
        teammates: [Teammate]
        contactInformation: ContactInformation
      }

      # Extending the Teammate type to allow look ups information for a member
      extend type Teammate {
        contactInformation: ContactInformation
      }

      type ContactInformation {
        nintendoId: String!
        address: [Address]
        addressHistories(first: Int!, before: String): addressHistoryConnection
        phone: [Phone]
        phoneHistories(first: Int!, before: String): phoneHistoryConnection
        email: [Email]
        emailHistories(first: Int!, before: String): emailHistoryConnection
      }
    `
    ,
    resolvers: {
      // Resolving the employeeDataById Query
      Query: {
        employeeDataById(obj, args, context, info) {
          const nintendoEmployee = {nintendoId: args.id}
          return nintendoEmployee
        } 
      },
      // Resolving the NintendoEmployee object
      NintendoEmployee: {
        name: {
          selectionSet: `{ id }`, 
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({schema: subSchemaIndividual, operation: 'query', fieldName: 'name', args: { id: nintendoEmployee.nintendoId }, context, info})
          }
        },
        teammates: {
          selectionSet: `{ id }`, 
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({schema: subSchemaIndividual, operation: 'query', fieldName: 'teammates', args: { id: nintendoEmployee.nintendoId }, context, info})
          }
        },
        contactInformation: {
          selectionSet: `{ id }`, 
          resolve(nintendoEmployee, args, context, info) {
            return {nintendoId: nintendoEmployee.nintendoId}
          }
        }
      }, 
      // Resolving the Teammate object
      Teammate: {
        contactInformation: {
          selectionSet: `{ id }`, 
          resolve(teammate, args, context, info) {
            return {nintendoId: teammate.nintendoId}
          }
        }
      },
      // Resolving the ContactInformation object that is used by both Teammate and NintendoEmployee
      ContactInformation: {
        address: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'addresses', args: { id: contactInformation.nintendoId }, context, info})
          }
        },
        addressHistories: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'addressHistories', 
              args: { 
                id: contactInformation.nintendoId, 
                rows: args.first,
                before: args.before
              }, 
              context, info})
          }
        },
        phone: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'phones', args: { id: contactInformation.nintendoId }, context, info})
          }
        }, 
        phoneHistories: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'phoneHistories', 
              args: { 
                id: contactInformation.nintendoId, 
                rows: args.first,
                before: args.before
              }, 
              context, info})
          }
        }, 
        email: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'emails', args: { id: contactInformation.nintendoId }, context, info})
          }
        },
        emailHistories: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'emailHistories', 
              args: { 
                id: contactInformation.nintendoId, 
                rows: args.first,
                before: args.before
              }, 
              context, info})
          }
        }
      }
    }
  });
}

makeGatewaySchema().then(schema => {
  const app = express();
  app.use('/nintendo/graphql', graphqlHTTP({ schema, graphiql: true }));
  app.listen(8080, () => console.log('gateway running at http://localhost:8080/nintendo/graphql'));
});
