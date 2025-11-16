# Self-documenting OpenAPI (Swagger)

api-machine includes a built-in, self-documenting feature that can generate an OpenAPI Spec. The spec is automatically generated from your server/router definitions, and automatically served as a Swagger UI.

See the Example and reference section below: [View the runnable example](#example).

## Quick enable

1. Enable the feature by passing `swaggerEnabled: true` in the server options.

```ts
export const server = new YourRestServer({
  port: 5050,
  swaggerEnabled: true,
});
```

2. Start the server as usual. When enabled, the server will expose two default endpoints:

- `/openapi.json` — the generated OpenAPI document (JSON)
- `/docs` — an interactive Swagger UI based on the generated spec

[These routes can be customized](#customization)

## Documentation data source (what's included)

The generated spec includes:

- All registered routers/endpoints (paths + methods)
- Parameters derived from endpoint validators (path/query/header)
- Request bodies derived from declared body validators
- Response shapes for common success/failure cases (where available)

Because the spec is derived from the endpoint definitions, it stays in sync with your code as long as you declare validators/metadata on the endpoints. The `test/spec/api/openapi-server.ts` example shows idiomatic endpoint definitions (classes that declare `params`, `body`, `query`, etc.) which are converted into OpenAPI automatically.

### Inputs that influence the generated spec

The generator pulls metadata from a few common places — set these values on your server/router/endpoint classes to produce richer API docs:

- RestServer metadata
  - `name`
  - `description`
  - `version`

- Router and endpoint metadata
  - Router (`BaseApiRouter`) can set `path` and `description` which are reflected in the grouping/description of operations.
  - Endpoint classes may set `name` and `description` properties (or override `path`) — these values are used for operation `summary`/`description` in the generated spec.

### ValSan schemas

This project uses `valsan` validators on endpoints to infer request/parameter and body schemas. Common validator placements include properties on endpoint classes such as `params`, `query`, `headers`, and `body`.

If you rely on Valsan validators in your endpoints, the self-documenting feature will include schema details automatically — this keeps the documentation accurate and minimizes duplication.

## Security & deployment notes

- Exposing the OpenAPI UI and spec is useful in development and for API consumers, but in production you may want to restrict access. Options:
  - Only enable `swaggerEnabled` for non-production environments.
  - Put `/docs` and `/openapi.json` behind authentication or IP allowlisting.

- The generator produces a snapshot of the API at runtime. If your API uses dynamic runtime-only routes, consider whether those routes should be included in the public spec.

## Example

### Run the example
`npm run script openapi`

### View example code
`test/spec/api/openapi-server.ts` — this file shows a `RestServer` with self-documenting Swagger.

## Customization

The default mount points are `/openapi.json` and `/docs`. If you need different paths or want to mount the UI manually, override or extend the server's `registerSwagger` method in your `RestServer` subclass and call the route helper with custom options.

## Troubleshooting

- If `/openapi.json` is missing or empty, verify `swaggerEnabled` is true and your server's routers are registering routes during startup.
- If some endpoints are missing from the spec, ensure the endpoint classes expose validators or metadata (for example `body`, `params`, `query`, `headers`) so the generator can infer the input shapes.
