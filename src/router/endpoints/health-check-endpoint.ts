import { ApiRequest, ApiResponse } from '../endpoint';
import { GetEndpoint } from './get-endpoint';

export class HealthCheckEndpoint extends GetEndpoint {
	override path = '/health';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async handle(_request: ApiRequest, _response: ApiResponse) {
		return {
			status: await this.getStatus(),
			timestamp: await this.getTimestamp(),
			uptime: await this.getUptime(),
			environment: await this.getEnvironment(),
		};
	}

	public async getStatus(): Promise<string> {
		return 'ok';
	}

	public async getTimestamp(): Promise<string> {
		return new Date().toISOString();
	}

	public async getUptime(): Promise<number> {
		return process.uptime();
	}

	public async getEnvironment(): Promise<string> {
		return process.env['NODE_ENV'] || 'development';
	}
}
