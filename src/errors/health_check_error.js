module.exports = class HealthCheckError extends Error {
    constructor(healthStatus) {
        super('Health check failed');
        this.healthStatus = healthStatus;
        this.extensions = { code: 'INTERNAL_SERVER_ERROR' };
    }
  };
  