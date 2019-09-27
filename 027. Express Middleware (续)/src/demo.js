const express = require('express');
const app = express();
const router = express.Router()


app.get('/error', (req, res, next) => {
  next(new Error('Error router'))
})

// predicate the router with a check and bail out when needed
router.get('/:id', (req, res, next) => {
  if(req.params.id === '0') next('router')
  else next()
})

router.use((req, res, next) => {
  res.send('hello, you\'re in the router!')
})

// send something to those fall through
app.use('/admin',
  router, // register router
  (req, res) => res.send('hello, 0!') // middleware after router
)

app.get('/user/:id', (req, res, next) => {
  // if the user ID is 0, skip to the next route
  if (req.params.id === '0') next('route')
  // otherwise pass the control to the next middleware function in this stack
  else next()
}, function (req, res, next) {
  // send a regular response
  res.send('Just next()')
})

app.use((req, res, next) => {
  res.send('After next(route)')
})

app.get('/', (req, res, next) => {
  console.log('1')
  next()
  console.log('4')
})

app.use((req, res, next) => {
  console.log('2')
  res.send('Hello world')
  console.log('3')
})

app.use((err, req, res, next) => {
  res.send(err.message);
})
app.listen(3000)
