import { env } from '../test/env';
import { OpenApiTestServer } from '../test/spec/api/openapi-server';

/**
 * Starts a test server with OpenAPI documentation enabled.
 */
export default async function example(): Promise<void> {
	await new OpenApiTestServer({
		port: env.API_PORT,
		swaggerEnabled: true,
	}).start();

	// eslint-disable-next-line no-console
	console.log(`Test server running at http://localhost:${env.API_PORT}`);

	// Gracefully handle shutdown on SIGINT (Ctrl+C) or SIGTERM
	process.on('SIGINT', () => {
		console.log('Shutting down server...');
		process.exit(0);
	});
	process.on('SIGTERM', () => {
		console.log('Shutting down server...');
		process.exit(0);
	});

	// Keep the process alive
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	await new Promise<void>((resolve) => {});
}
