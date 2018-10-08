const io = require('socket.io-client'),
    chai = require('chai'),
    expect = chai.expect;

const url = process.env.scanurl || 'http://192.168.1.87:3001';
const io_options = {
    upgrade: false,
    path: '/ws/v2_1',
    transports: ['websocket'],
};

describe('Socket.io API v. 2.1 "ERC20Details"', () => {
    let addr = '0x763186eb8d4856d536ed4478302971214febc6a9';
    let event = 'erc20Details';

    const error_handler = (socket, error, callback) => {
        socket.disconnect();
        return callback(Error(error.errorMessage));
    };

    it(`event "${event}" and addr:"${addr}" => should return ERC20Details for address ${addr} with price >= 0`, (done) => {
        const socket = io.connect(
            url,
            io_options
        );
        socket.on('connect', () => {
            socket.emit(event, JSON.stringify({ addr: addr }), (e) => error_handler(socket, e, done));
            socket.on(event, (data) => {
                let object = JSON.parse(data);
                expect(object)
                    .to.have.property('head')
                    .that.is.not.empty.and.to.have.property('head.price')
                    .that.satisfy((price) => price >= 0);
                done();
                socket.disconnect();
            });
        });
    });
});
