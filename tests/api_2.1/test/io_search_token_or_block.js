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
        q: '2018',
        params: {
            size: 5,
        },
    };
    let token = 'bKx';
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

    it(`event "${event}" and q:"${serch_query.q}" 
    => server should emit "${event}" event with blocks and tokens not empty arrays`, (done) => {
        const socket = io.connect(
            url,
            io_options
        );
        socket.on('connect', () => {
            socket.emit(event, JSON.stringify(serch_query), (e) => error_handler(socket, e, done));
            socket.on(event, (data) => {
                let object = JSON.parse(data);
                expect(object.blocks).to.be.an('array').that.is.not.empty;
                expect(object.tokens).to.be.an('array').that.is.not.empty;
                done();
                console.log(data);
                socket.disconnect();
            });
        });
    });

    it(`event "${event}" and q:"${token}" => server should emit "${event}" event with BKX token`, (done) => {
        const socket = io.connect(
            url,
            io_options
        );
        socket.on('connect', () => {
            socket.emit(
                event,
                JSON.stringify({
                    q: token,
                    params: {
                        size: 5,
                    },
                }),
                (e) => error_handler(socket, e, done)
            );
            socket.on(event, (data) => {
                expect(JSON.parse(data).tokens[0].smbl).to.includes('BKX');
                done();
                // console.log(data);
                socket.disconnect();
            });
        });
    });
});
