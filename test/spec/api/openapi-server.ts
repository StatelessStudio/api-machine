import { ObjectSanitizer } from 'valsan/object-sanitizer';

import { NotFoundError, RestServer } from '../../../src';
import {
	BaseApiRouter,
	PostEndpoint,
	ApiRequest,
	DeleteEndpoint,
	PatchEndpoint,
	PutEndpoint,
	GetEndpoint,
} from '../../../src/router';

import {
	ComposedValSan,
	EmailValidator,
	IntegerValidator,
	LengthValidator,
} from 'valsan';
import { StringToNumberValSan } from 'valsan';
import { RangeValidator } from 'valsan';

const idValidator = () => new LengthValidator({ minLength: 1, maxLength: 50 });
const nameValidator = (isOptional: boolean = false) =>
	new LengthValidator({ minLength: 2, maxLength: 50, isOptional });
const emailValidator = (isOptional: boolean = false) =>
	new EmailValidator({ isOptional });

/**
 * Users
 */
const usersDb: Record<string, { id: string; name: string; email: string }> = {};

class CreateUserEndpoint extends PostEndpoint {
	override path = '/users';
	override description = 'Creates a new user';

	static override body = new ObjectSanitizer({
		name: nameValidator(),
		email: emailValidator(),
	});

	async handle(request: ApiRequest) {
		const id = Math.random().toString(36).slice(2);
		usersDb[id] = { id, ...request.body };

		return usersDb[`${id}`];
	}
}

class GetUserEndpoint extends GetEndpoint {
	override path = '/users/:id';

	static override params = new ObjectSanitizer({
		id: idValidator(),
	});

	static override headers = new ObjectSanitizer({
		'x-request-id': new LengthValidator({
			minLength: 5,
			maxLength: 50,
		}),
	});

	async handle(request: ApiRequest) {
		const user = usersDb[request.params['id']];

		if (!user) {
			throw new NotFoundError('User not found');
		}

		return user;
	}
}

class ListUsersEndpoint extends GetEndpoint {
	override path = '/users';

	static override query = new ObjectSanitizer({
		limit: new ComposedValSan(
			[
				new StringToNumberValSan(),
				new IntegerValidator(),
				new RangeValidator({ min: 1, max: 100 }),
			],
			{ isOptional: true }
		),
	});

	async handle(request: ApiRequest) {
		const users = Object.values(usersDb);

		return request.query['limit']
			? users.slice(0, Number(request.query['limit']))
			: users;
	}
}

class UpdateUserEndpoint extends PatchEndpoint {
	override path = '/users/:id';

	static override params = GetUserEndpoint.params;
	static override body = new ObjectSanitizer({
		name: nameValidator(true),
		email: emailValidator(true),
	});

	async handle(request: ApiRequest) {
		if (!usersDb[request.params['id']]) {
			throw new NotFoundError('User not found');
		}

		const filteredBody = Object.fromEntries(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			Object.entries(request.body).filter(([_, v]) => v !== undefined)
		);

		usersDb[request.params['id']] = {
			...usersDb[request.params['id']],
			...filteredBody,
		};

		return usersDb[request.params['id']];
	}
}

class DeleteUserEndpoint extends DeleteEndpoint {
	override path = '/users/:id';
	static override params = GetUserEndpoint.params;

	async handle(request: ApiRequest) {
		const deleted = usersDb[request.params['id']];
		if (!deleted) {
			throw new NotFoundError('User not found');
		}

		delete usersDb[request.params['id']];

		return {};
	}
}

class UserRouter extends BaseApiRouter {
	override path = '/api';

	override async routes() {
		return [
			CreateUserEndpoint,
			GetUserEndpoint,
			ListUsersEndpoint,
			UpdateUserEndpoint,
			DeleteUserEndpoint,
		];
	}
}

/**
 * Posts
 */
// --- Posts CRUD Endpoints ---
const postsDb: Record<string, { id: string; title: string; content: string }> =
	{};

class CreatePostEndpoint extends PostEndpoint {
	override path = '/posts';

	static override body = new ObjectSanitizer({
		title: new LengthValidator({ minLength: 2, maxLength: 100 }),
		content: new LengthValidator({ minLength: 1, maxLength: 1000 }),
	});

	async handle(request: ApiRequest) {
		const id = Math.random().toString(36).slice(2);
		postsDb[id] = { id, ...request.body };

		return postsDb[id];
	}
}

class GetPostEndpoint extends GetEndpoint {
	override path = '/posts/:id';

	static override params = new ObjectSanitizer({
		id: new LengthValidator({ minLength: 1, maxLength: 50 }),
	});

	async handle(request: ApiRequest) {
		const post = postsDb[request.params['id']];

		if (!post) {
			throw new NotFoundError('Post not found');
		}

		return post;
	}
}

class ListPostsEndpoint extends GetEndpoint {
	override path = '/posts';
	async handle() {
		return Object.values(postsDb);
	}
}

class UpdatePostEndpoint extends PutEndpoint {
	override path = '/posts/:id';

	static override params = GetPostEndpoint.params;
	static override body = CreatePostEndpoint.body;

	async handle(request: ApiRequest) {
		if (!postsDb[request.params['id']]) {
			throw new NotFoundError('Post not found');
		}

		postsDb[request.params['id']] = {
			...postsDb[request.params['id']],
			...request.body,
		};

		return postsDb[request.params['id']];
	}
}

class DeletePostEndpoint extends DeleteEndpoint {
	override path = '/posts/:id';

	static override params = GetPostEndpoint.params;

	async handle(request: ApiRequest) {
		const deleted = postsDb[request.params['id']];
		delete postsDb[request.params['id']];

		return deleted ? { deleted } : { error: 'Not found' };
	}
}

class PostRouter extends BaseApiRouter {
	override path = '/api';
	override description = 'Blog Posts';

	override async routes() {
		return [
			CreatePostEndpoint,
			GetPostEndpoint,
			ListPostsEndpoint,
			UpdatePostEndpoint,
			DeletePostEndpoint,
		];
	}
}

class OpenApiRouter extends BaseApiRouter {
	override path = '/';

	override async routes() {
		return [UserRouter, PostRouter];
	}
}

export class OpenApiTestServer extends RestServer {
	override name = 'Self-Documenting OpenAPI Test Server';
	override version = '1.0.0';
	override description = 'Demo of ts-rest\'s self-documenting feature';

	override router = OpenApiRouter;
}

export const server = new OpenApiTestServer({
	port: 5050,
	swaggerEnabled: true,
});
