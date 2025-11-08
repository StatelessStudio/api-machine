import { BaseApiRouter } from '../../../src';
// eslint-disable-next-line max-len
import { HealthCheckEndpoint } from '../../../src';

export class HealthCheckRouter extends BaseApiRouter {
	override path = '/health-check';

	override async routes() {
		return [
			HealthCheckEndpoint,
			// Custom path example
			class extends HealthCheckEndpoint {
				override path = '/custom-health';
			},
		];
	}
}
