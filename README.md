# Fun with GraphQL
This prototype is just a fun side project in an effort to learn Schema Stitching. 
I'll continue to add more to this project as I learn more about schema stitching to showcase its functionality. 

**As a disclaimer, I am new to Javascript so expect to cringe when looking through my code** 

## Interesting things to learn from this Project
- Adding a locally executable schema
- Adding a remote schema using Introspection
- Creating Gateway Types and using Resolvers to resolve that data for the new type
- Extending Types coming from Subschemas and adding Resolvers to handle it
    - Something cool to note, we extended the teammate Type from the [Team GraphQL](https://github.com/HeroOfTheWild/nintendo-team-graphql-api) and added the contact details from the [Contact GraphQL](https://github.com/HeroOfTheWild/nintendo-contact-graphql-api/tree/master/src/main/resources/graphql). 
- Custom Scalar Types for id validation. 

## Next Steps
- Adding Authorization
- Working with Mutations and Resolving
- Further expanding on Custom Scalar Types

## What you need
**Be sure to download the other two Projects below**

- **Stitched Nintendo Gateway:** `http://localhost:8080/nintendo/graphql`
- _Nintendo Team subservice_: 
    - Can be found [here](https://github.com/HeroOfTheWild/nintendo-team-graphql-api) 
    - will be running on `http://localhost:8081/nintendo/team/graphql`
- _Nintendo Contact subservice_: 
    - Can be found [here](https://github.com/HeroOfTheWild/nintendo-contact-graphql-api)
    - will be running on `http://localhost:8082/nintendo/contact/graphql`


## Setup and Running

```shell
cd fun-with-graphQL-schema-stitching

yarn install
yarn start
```

## Playing with this API 
Visit the GraphIQL interface for the [stitched gateway](http://localhost:8080/nintendo/graphql) to play around with it. 

Checkout the attached Postman Collection for more examples. Below is an example for querying all Nintendo Employee Details. 

GraphQL Query
```graphql
query allData($nintendoId: String!, 
  $includeName: Boolean!, $includeTeam: Boolean!, $includeAddress: Boolean!, $includePhone: Boolean!, $includeEmail: Boolean!){
  employeeDataById(id: $nintendoId) {
    nintendoId
    name @include(if: $includeName) {
      firstName
      middleName
      lastName
    }
    teammates @include(if: $includeTeam) {
      teamName
      nintendoId
      name {
        firstName
        middleName
        lastName
      }
      contactInformation {
        address @include(if: $includeAddress) {
          country
          stateProvince
          cityName
          streetAddress
          postalCode
          regionCode
        }
        phone @include(if: $includePhone) {
          countryCode
          number
        }
        email @include(if: $includeEmail) {
          emailAddress
        }
      }
    }
    contactInformation {
      nintendoId
      address @include(if: $includeAddress) {
        id
        country
        stateProvince
        cityName
        streetAddress
        postalCode
        regionCode
        lastModified
      }
      phone @include(if: $includePhone) {
        id
        countryCode
        number
        lastModified
      }
      email @include(if: $includeEmail) {
        id
        emailAddress
        lastModified
      }
      addressHistories(first: 2) { 
        edges {
          cursor
          node {
            id
            country
            stateProvince
            cityName
            streetAddress
            postalCode
            regionCode
            lastModified
          }
        }
        pageInfo {
          startCursor
          endCursor
        }
      }
      phoneHistories(first: 2) @include(if: $includePhone) {
        edges {
          cursor
          node {
            id
            countryCode
            number
            lastModified
          }
        }
      }
      emailHistories(first: 2) {
        edges {
          cursor
          node {
            id
            emailAddress
            lastModified
          }
        }
        pageInfo {
          startCursor
          endCursor
        }
      }
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
  "includeAddress": true,
  "includePhone": true,
  "includeEmail": true
}
```

The results of this query are retrieved from the underlying subschemas by the stitched gateway. 
- `name` and `teammates` come from the remote Nintendo Team server. 
- `address`, `phone`, and `email` come from the remote Nintendo Contact server. 