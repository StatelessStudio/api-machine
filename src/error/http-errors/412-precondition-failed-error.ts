import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 412 Precondition Failed
 * The server does not meet one of the preconditions specified by the client
 */
export class PreconditionFailedError extends HTTPError {
	constructor(
		message = 'Precondition Failed',
		options: HttpErrorOptions = {}
	) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 412;
	}
}
