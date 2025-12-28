import { LogInterface } from '../../log';
import { BearerAuthenticationScheme } from '../..';

/**
 * @deprecated Use BearerAuthenticationScheme instead
 */
export interface BearerAuthenticationMiddlewareOptions {
	checkToken: (token: string) => Promise<boolean>;
	log?: LogInterface;
}

/**
 * @deprecated Use BearerAuthenticationScheme instead
 *
 * Bearer token authentication middleware
 * Validates the Authorization header against the configured bearer token
 */
export function bearerAuthenticationMiddleware(
	options: BearerAuthenticationMiddlewareOptions
) {
	const scheme = new BearerAuthenticationScheme({
		checkToken: options.checkToken,
		log: options.log,
	});

	return scheme.getMiddleware();
}
