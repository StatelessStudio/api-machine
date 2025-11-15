import { TagObject } from 'auto-oas/oas/v3.1';
import { BaseApiRouter } from '../router/router';

export class OasRouterConverter {
	public getOpenApiTag(router: BaseApiRouter): TagObject {
		return {
			name: router.getTag(),
			description: router.description,
		};
	}
}
