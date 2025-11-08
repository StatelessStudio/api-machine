import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 406 Not Acceptable
 * The server cannot produce a response matching the list of acceptable
 * values defined in the request's headers
 */
export class NotAcceptableError extends HTTPError {
	constructor(message = 'Not Acceptable', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 406;
	}
}
