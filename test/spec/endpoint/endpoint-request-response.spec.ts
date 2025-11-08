import 'jasmine';
import { env } from '../../env';

describe('Request and Response Handling', function () {
	const baseUrl = env.API_URL + '/request-response';

	describe('Global Security Headers', function () {
		it('should remove X-Powered-By header by default', async function () {
			const response = await fetch(`${baseUrl}/echo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(200);
			expect(response.headers.get('X-Powered-By')).toBeNull();
		});

		it('should set global security headers', async function () {
			const response = await fetch(`${baseUrl}/echo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(200);

			// Verify global security headers
			expect(response.headers.get('X-Content-Type-Options')).toBe(
				'nosniff'
			);
			expect(response.headers.get('X-Frame-Options')).toBe('DENY');
			expect(response.headers.get('X-XSS-Protection')).toBe(
				'1; mode=block'
			);
		});

		it('should not set HSTS header by default', async function () {
			const response = await fetch(`${baseUrl}/echo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(200);
			expect(
				response.headers.get('Strict-Transport-Security')
			).toBeNull();
		});
	});

	describe('Request Body Parsing', function () {
		it('should parse JSON request body', async function () {
			const requestBody = {
				name: 'Test Item',
				value: 42,
			};

			const response = await fetch(`${baseUrl}/echo`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				received: typeof requestBody;
			};
			expect(data.received.name).toBe(requestBody.name);
			expect(data.received.value).toBe(requestBody.value);
		});

		it('should handle nested JSON objects', async function () {
			const requestBody = {
				user: {
					name: 'John',
					age: 30,
				},
				settings: {
					notifications: true,
					theme: 'dark',
				},
			};

			const response = await fetch(`${baseUrl}/echo`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				received: typeof requestBody;
			};
			expect(data.received.user.name).toBe('John');
			expect(data.received.settings.theme).toBe('dark');
		});

		it('should handle arrays in request body', async function () {
			const requestBody = {
				items: ['apple', 'banana', 'cherry'],
				numbers: [1, 2, 3],
			};

			const response = await fetch(`${baseUrl}/echo`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				received: typeof requestBody;
			};
			expect(data.received.items.length).toBe(3);
			expect(data.received.items[0]).toBe('apple');
			expect(data.received.numbers[2]).toBe(3);
		});

		it('should handle empty request body', async function () {
			const response = await fetch(`${baseUrl}/echo`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				received: Record<string, unknown>;
			};
			expect(Object.keys(data.received).length).toBe(0);
		});

		it('should handle large request bodies', async function () {
			const largeArray = Array.from({ length: 100 }, (_, i) => ({
				id: i,
				name: `Item ${i}`,
			}));

			const response = await fetch(`${baseUrl}/echo`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ items: largeArray }),
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				received: { items: typeof largeArray };
			};
			expect(data.received.items.length).toBe(100);
		});
	});

	describe('Request Headers', function () {
		it('should access standard request headers', async function () {
			const response = await fetch(`${baseUrl}/headers`, {
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					'User-Agent': 'TestAgent/1.0',
				},
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				headers: Record<string, string>;
			};
			expect(data.headers['content-type']).toContain('application/json');
			expect(data.headers['accept']).toBe('application/json');
		});

		it('should access custom request headers', async function () {
			const response = await fetch(`${baseUrl}/headers`, {
				headers: {
					'X-Custom-Header': 'custom-value',
					'X-Request-ID': '12345',
				},
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				headers: Record<string, string>;
			};
			expect(data.headers['x-custom-header']).toBe('custom-value');
			expect(data.headers['x-request-id']).toBe('12345');
		});
	});

	describe('Response Headers', function () {
		it('should set custom response headers', async function () {
			const response = await fetch(`${baseUrl}/custom-headers`);
			expect(response.status).toBe(200);

			const customHeader = response.headers.get('X-Custom-Response');
			expect(customHeader).toBe('test-value');

			const poweredBy = response.headers.get('X-Powered-By');
			expect(poweredBy).toBe('ts-rest');
		});

		it('should set Content-Type header automatically', async function () {
			const response = await fetch(`${baseUrl}/custom-headers`);
			expect(response.status).toBe(200);

			const contentType = response.headers.get('Content-Type');
			expect(contentType).toContain('application/json');
		});

		it('should set cache control headers', async function () {
			const response = await fetch(`${baseUrl}/cacheable`);
			expect(response.status).toBe(200);

			const cacheControl = response.headers.get('Cache-Control');
			expect(cacheControl).toBeDefined();
			expect(cacheControl).toContain('max-age');
		});

		it('should set CORS headers', async function () {
			const response = await fetch(`${baseUrl}/cors-headers`);
			expect(response.status).toBe(200);

			// Verify CORS headers
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
				'*'
			);
			expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
				'GET, POST, PUT, DELETE, OPTIONS'
			);
			expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
				'Content-Type, Authorization'
			);
			expect(response.headers.get('Access-Control-Max-Age')).toBe(
				'86400'
			);
		});

		it('should set custom content-type header', async function () {
			const response = await fetch(`${baseUrl}/custom-content-type`);
			expect(response.status).toBe(200);

			// Verify custom content type is set
			const contentType = response.headers.get('Content-Type');
			expect(contentType).toBe('application/vnd.api+json; charset=utf-8');
		});

		it('should set location header for redirects', async function () {
			const response = await fetch(`${baseUrl}/redirect-header`, {
				redirect: 'manual',
			});
			expect(response.status).toBe(302);

			// Verify location header
			expect(response.headers.get('Location')).toBe(
				'/api/request-response/new-location'
			);
		});

		it('should set ETag and Last-Modified headers', async function () {
			const response = await fetch(`${baseUrl}/cache-validation`);
			expect(response.status).toBe(200);

			// Verify cache validation headers
			expect(response.headers.get('ETag')).toBe('"abc123"');
			expect(response.headers.get('Last-Modified')).toMatch(
				/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/
			);
		});
	});

	describe('Response Status Codes', function () {
		it('should set custom status codes', async function () {
			const response = await fetch(`${baseUrl}/created`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'New Item' }),
			});

			expect(response.status).toBe(201);
		});

		it('should handle no content responses', async function () {
			const response = await fetch(`${baseUrl}/no-content`, {
				method: 'DELETE',
			});

			expect(response.status).toBe(204);
		});

		it('should handle bad request responses', async function () {
			const response = await fetch(`${baseUrl}/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ invalid: 'data' }),
			});

			expect(response.status).toBe(400);
		});
	});

	describe('Request Method and Path', function () {
		it('should provide access to request method', async function () {
			const response = await fetch(`${baseUrl}/request-info`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(200);

			const data = (await response.json()) as { method: string };
			expect(data.method).toBe('POST');
		});

		it('should provide access to request path', async function () {
			const response = await fetch(`${baseUrl}/request-info`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as { path: string };
			expect(data.path).toContain('/request-info');
		});
	});
});
