import {
	ComposedValSan,
	LengthValidator,
	ObjectValSan,
	TrimSanitizer,
} from 'valsan';
import { ApiRequest, ApiResponse, GetEndpoint } from '../../../src/index';
import { UsersRepository } from './users-repository';

/**
 * Complete Example - List Users Endpoint
 *
 * Returns a list of all users.
 * Accessible at GET /api/users/
 */
export class ListUsersEndpoint extends GetEndpoint {
	override path = '/';

	protected usersRepo: UsersRepository;

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

	override inject(): void {
		this.usersRepo = this.container.require(UsersRepository);
	}

	async handle(request: ApiRequest, response: ApiResponse) {
		return this.usersRepo.getAll();
	}
}
