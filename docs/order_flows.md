# Phoenix originated order
1. Order created in Phoenix.
2. Changes Pusheed to SH as needed via "sync with SH"


# Guardian originated order
1. Periodic check for new orders in guardian (twice daily?)
    a. So a lambda that runs for all tenants, for all portals.
    b. Needs to access secret manager based on tenant secrets for said portal.
        i. ex of secret values <tenantid>/<portalId>/credentials
        ii. stored as {"user": "<user>", "password': "<password>"} 
        iii. no infra automation on this, manual entry 1 time per environment
2. Create new orders in Phoenix (sourceSystem=Guardian)
    a. Convert Guardian order data into a Phoenix order data
    b. Create or Update in Phoenix.