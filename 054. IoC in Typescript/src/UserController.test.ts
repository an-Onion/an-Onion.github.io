import { MockUserService } from './UserService';
import { UserController } from './UserController';
import { User } from './User.model';

describe('Mock test with UserController', () => {
  let userController: UserController;

  beforeEach(() => {
    userController = new UserController(
      new MockUserService() // Speedy! And valid since it inherits IUserRepo.
    );
  });

  it('Return an empty array of users', async () => {
    const users: User[] = await userController.getGetUsers();
    expect(users).toStrictEqual([]);
  });
});

