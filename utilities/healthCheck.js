const { fetch }         = require('cross-fetch');
const { GraphQLError}   = require('graphql');
const HealthCheckError  = require('../services/errors/health_check_error');

const healthCheckUri = "http://localhost:8080/nintendo/graphql?query={healthCheck}";

async function healthCheck() {
    try {
        const response = await fetch(healthCheckUri, {method: 'GET'});

        const result = await response.json();

        const errors = result.errors;

        if (errors != null) {
            console.log(errors[0].message);
            throw new GraphQLError(errors[0].message);
        }

        const healthCheck = result.data.healthCheck;

        if (healthCheck === "OK") {
            return healthCheck
        } else {
            throw new HealthCheckError(healthCheck);
        }

    } catch(err) {
        throw err;
    }
};

module.exports = { healthCheck }