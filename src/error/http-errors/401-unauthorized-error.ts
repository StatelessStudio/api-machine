import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

export interface UnauthorizedErrorOptions extends HttpErrorOptions {
	realm?: string;
	scheme?: 'Bearer' | 'Basic' | 'Digest';
}

/**
 * 401 Unauthorized
 * Authentication is required and has failed or has not been provided
 */
export class UnauthorizedError extends HTTPError {
	constructor(
		message = 'Unauthorized',
		options: UnauthorizedErrorOptions = {}
	) {
		const realm = options.realm || 'Access to the resource';
		const scheme = options.scheme || 'Bearer';
		const headers = {
			'WWW-Authenticate': `${scheme} realm="${realm}"`,
			...options.headers,
		};

		super(message, { ...options, headers });
	}

	public override getStatusCode(): number {
		return 401;
	}
}
