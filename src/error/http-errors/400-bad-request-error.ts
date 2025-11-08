import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 400 Bad Request
 * The server cannot process the request due to client error
 * (e.g., malformed request syntax, invalid request message framing,
 * or deceptive request routing)
 */
export class BadRequestError extends HTTPError {
	constructor(message = 'Bad Request', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 400;
	}
}
