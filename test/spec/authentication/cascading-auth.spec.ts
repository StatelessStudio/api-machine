import 'jasmine';
import { Router as ExpressRouter } from 'express';
import { BaseApiEndpoint } from '../../../src/router/endpoint';
import { BaseApiRouter } from '../../../src/router/router';
import { BearerAuthenticationScheme } from '../../../src/authentication';

describe('Authentication Cascading', () => {
	const serverAuth = new BearerAuthenticationScheme({
		checkToken: async (token: string) => token === 'server-token',
		schemeName: 'ServerAuth',
	});

	const routerAuth = new BearerAuthenticationScheme({
		checkToken: async (token: string) => token === 'router-token',
		schemeName: 'RouterAuth',
	});

	const endpointAuth = new BearerAuthenticationScheme({
		checkToken: async (token: string) => token === 'endpoint-token',
		schemeName: 'EndpointAuth',
	});

	describe('getEffectiveAuthentication()', () => {
		it('endpoint auth overrides router and server', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = endpointAuth;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(endpointAuth);
		});

		it('router auth used when endpoint auth undefined', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(routerAuth);
		});

		it('server auth when endpoint and router undefined', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = undefined;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			// Mock 'serverAuth' cascading from server container
			router.container.register('auth', serverAuth);

			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(serverAuth);
		});

		it('returns undefined when no auth at any level', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBeUndefined();
		});

		it('endpoint null explicitly makes it public', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = null;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBeNull();
		});

		it('null (public) vs undefined (inherited)', async () => {
			class PublicEndpoint extends BaseApiEndpoint {
				override authentication = null;

				override async handle() {
					return {};
				}
			}

			class InheritedEndpoint extends BaseApiEndpoint {
				override authentication = undefined;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [PublicEndpoint, InheritedEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const publicEndpoint = router.registeredRoutes.find(
				(r) => r instanceof PublicEndpoint
			) as PublicEndpoint;
			const inheritedEndpoint = router.registeredRoutes.find(
				(r) => r instanceof InheritedEndpoint
			) as InheritedEndpoint;

			expect(publicEndpoint.getEffectiveAuthentication()).toBeNull();
			expect(inheritedEndpoint.getEffectiveAuthentication()).toBe(
				routerAuth
			);
		});
	});

	describe('Router-level cascading', () => {
		it('router auth cascades to endpoints without auth', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(routerAuth);
		});

		it('endpoint auth overrides router auth', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = endpointAuth;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(endpointAuth);
		});

		it('endpoint null makes route public with router auth', async () => {
			// TODO: Is this test duplicative of one above?
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = null;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBeNull();
		});
	});

	describe('Mixed Authentication Schemes', () => {
		it('different schemes at different levels', async () => {
			const scheme1 = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'Scheme1',
			});

			const scheme2 = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'Scheme2',
			});

			class Endpoint1 extends BaseApiEndpoint {
				override authentication = scheme1;

				override async handle() {
					return {};
				}
			}

			class Endpoint2 extends BaseApiEndpoint {
				override authentication = scheme2;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				protected async routes() {
					return [Endpoint1, Endpoint2];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const e1 = router.registeredRoutes.find(
				(r) => r instanceof Endpoint1
			) as Endpoint1;
			const e2 = router.registeredRoutes.find(
				(r) => r instanceof Endpoint2
			) as Endpoint2;

			expect(e1.getEffectiveAuthentication()).toBe(scheme1);
			expect(e2.getEffectiveAuthentication()).toBe(scheme2);
		});
	});

	describe('Authentication Scheme Names', () => {
		it('preserved through cascading', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective?.schemeName).toBe('RouterAuth');
		});

		it('endpoints override parent scheme names', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = endpointAuth;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			await router.register(ExpressRouter(), '');
			const endpoint = router.registeredRoutes[0] as TestEndpoint;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective?.schemeName).toBe('EndpointAuth');
		});
	});
});
