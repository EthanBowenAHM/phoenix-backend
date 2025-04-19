```mermaid
sequenceDiagram
    participant Guardian as Guardian Portal
    participant SH as ServiceHubCRM
    participant AHM
    participant Customer as Customer

    %% Creation Phase
    rect rgb(78,160,111)
        Note over Guardian,SH: Creation Phase
        Guardian->>Guardian: New Ticket
        AHM->>Guardian: Review and Accept Ticket
        AHM->>SH: Search by Phone Number
        alt Phone Number Exists
            SH-->>AHM: Return Existing Customer
        else Phone Number New
            AHM->>SH: Create New Customer
        end
        AHM->>SH: Create Order
        Note over SH: Required Fields:<br/>- Client & BillTo<br/>- Order#<br/>- Customer Info<br/>- Service Instructions<br/>- Allotted Hours<br/>- Additional Info<br/>- Claim Type<br/>- Service Type
        SH-->>AHM: Order Created with Territory
    end

    %% Scheduling Phase
    rect rgb(9,127,245)
        Note over Guardian,SH: Scheduling Phase
        AHM->>SH: Assign Technician
        SH->>Customer: Send Appointment Selection Text
        Customer->>SH: Select Appointment Time
        AHM->>Guardian: Update Schedule Date
        Guardian->>Guardian: Status: Unscheduled → Scheduled
        AHM->>SH: Acknowledge Order
        Note over AHM: Day Before Appointment
        AHM->>SH: Set 3-Hour Arrival Window
        SH->>Customer: Send Arrival Window Text
    end
