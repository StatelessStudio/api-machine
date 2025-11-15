import 'jasmine';
import { RestServer } from '../../../src/server';
import { BaseApiRouter } from '../../../src/router/router';
import { BaseApiEndpoint } from '../../../src/router/endpoint';
import { BearerAuthenticationScheme } from '../../../src/authentication';
import { ErrorResponse } from '../../../src/error';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyServer = any;

describe('Authentication Integration Tests', () => {
	describe('Server-Level Authentication', () => {
		class ServerAuthEndpoint extends BaseApiEndpoint {
			override path = '/test';

			async handle() {
				return { authenticated: true };
			}
		}

		class ServerAuthRouter extends BaseApiRouter {
			override path = '/api';

			async routes() {
				return [ServerAuthEndpoint];
			}
		}

		class ServerWithAuth extends RestServer {
			override router = ServerAuthRouter;
			override name = 'ServerWithAuth';
			override version = '1.0.0';

			constructor() {
				super({
					port: 0,
					authentication: new BearerAuthenticationScheme({
						checkToken: async (token: string) =>
							token === 'server-token',
						schemeName: 'ServerAuth',
					}),
				});
			}
		}

		it('should apply server auth to endpoints', async () => {
			const server = new ServerWithAuth();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				// Request without auth should fail
				const noAuthResponse = await fetch(`${baseUrl}/api/test`);
				expect(noAuthResponse.status).toBe(401);

				// Request with valid token should succeed
				const authResponse = await fetch(`${baseUrl}/api/test`, {
					headers: {
						Authorization: 'Bearer server-token',
					},
				});
				expect(authResponse.status).toBe(200);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data = (await authResponse.json()) as any;
				expect(data.authenticated).toBe(true);
			}
			finally {
				await server.stop();
			}
		});

		it('should reject invalid server tokens', async () => {
			const server = new ServerWithAuth();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				const response = await fetch(`${baseUrl}/api/test`, {
					headers: { Authorization: 'Bearer wrong-token' },
				});

				expect(response.status).toBe(401);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data = (await response.json()) as ErrorResponse;
				expect(data.error).toBe('UnauthorizedError');
				expect(data.message).toBe('Bearer token check failed');
			}
			finally {
				await server.stop();
			}
		});
	});

	describe('Router-Level Authentication Override', () => {
		class PublicEndpoint extends BaseApiEndpoint {
			override path = '/public';

			async handle() {
				return { public: true };
			}
		}

		class ProtectedEndpoint extends BaseApiEndpoint {
			override path = '/protected';

			async handle() {
				return { protected: true };
			}
		}

		class PublicRouter extends BaseApiRouter {
			override path = '/api';
			override authentication = null;

			async routes() {
				return [PublicEndpoint];
			}
		}

		class ProtectedRouter extends BaseApiRouter {
			override path = '/secure';
			override authentication = new BearerAuthenticationScheme({
				checkToken: async (token: string) => token === 'router-token',
				schemeName: 'RouterAuth',
			});

			async routes() {
				return [ProtectedEndpoint];
			}
		}

		class MixedAuthServer extends RestServer {
			override router = class extends BaseApiRouter {
				async routes() {
					return [PublicRouter, ProtectedRouter];
				}
			};
			override name = 'MixedAuthServer';
			override version = '1.0.0';

			constructor() {
				super({
					port: 0,
					authentication: new BearerAuthenticationScheme({
						checkToken: async () => false,
						schemeName: 'DefaultAuth',
					}),
				});
			}
		}

		it('should allow public router to bypass server auth', async () => {
			const server = new MixedAuthServer();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				const response = await fetch(`${baseUrl}/api/public`);
				expect(response.status).toBe(200);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data = (await response.json()) as any;
				expect(data.public).toBe(true);
			}
			finally {
				await server.stop();
			}
		});

		it('should use router auth when specified', async () => {
			const server = new MixedAuthServer();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				// Without router token should fail
				const noAuthResponse = await fetch(
					`${baseUrl}/secure/protected`
				);
				expect(noAuthResponse.status).toBe(401);

				// With router token should succeed
				const authResponse = await fetch(
					`${baseUrl}/secure/protected`,
					{
						headers: {
							Authorization: 'Bearer router-token',
						},
					}
				);
				expect(authResponse.status).toBe(200);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data = (await authResponse.json()) as any;
				expect(data.protected).toBe(true);
			}
			finally {
				await server.stop();
			}
		});
	});

	describe('Endpoint-Level Authentication Override', () => {
		class AdminEndpoint extends BaseApiEndpoint {
			override path = '/admin';
			override authentication = new BearerAuthenticationScheme({
				checkToken: async (token: string) => token === 'admin-token',
				schemeName: 'AdminAuth',
			});

			async handle() {
				return { admin: true };
			}
		}

		class RegularEndpoint extends BaseApiEndpoint {
			override path = '/regular';

			async handle() {
				return { regular: true };
			}
		}

		class PublicEndpoint extends BaseApiEndpoint {
			override path = '/info';
			override authentication = null;

			async handle() {
				return { info: 'public' };
			}
		}

		class MixedEndpointRouter extends BaseApiRouter {
			override path = '/api';
			override authentication = new BearerAuthenticationScheme({
				checkToken: async (token: string) => token === 'user-token',
				schemeName: 'UserAuth',
			});

			async routes() {
				return [AdminEndpoint, RegularEndpoint, PublicEndpoint];
			}
		}

		class EndpointAuthServer extends RestServer {
			override router = class extends BaseApiRouter {
				async routes() {
					return [MixedEndpointRouter];
				}
			};
			override name = 'EndpointAuthServer';
			override version = '1.0.0';

			constructor() {
				super({ port: 0 });
			}
		}

		it('should use endpoint auth when specified', async () => {
			const server = new EndpointAuthServer();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				// Admin endpoint requires admin token
				const wrongTokenResponse = await fetch(`${baseUrl}/api/admin`, {
					headers: { Authorization: 'Bearer user-token' },
				});
				expect(wrongTokenResponse.status).toBe(401);

				// Admin endpoint succeeds with admin token
				const adminResponse = await fetch(`${baseUrl}/api/admin`, {
					headers: { Authorization: 'Bearer admin-token' },
				});
				expect(adminResponse.status).toBe(200);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const adminData = (await adminResponse.json()) as any;
				expect(adminData.admin).toBe(true);
			}
			finally {
				await server.stop();
			}
		});

		it('should use router auth when endpoint not specified', async () => {
			const server = new EndpointAuthServer();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				// Regular endpoint uses router auth
				const wrongTokenResponse = await fetch(
					`${baseUrl}/api/regular`,
					{
						headers: { Authorization: 'Bearer admin-token' },
					}
				);
				expect(wrongTokenResponse.status).toBe(401);

				const userTokenResponse = await fetch(
					`${baseUrl}/api/regular`,
					{
						headers: { Authorization: 'Bearer user-token' },
					}
				);
				expect(userTokenResponse.status).toBe(200);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data = (await userTokenResponse.json()) as any;
				expect(data.regular).toBe(true);
			}
			finally {
				await server.stop();
			}
		});

		it('should allow public endpoints despite router auth', async () => {
			const server = new EndpointAuthServer();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				// Public endpoint should succeed without any auth
				const response = await fetch(`${baseUrl}/api/info`);
				expect(response.status).toBe(200);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data = (await response.json()) as any;
				expect(data.info).toBe('public');
			}
			finally {
				await server.stop();
			}
		});
	});

	describe('Authentication Middleware Integration', () => {
		class TestEndpoint extends BaseApiEndpoint {
			override path = '/test';

			async handle() {
				return { success: true };
			}
		}

		class TestRouter extends BaseApiRouter {
			override path = '/api';
			override authentication = new BearerAuthenticationScheme({
				checkToken: async (token: string) => token === 'valid-token',
			});

			async routes() {
				return [TestEndpoint];
			}
		}

		class TestServer extends RestServer {
			override router = class extends BaseApiRouter {
				async routes() {
					return [TestRouter];
				}
			};
			override name = 'TestServer';
			override version = '1.0.0';

			constructor() {
				super({ port: 0 });
			}
		}

		it('should handle concurrent requests correctly', async () => {
			const server = new TestServer();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				const requests = [
					fetch(`${baseUrl}/api/test`, {
						headers: { Authorization: 'Bearer valid-token' },
					}),
					fetch(`${baseUrl}/api/test`, {
						headers: { Authorization: 'Bearer invalid-token' },
					}),
					fetch(`${baseUrl}/api/test`),
					fetch(`${baseUrl}/api/test`, {
						headers: { Authorization: 'Bearer valid-token' },
					}),
				];

				const responses = await Promise.all(requests);
				expect(responses[0].status).toBe(200);
				expect(responses[1].status).toBe(401);
				expect(responses[2].status).toBe(401);
				expect(responses[3].status).toBe(200);
			}
			finally {
				await server.stop();
			}
		});

		it('should preserve request isolation', async () => {
			const server = new TestServer();
			await server.start();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const port = ((server as AnyServer).listener as any).address().port;
			const baseUrl = `http://localhost:${port}`;

			try {
				const validResponse = await fetch(`${baseUrl}/api/test`, {
					headers: { Authorization: 'Bearer valid-token' },
				});

				const invalidResponse = await fetch(`${baseUrl}/api/test`, {
					headers: { Authorization: 'Bearer invalid-token' },
				});

				expect(validResponse.status).toBe(200);
				expect(invalidResponse.status).toBe(401);

				// Second valid request should still work
				const validResponse2 = await fetch(`${baseUrl}/api/test`, {
					headers: { Authorization: 'Bearer valid-token' },
				});
				expect(validResponse2.status).toBe(200);
			}
			finally {
				await server.stop();
			}
		});
	});
});
