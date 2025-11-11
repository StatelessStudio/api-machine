import { Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../error';
import { AuthenticatedRequest } from '../authenticated-request';
import { BearerTokenValSan } from 'valsan';
import { LogInterface } from '../../log';

export interface BearerAuthenticationMiddlewareOptions {
	checkToken: (token: string) => Promise<boolean>;
	log?: LogInterface;
}

/**
 * Bearer token authentication middleware
 * Validates the Authorization header against the configured bearer token
 */
export function bearerAuthenticationMiddleware(
	options: BearerAuthenticationMiddlewareOptions
) {
	return async function (
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const authHeader =
			req.headers['authorization'] || req.headers['Authorization'];

		if (!authHeader) {
			options.log?.warn(
				'Unauthorized access attempt from ' +
					req.ip +
					' - No token provided'
			);

			throw new UnauthorizedError('Authorization header is missing', {
				scheme: 'Bearer',
			});
		}

		const validationResult = await new BearerTokenValSan().run(authHeader);
		let token: string;

		if (validationResult.success) {
			token = validationResult.data!;
		}
		else {
			options.log?.warn(
				'Unauthorized access attempt from ' +
					req.ip +
					' - Invalid token format',
				JSON.stringify(validationResult.errors, null, 2)
			);

			throw new UnauthorizedError('Bearer token is empty or invalid', {
				scheme: 'Bearer',
				details: validationResult.errors,
			});
		}

		if (!(await options.checkToken(token))) {
			options.log?.warn(
				'Unauthorized access attempt from ' +
					req.ip +
					' - Check token failed'
			);

			throw new UnauthorizedError('Bearer token check failed', {
				scheme: 'Bearer',
			});
		}

		req.authenticated = true;
		next();

		return;
	};
}
