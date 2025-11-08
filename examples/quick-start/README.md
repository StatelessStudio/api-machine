# Quick Start Example

This example demonstrates the basic setup of a REST API server with a simple router and endpoint structure. It shows the minimal code needed to get a server up and running with two endpoints: a simple greeting endpoint and a users list endpoint.

## Setup & Run

From the root of the project, run:

```bash
npx ts-node examples/quick-start
```

The server will start on `http://localhost:3000`.

## Test the Endpoints

Once running, you can test these endpoints:

```bash
# Get a greeting message
curl http://localhost:3000/api/hello

# Get a list of users
curl http://localhost:3000/api/users
```

## Key Points

- **Minimal Setup**: This example shows the absolute minimum code needed to create a working REST API server
- **Class-Based Architecture**: Notice how the server, router, and endpoints are all separate classes that extend base classes
- **File Organization**: Each component (server, router, endpoints) is in its own file for better maintainability
- **Default HTTP Method**: Endpoints use GET by default - no need to override the `register()` method
- **Automatic JSON Response**: Simply return an object or array from the `handle()` method, and it will be automatically converted to JSON
