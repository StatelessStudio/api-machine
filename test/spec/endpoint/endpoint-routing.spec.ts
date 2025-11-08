import 'jasmine';
import { env } from '../../env';

describe('Endpoint Routing', function () {
	const baseUrl = env.API_URL + '/routing';

	describe('Path Parameters', function () {
		it('should handle single path parameter', async function () {
			const itemId = '123';
			const response = await fetch(`${baseUrl}/items/${itemId}`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as { id: number };
			expect(data.id).toBe(123);
		});

		it('should handle multiple path parameters', async function () {
			const userId = '42';
			const postId = '7';
			const response = await fetch(
				`${baseUrl}/users/${userId}/posts/${postId}`
			);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				userId: number;
				postId: number;
			};
			expect(data.userId).toBe(42);
			expect(data.postId).toBe(7);
		});

		it('supports path params with special characters', async function () {
			const slug = 'hello-world';
			const response = await fetch(`${baseUrl}/slug/${slug}`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as { slug: string };
			expect(data.slug).toBe(slug);
		});

		it('should decode URL-encoded path parameters', async function () {
			const encodedValue = encodeURIComponent('hello world');
			const response = await fetch(`${baseUrl}/encoded/${encodedValue}`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as { value: string };
			expect(data.value).toBe('hello world');
		});
	});

	describe('Query Parameters', function () {
		it('should handle single query parameter', async function () {
			const response = await fetch(`${baseUrl}/search?q=test`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: Record<string, string>;
			};
			expect(data.query['q']).toBe('test');
		});

		it('should handle multiple query parameters', async function () {
			const response = await fetch(
				`${baseUrl}/search?q=test&page=2&limit=10`
			);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: Record<string, string>;
			};
			expect(data.query['q']).toBe('test');
			expect(data.query['page']).toBe('2');
			expect(data.query['limit']).toBe('10');
		});

		it('supports query params with special characters', async function () {
			const searchTerm = 'hello world!';
			const encoded = encodeURIComponent(searchTerm);
			const response = await fetch(`${baseUrl}/search?q=${encoded}`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: Record<string, string>;
			};
			expect(data.query['q']).toBe(searchTerm);
		});

		it('should handle missing query parameters', async function () {
			const response = await fetch(`${baseUrl}/search`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: Record<string, string>;
			};
			expect(Object.keys(data.query).length).toBe(0);
		});

		it('should handle array query parameters', async function () {
			const response = await fetch(
				`${baseUrl}/search?tags=javascript&tags=typescript`
			);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: Record<string, string | string[]>;
			};
			// Express parses multiple same-name params as array
			expect(data.query['tags']).toBeDefined();
		});
	});

	describe('Combined Routing', function () {
		it('supports path params and query params together', async function () {
			const userId = '99';
			const response = await fetch(
				`${baseUrl}/users/${userId}/activity?type=posts&limit=5`
			);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				userId: number;
				query: Record<string, string>;
			};
			expect(data.userId).toBe(99);
			expect(data.query['type']).toBe('posts');
			expect(data.query['limit']).toBe('5');
		});
	});

	describe('Route Matching', function () {
		it('should match exact paths', async function () {
			const response = await fetch(`${baseUrl}/exact`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as { matched: string };
			expect(data.matched).toBe('exact');
		});

		it('should return 404 for non-existent routes', async function () {
			const response = await fetch(`${baseUrl}/does-not-exist`);
			expect(response.status).toBe(404);
		});

		it('should handle trailing slashes consistently', async function () {
			const withSlash = await fetch(`${baseUrl}/exact/`);
			const withoutSlash = await fetch(`${baseUrl}/exact`);

			// Both should work (Express default behavior)
			expect([200, 301, 404]).toContain(withSlash.status);
			expect(withoutSlash.status).toBe(200);
		});
	});
});
