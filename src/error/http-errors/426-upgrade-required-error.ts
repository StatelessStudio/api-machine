import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

export interface UpgradeRequiredErrorOptions extends HttpErrorOptions {
	upgradeProtocol?: string;
}

/**
 * 426 Upgrade Required
 * The client should switch to a different protocol
 */
export class UpgradeRequiredError extends HTTPError {
	constructor(
		message = 'Upgrade Required',
		options: UpgradeRequiredErrorOptions = {}
	) {
		const headers = {
			Upgrade: options.upgradeProtocol || 'TLS/1.0',
			...options.headers,
		};
		super(message, { ...options, headers });
	}

	public override getStatusCode(): number {
		return 426;
	}
}
