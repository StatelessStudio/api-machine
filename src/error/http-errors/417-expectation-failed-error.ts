import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 417 Expectation Failed
 * The expectation given in the Expect request header could not be met
 */
export class ExpectationFailedError extends HTTPError {
	constructor(
		message = 'Expectation Failed',
		options: HttpErrorOptions = {}
	) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 417;
	}
}
