class User {
  public() {
    throw new Error('Denied!')
  }

  private() {
    throw new Error('Denied!')
  }
}

class Owner extends User {
  public() {
    console.log('Owner in public');
  }
  private() {
    console.log('Owner inside');
  }
}

class Factory {
  static create(role) {
    if( 'owner' === role )
      return new Owner();
    else if( 'admin' === role )
      return new Admin();
    else if( 'hr' === role )
      return new HR();
  }
}

const user = Factory.create('owner');
user['public']();
