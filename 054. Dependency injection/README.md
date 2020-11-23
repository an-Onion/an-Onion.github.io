# DI

1. If in the future we’ll want to use a different strategy, we’ll only need to replace the dependency without changing Foo — cause we managed the dependency outside of it.

2. In case Bar is a shared service that we aim to instantiate once, we don’t have to implement it as a singleton, that will become the responsibility of the “injecting” layer which IMO keeps things looser.

3. Unit testing is easier, we can just inject mock implementations into the class which is under test.
