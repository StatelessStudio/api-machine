import 'jasmine';
import { env } from '../../env';

describe('QueryParamsEndpoint', function () {
	const baseUrl = env.API_URL + '/query-params';

	describe('Query Parameter Parsing', function () {
		it('should parse single query parameter', async function () {
			const response = await fetch(`${baseUrl}/search?q=typescript`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.search).toBe('typescript');
			expect(data.query.page).toBe(1); // default value
			expect(data.query.limit).toBe(10); // default value
		});

		it('should parse multiple query parameters', async function () {
			const response = await fetch(
				`${baseUrl}/search?q=node&page=2&limit=20`
			);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.search).toBe('node');
			expect(data.query.page).toBe(2);
			expect(data.query.limit).toBe(20);
		});

		it('should apply default values', async function () {
			const response = await fetch(`${baseUrl}/search`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.search).toBe('');
			expect(data.query.page).toBe(1);
			expect(data.query.limit).toBe(10);
		});

		it('should handle special characters', async function () {
			const searchTerm = 'hello world & friends';
			const encoded = encodeURIComponent(searchTerm);
			const response = await fetch(`${baseUrl}/search?q=${encoded}`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.search).toBe(searchTerm);
		});

		it('should convert page parameter to integer', async function () {
			const response = await fetch(`${baseUrl}/search?page=5`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(typeof data.query.page).toBe('number');
			expect(data.query.page).toBe(5);
		});

		it('should convert limit parameter to integer', async function () {
			const response = await fetch(`${baseUrl}/search?limit=50`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(typeof data.query.limit).toBe('number');
			expect(data.query.limit).toBe(50);
		});

		it('should handle numeric string params correctly', async function () {
			const response = await fetch(
				`${baseUrl}/search?q=123&page=3&limit=15`
			);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.search).toBe('123');
			expect(data.query.page).toBe(3);
			expect(data.query.limit).toBe(15);
		});

		it('should include all query params in allParams', async function () {
			const url = `${baseUrl}/search?q=test&page=1&limit=10&extra=val`;
			const response = await fetch(url);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.allParams['q']).toBe('test');
			expect(data.allParams['page']).toBe('1');
			expect(data.allParams['limit']).toBe('10');
			expect(data.allParams['extra']).toBe('val');
		});

		it('should return results array', async function () {
			const response = await fetch(`${baseUrl}/search?q=test`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(Array.isArray(data.results)).toBe(true);
			expect(data.results.length).toBe(2);
			expect(data.results[0]).toEqual({ id: 1, title: 'Result 1' });
			expect(data.results[1]).toEqual({ id: 2, title: 'Result 2' });
		});

		it('should handle empty search parameter', async function () {
			const response = await fetch(`${baseUrl}/search?q=`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.search).toBe('');
		});

		it('should handle zero values for params', async function () {
			const response = await fetch(`${baseUrl}/search?page=0&limit=0`);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.page).toBe(0);
			expect(data.query.limit).toBe(0);
		});

		it('should handle large page numbers', async function () {
			const response = await fetch(
				`${baseUrl}/search?page=999&limit=100`
			);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.page).toBe(999);
			expect(data.query.limit).toBe(100);
		});

		it('should handle URL-encoded special characters', async function () {
			const searchTerm = 'test+query';
			const response = await fetch(
				`${baseUrl}/search?q=${encodeURIComponent(searchTerm)}`
			);
			expect(response.status).toBe(200);

			const data = (await response.json()) as {
				query: { page: number; limit: number; search: string };
				allParams: Record<string, string>;
				results: { id: number; title: string }[];
			};

			expect(data.query.search).toBe(searchTerm);
		});
	});
});
