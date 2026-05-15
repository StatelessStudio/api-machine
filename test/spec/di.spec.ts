import { RestServer } from '../../src/server/server';
import { BaseApiRouter } from '../../src/router/router';
import { BaseApiEndpoint } from '../../src/router/endpoint';
import { ApiRoute } from '../../src/router/base';

describe('Dependency injection', () => {
	// eslint-disable-next-line max-len
	it('should allow dependencies to flow from Server > Router > Endpoint', async () => {
		class TestEndpoint extends BaseApiEndpoint {
			override name = 'TestEndpoint';
			override async handle() {
				return { value: this.container.get('test-key') };
			}
		}

		class TestRouter extends BaseApiRouter {
			override name = 'TestRouter';
			override async routes(): Promise<ApiRoute[]> {
				return [TestEndpoint];
			}
		}

		class TestServer extends RestServer {
			override router = TestRouter;
		}

		const server = new TestServer({ port: 0 });
		server.container.register('test-key', 'server-value');

		await server.start();

		const router = server.routerInstance;
		const endpoint = router.registeredRoutes[0] as TestEndpoint;

		expect(endpoint.container.get('test-key')).toBe('server-value');

		await server.stop();
	});

	it('should allow overriding dependencies at any layer', async () => {
		class TestEndpoint extends BaseApiEndpoint {
			override name = 'TestEndpoint';
			override async handle() {
				return {};
			}
		}

		class TestRouter extends BaseApiRouter {
			override name = 'TestRouter';
			override async routes(): Promise<ApiRoute[]> {
				return [TestEndpoint];
			}
		}

		class TestServer extends RestServer {
			override router = TestRouter;
		}

		const server = new TestServer({ port: 0 });
		server.container.register('test-key', 'server-value');
		server.container.register('other-key', 'other-value');

		await server.start();

		const router = server.routerInstance;
		router.container.register('test-key', 'router-value');

		const endpoint = router.registeredRoutes[0] as TestEndpoint;
		endpoint.container.register('other-key', 'endpoint-value');

		expect(endpoint.container.get('test-key')).toBe('router-value');
		expect(endpoint.container.get('other-key')).toBe('endpoint-value');

		await server.stop();
	});

	it('can run inject in any layer', async () => {
		class TestLayer extends BaseApiEndpoint {
			override async handle() {
				return {};
			}
		}

		const layer = new TestLayer();
		layer.inject();

		expect(layer.container.get('injected-key')).toBe(undefined);
	});
});
