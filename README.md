# Vehicle Rental Management System (VRMS)

A simple web application for managing vehicle rental records. Try it [here](https://cs340g27-production.up.railway.app/).

## Overview

Manage fundamental elements of a typical vehicle rental business via GUI triggering standard CRUD operations.

### Primary Entities and CRUD Operations

| Entity | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| Vehicles | Yes | Yes | Yes | Yes |
| Customers | Yes | Yes | No | Yes |
| Locations | Yes | Yes | No | Yes |
| Rentals | Yes | Yes | No | Yes |
| Vehicle Locations | No | Yes | Yes | No |

### General CRUD Flow

```mermaid
sequenceDiagram
    actor User
    User->>Browser: Navigate to entity page
    Browser->>Express: GET /entity
    Express->>DB: SELECT * FROM Entity
    DB-->>Express: Records
    Express->>EJS: Render index.ejs
    EJS-->>Browser: Display list
    Browser-->>User: View all records
    
    alt Create - All entities except Vehicle Locations
        User->>Browser: Submit create form
        Browser->>Express: POST /entity
        Express->>DB: INSERT into Entity
        DB-->>Express: Success
        Express-->>Browser: Redirect to /entity
    else Update - Vehicles (all), Vehicle Locations (all)
        User->>Browser: Click edit/update
        Browser->>Express: GET/POST /entity/update/:id
        Express->>DB: SELECT / UPDATE Entity
        DB-->>Express: Record/Success
        Express-->>Browser: Form or redirect
    else Delete - Vehicles, Customers, Locations, Rentals
        User->>Browser: Click delete
        Browser->>Express: GET /entity/delete/:id
        Express->>DB: DELETE from Entity
        DB-->>Express: Success or constraint error
        Express-->>Browser: Redirect or error
    end
    
    Browser->>Express: GET /entity (post-CRUD refresh)
    Express->>DB: SELECT * FROM Entity
    DB-->>Express: Updated records
    Express->>EJS: Render updated list
    EJS-->>Browser: Display results
    Browser-->>User: Show operation result
```

### Key Features

**Business Logic:**
- Prevents deletion of customers or vehicles with active rentals
- Validates that rental start dates don't exceed end dates
- Tracks vehicle availability and prevents double-booking
- Automatic timestamp tracking for all records
- Rental calculations with total cost tracking
- Vehicle model updates with stored procedure support

**Data Integrity:**
- Foreign key constraints with cascade delete for supporting tables
- Unique constraints on customer emails/phones and vehicle models
- Check constraints ensuring non-negative prices and valid date ranges
- Stored procedures for complex operations (CreateCustomer, UpdateVehicle, ResetDatabase)

## Architecture

VRMS uses a server-rendered MVC-style structure where the browser interacts with Express routes, routes query MySQL, and EJS templates render HTML responses.

```mermaid
flowchart LR
  U[User Browser] -->|HTTP requests| A[Express App app.js]
  A -->|Serve static assets| P[public css/js]
  A -->|Route handling| R[routes/*.js]
  R -->|Render views| V[views/*.ejs]
  R -->|SQL queries| D[db.js]
  D --> M[(MySQL Database)]
  M -->|Query results| D
  D -->|Rows/Status| R
  V -->|HTML response| U
```

## Getting Started

1. Open [the deployed webapp](https://cs340g27-production.up.railway.app/) in your browser.
2. Use the navigation bar to switch between Customers, Vehicles, Locations, Rentals, and Vehicle-Locations.
3. Add new records using the forms on each page, and use the edit or delete actions where available.
4. Review rentals to see which vehicles are active, available, or associated with specific customers and locations.
5. Use the reset option only if you want to restore the database to its initial sample state.

## Database Schema
All tables include timestamps and enforce data integrity with foreign key constraints.

```mermaid
erDiagram
  VEHICLES {
    int vehicleID PK
    string model
    int year
    decimal basePrice
    boolean isAvailable
    datetime createdAt
  }

  CUSTOMERS {
    int customerID PK
    string customerName
    string customerEmail
    string customerPhone
    datetime createdAt
  }

  LOCATIONS {
    int locationID PK
    string locationName
    datetime createdAt
  }

  VEHICLE_LOCATIONS {
    int vehicleLocationID PK
    int vehicleID FK
    int locationID FK
    datetime createdAt
  }

  RENTALS {
    int rentalID PK
    int vehicleID FK
    string vehicleModel FK
    int customerID FK
    int pickupLocationID FK
    int dropoffLocationID FK
    date startDate
    date endDate
    decimal totalCost
    boolean isActive
    datetime createdAt
  }

  VEHICLES ||--o{ VEHICLE_LOCATIONS : located_at
  LOCATIONS ||--o{ VEHICLE_LOCATIONS : hosts
  VEHICLES ||--o{ RENTALS : assigned_to
  CUSTOMERS ||--o{ RENTALS : places
  LOCATIONS ||--o{ RENTALS : pickup_location
  LOCATIONS ||--o{ RENTALS : dropoff_location
  VEHICLES ||--o{ RENTALS : referenced_by_model
```

### Technology Stack

- **Frontend:** Bootstrap
- **Backend:** Express.js
- **Database:** MySQL

### Project Structure

```
app.js                    # Main application entry point
db.js                     # Database connection management
package.json              # Project dependencies
DDL.sql                   # Database schema definitions
DML.sql                   # Initial data population
PL.sql                    # Stored procedures and triggers
routes/                   # Express route handlers
  ├── customers.js
  ├── vehicles.js
  ├── locations.js
  ├── rentals.js
  └── vehicles_locations.js
views/                    # EJS template files
  ├── customers/
  ├── vehicles/
  ├── locations/
  ├── rentals/
  ├── vehicles_locations/
  └── partials/
public/                   # Static assets (CSS, JavaScript)
  ├── css/
  └── js/
```
