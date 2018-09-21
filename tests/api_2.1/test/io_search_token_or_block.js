const io = require('socket.io-client'),
    chai = require('chai'),
    expect = chai.expect;

const url = process.env.scanurl || 'http://192.168.1.87:3001';
const io_options = {
    upgrade: false,
    path: '/ws/v2_1',
    transports: ['websocket'],
};

describe('Socket.io API v. 2.1 "search block or tokens"', () => {
    let serch_query = {
        q: '123',
        params: {
            size: 5,
        },
    };
    let event = 'search';

    const error_handler = (socket, error, callback) => {
        socket.disconnect();
        return callback(Error(error.errorMessage));
    };

    it(`client connected to "${url}" path: "${io_options.path}"`, (done) => {
        const socket = io.connect(
            url,
            io_options
        );
        socket.on('connect', () => {
            done();
            socket.disconnect();
        });
    });

    it(`event "${event}" and serch_query "${
        serch_query.q
    }" => should emit event ${event} blocks array that is not empty`, (done) => {
        const socket = io.connect(
            url,
            io_options
        );
        socket.on('connect', () => {
            socket.emit(event, JSON.stringify(serch_query), (e) => error_handler(socket, e, done));
            socket.on(event, (data) => {
                console.log(data);
                expect(JSON.parse(data).blocks).to.be.an('array').that.is.not.empty;
                done();
                socket.disconnect();
            });
        });
    });
});
