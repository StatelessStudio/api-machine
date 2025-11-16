import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

export interface MethodNotAllowedErrorOptions extends HttpErrorOptions {
	allowedMethods?: string[];
}

/**
 * 405 Method Not Allowed
 * The request method is not supported for the requested resource
 */
export class MethodNotAllowedError extends HTTPError {
	constructor(
		message = 'Method Not Allowed',
		options: MethodNotAllowedErrorOptions = {}
	) {
		const headers: Record<string, string> = {};

		if (
			!(options.headers ? options.headers['Allow'] : null) &&
			options.allowedMethods &&
			options.allowedMethods.length > 0
		) {
			headers['Allow'] = options.allowedMethods.join(', ');
		}

		super(message, {
			...options,
			headers: { ...headers, ...options.headers },
		});
	}

	public override getStatusCode(): number {
		return 405;
	}
}
