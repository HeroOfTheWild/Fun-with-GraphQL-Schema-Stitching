const express     = require('express');
const depthLimit  = require('graphql-depth-limit');

const { graphqlHTTP }   = require('express-graphql');
const { stitchSchemas } = require('@graphql-tools/stitch');
const { delegateToSchema } = require('@graphql-tools/delegate')
const { introspectSchema } = require('@graphql-tools/wrap');
const { fetch } = require('cross-fetch');
const { print } = require('graphql');

const NotFound = require('./services/not_found');

const teamSchema          = require('./subgraphs/team/schema');
const makeRemoteExecutor  = require('./services/make_remote_executor');

async function makeGatewaySchema() {
  // Make remote executors:
  //  These are simple functions that query a remote GraphQL API for JSON.
  const teamExec    = makeRemoteExecutor('http://localhost:8081/nintendo/team/graphql');
  const contactExec = makeRemoteExecutor('http://localhost:8082/nintendo/contact/graphql');
  const projectExec = makeRemoteExecutor('http://localhost:8083/nintendo/project/graphql');

  // We are pulling in the schemas locally and using the executor to call the API to retrieve the requested data
  const subSchemaTeam = { 
    schema: teamSchema, 
    executor: teamExec
  }

  // Here we are pulling the schema remotely using introspection and using the executor to call the API to retrieve the requested data
  const subSchemaContact = { 
    schema: await introspectSchema(contactExec), 
    executor: contactExec
  }

  // Here we are pulling the schema remotely using introspection and using the executor to call the API to retrieve the requested data
  const subSchemaProject = { 
    schema: await introspectSchema(projectExec), 
    executor: projectExec
  }

  // GraphQL Query to retrieve the Team Details associated to a NintendoId
  const myTeamInfoQuery = `
      query primary($nintendoId: NintendoId!) {
        primaryTeam(nintendoId: $nintendoId) {
            nintendoId
            teamId
            teamName
            managerId
        }
      }
  `

  // Under the hood, `stitchSchemas` is a wrapper for `makeExecutableSchema`,
  // and accepts all of its same options. This allows extra type definitions
  // and resolvers to be added directly into the top-level gateway proxy schema.
  return stitchSchemas({
    // Adding our subSchemas
    subschemas: [subSchemaTeam, subSchemaContact, subSchemaProject],
    typeDefs: 
    `
      type Query {
        # Retrieve all employee information associated to a NintendoID
        employeeData(id: NintendoId!): NintendoEmployee
      }

      type NintendoEmployee {
        nintendoId: String!
        teamId: String!
        name: Name
        projects(franchiseId: String, status: ProjectStatus): [Project]
        contactInformation: ContactInformation
        teammates: [Teammate]
      }

      # Extending the Teammate type to allow look ups information for a member
      extend type Teammate {
        details: NintendoEmployee
      }

      # Extending the Project type to bring in the Franchise Information
      extend type Project {
        franchise: Franchise
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
        employeeData(obj, args, context, info) {
          const query = typeof myTeamInfoQuery === 'string' ? myTeamInfoQuery : print(myTeamInfoQuery);
          const ninId = args.id
          return fetch('http://localhost:8081/nintendo/team/graphql', {
            method: 'POST',
            body: JSON.stringify({ 
              query, 
              variables: { nintendoId: ninId } 
            }),
          }).then((response) => response.json()).then(result => {
            const info = result.data.primaryTeam
            if (null === info) {
              throw new NotFound("No record found with this ID: " + ninId);
            }

            return  {
                      nintendoId: info.nintendoId, 
                      teamId: info.teamId,
                      teamName: info.teamName,
                      managerId: info.managerId
                    }
          }).catch((err) => {
            throw err;
          })
        } 
      },
      // Resolving the NintendoEmployee object
      NintendoEmployee: {
        name: {
          selectionSet: `{ id }`, 
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({schema: subSchemaTeam, operation: 'query', fieldName: 'name', args: { nintendoId: nintendoEmployee.nintendoId }, context, info})
          }
        },
        teammates: {
          selectionSet: `{ id }`, 
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({schema: subSchemaTeam, operation: 'query', fieldName: 'teammates', args: { nintendoId: nintendoEmployee.nintendoId }, context, info})
          }
        },
        projects : {
          selectionSet: `{ id }`, 
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({
              schema: subSchemaProject, operation: 'query', fieldName: 'projectsByCriteria', 
              args: { 
                teamId: nintendoEmployee.teamId,
                franchiseId: args.franchiseId,
                status: args.status
              }, context, info})
          }
        },
        // Setting up the Contact Information with the NintendoId
        contactInformation: {
          selectionSet: `{ id }`, 
          resolve(nintendoEmployee, args, context, info) {
            return {nintendoId: nintendoEmployee.nintendoId}
          }
        }
      }, 
      // Resolving the Teammate object 
      Teammate: {
        details: {
          selectionSet: `{ id }`, 
          resolve(teammate, args, context, info) {
            return {nintendoId: teammate.nintendoId, teamId: teammate.teamId}
          }
        }
      },
      // Resolving the Project object 
      Project: {
        franchise: {
          selectionSet: `{ id }`, 
          resolve(project, args, context, info) {
            return delegateToSchema({schema: subSchemaProject, operation: 'query', fieldName: 'franchise', args: { franchiseId: project.franchiseId }, context, info})
          }
        }
      },
      // Resolving the ContactInformation object
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
  app.use('/nintendo/graphql', graphqlHTTP({ 
    schema, 
    graphiql: true,
    // Since NintendoEmployee has a Teammate field and we extended Teammate to have a NintendoEmployee field
    // it is really easy for a malicious actor to take advantage of this feature by sending a chained Malicious Query and overwhelm/crash our API
    // To prevent this, we can add a depthLimit
    validationRules: [ depthLimit(5) ]
  }));
  app.listen(8080, () => console.log('gateway running at http://localhost:8080/nintendo/graphql'));
});
