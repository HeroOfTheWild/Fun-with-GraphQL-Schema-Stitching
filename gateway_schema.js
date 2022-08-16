module.exports = gatewaySchema = 
`
    type Query {
        # Retrieve all employee information associated to a NintendoID
        employeeData(id: NintendoId!): NintendoEmployee
    }

    type NintendoEmployee {
        nintendoId: String!
        teamId: String!
        name: Name
        projects(franchiseId: String, status: ProjectStatus): [Project]
        contactInformation: ContactInformation
        teammates: [Teammate]
    }

    # Extending the Teammate type to allow look ups information for a member
    extend type Teammate {
        details: NintendoEmployee
    }

    # Extending the Project type to bring in the Franchise Information
    extend type Project {
        franchise: Franchise
    }

    type ContactInformation {
        nintendoId: String!
        address: [Address]
        addressHistories(first: Int!, before: String): addressHistoryConnection
        phone: [Phone]
        phoneHistories(first: Int!, before: String): phoneHistoryConnection
        email: [Email]
        emailHistories(first: Int!, before: String): emailHistoryConnection
    }
`;