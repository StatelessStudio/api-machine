import { env } from '../../env';

describe('Express Errors', () => {
	it('should map 400 errors correctly', async () => {
		const result = await fetch(env.API_URL + '/test', {
			method: 'POST',
			body: 'invalid-json',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		expect(result.status).toBe(400);
		expect(result.statusText).toBe('Bad Request');

		const body = (await result.json()) as {
			error: string;
			message: string;
		};

		expect(body).toEqual({
			error: 'SyntaxError',
			message: 'Unexpected token \'i\', "invalid-json" is not valid JSON',
		});
	});
});
