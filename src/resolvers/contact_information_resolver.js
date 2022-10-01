const { delegateToSchema }  = require('@graphql-tools/delegate');

module.exports = function contactInformation(subSchemaContact) {
    return {
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
};