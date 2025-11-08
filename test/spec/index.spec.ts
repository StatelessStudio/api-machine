import 'jasmine';
import { server } from '../test-server';

beforeAll(async () => {
	await server.start();
});

afterAll(async () => {
	await server.stop();
});
