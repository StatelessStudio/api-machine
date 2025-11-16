import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 421 Misdirected Request
 * The request was directed at a server that is not able to produce a response
 */
export class MisdirectedRequestError extends HTTPError {
	constructor(
		message = 'Misdirected Request',
		options: HttpErrorOptions = {}
	) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 421;
	}
}
