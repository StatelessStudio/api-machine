import { bearerAuthenticationMiddleware } from '../../../src/authentication';
import { BaseApiEndpoint, BaseApiRouter } from '../../../src/router';
import { RequestHandler } from 'express';

// Authentication middleware matching the test expectations
export const authMiddleware: RequestHandler = bearerAuthenticationMiddleware({
	checkToken: async (token: string) => token === 'validtoken',
	// eslint-disable-next-line no-console
	log: { ...console, fatal: console.error },
});

export class AuthenticatedEndpoint extends BaseApiEndpoint {
	override path = '/test';
	override middleware = [authMiddleware];

	async handle() {
		return { ok: true };
	}
}

export class ProtectedRouter extends BaseApiRouter {
	override path = '/protected';
	override middleware = [authMiddleware];

	async routes() {
		return [AuthenticatedEndpoint];
	}
}
