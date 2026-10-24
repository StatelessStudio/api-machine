import 'jasmine';
import { Router as ExpressRouter } from 'express';
import { BaseApiEndpoint } from '../../../src/router/endpoint';
import { BaseApiRouter } from '../../../src/router/router';
import {
	AUTHENTICATION_KEY,
	AUTHORIZATION_KEY,
	AUTHORIZATION_REQUIREMENT_KEY,
} from '../../../src/router';
import { BearerAuthenticationScheme } from '../../../src/authentication';
import { DependencyContainer } from 'hidi';

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

	const serverAuthorizer = {
		async evaluate() {
			return { allowed: true };
		},
	};

	const routerAuthorizer = {
		async evaluate() {
			return { allowed: true };
		},
	};

	const endpointAuthorizer = {
		async evaluate() {
			return { allowed: true };
		},
	};

	describe('getEffectiveAuthentication()', () => {
		class ResolutionEndpoint extends BaseApiEndpoint {
			override async handle() {
				return {};
			}
		}

		it('supports namespaced inject overrides in cascading',
			async () => {
				class TestEndpoint extends BaseApiEndpoint {
					override inject() {
						this.container.registerInstance(
							AUTHENTICATION_KEY, endpointAuth
						);
					}

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
				const endpoint = router.registeredRoutes[0];
				expect(endpoint.getEffectiveAuthentication())
					.toBe(endpointAuth);
			});

		it('inherits the nearest namespaced scheme or public override', () => {
			for (const authentication of [routerAuth, null]) {
				const ancestor = new DependencyContainer();
				ancestor.registerInstance(AUTHENTICATION_KEY, serverAuth);
				const parent = ancestor.extend();
				parent.registerInstance(AUTHENTICATION_KEY, authentication);
				const endpoint = new ResolutionEndpoint();
				endpoint.container.setParent(parent);
				expect(endpoint.getEffectiveAuthentication())
					.toBe(authentication);
			}
		});

		it('ignores legacy registrations when inheriting authentication',
			() => {
				for (const legacy of [endpointAuth, null, serverAuthorizer]) {
					const parent = new DependencyContainer();
					parent.registerInstance(AUTHENTICATION_KEY, serverAuth);
					const endpoint = new ResolutionEndpoint();
					endpoint.container.setParent(parent);
					endpoint.container.registerInstance('auth', legacy);
					expect(endpoint.getEffectiveAuthentication())
						.toBe(serverAuth);
				}
			});

		it('ignores local and inherited legacy registrations', () => {
			for (const legacy of [serverAuth, null, serverAuthorizer]) {
				const parent = new DependencyContainer();
				parent.registerInstance('auth', legacy);
				const endpoint = new ResolutionEndpoint();
				endpoint.container.setParent(parent);
				expect(endpoint.getEffectiveAuthentication()).toBeUndefined();
				endpoint.container.registerInstance('auth', legacy);
				expect(endpoint.getEffectiveAuthentication()).toBeUndefined();
			}
		});

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
			router.container.register(AUTHORIZATION_KEY, serverAuthorizer);
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
			router.container.register(AUTHENTICATION_KEY, serverAuth);

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

	describe('getEffectiveAuthorizationService()', () => {
		it('uses the nearest router or endpoint authorizer', async () => {
			class InheritedEndpoint extends BaseApiEndpoint {
				async handle() {
					return {};
				}
			}

			class OverrideEndpoint extends BaseApiEndpoint {
				override authorizer = endpointAuthorizer;

				async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authorizer = routerAuthorizer;

				protected async routes() {
					return [InheritedEndpoint, OverrideEndpoint];
				}
			}

			const router = new TestRouter();
			router.container.register(AUTHORIZATION_KEY, serverAuthorizer);
			await router.register(ExpressRouter(), '');

			const inherited = router.registeredRoutes[0];
			const overridden = router.registeredRoutes[1];
			expect(inherited.getEffectiveAuthorizationService()).toBe(
				routerAuthorizer
			);
			expect(overridden.getEffectiveAuthorizationService()).toBe(
				endpointAuthorizer
			);
		});

		it('uses the server authorizer when the router inherits', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			router.container.register(AUTHORIZATION_KEY, serverAuthorizer);
			await router.register(ExpressRouter(), '');

			expect(
				router.registeredRoutes[0].getEffectiveAuthorizationService()
			).toBe(serverAuthorizer);
		});
	});

	describe('getEffectiveAuthorizationRequirement()', () => {
		const routerRequirement = {
			action: 'manage',
			resource: 'rbac',
		};
		const endpointRequirement = {
			action: 'read',
			resource: 'documents',
		};

		it('inherits router requirements with endpoint overrides', async () => {
			class InheritedEndpoint extends BaseApiEndpoint {
				async handle() {
					return {};
				}
			}

			class OverrideEndpoint extends BaseApiEndpoint {
				override authorization = endpointRequirement;

				async handle() {
					return {};
				}
			}

			class PublicEndpoint extends BaseApiEndpoint {
				override authorization = null;

				async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				override authorization = routerRequirement;

				protected async routes() {
					return [
						InheritedEndpoint,
						OverrideEndpoint,
						PublicEndpoint,
					];
				}
			}

			const router = new TestRouter();
			router.container.register(AUTHORIZATION_KEY, serverAuthorizer);
			await router.register(ExpressRouter(), '');

			const requirements = router.registeredRoutes.map((route) =>
				route.getEffectiveAuthorizationRequirement()
			);
			expect(requirements).toEqual([
				routerRequirement,
				endpointRequirement,
				null,
			]);
		});

		it('inherits server requirements without router override', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				async handle() {
					return {};
				}
			}

			class TestRouter extends BaseApiRouter {
				protected async routes() {
					return [TestEndpoint];
				}
			}

			const router = new TestRouter();
			router.container.register(AUTHORIZATION_KEY, serverAuthorizer);
			router.container.register(
				AUTHORIZATION_REQUIREMENT_KEY,
				routerRequirement
			);
			await router.register(ExpressRouter(), '');

			const requirement =
				router.registeredRoutes[0]
					.getEffectiveAuthorizationRequirement();
			expect(requirement).toEqual(routerRequirement);
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
