import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 404 Not Found
 * The server cannot find the requested resource
 */
export class NotFoundError extends HTTPError {
	constructor(message = 'Not Found', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 404;
	}
}
