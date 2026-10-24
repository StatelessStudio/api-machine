/**
 * Inline (Bearer Token) Authentication
 *
 * This module demonstrates stateless, token-based authentication.
 * Token validation occurs on every request without session storage.
 */

import {
	BaseApiRouter,
	BaseApiEndpoint,
	BearerAuthenticationScheme,
	ApiRequest,
	ApiResponse,
} from '../../../src/index';

/**
 * Bearer authentication for simple token-based APIs
 * Token validation on every request
 */
export const bearerAuth = new BearerAuthenticationScheme({
	checkToken: async (token: string) => {
		// In production: validate JWT signature, check expiration, etc.
		const principals = new Map([
			['demo-token', { id: 'demo-user' }],
			['admin-token', { id: 'admin-user' }],
			['user-token', { id: 'user' }],
		]);

		return principals.get(token) ?? false;
	},
	schemeName: 'BearerAuth',
	bearerFormat: 'JWT',
	description: 'Bearer token authentication',
});

/**
 * Protected endpoint that requires Bearer token authentication
 */
export class BearerProtectedEndpoint extends BaseApiEndpoint {
	override path = '/protected';
	override description = 'Protected resource requiring Bearer token';
	override authorization = {
		action: 'read',
		resource: 'demo',
	};

	async handle(request: ApiRequest, response: ApiResponse) {
		return {
			message: 'You accessed a protected resource',
			principal: request.principal,
			timestamp: new Date().toISOString(),
		};
	}
}

/**
 * Public endpoint in the Bearer router (no auth required)
 */
export class BearerPublicEndpoint extends BaseApiEndpoint {
	override path = '/public';
	override description = 'Public resource (no authentication)';
	override authentication = null;
	override authorization = null;

	async handle(request: ApiRequest, response: ApiResponse) {
		return {
			message: 'Public data',
			authType: 'Bearer Token',
		};
	}
}

/**
 * Router for Bearer token authentication endpoints
 */
export class BearerAuthRouter extends BaseApiRouter {
	override path = '/bearer';
	override description = 'Bearer token authentication endpoints';
	override authentication = bearerAuth;

	async routes() {
		return [BearerProtectedEndpoint, BearerPublicEndpoint];
	}
}
