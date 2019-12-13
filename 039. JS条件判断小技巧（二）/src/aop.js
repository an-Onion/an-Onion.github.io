const nextSmb = Symbol('next');

Function.prototype.after = function(next) {
  let fn = this;

  return function $after(...args) {
    let code = fn.apply(this, args)

    if( nextSmb !== code )
      return code;

    return next.apply(this, args);
  }
}

function owner (role, access) {

  const ownerChain = public.after(private);

  return 'owner' === role ? ownerChain(access) : nextSmb;

  function public(access) {
    return 1 === access ? console.log('owner in public') : nextSmb;
  }

  function private(access) {
    return 2 === access ? console.log('owner in private') : nextSmb;
  }
}

function admin (role, access) {
  const ownerChain = public.after(private);

  return 'admin' === role ? ownerChain(access) : nextSmb;

  function public(access) {
    return 1 === access ? console.log('admin in public') : nextSmb;
  }

  function private(access) {
    return 2 === access ? console.log('admin in private') : nextSmb;
  }
}

let greeting = owner.after(admin)
greeting('owner', 1);
greeting('owner', 2);
greeting('admin', 1);
greeting('admin', 2);
