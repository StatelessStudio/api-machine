import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 422 Unprocessable Entity
 * The request was well-formed but contains semantic errors
 */
export class UnprocessableEntityError extends HTTPError {
	constructor(
		message = 'Unprocessable Entity',
		options: HttpErrorOptions = {}
	) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 422;
	}
}
