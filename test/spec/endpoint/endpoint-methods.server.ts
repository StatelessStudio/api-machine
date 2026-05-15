import {
	BaseApiRouter,
	ApiRequest,
	GetEndpoint,
	PostEndpoint,
	PutEndpoint,
	DeleteEndpoint,
	PatchEndpoint,
} from '../../../src';

// Mock in-memory data store
const items = [
	{ id: 1, name: 'Item 1', description: 'First item' },
	{ id: 2, name: 'Item 2', description: 'Second item' },
	{ id: 3, name: 'Item 3', description: 'Third item' },
];
let nextId = 4;

export class MethodsRouter extends BaseApiRouter {
	override path = '/methods';

	override async routes() {
		return [
			// GET: List all items
			class extends GetEndpoint {
				override path = '/items';

				override async handle() {
					return items;
				}
			},

			// GET: Get single item
			class extends GetEndpoint {
				override path = '/items/:id';

				override async handle(request: ApiRequest) {
					const id = parseInt(request.params['id'] as string, 10);
					const item = items.find((i) => i.id === id);
					return item || { id, name: 'Not found', description: '' };
				}
			},

			// POST: Create item
			class extends PostEndpoint {
				override path = '/items';

				override async handle(request: ApiRequest) {
					const newItem = {
						id: nextId++,
						name: request.body?.name || 'Unnamed',
						description: request.body?.description || '',
					};
					items.push(newItem);
					return newItem;
				}
			},

			// POST-only endpoint for method testing
			class extends PostEndpoint {
				override path = '/post-only';

				override async handle() {
					return { method: 'post' };
				}
			},

			// PUT: Update item
			class extends PutEndpoint {
				override path = '/items/:id';

				override async handle(request: ApiRequest) {
					const id = parseInt(request.params['id'] as string, 10);
					const index = items.findIndex((i) => i.id === id);

					if (index >= 0) {
						items[index] = {
							id,
							name: request.body?.name || items[index].name,
							description:
								request.body?.description ||
								items[index].description,
						};
						return items[index];
					}

					// Create new item with specified ID
					const newItem = {
						id,
						name: request.body?.name || 'Unnamed',
						description: request.body?.description || '',
					};
					items.push(newItem);
					return newItem;
				}
			},

			// PUT-only endpoint for method testing
			class extends PutEndpoint {
				override path = '/put-only';

				override async handle() {
					return { method: 'put' };
				}
			},

			// DELETE: Delete item
			class extends DeleteEndpoint {
				override path = '/items/:id';

				override async handle(request: ApiRequest) {
					const id = parseInt(request.params['id'] as string, 10);
					const index = items.findIndex((i) => i.id === id);

					if (index >= 0) {
						items.splice(index, 1);
						return { success: true, id };
					}

					return { success: false, id, message: 'Not found' };
				}
			},

			// DELETE-only endpoint for method testing
			class extends DeleteEndpoint {
				override path = '/delete-only';

				override async handle() {
					return { method: 'delete' };
				}
			},

			// PATCH: Partial update item
			class extends PatchEndpoint {
				override path = '/items/:id';

				override async handle(request: ApiRequest) {
					const id = parseInt(request.params['id'] as string, 10);
					const index = items.findIndex((i) => i.id === id);

					if (index >= 0) {
						items[index] = {
							...items[index],
							...(request.body || {}),
							id, // Ensure ID doesn't change
						};
						return items[index];
					}

					return { id, message: 'Not found' };
				}
			},

			// PATCH-only endpoint for method testing
			class extends PatchEndpoint {
				override path = '/patch-only';

				override async handle() {
					return { method: 'patch' };
				}
			},

			// Default method test (should be GET)
			class extends GetEndpoint {
				override path = '/default-method';

				override async handle() {
					return { method: 'get' };
				}
			},
		];
	}
}
