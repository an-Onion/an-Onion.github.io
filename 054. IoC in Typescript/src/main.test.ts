import * as awilix from 'awilix';
import { UserController } from './UserController';
import { UserService } from './UserService';
import { User } from './User.model';

describe('User main test', () => {

  let container: awilix.AwilixContainer;

  beforeEach(() => {

    container = awilix.createContainer({
      injectionMode: awilix.InjectionMode.CLASSIC,
    });

    container.register({
      userController: awilix.asClass(UserController),
      userService: awilix.asClass(UserService),
    });

  });

  it('IoC UserController', async() => {
    const users: User[] = await container.resolve<UserController>('userController').getGetUsers();
    expect(users).toStrictEqual([{id: 'uuid', name: 'Onion'}]);
  });

});

