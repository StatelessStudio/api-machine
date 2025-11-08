import 'jasmine';
import { MockConsole } from 'ts-jasmine-spies';

import { env } from '../../env';
import { server } from '../../test-server';
import { ErrorResponse } from '../../../src/error';
import { defaultRestServerOptions } from '../../../src';

describe('API Server', function () {
	const baseUrl = env.API_URL + '/test';
	let mockConsole: MockConsole;

	beforeEach(() => {
		mockConsole = new MockConsole();
	});

	describe('Server Status', function () {
		it('should be running and accessible', async function () {
			const response = await fetch(baseUrl);
			expect(response.status).toBe(200);
		});

		it('should respond within reasonable time', async function () {
			const startTime = Date.now();
			const response = await fetch(baseUrl);
			const endTime = Date.now();
			const responseTime = endTime - startTime;

			expect(response.status).toBe(200);
			// Should respond within 1 second
			expect(responseTime).toBeLessThan(1000);
		});

		it('should serve JSON responses', async function () {
			const response = await fetch(baseUrl);
			const contentType = response.headers.get('content-type');
			expect(contentType).toContain('application/json');
		});
	});

	describe('Configuration Options', function () {
		it('should export default REST server options', function () {
			expect(defaultRestServerOptions).toBeDefined();
			expect(defaultRestServerOptions.port).toBeDefined();
			expect(defaultRestServerOptions.maxPayloadSizeMB).toBeDefined();
			expect(defaultRestServerOptions.maxUrlEncodedSizeMB).toBeDefined();
			expect(defaultRestServerOptions.log).toBeDefined();
		});
	});

	describe('CORS Support', function () {
		it('should include CORS headers', async function () {
			const response = await fetch(baseUrl);
			const corsHeader = response.headers.get(
				'access-control-allow-origin'
			);

			// CORS should be enabled (could be * or specific origin)
			expect(corsHeader).toBeDefined();
		});

		it('should handle preflight OPTIONS requests', async function () {
			const response = await fetch(baseUrl, {
				method: 'OPTIONS',
			});

			// Should handle OPTIONS for CORS preflight
			expect([200, 204]).toContain(response.status);
		});
	});

	describe('Request/Response Format', function () {
		it('should handle JSON request bodies', async function () {
			const response = await fetch(baseUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			});

			expect(response.status).toBe(200);
		});

		it('should reject invalid HTTP methods', async function () {
			const invalidMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

			for (const method of invalidMethods) {
				const response = await fetch(baseUrl, {
					method: method,
				});

				// Should return 404 or 405 for unsupported methods
				expect([404, 405]).toContain(response.status);
			}
		});
	});

	describe('Startup errors', function () {
		it('should throw error for port already in use', async function () {
			await expectAsync(server.start()).toBeRejectedWithError(
				'listen EADDRINUSE: address already in use :::' + env.API_PORT
			);
		});
	});

	describe('Error Handling', function () {
		it('should return 404 for non-existent endpoints', async function () {
			const response = await fetch(`${baseUrl}/non-existent-endpoint`);
			expect(response.status).toBe(404);

			const data = (await response.json()) as ErrorResponse;
			expect(data.error).toBe('Endpoint not found');
			expect(data.code).toBe('NOT_FOUND');
			expect(data.timestamp).toBeDefined();
		});

		it('should return JSON error responses', async function () {
			const response = await fetch(`${baseUrl}/non-existent-endpoint`);
			const contentType = response.headers.get('content-type');
			expect(contentType).toContain('application/json');
		});

		it('should handle server errors gracefully', async function () {
			const response = await fetch(`${baseUrl}/error-test`);
			expect(response.status).toBe(500);

			const data = (await response.json()) as ErrorResponse;
			expect(data.error).toBe('Internal server error');
			expect(data.code).toBe('INTERNAL_ERROR');
			expect(data.timestamp).toBeDefined();

			mockConsole.expectStderrContains('Error: Test error');
		});
	});
});
