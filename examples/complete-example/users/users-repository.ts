export interface User {
	id: number;
	name: string;
	email: string;
	created: Date;
}

export class UsersRepository {
	protected readonly users: { [id: number]: User } = {
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

	public getAll(): User[] {
		return Object.values(this.users);
	}

	public getById(id: number): User | undefined {
		return this.users[id];
	}

	public add(user: Omit<User, 'id' | 'created'>): User {
		const id = Math.max(...Object.keys(this.users).map(Number)) + 1;

		const newUser: User = {
			...user,
			id,
			created: new Date(),
		};

		this.users[id] = newUser;

		return newUser;
	}

	public update(
		id: number,
		user: Partial<Omit<User, 'id' | 'created'>>
	): User | undefined {
		if (!this.users[id]) {
			return undefined;
		}
		this.users[id] = { ...this.users[id], ...user };

		return this.users[id];
	}

	public delete(id: number): boolean {
		if (!this.users[id]) {
			return false;
		}

		delete this.users[id];

		return true;
	}
}
