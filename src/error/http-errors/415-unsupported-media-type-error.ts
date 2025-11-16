import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

export interface UnsupportedMediaTypeErrorOptions extends HttpErrorOptions {
	acceptedTypes?: string[];
}

/**
 * 415 Unsupported Media Type
 * The media format of the requested data is not supported by the server
 */
export class UnsupportedMediaTypeError extends HTTPError {
	constructor(
		message = 'Unsupported Media Type',
		options: UnsupportedMediaTypeErrorOptions = {}
	) {
		const headers: Record<string, string> = {};
		if (options.acceptedTypes && options.acceptedTypes.length > 0) {
			headers['Accept'] = options.acceptedTypes.join(', ');
		}
		super(message, {
			...options,
			headers: { ...headers, ...options.headers },
		});
	}

	public override getStatusCode(): number {
		return 415;
	}
}
