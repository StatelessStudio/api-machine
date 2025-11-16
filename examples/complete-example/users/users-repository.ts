export interface User {
	id: number;
	name: string;
	email: string;
	created: Date;
}

export const usersRepo: { [id: number]: User } = {
	1: {
		id: 1,
		name: 'Alice',
		email: 'alice@example.com',
		created: new Date('2023-01-01'),
	},
	2: {
		id: 2,
		name: 'Bob',
		email: 'bob@example.com',
		created: new Date('2023-01-02'),
	},
};
