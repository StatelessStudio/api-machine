import 'jasmine';
import { env } from '../../env';

describe('Endpoint Methods', function () {
	const baseUrl = env.API_URL + '/methods';

	describe('GET Method', function () {
		it('should handle GET requests', async function () {
			const response = await fetch(`${baseUrl}/items`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as unknown[];
			expect(Array.isArray(data)).toBe(true);
		});

		it('returns 405 for unsupported methods', async function () {
			const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

			for (const method of methods) {
				const response = await fetch(`${baseUrl}/default-method`, {
					method: method,
				});

				// Should return 404 (route not found) or
				// 405 (method not allowed)
				expect(response.status).toBe(405);
			}
		});
	});

	describe('POST Method', function () {
		it('should handle POST requests', async function () {
			const response = await fetch(`${baseUrl}/items`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: 'Test' }),
			});

			expect(response.status).toBe(201);

			const data = (await response.json()) as { id: number };
			expect(data.id).toBeDefined();
		});

		it('should reject other methods on POST endpoint', async function () {
			const methods = ['GET', 'PUT', 'DELETE', 'PATCH'];

			for (const method of methods) {
				const response = await fetch(`${baseUrl}/post-only`, {
					method: method,
				});

				expect(response.status).toBe(405);
			}
		});
	});

	describe('PUT Method', function () {
		it('should handle PUT requests', async function () {
			const response = await fetch(`${baseUrl}/items/1`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: 'Updated' }),
			});

			expect(response.status).toBe(200);
		});

		it('should reject other methods on PUT endpoint', async function () {
			const methods = ['GET', 'POST', 'DELETE', 'PATCH'];

			for (const method of methods) {
				const response = await fetch(`${baseUrl}/put-only`, {
					method: method,
				});

				expect(response.status).toBe(405);
			}
		});
	});

	describe('DELETE Method', function () {
		it('should handle DELETE requests', async function () {
			const response = await fetch(`${baseUrl}/items/1`, {
				method: 'DELETE',
			});

			expect(response.status).toBe(204);
		});

		it('should reject other methods on DELETE endpoint', async function () {
			const methods = ['GET', 'POST', 'PUT', 'PATCH'];

			for (const method of methods) {
				const response = await fetch(`${baseUrl}/delete-only`, {
					method: method,
				});

				expect(response.status).toBe(405);
			}
		});
	});

	describe('PATCH Method', function () {
		it('should handle PATCH requests', async function () {
			const response = await fetch(`${baseUrl}/items/1`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: 'Patched' }),
			});

			expect(response.status).toBe(200);
		});

		it('should reject other methods on PATCH endpoint', async function () {
			const methods = ['GET', 'POST', 'PUT', 'DELETE'];

			for (const method of methods) {
				const response = await fetch(`${baseUrl}/patch-only`, {
					method: method,
				});

				expect(response.status).toBe(405);
			}
		});
	});

	describe('Method Property', function () {
		it('uses GET as default method', async function () {
			const response = await fetch(`${baseUrl}/default-method`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as { method: string };
			expect(data.method).toBe('get');
		});

		it('should allow overriding the default method', async function () {
			// Test that POST endpoint works
			const postResponse = await fetch(`${baseUrl}/items`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Test' }),
			});
			expect(postResponse.status).toBe(201);

			// Test that GET on same path works (different endpoint)
			const getResponse = await fetch(`${baseUrl}/items`);
			expect(getResponse.status).toBe(200);
		});
	});

	describe('Multiple Endpoints Same Path', function () {
		it('should support different methods on same path', async function () {
			const path = `${baseUrl}/items/1`;

			// GET should work
			const getResponse = await fetch(path);
			expect(getResponse.status).toBe(200);

			// PUT should work
			const putResponse = await fetch(path, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Test' }),
			});
			expect(putResponse.status).toBe(200);

			// PATCH should work
			const patchResponse = await fetch(path, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Test' }),
			});
			expect(patchResponse.status).toBe(200);

			// DELETE should work
			const deleteResponse = await fetch(path, { method: 'DELETE' });
			expect(deleteResponse.status).toBe(204);
		});
	});
});
