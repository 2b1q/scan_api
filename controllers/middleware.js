// socket.io controller
const config = require('../config/config'),
      c      = config.color;

const init_io = server => {
  let event = data => console.log(`Event:\n${data}`);
  let io = require('socket.io')(server)
  io.on('connection', socket =>{
    let con_obj = {
      client_ip:  socket.handshake.address,
      url:        socket.handshake.url,
      query:      socket.handshake.query,
      sid:        socket.client.id
    }
    console.log(`${c.green}[i] a socket io client${c.white} ${socket.client.id} ${c.green}connected
${c.yellow}${JSON.stringify(con_obj,null,1)}${c.white}`);
    socket.on('list', data => event(data))
    socket.on('txDetails', data => event(data))
    socket.on('blockDetails', data => event(data))
    socket.on('addressDetails', data => event(data))
  })
}

module.exports = init_io
