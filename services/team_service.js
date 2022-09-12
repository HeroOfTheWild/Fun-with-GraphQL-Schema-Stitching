const { fetch } = require('cross-fetch');
const { GraphQLError, print } = require('graphql');
const NotFound = require('./errors/not_found');
const IssueEmployeeError = require('./errors/issue_employee_error');

const myTeamInfoQuery = `
    query primary($nintendoId: NintendoId!) {
      myNintendoAccount(nintendoId: $nintendoId) {
          nintendoId
          teamId
          teamInfo {
              teamId
              teamName
              managerId
          }
      }
    }
`

const newTeammateMutation = `
    mutation issueNew($teammate: TeammateInput!) {
      newTeammate(newTeammate: $teammate) {
          nintendoId
          teamId
          name {
              firstName
              middleName
              lastName
          }
          teamInfo {
              teamId
              teamName
              managerId
          }
      }
    }
`

async function retrieveTeamInfo(nintendoId) {
  const query = typeof myTeamInfoQuery === 'string' ? myTeamInfoQuery : print(myTeamInfoQuery);
  try {
    const response = await fetch('http://localhost:8081/nintendo/team/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query,
        variables: { nintendoId: nintendoId }
      })
    });
    const result = await response.json();

    const errors = result.errors;
    if (errors != null) {
      throw new GraphQLError(errors[0].message);
    }

    const myNintendoAccount = result.data.myNintendoAccount;
    if (null === myNintendoAccount) {
      throw new NotFound("No record found with this ID: " + nintendoId);
    }

    return {
      nintendoId: myNintendoAccount.nintendoId,
      teamId: myNintendoAccount.teamId,
      teamInfo: {
        teamId: myNintendoAccount.teamId,
        teamName: myNintendoAccount.teamInfo.teamName,
        managerId: myNintendoAccount.teamInfo.managerId
      }
    };
  } catch (err) {
    throw err;
  }
};

async function issueNewTeammate(teammateInput) {
  const mutation = typeof newTeammateMutation === 'string' ? newTeammateMutation : print(newTeammateMutation);
  try {
    const response = await fetch('http://localhost:8081/nintendo/team/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: mutation,
        variables: { teammate: teammateInput }
      })
    });
    const result = await response.json();
    const errors = result.errors;
    if (errors != null) {
      throw new IssueEmployeeError(errors[0].message);
    }
    
    return result.data.newTeammate;
  } catch(err) {
    throw err;
  }
};

module.exports = {retrieveTeamInfo, issueNewTeammate }