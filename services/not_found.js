module.exports = class NotFound extends Error {
    constructor(message) {
      super(message || 'Record not found');
      this.extensions = { code: 'NOT_FOUND' };
    }
  };
  