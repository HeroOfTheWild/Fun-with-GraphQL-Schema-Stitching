// relay.config.js
module.exports = {
    // ...
    // Configuration options accepted by the `relay-compiler` command-line tool and `babel-plugin-relay`.
    src: "./services",
    language: "javascript", // "javascript" | "typescript" | "flow"
    schema: "./services/individuals/schema.graphql",
    exclude: ["**/node_modules/**", "**/__mocks__/**", "**/__generated__/**"],
  }