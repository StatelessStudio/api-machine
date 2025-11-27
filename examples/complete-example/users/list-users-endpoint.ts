import {
	ComposedValSan,
	LengthValidator,
	ObjectValSan,
	TrimSanitizer,
} from 'valsan';
import { ApiRequest, ApiResponse, GetEndpoint } from '../../../src/index';
import { usersRepo } from './users-repository';

/**
 * Complete Example - List Users Endpoint
 *
 * Returns a list of all users.
 * Accessible at GET /api/users/
 */
export class ListUsersEndpoint extends GetEndpoint {
	override path = '/';

	override params = new ObjectValSan({
		schema: {
			name: new ComposedValSan(
				[new TrimSanitizer(), new LengthValidator({ minLength: 3 })],
				{ isOptional: true }
			),
			email: new ComposedValSan(
				[new TrimSanitizer(), new LengthValidator({ minLength: 5 })],
				{ isOptional: true }
			),
		},
	});

	async handle(request: ApiRequest, response: ApiResponse) {
		return Object.values(usersRepo);
	}
}
