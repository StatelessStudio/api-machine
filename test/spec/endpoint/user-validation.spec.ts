import 'jasmine';
import { env } from '../../env';
import { ValidationError } from 'valsan';
import { ErrorResponse } from '../../../src';

describe('User Validation (valsan integration)', function () {
	const baseUrl = env.API_URL + '/test/user-validation';

	it('should create user with valid data', async function () {
		const response = await fetch(baseUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'Alice',
				email: 'alice@example.com',
			}),
		});

		// TODO: Should be returning 201 Created
		expect(response.status).toBe(200);

		const data = (await response.json()) as {
			name: string;
			email: string;
		};

		expect(data.name).toBe('Alice');
		expect(data.email).toBe('alice@example.com');
	});

	it('should reject missing name', async function () {
		const response = await fetch(baseUrl, {
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
		const response = await fetch(baseUrl, {
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
		const response = await fetch(baseUrl, {
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
		const response = await fetch(baseUrl, {
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
		expect(details[0].code).toBe('STRING_TOO_SHORT');
		expect(details[0].message).toBe(
			'Input must be at least 1 character(s)'
		);
		expect(details[0].context).toEqual({ minLength: 1, actualLength: 0 });

		expect(details[1].field).toBe('email');
		expect(details[1].code).toBe('STRING_EMAIL_INVALID');
		expect(details[1].message).toBe('Input is not a valid email address');
	});

	it('should sanitize the body (trims name)', async function () {
		const response = await fetch(baseUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: '   Alice   ',
				email: 'alice@example.com',
			}),
		});

		// TODO: Should be returning 201 Created
		expect(response.status).toBe(200);

		const data = (await response.json()) as {
			name: string;
			email: string;
		};

		// The name should be trimmed
		expect(data.name).toBe('Alice');
		expect(data.email).toBe('alice@example.com');
	});
});
