import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 431 Request Header Fields Too Large
 * The server is unwilling to process the request because its header fields
 * are too large
 */
export class RequestHeaderFieldsTooLargeError extends HTTPError {
	constructor(
		message = 'Request Header Fields Too Large',
		options: HttpErrorOptions = {}
	) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 431;
	}
}
