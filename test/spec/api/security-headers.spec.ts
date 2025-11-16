import 'jasmine';
import { RestServer } from '../../../src';
import { BaseApiRouter, BaseApiEndpoint } from '../../../src/router';

describe('Security Headers Configuration', function () {
	class TestRouter extends BaseApiRouter {
		override path = '/security-test';

		override async routes() {
			return [
				class extends BaseApiEndpoint {
					override async handle() {
						return { test: true };
					}
				},
			];
		}
	}

	class SecureServer extends RestServer {
		override router = TestRouter;
	}

	describe('Default Security (Secure by Default)', function () {
		let server: SecureServer;
		const testPort = 4001;
		const baseUrl = `http://localhost:${testPort}/security-test`;

		afterEach(async function () {
			if (server) {
				await server.stop();
			}
		});

		it('should remove X-Powered-By by default', async function () {
			server = new SecureServer({ port: testPort });
			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			// X-Powered-By should be removed for security
			const poweredBy = response.headers.get('X-Powered-By');
			expect(poweredBy).toBeNull();
		});

		it('should set X-Content-Type-Options by default', async function () {
			server = new SecureServer({ port: testPort });
			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			const contentTypeOptions = response.headers.get(
				'X-Content-Type-Options'
			);
			expect(contentTypeOptions).toBe('nosniff');
		});

		it('should set X-Frame-Options to DENY by default', async function () {
			server = new SecureServer({ port: testPort });
			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			const frameOptions = response.headers.get('X-Frame-Options');
			expect(frameOptions).toBe('DENY');
		});

		it('should set X-XSS-Protection by default', async function () {
			server = new SecureServer({ port: testPort });
			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			const xssProtection = response.headers.get('X-XSS-Protection');
			expect(xssProtection).toBe('1; mode=block');
		});

		it('should NOT set HSTS by default (HTTP-safe)', async function () {
			server = new SecureServer({ port: testPort });
			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			// HSTS should not be set by default (only use with HTTPS)
			const hsts = response.headers.get('Strict-Transport-Security');
			expect(hsts).toBeNull();
		});
	});

	describe('HSTS Configuration', function () {
		let server: SecureServer;
		const testPort = 4001;
		const baseUrl = `http://localhost:${testPort}/security-test`;

		afterEach(async function () {
			if (server) {
				await server.stop();
			}
		});

		it('should set HSTS header when enabled', async function () {
			// Create server with HSTS enabled
			server = new SecureServer({
				port: testPort,
				securityHeaders: {
					disableXPoweredBy: true,
					noSniff: true,
					frameOptions: 'DENY',
					xssProtection: true,
					hsts: 31536000, // 1 year
				},
			});

			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			// Verify HSTS header is set
			const hsts = response.headers.get('Strict-Transport-Security');
			expect(hsts).toBe('max-age=31536000; includeSubDomains');
		});

		it('should allow custom HSTS max-age', async function () {
			// Create server with custom HSTS duration
			server = new SecureServer({
				port: testPort,
				securityHeaders: {
					disableXPoweredBy: true,
					noSniff: true,
					frameOptions: 'DENY',
					xssProtection: true,
					hsts: 86400, // 1 day
				},
			});

			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			// Verify HSTS header has correct max-age
			const hsts = response.headers.get('Strict-Transport-Security');
			expect(hsts).toBe('max-age=86400; includeSubDomains');
		});
	});

	describe('Security Headers Customization', function () {
		let server: SecureServer;
		const testPort = 4002;
		const baseUrl = `http://localhost:${testPort}/security-test`;

		afterEach(async function () {
			if (server) {
				await server.stop();
			}
		});

		it('should allow X-Powered-By if needed', async function () {
			server = new SecureServer({
				port: testPort,
				securityHeaders: {
					disableXPoweredBy: false,
					noSniff: true,
					frameOptions: 'DENY',
					xssProtection: true,
					hsts: false,
				},
			});

			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			// X-Powered-By should be present when not disabled
			const poweredBy = response.headers.get('X-Powered-By');
			expect(poweredBy).toBeDefined();
			expect(poweredBy).toContain('Express');
		});

		it('should allow SAMEORIGIN frame options', async function () {
			server = new SecureServer({
				port: testPort,
				securityHeaders: {
					disableXPoweredBy: true,
					noSniff: true,
					frameOptions: 'SAMEORIGIN',
					xssProtection: true,
					hsts: false,
				},
			});

			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			const frameOptions = response.headers.get('X-Frame-Options');
			expect(frameOptions).toBe('SAMEORIGIN');
		});

		it('should allow disabling frame options', async function () {
			server = new SecureServer({
				port: testPort,
				securityHeaders: {
					disableXPoweredBy: true,
					noSniff: true,
					frameOptions: false,
					xssProtection: true,
					hsts: false,
				},
			});

			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			const frameOptions = response.headers.get('X-Frame-Options');
			expect(frameOptions).toBeNull();
		});

		it('should allow disabling noSniff if required', async function () {
			server = new SecureServer({
				port: testPort,
				securityHeaders: {
					disableXPoweredBy: true,
					noSniff: false,
					frameOptions: 'DENY',
					xssProtection: true,
					hsts: false,
				},
			});

			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			const contentTypeOptions = response.headers.get(
				'X-Content-Type-Options'
			);
			expect(contentTypeOptions).toBeNull();
		});

		it('should allow disabling XSS protection', async function () {
			server = new SecureServer({
				port: testPort,
				securityHeaders: {
					disableXPoweredBy: true,
					noSniff: true,
					frameOptions: 'DENY',
					xssProtection: false,
					hsts: false,
				},
			});

			await server.start();

			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);

			const xssProtection = response.headers.get('X-XSS-Protection');
			expect(xssProtection).toBeNull();
		});
	});
});
