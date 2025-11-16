import 'jasmine';
import { OasEndpointConverter, OasRestServerConverter } from '../../src/oas';
// eslint-disable-next-line max-len
import { BearerAuthenticationScheme } from '../../src/authentication/schemes/bearer-authentication-scheme';
import { BaseApiEndpoint } from '../../src/router/endpoint';

describe('OAS Authentication Integration', () => {
	describe('OasEndpointConverter with authentication', () => {
		it('adds security requirement when auth present', () => {
			const converter = new OasEndpointConverter();
			const auth = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'BearerAuth',
			});

			const fakeEndpoint = {
				method: 'get',
				statusCode: 200,
				getName: () => 'testEndpoint',
				description: 'Test endpoint',
				getTag: () => 'tests',
				getErrors: () => ({}),
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const path = converter.getOpenApiPath(fakeEndpoint as any, auth);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const operation = (path as any)['get'];

			expect(operation.security).toBeDefined();
			expect(operation.security).toEqual([{ BearerAuth: [] }]);
		});

		it('adds empty security array when auth is null (public)', () => {
			const converter = new OasEndpointConverter();

			const fakeEndpoint = {
				method: 'get',
				statusCode: 200,
				getName: () => 'publicEndpoint',
				description: 'Public endpoint',
				getTag: () => 'public',
				getErrors: () => ({}),
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const path = converter.getOpenApiPath(fakeEndpoint as any, null);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const operation = (path as any)['get'];

			expect(operation.security).toBeDefined();
			expect(operation.security).toEqual([]);
		});

		it('omits security when auth undefined (inherits)', () => {
			const converter = new OasEndpointConverter();

			const fakeEndpoint = {
				method: 'get',
				statusCode: 200,
				getName: () => 'inheritedEndpoint',
				description: 'Inherited auth endpoint',
				getTag: () => 'inherited',
				getErrors: () => ({}),
			};

			const path = converter.getOpenApiPath(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				fakeEndpoint as any,
				undefined
			);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const operation = (path as any)['get'];

			expect(operation.security).toBeUndefined();
		});

		it('includes security with custom scheme name', () => {
			const converter = new OasEndpointConverter();
			const customAuth = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'AdminBearer',
			});

			const fakeEndpoint = {
				method: 'post',
				statusCode: 201,
				getName: () => 'adminEndpoint',
				description: 'Admin endpoint',
				getTag: () => 'admin',
				getErrors: () => ({}),
			};

			const path = converter.getOpenApiPath(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				fakeEndpoint as any,
				customAuth
			);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const operation = (path as any)['post'];

			expect(operation.security).toEqual([{ AdminBearer: [] }]);
		});

		it('preserves other endpoint properties', () => {
			const converter = new OasEndpointConverter();
			const auth = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const fakeEndpoint = {
				method: 'get',
				statusCode: 200,
				getName: () => 'testEndpoint',
				description: 'Test description',
				getTag: () => 'TestTag',
				getErrors: () => ({}),
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const path = converter.getOpenApiPath(fakeEndpoint as any, auth);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const operation = (path as any)['get'];

			expect(operation.summary).toBe('testEndpoint');
			expect(operation.description).toBe('Test description');
			expect(operation.tags).toEqual(['TestTag']);
			expect(operation.security).toEqual([{ BearerAuth: [] }]);
		});
	});

	describe('OasRestServerConverter with authentication', () => {
		it('collects security schemes from endpoints', async () => {
			const auth = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'BearerAuth',
			});

			class TestEndpoint extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'get' as any;
				override path = '/test';
				override fullPath = '/test';

				override getEffectiveAuthentication() {
					return auth;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			const converter = new OasRestServerConverter();
			const endpoint = new TestEndpoint();

			await converter.convertEndpoint(endpoint);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const schemes = (converter as any).securitySchemes;
			expect(schemes['BearerAuth']).toBeDefined();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((schemes['BearerAuth'] as any).type).toBe('http');
		});

		it('avoids duplicate security schemes', async () => {
			const auth = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'SharedAuth',
			});

			class Endpoint1 extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'get' as any;
				override path = '/test1';
				override fullPath = '/test1';

				override getEffectiveAuthentication() {
					return auth;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			class Endpoint2 extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'post' as any;
				override path = '/test2';
				override fullPath = '/test2';

				override getEffectiveAuthentication() {
					return auth;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			const converter = new OasRestServerConverter();
			await converter.convertEndpoint(new Endpoint1());
			await converter.convertEndpoint(new Endpoint2());

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const schemes = (converter as any).securitySchemes;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(Object.keys(schemes).length).toBe(1);
			expect(schemes['SharedAuth']).toBeDefined();
		});

		it('handles public endpoints (null auth)', async () => {
			class PublicEndpoint extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'get' as any;
				override path = '/public';
				override fullPath = '/public';

				override getEffectiveAuthentication() {
					return null;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			const converter = new OasRestServerConverter();
			await converter.convertEndpoint(new PublicEndpoint());

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const schemes = (converter as any).securitySchemes;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(Object.keys(schemes).length).toBe(0);
		});

		it('handles endpoints without auth (inherited)', async () => {
			class InheritedAuthEndpoint extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'get' as any;
				override path = '/inherited';
				override fullPath = '/inherited';

				override getEffectiveAuthentication() {
					return undefined;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			const converter = new OasRestServerConverter();
			await converter.convertEndpoint(new InheritedAuthEndpoint());

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const schemes = (converter as any).securitySchemes;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(Object.keys(schemes).length).toBe(0);
		});

		it('adds security schemes to components', async () => {
			const auth = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'BearerAuth',
				description: 'JWT Bearer Authentication',
			});

			class TestEndpoint extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'get' as any;
				override path = '/test';
				override fullPath = '/test';

				override getEffectiveAuthentication() {
					return auth;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			const mockServer = {
				name: 'Test Server',
				version: '1.0.0',
				description: 'Test',
				routerInstance: {
					registeredRoutes: [new TestEndpoint()],
				},
				authentication: undefined,
			};

			const converter = new OasRestServerConverter();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spec = await converter.getOpenApiSpec(mockServer as any);

			expect(spec.components?.securitySchemes).toBeDefined();
			expect(
				spec.components?.securitySchemes?.['BearerAuth']
			).toBeDefined();
		});

		it('sets global security with server auth', async () => {
			const serverAuth = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'GlobalAuth',
			});

			class TestEndpoint extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'get' as any;
				override path = '/test';
				override fullPath = '/test';

				override getEffectiveAuthentication() {
					return undefined;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			const mockServer = {
				name: 'Test Server',
				version: '1.0.0',
				description: 'Test',
				routerInstance: {
					registeredRoutes: [new TestEndpoint()],
				},
				authentication: serverAuth,
			};

			const converter = new OasRestServerConverter();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spec = await converter.getOpenApiSpec(mockServer as any);

			expect(spec.security).toBeDefined();
			expect(spec.security).toEqual([{ GlobalAuth: [] }]);
		});

		it('excludes empty security without server auth', async () => {
			class TestEndpoint extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'get' as any;
				override path = '/test';
				override fullPath = '/test';

				override getEffectiveAuthentication() {
					return undefined;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			const mockServer = {
				name: 'Test Server',
				version: '1.0.0',
				description: 'Test',
				routerInstance: {
					registeredRoutes: [new TestEndpoint()],
				},
				authentication: undefined,
			};

			const converter = new OasRestServerConverter();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spec = await converter.getOpenApiSpec(mockServer as any);

			expect(spec.security).toEqual([]);
		});

		it('collects multiple different auth schemes', async () => {
			const auth1 = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'BearerAuth',
			});

			const auth2 = new BearerAuthenticationScheme({
				checkToken: async () => true,
				schemeName: 'AdminBearer',
			});

			class Endpoint1 extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'get' as any;
				override path = '/test1';
				override fullPath = '/test1';

				override getEffectiveAuthentication() {
					return auth1;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			class Endpoint2 extends BaseApiEndpoint {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				override method = 'post' as any;
				override path = '/test2';
				override fullPath = '/test2';

				override getEffectiveAuthentication() {
					return auth2;
				}

				override getErrors() {
					return {};
				}

				override async handle() {
					return {};
				}
			}

			const mockServer = {
				name: 'Test Server',
				version: '1.0.0',
				description: 'Test',
				routerInstance: {
					registeredRoutes: [new Endpoint1(), new Endpoint2()],
				},
				authentication: undefined,
			};

			const converter = new OasRestServerConverter();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spec = await converter.getOpenApiSpec(mockServer as any);

			expect(spec.components?.securitySchemes).toBeDefined();
			const schemeKeys = Object.keys(
				spec.components?.securitySchemes || {}
			);
			expect(schemeKeys).toContain('BearerAuth');
			expect(schemeKeys).toContain('AdminBearer');
		});
	});

	describe('OasEndpointConverter auth with other properties', () => {
		it('combines authentication with error responses', () => {
			const converter = new OasEndpointConverter();
			const auth = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const fakeError = {
				getStatusCode: () => 401,
				message: 'Unauthorized',
			};

			const fakeEndpoint = {
				method: 'get',
				statusCode: 200,
				getName: () => 'secureEndpoint',
				description: 'Secure endpoint',
				getTag: () => 'secure',
				getErrors: () => ({ unauthorized: fakeError }),
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const path = converter.getOpenApiPath(fakeEndpoint as any, auth);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const operation = (path as any)['get'];

			expect(operation.security).toBeDefined();
			expect(operation.responses['401']).toBeDefined();
		});

		it('authentication with parameters', () => {
			const converter = new OasEndpointConverter();
			const auth = new BearerAuthenticationScheme({
				checkToken: async () => true,
			});

			const fakeEndpoint = {
				method: 'get',
				statusCode: 200,
				getName: () => 'userEndpoint',
				description: 'Get user',
				getTag: () => 'users',
				getErrors: () => ({}),
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const path = converter.getOpenApiPath(fakeEndpoint as any, auth);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const operation = (path as any)['get'];

			expect(operation.security).toBeDefined();
		});
	});
});
