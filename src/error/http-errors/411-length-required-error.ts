import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 411 Length Required
 * The request did not specify the length of its content
 */
export class LengthRequiredError extends HTTPError {
	constructor(message = 'Length Required', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 411;
	}
}
