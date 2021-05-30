module.exports = {
  name: 'saltana-stripe',
  version: '0.1.0',

  routes: require('./routes'),
  versions: require('./versions'),

  permissions: [
    'integrations:read_write:stripe'
  ]
}
