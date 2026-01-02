import { RestServer } from '../../src/index';
import { MainRouter } from './router';
import { Log } from 'ts-tiny-log';

/**
 * Complete Example - Server
 *
 * Server class with custom logger configuration.
 * Demonstrates server options including custom logging.
 * Includes both Bearer token and OAuth2 session-based authentication.
 */
export class MyServer extends RestServer {
	override router = MainRouter;

	protected override async setupExpress(): Promise<void> {
		await super.setupExpress();
		// Add middleware to parse sessionId from cookies
		this.app.use(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(req: any, res: any, next: any) => {
				// Manual cookie parsing for session-based authentication
				const cookies: Record<string, string> = {};

				if (req.headers.cookie) {
					req.headers.cookie.split(';').forEach((cookie: string) => {
						const [name, value] = cookie.trim().split('=');
						if (name === 'sessionId') {
							cookies[name] = decodeURIComponent(value);
						}
					});
				}

				// Extract sessionId from cookies
				if (cookies['sessionId']) {
					req['sessionId'] = cookies['sessionId'];
				}

				next();
			}
		);
	}
}

// Create a custom logger instance
export const customLogger = new Log({
	shouldWriteLogLevel: true,
	shouldWriteTimestamp: true,
});
