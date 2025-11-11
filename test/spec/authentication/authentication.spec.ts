import 'jasmine';
import { MockConsole } from 'ts-jasmine-spies';

import { env } from '../../env';
import { ErrorResponse } from '../../../src/error';

describe('Authentication Middleware', function () {
	const baseUrl = env.API_URL;
	const validToken = 'validtoken';

	let mockConsole: MockConsole;

	beforeEach(async function () {
		mockConsole = new MockConsole();
	});

	describe('Protected Routes (/protected/*)', function () {
		const protectedEndpoint = `${baseUrl}/protected/test`;

		it('should reject requests without Authorization', async function () {
			const response = await fetch(protectedEndpoint);

			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data.message).toBe('Authorization header is missing');
			expect(data.error).toBe('UnauthorizedError');
			expect(data.timestamp).toBeDefined();

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - No token provided'
			);
		});

		it('should reject requests with missing token', async function () {
			const response = await fetch(protectedEndpoint, {
				headers: { Authorization: 'Bearer' },
			});

			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data.message).toBe('Bearer token is empty or invalid');
			expect(data.error).toBe('UnauthorizedError');

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - Invalid token format'
			);
			mockConsole.expectStderrContains('"code": "INVALID_BEARER_TOKEN",');
			mockConsole.expectStderrContains(
				'"message": "Token must contain Bearer prefix and token'
			);
		});

		it('should reject empty Authorization', async function () {
			const response = await fetch(protectedEndpoint, {
				headers: { Authorization: '' },
			});

			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data.message).toBe('Authorization header is missing');
			expect(data.error).toBe('UnauthorizedError');

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - No token provided'
			);
		});

		it('should reject requests with wrong token', async function () {
			const response = await fetch(protectedEndpoint, {
				headers: { Authorization: 'Bearer invalid-token' },
			});

			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data.message).toBe('Bearer token check failed');
			expect(data.error).toBe('UnauthorizedError');
			expect(data.timestamp).toBeDefined();

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - Check token failed'
			);
		});

		it('should reject malformed Authorization', async function () {
			const response = await fetch(protectedEndpoint, {
				headers: { Authorization: 'InvalidFormat token' },
			});

			// Middleware extracts "token" and compares to bearer token
			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data.message).toBe('Bearer token is empty or invalid');
			expect(data.error).toBe('UnauthorizedError');

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - Invalid token'
			);
		});

		it('should reject requests with Basic auth', async function () {
			const response = await fetch(protectedEndpoint, {
				headers: { Authorization: 'Basic dXNlcjpwYXNzd29yZA==' },
			});

			// Middleware extracts "dXNlcjpwYXNzd29yZA==" and compares
			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data.message).toBe('Bearer token is empty or invalid');
			expect(data.error).toBe('UnauthorizedError');

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - Invalid token'
			);
		});

		it('should accept requests with valid Bearer token', async function () {
			const response = await fetch(protectedEndpoint, {
				headers: { Authorization: `Bearer ${validToken}` },
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as { ok: boolean };

			expect(data).toEqual({ ok: true });

			mockConsole.expectStdout('');
			mockConsole.expectStderr('');
		});

		it('should handle case-sensitive Authorization', async function () {
			const response = await fetch(protectedEndpoint, {
				headers: { authorization: `Bearer ${validToken}` },
			});

			expect(response.status).toBe(200);

			mockConsole.expectStdout('');
			mockConsole.expectStderr('');
		});

		it('should handle extra whitespace in Bearer token', async function () {
			const response = await fetch(protectedEndpoint, {
				headers: { Authorization: `Bearer  ${validToken}  ` },
			});

			// Multiple spaces result in extracting empty/wrong token
			expect(response.status).toBe(200);

			const data = (await response.json()) as { ok: boolean };
			expect(data).toEqual({ ok: true });
			mockConsole.expectStdout('');
			mockConsole.expectStderr('');
		});

		it('should include timestamp in error', async function () {
			const beforeRequest = new Date();
			const response = await fetch(protectedEndpoint);
			const afterRequest = new Date();

			const data = (await response.json()) as ErrorResponse;
			const responseTimestamp = new Date(data.timestamp);

			expect(responseTimestamp.getTime()).toBeGreaterThanOrEqual(
				beforeRequest.getTime() - 1000
			);
			expect(responseTimestamp.getTime()).toBeLessThanOrEqual(
				afterRequest.getTime() + 1000
			);

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - No token provided'
			);
		});
	});

	describe('Authentication Error Response Format', function () {
		it('should return JSON for auth errors', async function () {
			const response = await fetch(`${baseUrl}/protected/test`);

			const contentType = response.headers.get('content-type');
			expect(contentType).toContain('application/json');

			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data).toEqual({
				error: jasmine.any(String),
				message: jasmine.any(String),
				timestamp: jasmine.any(String),
				options: jasmine.any(Object),
			});

			expect(Object.keys(data)).toEqual([
				'error',
				'message',
				'timestamp',
				'options',
			]);

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - No token provided'
			);
		});

		it('should return consistent error for 401', async function () {
			const response = await fetch(`${baseUrl}/protected/test`);

			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data).toEqual({
				error: jasmine.any(String),
				message: jasmine.any(String),
				timestamp: jasmine.any(String),
				options: jasmine.any(Object),
			});

			expect(Object.keys(data)).toEqual([
				'error',
				'message',
				'timestamp',
				'options',
			]);

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - No token provided'
			);
		});

		it('should return 401 for invalid token', async function () {
			const response = await fetch(`${baseUrl}/protected/test`, {
				headers: {
					Authorization: 'Bearer wrong-token',
				},
			});

			expect(response.status).toBe(401);

			const data = (await response.json()) as ErrorResponse;
			expect(data).toEqual({
				error: jasmine.any(String),
				message: jasmine.any(String),
				timestamp: jasmine.any(String),
				options: jasmine.any(Object),
			});

			expect(Object.keys(data)).toEqual([
				'error',
				'message',
				'timestamp',
				'options',
			]);

			mockConsole.expectStderrContains(
				'Unauthorized access attempt from ::1 - Check token failed'
			);
		});
	});

	describe('Security Headers and Behavior', function () {
		it('should not expose sensitive internal details', async function () {
			const response = await fetch(`${baseUrl}/protected/test`);

			const data = (await response.json()) as ErrorResponse;
			expect(data.error).not.toContain('env');
			expect(data.error).not.toContain('BEARER_TOKEN');
			expect(data.error).not.toContain('your-secret-bearer-token-here');
			expect(data.error).not.toContain('secret');
		});

		it('should handle concurrent requests', async function () {
			const requests = Array.from({ length: 5 }, async () =>
				fetch(`${baseUrl}/protected/test`, {
					headers: { Authorization: `Bearer ${validToken}` },
				})
			);

			const responses = await Promise.all(requests);

			for (const response of responses) {
				expect(response.status).toBe(200);
			}

			mockConsole.expectStdout('');
			mockConsole.expectStderr('');
		});

		it('should handle mixed tokens concurrently', async function () {
			const validRequest = fetch(`${baseUrl}/protected/test`, {
				headers: { Authorization: `Bearer ${validToken}` },
			});

			const invalidRequest = fetch(`${baseUrl}/protected/test`, {
				headers: { Authorization: 'Bearer invalid-token' },
			});

			const noAuthRequest = fetch(`${baseUrl}/protected/test`);

			const [validResponse, invalidResponse, noAuthResponse] =
				await Promise.all([
					validRequest,
					invalidRequest,
					noAuthRequest,
				]);

			expect(validResponse.status).toBe(200); // Passes auth
			expect(invalidResponse.status).toBe(401); // Invalid token
			expect(noAuthResponse.status).toBe(401); // No token
		});
	});

	describe('Authorization Header Variations', function () {
		it('should work with proper Bearer token format', async function () {
			const response = await fetch(`${baseUrl}/protected/test`, {
				headers: { Authorization: `Bearer ${validToken}` },
			});

			expect(response.status).toBe(200);
		});

		it('should not allow non-Bearer schemes', async function () {
			// Test that the middleware extracts tokens properly
			const response = await fetch(`${baseUrl}/protected/test`, {
				headers: { Authorization: `SomeScheme ${validToken}` },
			});

			expect(response.status).toBe(401);
		});

		it('should reject empty Bearer token', async function () {
			const response = await fetch(`${baseUrl}/protected/test`, {
				headers: { Authorization: 'Bearer ' },
			});

			expect(response.status).toBe(401);
		});
	});

	describe('Performance and Reliability', function () {
		it('should handle concurrent auth failures', async function () {
			const requests = Array.from({ length: 10 }, async () => {
				const startTime = Date.now();
				const response = await fetch(`${baseUrl}/protected/test`);
				const endTime = Date.now();

				return {
					status: response.status,
					responseTime: endTime - startTime,
				};
			});

			const results = await Promise.all(requests);

			for (const result of results) {
				expect(result.status).toBe(401);
				expect(result.responseTime).toBeLessThan(1000);
			}
		});
	});
});
