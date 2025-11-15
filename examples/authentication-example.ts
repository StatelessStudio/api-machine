/**
 * Example for Authentication class system
 * Shows server-level, router-level, and endpoint-level authentication
 */

import {
	RestServer,
	BaseApiRouter,
	BaseApiEndpoint,
	BearerAuthenticationScheme,
} from '../src';

// This endpoint inherits server-level authentication
class ProtectedEndpoint extends BaseApiEndpoint {
	override path = '/protected';

	async handle() {
		return {
			message: 'This endpoint is protected by server-level auth',
			authenticated: true,
		};
	}
}

class PublicEndpoint extends BaseApiEndpoint {
	override path = '/info';

	async handle() {
		return {
			message: 'This endpoint is public',
			authenticated: false,
		};
	}
}

// Router explicitly made public (no authentication)
class PublicRouter extends BaseApiRouter {
	override path = '/public';
	override authentication = null; // Explicitly public - overrides server auth

	async routes() {
		return [PublicEndpoint];
	}
}

class AdminEndpoint extends BaseApiEndpoint {
	override path = '/dashboard';

	async handle() {
		return {
			message: 'Admin dashboard - requires AdminAuth',
			role: 'admin',
		};
	}
}

// Endpoint with even more restrictive authentication
class SuperAdminEndpoint extends BaseApiEndpoint {
	override path = '/super-admin';

	// Endpoint-level override for super admin
	override authentication = new BearerAuthenticationScheme({
		checkToken: async (token: string) => {
			return token === 'super-admin-token-789';
		},
		schemeName: 'SuperAdminAuth',
		bearerFormat: 'JWT',
		description: 'Super admin authentication',
	});

	async handle() {
		return {
			message: 'Super admin area - requires SuperAdminAuth',
			role: 'super-admin',
		};
	}
}

// Router with different authentication scheme
class AdminRouter extends BaseApiRouter {
	override path = '/admin';

	// Override with stricter authentication
	override authentication = new BearerAuthenticationScheme({
		checkToken: async (token: string) => {
			// Admin token validation
			return token === 'admin-token-456';
		},
		schemeName: 'AdminAuth',
		bearerFormat: 'JWT',
		description: 'Admin-level JWT authentication',
	});

	async routes() {
		return [AdminEndpoint, SuperAdminEndpoint];
	}
}

// Router inherits server authentication automatically
class MainRouter extends BaseApiRouter {
	override path = '/api';

	async routes() {
		return [ProtectedEndpoint, PublicRouter, AdminRouter];
	}
}

class AuthenticatedServer extends RestServer {
	override router = MainRouter;
	override name = 'Authentication Example API';
	override version = '1.0.0';

	constructor() {
		super({
			port: 4000,
			swaggerEnabled: true,
			// Server-level authentication - applies to all routes by default
			authentication: new BearerAuthenticationScheme({
				checkToken: async (token: string) => {
					// In real app, validate against database/JWT
					return token === 'valid-token-123';
				},
				bearerFormat: 'JWT',
				description: 'JWT Bearer token authentication',
			}),
		});
	}
}

// Start the server
async function main() {
	const server = new AuthenticatedServer();
	await server.start();
	console.log(`Server running on http://localhost:${server.port}`);
	console.log('\nEndpoints:');
	console.log('  Protected: GET /api/protected (valid-token-123)');
	console.log('  Public:    GET /api/public/info (no auth required)');
	console.log('  Admin:     GET /api/admin/dashboard (admin-token-456)');
	console.log(
		'  SuperAdmin:GET /api/admin/super-admin (super-admin-token-789)'
	);
}

if (require.main === module) {
	main().catch(console.error);
}
