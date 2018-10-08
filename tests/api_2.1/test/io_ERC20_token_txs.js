const io = require('socket.io-client'),
    chai = require('chai'),
    expect = chai.expect;

const url = process.env.scanurl || 'http://192.168.1.87:3001';
const io_options = {
    upgrade: false,
    path: '/ws/v2_1',
    transports: ['websocket'],
};

describe('Socket.io API v. 2.1 "ERC20 token transactions"', () => {
    let addr = '0x763186eb8d4856d536ed4478302971214febc6a9';
    let event = 'list';
    let payload = {
        listId: 'listOfTokens',
        moduleId: 'erc20Token',
        params: {
            entityId: addr,
            size: 20,
            offset: 0,
        },
    };

    const error_handler = (socket, error, callback) => {
        socket.disconnect();
        return callback(Error(error.errorMessage));
    };

    it(`ERC20 token transactions for "${addr}" => should return token transactions`, (done) => {
        const socket = io.connect(
            url,
            io_options
        );
        socket.on('connect', () => {
            socket.emit(event, JSON.stringify(payload), (e) => error_handler(socket, e, done));
            socket.on(event, (data) => {
                let object = JSON.parse(data);
                expect(object)
                    .to.have.property('head')
                    .that.is.not.empty.and.to.have.property('rows');
                expect(object.head)
                    .to.have.property('moduleId')
                    .equal(payload.moduleId);
                expect(object.head)
                    .to.have.property('listId')
                    .equal(payload.listId);
                done();
                // console.log(object.head);
                socket.disconnect();
            });
        });
    });
});
