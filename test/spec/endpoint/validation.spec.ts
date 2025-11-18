import 'jasmine';
import { env } from '../../env';
import { ValidationError } from 'valsan';
import { ErrorResponse } from '../../../src';

describe('Validation', function () {
	const baseUrl = env.API_URL + '/validation';

	it('should create user with valid data', async function () {
		const response = await fetch(baseUrl + '/body', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'Alice',
				email: 'alice@example.com',
			}),
		});

		expect(response.status).toBe(201);

		const data = (await response.json()) as {
			name: string;
			email: string;
		};

		expect(data.name).toBe('Alice');
		expect(data.email).toBe('alice@example.com');
	});

	it('should reject missing name', async function () {
		const response = await fetch(baseUrl + '/body', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: 'alice@example.com' }),
		});

		expect(response.status).toBe(422);

		const data = (await response.json()) as ErrorResponse;

		expect(data.message).toBe('Validation failed');
		expect(data.options.details).toBeDefined();
	});

	it('should reject invalid email', async function () {
		const response = await fetch(baseUrl + '/body', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Alice', email: 'not-an-email' }),
		});

		expect(response.status).toBe(422);

		const data = (await response.json()) as ErrorResponse;

		expect(data.message).toBe('Validation failed');
		expect(data.options.details).toBeDefined();
	});

	it('should reject empty name', async function () {
		const response = await fetch(baseUrl + '/body', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: '', email: 'alice@example.com' }),
		});

		expect(response.status).toBe(422);

		const data = (await response.json()) as ErrorResponse;

		expect(data.message).toBe('Validation failed');
		expect(data.options.details).toBeDefined();
	});

	it('should return helpful error', async function () {
		const response = await fetch(baseUrl + '/body', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: '   ', email: 'invalid-email' }),
		});

		expect(response.status).toBe(422);
		const data = (await response.json()) as ErrorResponse;

		expect(data.error).toBe('UnprocessableEntityError');
		expect(data.message).toBe('Validation failed');
		expect(data.timestamp).toBeDefined();
		expect(data.options).toBeDefined();
		expect(data.options.details).toBeDefined();

		const details = data.options.details as ValidationError[];
		expect(details.length).toBe(2);

		expect(details[0].field).toBe('name');
		expect(details[0].code).toBe('string_min_len');
		expect(details[0].message).toBe(
			'Input must be at least 1 character(s)'
		);
		expect(details[0].context).toEqual({ minLength: 1 });

		expect(details[1].field).toBe('email');
		expect(details[1].code).toBe('email_format');
		expect(details[1].message).toBe('Input is not a valid email address');
	});

	it('should sanitize query params', async function () {
		const response = await fetch(
			baseUrl + '/query-params?search=test+search   ',
			{
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			}
		);

		expect(response.status).toBe(200);
		const data = (await response.json()) as { received: string };

		// The search query param should be trimmed
		expect(data.received).toBe('test search');
	});

	it('should sanitize route params', async function () {
		const response = await fetch(baseUrl + '/route-params/42', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		expect(response.status).toBe(201);
		const data = (await response.json()) as { received: number };
		expect(data.received).toBe(42);
	});

	it('should sanitize headers', async function () {
		const response = await fetch(baseUrl + '/headers', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Custom-Header': 'custom header value   ',
			},
		});

		expect(response.status).toBe(201);
		const data = (await response.json()) as { received: string };

		// The header value should be trimmed
		expect(data.received).toBe('custom header value');
	});

	it('should sanitize the body (trims name)', async function () {
		const response = await fetch(baseUrl + '/body', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: '   Alice   ',
				email: 'alice@example.com',
			}),
		});

		expect(response.status).toBe(201);

		const data = (await response.json()) as {
			name: string;
			email: string;
		};

		// The name should be trimmed
		expect(data.name).toBe('Alice');
		expect(data.email).toBe('alice@example.com');
	});

	it('should reject invalid query params', async function () {
		const response = await fetch(
			baseUrl + '/query-params?age=not-a-number',
			{
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			}
		);

		expect(response.status).toBe(422);

		const data = (await response.json()) as ErrorResponse;
		expect(data.message).toBe('Validation failed');
		expect(data.options.details).toBeDefined();

		const details = data.options.details as ValidationError[];
		expect(details.some((d) => d.field === 'search')).toBeTrue();
	});

	it('should reject invalid router params', async function () {
		const url = baseUrl + '/route-params/not-a-number';
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		expect(response.status).toBe(422);

		const data = (await response.json()) as ErrorResponse;
		expect(data.message).toBe('Validation failed');
		expect(data.options.details).toBeDefined();

		const details = data.options.details as ValidationError[];
		expect(details.some((d) => d.field === 'itemId')).toBeTrue();
	});

	it('should reject invalid headers', async function () {
		const response = await fetch(baseUrl + '/headers', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});

		expect(response.status).toBe(422);

		const data = (await response.json()) as ErrorResponse;
		expect(data.message).toBe('Validation failed');
		expect(data.options.details).toBeDefined();

		const details = data.options.details as ValidationError[];
		expect(details.some((d) => d.field === 'x-custom-header')).toBeTrue();
	});

	it('should reject invalid body', async function () {
		const response = await fetch(baseUrl + '/body', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: '', email: 'not-an-email' }),
		});
		expect(response.status).toBe(422);

		const data = (await response.json()) as ErrorResponse;
		expect(data.message).toBe('Validation failed');
		expect(data.options.details).toBeDefined();

		const details = data.options.details as ValidationError[];
		expect(details.some((d) => d.field === 'name')).toBeTrue();
		expect(details.some((d) => d.field === 'email')).toBeTrue();
	});

	it('should support optional query params', async function () {
		const response = await fetch(baseUrl + '/optional-validation', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		expect(response.status).toBe(200);
		const data = (await response.json()) as {
			request: Record<string, never>;
		};

		expect(data).toEqual({
			request: {},
		});
	});
});
