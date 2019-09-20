// target === Employee.prototype
// propertyName === "getFullName"
// descriptor === Object.getOwnPropertyDescriptor(Employee.prototype, "getFullName")
export function log(
  target: object,
  propertyName: string,
  descriptor: PropertyDescriptor): void {

    const method: () => string = descriptor.value;

    descriptor.value = function() {

      // invoke getFullName() and get its return value
      const result: string = method.call(this);

      // display in console the function call details
      console.log(result);

      // return the result of invoking the method
      return result;
  };
}

class Persion {

  constructor(
      private firstName: string,
      private lastName: string,
  ) {}

  @log
  public getFullName(): string {
      return `${this.firstName} ${this.lastName}`;
  }

}

const emp: Persion = new Persion('Onion', 'Garlic');
emp.getFullName();
