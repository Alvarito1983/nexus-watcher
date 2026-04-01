// Socket.io singleton — set in server.js, read in routes
let _io = null;

module.exports = {
  setIo(io) { _io = io; },
  getIo() { return _io; },
};
