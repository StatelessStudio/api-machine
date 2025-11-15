import 'jasmine';
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
		it('endpoint auth overrides router and server', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = endpointAuth;

				override async handle() {
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			endpoint.parentRoute = { authentication: routerAuth } as any;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(endpointAuth);
		});

		it('router auth used when endpoint auth undefined', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			const mockRouter = {
				authentication: routerAuth,
				getEffectiveAuthentication: () => routerAuth,
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			endpoint.parentRoute = mockRouter as any;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(routerAuth);
		});

		it('server auth when endpoint and router undefined', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			const routerWithServerAuth = {
				authentication: undefined,
				getEffectiveAuthentication: () => serverAuth,
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			endpoint.parentRoute = routerWithServerAuth as any;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(serverAuth);
		});

		it('returns undefined when no auth at any level', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			endpoint.parentRoute = undefined;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBeUndefined();
		});

		it('endpoint null explicitly makes it public', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = null;

				override async handle() {
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			endpoint.parentRoute = { authentication: routerAuth } as any;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBeNull();
		});

		it('null (public) vs undefined (inherited)', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			const publicEndpoint = new TestEndpoint();
			publicEndpoint.authentication = null;
			const mockRouter1 = {
				authentication: routerAuth,
				getEffectiveAuthentication: () => routerAuth,
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			publicEndpoint.parentRoute = mockRouter1 as any;

			const inheritedEndpoint = new TestEndpoint();
			inheritedEndpoint.authentication = undefined;
			const mockRouter2 = {
				authentication: routerAuth,
				getEffectiveAuthentication: () => routerAuth,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any;
			inheritedEndpoint.parentRoute = mockRouter2;

			expect(publicEndpoint.getEffectiveAuthentication()).toBeNull();
			expect(inheritedEndpoint.getEffectiveAuthentication()).toBe(
				routerAuth
			);
		});
	});

	describe('Router-level cascading', () => {
		it('router auth cascades to endpoints without auth', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				override async routes() {
					return [TestEndpoint];
				}
			}

			const endpoint = new TestEndpoint();
			endpoint.parentRoute = new TestRouter();

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(routerAuth);
		});

		it('endpoint auth overrides router auth', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = endpointAuth;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				override async routes() {
					return [TestEndpoint];
				}
			}

			const endpoint = new TestEndpoint();
			endpoint.parentRoute = new TestRouter();

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBe(endpointAuth);
		});

		it('endpoint null makes route public with router auth', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override authentication = null;

				override async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authentication = routerAuth;

				override async routes() {
					return [TestEndpoint];
				}
			}

			const endpoint = new TestEndpoint();
			endpoint.parentRoute = new TestRouter();

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective).toBeNull();
		});
	});

	describe('Mixed Authentication Schemes', () => {
		it('different schemes at different levels', () => {
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

			const e1 = new Endpoint1();
			const e2 = new Endpoint2();

			expect(e1.getEffectiveAuthentication()).toBe(scheme1);
			expect(e2.getEffectiveAuthentication()).toBe(scheme2);
		});
	});

	describe('Authentication Scheme Names', () => {
		it('preserved through cascading', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			endpoint.parentRoute = new (class extends BaseApiRouter {
				override authentication = routerAuth;

				override async routes() {
					return [];
				}
			})();

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective?.schemeName).toBe('RouterAuth');
		});

		it('endpoints override parent scheme names', () => {
			class TestEndpoint extends BaseApiEndpoint {
				override async handle() {
					return {};
				}
			}

			const endpoint = new TestEndpoint();
			endpoint.authentication = endpointAuth;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			endpoint.parentRoute = { authentication: routerAuth } as any;

			const effective = endpoint.getEffectiveAuthentication();
			expect(effective?.schemeName).toBe('EndpointAuth');
		});
	});
});
