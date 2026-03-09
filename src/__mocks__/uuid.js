let counter = 0;
module.exports = {
  v4: () => `mock-uuid-${++counter}`,
  NIL: '00000000-0000-0000-0000-000000000000'
};
