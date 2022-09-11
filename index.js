const express               = require('express');
const { graphqlHTTP }       = require('express-graphql');
const expressPlayground     = require('graphql-playground-middleware-express').default
const depthLimit            = require('graphql-depth-limit');

const { stitchSchemas }     = require('@graphql-tools/stitch');
const { delegateToSchema }  = require('@graphql-tools/delegate');
const { introspectSchema }  = require('@graphql-tools/wrap');

const { retrieveTeamInfo }  = require('./services/team_service');
const makeRemoteExecutor    = require('./services/make_remote_executor');
const newEmployee           = require('./resolvers/new_employee_resolver');
const teamSchema            = require('./subgraphs/team/schema');
const gatewaySchema         = require('./gateway_schema');

async function makeGatewaySchema() {
  // These executors are simple functions used to delegate queries and mutations from the gateway graph to their respective subgraphs
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

  // Under the hood, `stitchSchemas` is a wrapper for `makeExecutableSchema`,
  // and accepts all of its same options. This allows extra type definitions
  // and resolvers to be added directly into the top-level gateway proxy schema.
  return stitchSchemas({
    // Our Stitched Gateway will have access to all queries/mutations defined by our Sub Graphs
    subschemas: [subSchemaTeam, subSchemaContact, subSchemaProject],
    // Defining extra types, queries, and mutations on the Gateway Schema
    typeDefs: gatewaySchema,
    // Resolving our Gateway Schema
    resolvers: {
      // Resolving the employeeData Query
      Query: {
        employeeData(obj, args, context, info) {
          return retrieveTeamInfo(args.nintendoId);
        }
      },
      // Resolving the newEmployee Query
      Mutation: {
        newEmployee(obj, args, context, info) {
          return newEmployee(subSchemaContact, obj, args, context, info);
        }
      }, 
      // Resolving the NintendoEmployee object
      NintendoEmployee: {
        name: {
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({schema: subSchemaTeam, operation: 'query', fieldName: 'myName', args: { nintendoId: nintendoEmployee.nintendoId }, context, info})
          }
        },
        teamInfo: {
          resolve(nintendoEmployee, args, context, info) {
            var teamInfo = nintendoEmployee.teamInfo
            if(null == teamInfo) {
              return delegateToSchema({schema: subSchemaTeam, operation: 'query', fieldName: 'myPrimaryTeam', args: { nintendoId: nintendoEmployee.nintendoId }, context, info})
            }
            return teamInfo            
          }
        },
        contactInformation: {
          resolve(nintendoEmployee, args, context, info) {
            return {nintendoId: nintendoEmployee.nintendoId}
          }
        },
        teammates: {
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({schema: subSchemaTeam, operation: 'query', fieldName: 'myTeammates', args: { nintendoId: nintendoEmployee.nintendoId }, context, info})
          }
        },
        projects : {
          selectionSet: `{ teamId }`, 
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({
              schema: subSchemaProject, operation: 'query', fieldName: 'projectsByCriteria', 
              args: { 
                teamId: nintendoEmployee.teamId,
                franchiseId: args.franchiseId,
                status: args.status
              }, context, info});
          }
        }
      }, 
      // Resolving the Teammate object 
      Teammate: {
        details: {
          // Definiting the Selection Set tells the parent object to include a specific field
          selectionSet: `{ nintendoId }`, 
          resolve(teammate, args, context, info) {
            return {nintendoId: teammate.nintendoId, teamId: teammate.teamId}
          }
        }
      },
      // Resolving the Project object 
      Project: {
        franchise: {
          // Definiting the Selection Set tells the parent object to include a specific field
          selectionSet: `{ franchiseId }`, 
          resolve(project, args, context, info) {
            return delegateToSchema({schema: subSchemaProject, operation: 'query', fieldName: 'franchise', args: { franchiseId: project.franchiseId }, context, info});
          }
        }
      },
      // Resolving the ContactInformation object
      ContactInformation: {
        addresses: {
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'addresses', args: { nintendoId: contactInformation.nintendoId }, context, info});
          }
        },
        addressHistories: {
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'addressHistories', 
              args: { 
                nintendoId: contactInformation.nintendoId, 
                rows: args.first,
                before: args.before
              }, context, info});
          }
        },
        phones: {
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'phones', args: { nintendoId: contactInformation.nintendoId }, context, info});
          }
        }, 
        phoneHistories: {
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'phoneHistories', 
              args: { 
                nintendoId: contactInformation.nintendoId, 
                rows: args.first,
                before: args.before
              }, context, info});
          }
        }, 
        emails: {
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'emails', args: { nintendoId: contactInformation.nintendoId }, context, info});
          }
        },
        emailHistories: {
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'emailHistories', 
              args: { 
                nintendoId: contactInformation.nintendoId, 
                rows: args.first,
                before: args.before
              }, context, info});
          }
        }
      }
    }
  });
}

makeGatewaySchema().then(schema => {
  const PORT = 8080;
  const CONTEXT_PATH = "/nintendo/graphql";
  const app = express();

  app.use(CONTEXT_PATH, graphqlHTTP({ 
    schema, 
    // Since NintendoEmployee has a Teammate field and we extended Teammate to have a NintendoEmployee field
    // it is really easy for a malicious actor to take advantage of this feature by sending a chained Malicious Query and overwhelm/crash our API
    // To prevent this, we can add a depthLimit
    validationRules: [ depthLimit(5) ]
  }));

  app.get('/nintendo/playground', expressPlayground({endpoint: CONTEXT_PATH}));
  app.listen(PORT, () => console.log(`gateway running at http://localhost:${PORT}${CONTEXT_PATH}`));
});
