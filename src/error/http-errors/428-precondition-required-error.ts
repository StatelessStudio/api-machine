import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 428 Precondition Required
 * The origin server requires the request to be conditional
 */
export class PreconditionRequiredError extends HTTPError {
	constructor(
		message = 'Precondition Required',
		options: HttpErrorOptions = {}
	) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 428;
	}
}
