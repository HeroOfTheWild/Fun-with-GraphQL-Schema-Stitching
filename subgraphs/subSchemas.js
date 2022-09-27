const { introspectSchema } = require('@graphql-tools/wrap');

// The executor is a simple functions used to delegate queries and mutations from the gateway graph to their respective subgraphs
const makeRemoteExecutor = require('../services/make_remote_executor');

const teamSchema            = require('../subgraphs/team/schema');

// We are pulling in the schemas locally and using the executor to call the API to retrieve the requested data
const schemaTeam = async() => {
    const teamExec    = makeRemoteExecutor('http://localhost:8081/nintendo/team/graphql');

    return {
        schema: teamSchema, 
        executor: teamExec
    }
};

// Here we are pulling the schema remotely using introspection and using the executor to call the API to retrieve the requested data
const schemaContact = async() => {
    const contactExec = makeRemoteExecutor('http://localhost:8082/nintendo/contact/graphql');

    return {
        schema: await introspectSchema(contactExec), 
        executor: contactExec
    }
};

// Here we are pulling the schema remotely using introspection and using the executor to call the API to retrieve the requested data
const schemaProject = async() => {
    const projectExec = makeRemoteExecutor('http://localhost:8083/nintendo/project/graphql');

    return {
        schema: await introspectSchema(projectExec), 
        executor: projectExec
    }
};

module.exports = { schemaTeam, schemaContact, schemaProject };