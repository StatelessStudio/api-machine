import { RestServer } from '../src';
import {
	ApiRequest,
	BaseApiEndpoint,
	BaseApiRouter,
	PostEndpoint,
} from '../src/router';
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
import {
	ObjectSanitizer,
	ComposedValSan,
	TrimSanitizer,
	MinLengthValidator,
	EmailValidator,
} from 'valsan';
import { MiddlewareRouter } from './spec/router/middleware.server';

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
			class extends PostEndpoint {
				override path = '/user-validation';

				static override body = new ObjectSanitizer({
					name: new ComposedValSan([
						new TrimSanitizer(),
						new MinLengthValidator({ minLength: 1 }),
					]),
					email: new EmailValidator(),
				});

				async handle(request: ApiRequest) {
					const { name, email } = request.body;

					return { name, email };
				}
			},
		];
	}
}

export class TestServer extends RestServer {
	override async routes() {
		return [
			TestRouter,
			MethodsRouter,
			RoutingRouter,
			RequestResponseRouter,
			QueryParamsRouter,
			HealthCheckRouter,
			MiddlewareRouter,
		];
	}
}

export const server = new TestServer({
	port: env.API_PORT,
});
