const rules = [
  {
    match(role) {
      return 'owner' === role;
    },
    action(access) {
      if( 1 === access )
        console.log('Owner in public');
      else if( 2 === access )
        console.log('Owner in private');
    }
  },
  {
    match(role) {
      return 'admin' === role;
    },
    action(access) {
      if( 1 === access )
        console.log('Admin in public');
      else if( 2 === access )
        console.log('Admin in private');
    }
  }
];

function greeting(role, access){
  for(let rule of rules){
    if( rule.match(role) )
      return rule.action(access);
  }
}

greeting('owner', 1);
greeting('owner', 2);
greeting('admin', 1);
greeting('admin', 2);
