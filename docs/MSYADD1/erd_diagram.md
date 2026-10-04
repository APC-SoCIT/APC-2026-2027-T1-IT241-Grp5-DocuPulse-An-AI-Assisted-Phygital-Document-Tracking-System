erDiagram
    %% Auth Schema Entity
    "auth.users" {
        uuid id PK
        string email
    }

    %% Public Schema Entities
    profiles {
        uuid id PK, FK "References auth.users.id"
        string email
        string full_name
        string role
        string department
        timestamptz created_at
    }erDiagram
    %% Auth Schema Entity
    "auth.users" {
        uuid id PK
        string email
    }

    %% Public Schema Entities
    profiles {
        uuid id PK, FK "References auth.users.id"
        string email
        string full_name
        string role
        string department
        timestamptz created_at
    }

    requisitions {
        text id PK
        text title
        text category
        text priority
        text description
        text requestor
        text department
        text workflow_stage
        text status
        jsonb processing_remarks
        timestamptz created_at
        timestamptz updated_at
    }

    notifications {
        uuid id PK
        text requisition_id FK "References requisitions.id"
        text title
        text previous_stage
        text new_stage
        text message
        bool is_read
        text type
        timestamptz created_at
    }

    %% Relationships
    "auth.users" ||--|| profiles : "has profile"
    requisitions ||--o{ notifications : "generates"

    requisitions {
        text id PK
        text title
        text category
        text priority
        text description
        text requestor
        text department
        text workflow_stage
        text status
        jsonb processing_remarks
        timestamptz created_at
        timestamptz updated_at
    }

    notifications {
        uuid id PK
        text requisition_id FK "References requisitions.id"
        text title
        text previous_stage
        text new_stage
        text message
        bool is_read
        text type
        timestamptz created_at
    }

    %% Relationships
    "auth.users" ||--|| profiles : "has profile"
    requisitions ||--o{ notifications : "generates"