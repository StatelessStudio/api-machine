import { BaseApiEndpoint, EndpointMethod } from '../../../src/router/endpoint';
import { Router as ExpressRouter } from 'express';

describe('router register behavior', () => {
	it('composes fullPath when parentPath lacks trailing slash', () => {
		class TestEndpoint extends BaseApiEndpoint {
			override path = 'child';
			override async handle() {
				return { ok: true };
			}
		}

		const e = new TestEndpoint();

		// exercise branch: parentPath without trailing slash
		const callRegister = e as unknown as {
			registerRoutePath(parentPath: string): void;
		};
		callRegister.registerRoutePath('/parent');

		expect(e.path).toBe('/child');
		expect(e.fullPath).toBe('/parent/child');
	});

	it('getName falls back to constructor name when name is not set', () => {
		class NameTestEndpoint extends BaseApiEndpoint {
			override async handle() {
				return {};
			}
		}

		const inst = new NameTestEndpoint();

		expect(inst.getName()).toBe('NameTestEndpoint');
	});

	it('getTag falls back to constructor name without suffix', () => {
		class TagTestEndpoint extends BaseApiEndpoint {
			override async handle() {
				return {};
			}
		}

		const inst = new TagTestEndpoint();

		expect(inst.getTag()).toBe('TagTest');
	});

	it('registers endpoint without middleware', async () => {
		class NoMiddlewareEndpoint extends BaseApiEndpoint {
			override path = '/nomw';
			override method = EndpointMethod.GET;

			override async handle() {
				return { ok: true };
			}
		}

		const ep = new NoMiddlewareEndpoint();

		// fake express router to capture calls
		const fakeRouterObj = { get: jasmine.createSpy('get') };
		const fakeRouter = fakeRouterObj as unknown as ExpressRouter;

		await ep.register(fakeRouter, '/parent');

		const spy = (fakeRouter as unknown as { get: jasmine.Spy }).get;

		expect(spy).toHaveBeenCalled();
		const args = spy.calls.mostRecent().args as unknown[];
		expect(args[0]).toBe('/nomw');
		// second arg should be the handler function (bound)
		expect(typeof args[1]).toBe('function');
	});
});
