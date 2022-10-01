const { delegateToSchema }  = require('@graphql-tools/delegate');
const { issueNewTeammate }  = require('../services/team_service');

const { addressCollectionSet, phoneCollectionSet, emailCollectionSet } = require('./contact_selection_set');

module.exports = function newEmployee(subSchemaContact, object, args, context, info) {
    const newTeammate = issueNewTeammate(args.nintendoEmployee.teammate);

    return newTeammate.then((newEmployeeWoohoo) => {
      const newNintendoId = newEmployeeWoohoo.nintendoId;
      const teamId = newEmployeeWoohoo.teamId;
      const name = newEmployeeWoohoo.name;
      const teamInfo = newEmployeeWoohoo.teamInfo;

      var phoneArgument = args.nintendoEmployee.phone;
      phoneArgument.nintendoId = newNintendoId;

      const newPhone = delegateToSchema({
        schema: subSchemaContact, operation: 'mutation', fieldName: 'issuePhone', 
        args: { phone: phoneArgument }, context, info,
        returnType: info.schema.getMutationType().toConfig().fields['issuePhone'].type,
        selectionSet: phoneCollectionSet
      });

      var emailArgument = args.nintendoEmployee.email;
      emailArgument.nintendoId = newNintendoId;

      const newEmail = delegateToSchema({
        schema: subSchemaContact, operation: 'mutation', fieldName: 'issueEmail', 
        args: { email: emailArgument }, context, info,
        returnType: info.schema.getMutationType().toConfig().fields['issueEmail'].type,
        selectionSet: emailCollectionSet
      });

      var addressArgument = args.nintendoEmployee.address;
      addressArgument.nintendoId = newNintendoId;

      const newAddress = delegateToSchema({
        schema: subSchemaContact, operation: 'mutation', fieldName: 'issueAddress', 
        args: { address: addressArgument }, context, info,
        returnType: info.schema.getMutationType().toConfig().fields['issueAddress'].type,
        selectionSet: addressCollectionSet
      });

      return {
        nintendoId: newNintendoId, 
        teamId: teamId, 
        teamInfo: teamInfo,
        name: name,
        address: newAddress,
        phone: newPhone,
        email: newEmail
      }
    })
  };