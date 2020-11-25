import {User} from './User.model';

export interface IUserService {
  getUsers(): Promise<User[]>
}

export class UserService implements IUserService {

  getUsers(): Promise<User[]> {
    return Promise.resolve([{id: 'uuid', name: 'Onion'}]);
  }
}

export class MockUserService implements IUserService {
  getUsers(): Promise<User[]>{
    return Promise.resolve([]);
  }
}
