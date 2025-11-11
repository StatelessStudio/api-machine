import { RestServer } from '../src';
import { BaseApiEndpoint, BaseApiRouter } from '../src/router';
import { UnauthorizedError } from '../src/error';
import { env } from './env';
import { MethodsRouter } from './spec/endpoint/endpoint-methods.server';
import { RoutingRouter } from './spec/endpoint/endpoint-routing.server';
// eslint-disable-next-line max-len
import { RequestResponseRouter } from './spec/endpoint/endpoint-request-response.server';
// eslint-disable-next-line max-len
import { QueryParamsRouter } from './spec/endpoint/query-params.server';
// eslint-disable-next-line max-len
import { HealthCheckRouter } from './spec/endpoint/health-check.server';
import { MiddlewareRouter } from './spec/router/middleware.server';
import { ProtectedRouter } from './spec/authentication/authentication.server';
import { ValidationRouter } from './spec/endpoint/validation.server';

export class TestRouter extends BaseApiRouter {
	override path = '/test';

	override async routes() {
		return [
			class extends BaseApiEndpoint {
				override async handle() {
					return { works: true };
				}
			},
			class extends BaseApiEndpoint {
				override path = '/error-test';

				override async handle() {
					throw new Error('Test error');

					return {};
				}
			},
			class extends BaseApiEndpoint {
				override path = 'no-leading-slash';

				override async handle() {
					return { works: true };
				}
			},
			class extends BaseApiEndpoint {
				override path = '/http-error-with-headers';

				override async handle() {
					throw new UnauthorizedError('Custom auth error', {
						realm: 'TestRealm',
						headers: {
							'X-Custom-Header': 'test-value',
						},
					});

					return {};
				}
			},
		];
	}
}

export class TestRouterWithoutLeadingSlash extends BaseApiRouter {
	override path = 'test-without-leading-slash';

	override async routes() {
		return [
			class extends BaseApiEndpoint {
				override async handle() {
					return { works: true };
				}
			},
		];
	}
}

export class TestServer extends RestServer {
	override async routes() {
		return [
			TestRouter,
			TestRouterWithoutLeadingSlash,
			MethodsRouter,
			RoutingRouter,
			RequestResponseRouter,
			QueryParamsRouter,
			HealthCheckRouter,
			MiddlewareRouter,
			ProtectedRouter,
			ValidationRouter,
		];
	}
}

export const server = new TestServer({
	port: env.API_PORT,
});
