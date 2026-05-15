import {
	ApiRequest,
	ApiResponse,
	DeleteEndpoint,
	NotFoundError,
} from '../../../src/index';
import { UsersRepository } from './users-repository';

/**
 * Complete Example - Delete User Endpoint (DELETE)
 *
 * Accessible at DELETE /api/users/:id
 */
export class DeleteUserEndpoint extends DeleteEndpoint {
	override path = '/:id';

	protected usersRepo: UsersRepository;

	override inject(): void {
		this.usersRepo = this.container.require(UsersRepository);
	}

	async handle(request: ApiRequest, response: ApiResponse) {
		const userId = parseInt(request.params['id'] as string, 10);
		const user = this.usersRepo.getById(userId);

		if (!user) {
			throw new NotFoundError('User not found', {
				details: { userId },
			});
		}

		this.usersRepo.delete(userId);

		// DeleteEndpoint automatically sets 204 status
		return {};
	}
}
