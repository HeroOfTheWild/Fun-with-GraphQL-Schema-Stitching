const express     = require('express');
const depthLimit  = require('graphql-depth-limit');

const { graphqlHTTP }       = require('express-graphql');
const { stitchSchemas }     = require('@graphql-tools/stitch');
const { delegateToSchema }  = require('@graphql-tools/delegate');
const { introspectSchema }  = require('@graphql-tools/wrap');
const { Kind } = require('graphql');

const { retrieveTeamInfo, issueNewTeammate }     = require('./services/team_service');
const { addressCollectionSet, phoneCollectionSet, emailCollectionSet } = require('./services/contact_selection_set');
const teamSchema          = require('./subgraphs/team/schema');
const makeRemoteExecutor  = require('./services/make_remote_executor');
const gatewaySchema       = require('./gateway_schema');

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
          return retrieveTeamInfo(args.id);
        } 
      },
      // Resolving the newEmployee Query
      Mutation: {
        newEmployee(obj, args, context, info) {
          const newTeammate = issueNewTeammate(args.nintendoEmployee.teammate);

          return newTeammate.then((newEmployeeWoohoo) => {
            const newNintendoId = newEmployeeWoohoo.nintendoId;
            const teamId = newEmployeeWoohoo.teamId;
            const name = newEmployeeWoohoo.name;
            const teamInfo = newEmployeeWoohoo.teamInfo;

            var phoneArgument = args.nintendoEmployee.phone;
            phoneArgument.nintendoId = newNintendoId;

            const newPhone = delegateToSchema({
              schema: subSchemaContact, operation: 'mutation', fieldName: 'issuePhone', 
              args: { phone: phoneArgument }, context, info,
              returnType: info.schema.getMutationType().toConfig().fields['issuePhone'].type,
              selectionSet: phoneCollectionSet
            });
  
            var emailArgument = args.nintendoEmployee.email;
            emailArgument.nintendoId = newNintendoId;

            const newEmail = delegateToSchema({
              schema: subSchemaContact, operation: 'mutation', fieldName: 'issueEmail', 
              args: { email: emailArgument }, context, info,
              returnType: info.schema.getMutationType().toConfig().fields['issueEmail'].type,
              selectionSet: emailCollectionSet
            });
  
            var addressArgument = args.nintendoEmployee.address;
            addressArgument.nintendoId = newNintendoId;

            const newAddress = delegateToSchema({
              schema: subSchemaContact, operation: 'mutation', fieldName: 'issueAddress', 
              args: { address: addressArgument }, context, info,
              returnType: info.schema.getMutationType().toConfig().fields['issueAddress'].type,
              selectionSet: addressCollectionSet
            });

            return {
              nintendoId: newNintendoId, 
              teamId: teamId, 
              teamInfo: teamInfo,
              name: name,
              address: newAddress,
              phone: newPhone,
              email: newEmail
            }
          })
        },
        newEmployeeV2(obj, args, context, info) {
          return null;
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
        } , 
        teammates: {
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({schema: subSchemaTeam, operation: 'query', fieldName: 'myTeammates', args: { nintendoId: nintendoEmployee.nintendoId }, context, info})
          }
        },
        projects : {
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
          resolve(nintendoEmployee, args, context, info) {
            return {nintendoId: nintendoEmployee.nintendoId}
          }
        }
      }, 
      // Resolving the Teammate object 
      Teammate: {
        details: {
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
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'addresses', args: { nintendoId: contactInformation.nintendoId }, context, info})
          }
        },
        addressHistories: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'addressHistories', 
              args: { 
                nintendoId: contactInformation.nintendoId, 
                rows: args.first,
                before: args.before
              }, 
              context, info})
          }
        },
        phone: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'phones', args: { nintendoId: contactInformation.nintendoId }, context, info})
          }
        }, 
        phoneHistories: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'phoneHistories', 
              args: { 
                nintendoId: contactInformation.nintendoId, 
                rows: args.first,
                before: args.before
              }, 
              context, info})
          }
        }, 
        email: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({schema: subSchemaContact, operation: 'query', fieldName: 'emails', args: { nintendoId: contactInformation.nintendoId }, context, info})
          }
        },
        emailHistories: {
          selectionSet: `{ id }`, 
          resolve(contactInformation, args, context, info) {
            return delegateToSchema({
              schema: subSchemaContact, operation: 'query', fieldName: 'emailHistories', 
              args: { 
                nintendoId: contactInformation.nintendoId, 
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
