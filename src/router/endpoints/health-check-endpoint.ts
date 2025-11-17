import {
	Iso8601TimestampValSan,
	MinLengthValidator,
	ObjectSanitizer,
	StringToNumberValSan,
} from 'valsan';
import { GetEndpoint } from './get-endpoint';

export class HealthCheckEndpoint extends GetEndpoint {
	override path = '/health';

	override responseExample = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		uptime: 12345,
		environment: 'development',
	};

	override response = new ObjectSanitizer({
		status: new MinLengthValidator(),
		timestamp: new Iso8601TimestampValSan(),
		uptime: new StringToNumberValSan(),
		environment: new MinLengthValidator(),
	});

	async handle() {
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
