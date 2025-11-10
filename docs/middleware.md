# Middleware Support

You can add Express-style middleware to both Routers and Endpoints in this framework. Middleware functions allow you to run logic before your endpoint handler is called (for example, authentication, logging, validation, etc.).

## Router Middleware

To add middleware to a router, set the `middleware` property to an array of Express middleware functions. These will run for all endpoints registered under that router.

```typescript
import { BaseApiRouter } from 'src/router/router';
import { RequestHandler } from 'express';

const logMiddleware: RequestHandler = (req, res, next) => {
  console.log('Request:', req.method, req.path);
  next();
};

export class MyRouter extends BaseApiRouter {
  override path = '/api';
  override middleware = [logMiddleware];

  async routes() {
    return [/* your endpoints */];
  }
}
```

## Endpoint Middleware

To add middleware to a specific endpoint, set the `middleware` property to an array of Express middleware functions on your endpoint class. These will run only for that endpoint, after any router-level middleware.

```typescript
import { BaseApiEndpoint, EndpointMethod } from 'src/router/endpoint';
import { RequestHandler } from 'express';

const authMiddleware: RequestHandler = (req, res, next) => {
  if (req.headers['authorization'] === 'Bearer validtoken') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export class MyEndpoint extends BaseApiEndpoint {
  override path = '/secure';
  override method = EndpointMethod.GET;

  override middleware = [authMiddleware];
  
  async handle(req, res) {
    return { ok: true };
  }
}
```

## Middleware Order

- Router middleware runs first (in the order defined in the array).
- Endpoint middleware runs next (in the order defined in the array).
- Finally, the endpoint handler is called.

If any middleware sends a response (e.g., for authentication failure), the endpoint handler will not be called.

## Example Use Cases
- Authentication/authorization
- Logging
- Input validation
- Rate limiting

## See Also
- [Express Middleware Documentation](https://expressjs.com/en/guide/using-middleware.html)
