const { delegateToSchema }  = require('@graphql-tools/delegate');

module.exports = function nintendoEmployee(subSchemaTeam, subSchemaProject) {
    return {
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
        },
        contactInformation: {
          resolve(nintendoEmployee, args, context, info) {
            return {nintendoId: nintendoEmployee.nintendoId}
          }
        },
        teammates: {
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({schema: subSchemaTeam, operation: 'query', fieldName: 'myTeammates', args: { nintendoId: nintendoEmployee.nintendoId }, context, info})
          }
        },
        projects : {
          selectionSet: `{ teamId }`, 
          resolve(nintendoEmployee, args, context, info) {
            return delegateToSchema({
              schema: subSchemaProject, operation: 'query', fieldName: 'projectsByCriteria', 
              args: { 
                teamId: nintendoEmployee.teamId,
                franchiseId: args.franchiseId,
                status: args.status
              }, context, info});
          }
        }
      }
};