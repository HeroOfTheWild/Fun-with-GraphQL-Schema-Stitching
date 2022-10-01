module.exports = class IssueEmployeeError extends Error {
    constructor(message) {
      super(message || 'Failed to create new member');
      this.extensions = { code: 'INTERNAL_SERVER_ERROR' };
    }
  };
  