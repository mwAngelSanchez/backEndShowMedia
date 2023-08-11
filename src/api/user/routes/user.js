module.exports = {
  routes: [
     {
      method: 'POST',
      path: '/user/login',
      handler: 'user.login',
     },
     {
      method: 'PUT',
      path: '/user/confirmUser/:id',
      handler: 'user.confirmUser',
     },
     {
      method: 'POST',
      path: '/user/create',
      handler: 'user.createUser',
     }
  ],
};
