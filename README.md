# Fun with GraphQL
This prototype is just a fun side project in an effort to learn Schema Stitching. 
I'll continue to add more to this project as I learn more about schema stitching to showcase its functionality. 

**As a disclaimer, I am new to Javascript so expect to cringe when looking through my code** 

## Interesting things to learn from this Project
- Adding subschema definitions from a local file 
- Adding subschema definitions remotely using Introspection
- Creating new Types on the stitched gateway and using Resolvers to resolve that data for the new type
- Extending Types coming from Subschemas and adding Resolvers to handle it
    - Something cool to note, we extended the teammate Type from the [Team GraphQL](https://github.com/HeroOfTheWild/nintendo-team-graphql-api) and added the contact details from the [Contact GraphQL](https://github.com/HeroOfTheWild/nintendo-contact-graphql-api/tree/master/src/main/resources/graphql). 
- Creating new mutations on top of existing mutations
- Adding selection sets when delegating to schema to ensure we get certain elements even if the client didn't request them. 
- Custom Scalar Types for id validation. 


## Next Steps
- Adding Authorization
- Further expanding on Custom Scalar Types

## What you need to run this GraphQL API
**Be sure to download the other three Projects below**
- _Nintendo Team GraphQL API_: 
    - Can be found [here](https://github.com/HeroOfTheWild/nintendo-team-graphql-api) 
    - will be running on `http://localhost:8081/nintendo/team/graphql`
- _Nintendo Contact GraphQL API_: 
    - Can be found [here](https://github.com/HeroOfTheWild/nintendo-contact-graphql-api)
    - will be running on `http://localhost:8082/nintendo/contact/graphql`
- _Nintendo Project GraphQL API_: 
    - Can be found [here](https://github.com/HeroOfTheWild/nintendo-project-graphql-api)
    - will be running on `http://localhost:8083/nintendo/project/graphql`


## Setup and Running

```shell
cd fun-with-graphQL-schema-stitching

yarn install
yarn start
```

## Playing with this API 
Visit the GraphQL Playground interface for the [stitched gateway](http://localhost:8080/nintendo/playground) to mess around with the mutations and queries. 

Below is an example for querying all Nintendo Employee Details. Checkout the attached Postman Collection for more examples. 

 GraphQL Query
```graphql
query allData($nintendoId: NintendoId!, 
  $includeName: Boolean!, $includeTeam: Boolean!, $includeProjects: Boolean!, 
  $includeContact: Boolean!, $includeAddress: Boolean!, $includePhone: Boolean!, $includeEmail: Boolean!){
  employeeData(nintendoId: $nintendoId) {
    nintendoId
    name @include(if: $includeName) {
      ...fullName
    }
    teamInfo {
      teamName
    }
    teammates @include(if: $includeTeam) {
      teamId
      nintendoId
      details {
        name {
          ...fullName
        }
        ...contact
      }
    }
    projects @include(if: $includeProjects) {
      projectName
      status
      franchise {
        title
      }
    }
    ...contact
  }
}

fragment fullName on Name {
  firstName
  middleName
  lastName
}

fragment contact on NintendoEmployee {
   contactInformation @include(if: $includeContact) {
    emails @include(if: $includeEmail) {
      emailAddress
      purpose
    }
    phones @include(if: $includePhone) {
      number
      type
    }
    addresses @include(if: $includeAddress) {
      country
      streetAddress
      cityName
      stateProvince
      postalCode
    }
  }
}
```

Variables
```json 
{
  "nintendoId": "nin0001",
  "includeName": true,
  "includeTeam": true,
  "includeContact": true,
  "includeAddress": true,
  "includePhone": true,
  "includeEmail": true,
  "includeProjects": true
}
```

The results of this query are retrieved from the underlying subschemas by the stitched gateway. 
- `name` and `teammates` come from the remote [Nintendo Team server](https://github.com/HeroOfTheWild/nintendo-team-graphql-api). 
- `address`, `phone`, and `email` come from the remote [Nintendo Contact server](https://github.com/HeroOfTheWild/nintendo-contact-graphql-api).
- `project` and `franchises` come from the remote [Nintendo Project server](https://github.com/HeroOfTheWild/nintendo-project-graphql-api).