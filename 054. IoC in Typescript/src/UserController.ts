import { IUserService } from './UserService';
import { User } from './User.model';

export class UserController {

  constructor (private userService: IUserService) {}

  getGetUsers (): Promise<User[]> {
    return this.userService.getUsers();
  }
}
