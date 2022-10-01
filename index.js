const express               = require('express');
const { graphqlHTTP }       = require('express-graphql');
const expressPlayground     = require('graphql-playground-middleware-express').default
const depthLimit            = require('graphql-depth-limit');

const { stitchSchemas }     = require('@graphql-tools/stitch');
const { delegateToSchema }  = require('@graphql-tools/delegate');

const newEmployee           = require('./src/resolvers/new_employee_resolver');
const nintendoEmployee      = require('./src/resolvers/nintendo_employee_resolver');
const contactInformation    = require('./src/resolvers/contact_information_resolver');
const gatewaySchema         = require('./src/gateway/schema');

const { healthCheck }       = require('./src/utilities/health_check');
const { retrieveTeamInfo }  = require('./src/services/team_service');

const { schemaTeam, schemaContact, schemaProject } = require('./src/subgraphs/subSchemas');

async function makeGatewaySchema() {

  const subSchemaTeam     = await schemaTeam();  
  const subSchemaContact  = await schemaContact();
  const subSchemaProject  = await schemaProject();

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
      Query: {
        // Resolving the employeeData Query
        employeeData(obj, args, context, info) {
          return retrieveTeamInfo(args.nintendoId);
        }, 
        healthCheck(obj, args, context, info) {
          return "OK";
        }
      },
      Mutation: {
        // Resolving the newEmployee Query
        newEmployee(obj, args, context, info) {
          return newEmployee(subSchemaContact, obj, args, context, info);
        }
      }, 
      // Resolving the NintendoEmployee object
      NintendoEmployee: nintendoEmployee(subSchemaTeam, subSchemaProject), 
        // Resolving the ContactInformation object
      ContactInformation: contactInformation(subSchemaContact),
      // Resolving the Teammate object 
      Teammate: {
        details: {
          selectionSet: `{ nintendoId }`, 
          resolve(teammate, args, context, info) {
            return {nintendoId: teammate.nintendoId, teamId: teammate.teamId}
          }
        }
      },
      // Resolving the Project object 
      Project: {
        franchise: {
          // Defining a Selection Set tells the parent object to include a specific field. 
          // In this case, even if the client doesn't request for the franchiseId, we are guaranteed it will be there thanks to our selectionSet
          selectionSet: `{ franchiseId }`, 
          resolve(project, args, context, info) {
            return delegateToSchema({schema: subSchemaProject, operation: 'query', fieldName: 'franchise', args: { franchiseId: project.franchiseId }, context, info});
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

  app.get('/health', (request, response, next)=> {
    healthCheck().then((res) => { 
      return response.json(res);
    }).catch((err) => {
      return response.status(500).send(err.healthStatus);
    });
    
  });

  app.listen(PORT, () => console.log(`gateway running at http://localhost:${PORT}${CONTEXT_PATH}`));
});
