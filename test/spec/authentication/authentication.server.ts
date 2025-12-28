import { BearerAuthenticationScheme } from '../../../src/authentication';
import { BaseApiEndpoint, BaseApiRouter } from '../../../src/router';
import { LogInterface } from '../../../src/log';

const testLog: LogInterface = {
	...console,
	// eslint-disable-next-line no-console
	fatal: console.error,
};

export class AuthenticatedEndpoint extends BaseApiEndpoint {
	override path = '/test';

	async handle() {
		return { ok: true };
	}
}

export class ProtectedRouter extends BaseApiRouter {
	override path = '/protected';
	override authentication = new BearerAuthenticationScheme({
		checkToken: async (token: string) => token === 'validtoken',
		log: testLog,
	});

	async routes() {
		return [AuthenticatedEndpoint];
	}
}
