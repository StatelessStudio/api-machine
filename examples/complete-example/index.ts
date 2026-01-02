import { MyServer, customLogger } from './server';
import { Log } from 'ts-tiny-log';

/**
 * Complete Example
 *
 * This example demonstrates advanced REST API features including:
 * - Domain-driven folder organization
 * - Multiple routers for different domains
 * - All HTTP methods (GET, POST, PUT, DELETE)
 * - Route parameters
 * - Error handling and validation
 * - Custom logger configuration with ts-tiny-log
 * - Express integration (headers, query params)
 * - Bearer token authentication (inline, stateless)
 * - OAuth2 session-based authentication (stateful, multi-step)
 *
 * File Structure:
 * - index.ts: Entry point
 * - server.ts: Server class with custom logger
 * - router.ts: Main routers combining API and auth
 * - auth/: Authentication implementations
 *   - inline-auth.ts: Bearer token authentication (stateless)
 *   - session-auth.ts: OAuth2 session-based authentication (stateful)
 * - users/: User management domain
 *   - users-router.ts: Groups all user endpoints under /api/users
 *   - list-users-endpoint.ts: List all users (GET /api/users)
 *   - get-user-endpoint.ts: Get single user (GET /api/users/:id)
 *   - create-user-endpoint.ts: Create user (POST /api/users)
 *   - update-user-endpoint.ts: Update user (PUT /api/users/:id)
 *   - delete-user-endpoint.ts: Delete user (DELETE /api/users/:id)
 * - express-features/: Express integration examples
 *   - express-features-router.ts: Groups features under /api/express
 *   - headers-endpoint.ts: Headers manipulation (GET /api/express/headers)
 *   - query-params-endpoint.ts: Query parsing (GET /api/express/search)
 */

const log = new Log();

// Start server with custom options
const server = new MyServer({
	port: 3000,
	maxPayloadSizeMB: 10,
	log: customLogger,
	swaggerEnabled: true,
});

server
	.start()
	.then(() => {
		log.info('Server is running at http://localhost:3000');
		log.info('Available endpoints:');
		log.info('');
		log.info('User CRUD:');
		log.info('  GET    http://localhost:3000/api/users');
		log.info('  GET    http://localhost:3000/api/users/:id');
		log.info('  POST   http://localhost:3000/api/users');
		log.info('  PUT    http://localhost:3000/api/users/:id');
		log.info('  DELETE http://localhost:3000/api/users/:id');
		log.info('');
		log.info('Express Integration:');
		log.info('  GET    http://localhost:3000/api/express/headers');
		log.info(
			'  GET    http://localhost:3000/api/express/search?q=test&page=1'
		);
		log.info('');
		log.info('Bearer Token Authentication (inline, stateless):');
		log.info(
			'  GET    http://localhost:3000/api/bearer/protected ' +
				'(requires Authorization header)'
		);
		log.info('    Header: Authorization: Bearer demo-token');
		log.info('  GET    http://localhost:3000/api/bearer/public (no auth)');
		log.info('');
		log.info('OAuth2 Session-Based Authentication (stateful):');
		log.info('  POST   http://localhost:3000/oauth/challenge');
		log.info('  POST   http://localhost:3000/oauth/authorize');
		log.info('  POST   http://localhost:3000/oauth/token');
		log.info('  GET    http://localhost:3000/oauth/protected');
		log.info('  Demo credentials: demo/demo or admin/admin');
		log.info('');
		log.info('Health Check:');
		log.info('  GET    http://localhost:3000/api/health');
		log.info('');
		log.info('Error Handling Examples:');
		log.info(
			'  GET    http://localhost:3000/api/users/0 (400 Bad Request)'
		);
		log.info(
			'  GET    http://localhost:3000/api/users/999 (404 Not Found)'
		);
		log.info(
			'  POST   http://localhost:3000/api/users (with invalid body)'
		);
	})
	.catch((error) => {
		log.error('Failed to start server:', error);
		process.exit(1);
	});
