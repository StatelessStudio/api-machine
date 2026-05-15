import { ApiRequest, PutEndpoint, NotFoundError } from '../../../src/index';
import { UsersRepository } from './users-repository';

/**
 * Complete Example - Update User Endpoint (PUT)
 *
 * Accessible at PUT /api/users/:id
 */
export class UpdateUserEndpoint extends PutEndpoint {
	override path = '/:id';

	protected usersRepo: UsersRepository;

	override inject(): void {
		this.usersRepo = this.container.require(UsersRepository);
	}

	async handle(request: ApiRequest) {
		const userId = parseInt(request.params['id'], 10);

		// Update user properties
		const { name, email } = request.body;
		const updatedUser = this.usersRepo.update(userId, { name, email });

		if (!updatedUser) {
			throw new NotFoundError('User not found', {
				details: { userId },
			});
		}

		return updatedUser;
	}
}
