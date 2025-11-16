import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 402 Payment Required
 * Reserved for future use. Originally intended for digital payment systems
 */
export class PaymentRequiredError extends HTTPError {
	constructor(message = 'Payment Required', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 402;
	}
}
