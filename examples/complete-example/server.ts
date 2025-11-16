import { RestServer } from '../../src/index';
import { ApiRouter } from './router';
import { Log } from 'ts-tiny-log';

/**
 * Complete Example - Server
 *
 * Server class with custom logger configuration.
 * Demonstrates server options including custom logging.
 */
export class MyServer extends RestServer {
	override router = ApiRouter;
}

// Create a custom logger instance
export const customLogger = new Log({
	shouldWriteLogLevel: true,
	shouldWriteTimestamp: true,
});
