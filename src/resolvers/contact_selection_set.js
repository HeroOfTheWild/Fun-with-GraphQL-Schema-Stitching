const { Kind } = require('graphql');

const addressCollectionSet = {
    kind: Kind.SELECTION_SET, 
    selections: [
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'id'
        }
      },
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'nintendoId'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'purpose'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'country'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'stateProvince'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'cityName'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'streetAddress'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'postalCode'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'regionCode'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'startDate'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'endDate'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'lastModified'
        }
      }, 
    ]
};

const phoneCollectionSet = {
    kind: Kind.SELECTION_SET, 
    selections: [
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'id'
        }
      },
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'nintendoId'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'purpose'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'countryCode'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'purpose'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'number'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'lastModified'
        }
      }
    ]
};

const emailCollectionSet = {
    kind: Kind.SELECTION_SET, 
    selections: [
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'id'
        }
      },
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'nintendoId'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'purpose'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'emailAddress'
        }
      }, 
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: 'lastModified'
        }
      }
    ]
};

module.exports = { addressCollectionSet, phoneCollectionSet, emailCollectionSet }