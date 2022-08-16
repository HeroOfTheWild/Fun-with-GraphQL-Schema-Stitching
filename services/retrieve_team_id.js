const { fetch } = require('cross-fetch');
const { print } = require('graphql');
const NotFound = require('./not_found');

const myTeamInfoQuery = `
    query primary($nintendoId: NintendoId!) {
        primaryTeam(nintendoId: $nintendoId) {
            nintendoId
            teamId
            teamName
            managerId
        }
    }
`

module.exports = function retrieveTeamInfo(nintendoId) {
    const query = typeof myTeamInfoQuery === 'string' ? myTeamInfoQuery : print(myTeamInfoQuery);
    return fetch('http://localhost:8081/nintendo/team/graphql', {
        method: 'POST',
        body: JSON.stringify({ 
          query, 
          variables: { nintendoId: nintendoId } 
        }),
      }).then((response) => response.json()).then(result => {
        const info = result.data.primaryTeam
        if (null === info) {
          throw new NotFound("No record found with this ID: " + nintendoId);
        }

        return  {
                  nintendoId: info.nintendoId, 
                  teamId: info.teamId,
                  teamName: info.teamName,
                  managerId: info.managerId
                }
      }).catch((err) => {
        throw err;
      });
}