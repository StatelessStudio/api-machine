import { MyApiServer } from './server';
import { Log } from 'ts-tiny-log';

/**
 * Quick Start Example
 *
 * This example demonstrates the basic setup of a REST API server
 * with a simple router and endpoint structure.
 *
 * File Structure:
 * - index.ts: Entry point that starts the server
 * - server.ts: Server class definition
 * - router.ts: Router that groups endpoints
 * - endpoints/: Individual endpoint implementations
 */

const log = new Log();

// Start the server
const server = new MyApiServer({
	port: 3000,
});

server
	.start()
	.then(() => {
		log.info('Server is running at http://localhost:3000');
		log.info('Try these endpoints:');
		log.info('  GET http://localhost:3000/api/hello');
		log.info('  GET http://localhost:3000/api/users');
	})
	.catch((error) => {
		log.error('Error starting server:', error);
		process.exit(1);
	});
