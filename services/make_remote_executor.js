const { fetch } = require('cross-fetch');
const { print } = require('graphql');

// WIP
module.exports = function makeRemoteExecutor(url) {
  return async ({ document, variables, context }) => {
    const query = typeof document === 'string' ? document : print(document);
    const fetchResult = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    });
    return fetchResult.json();
  };
};
