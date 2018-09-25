const chai = require('chai'),
    expect = chai.expect,
    supertest = require('supertest');

const url = process.env.scanurl || 'http://localhost:3000';
const api = supertest(url);

describe('REST API v. 2.1 "address details"', () => {
    let endpoint = '/api/v2_1/address/details';
    let addr = process.env.addr || '0x0000000000000000000000000000000000000000';
    let addr_head_keys = ['addr', 'mainTxCount', 'innerTxCount', 'tokenTxCount', 'tokenTxCount', 'balance'];
    let balance_keys = ['dcm', 'val'];

    it(`${endpoint}?addr=${addr} => should return "Content-Type: json" and 200 response`, (done) => {
        api.get(`${endpoint}?block=${addr}`)
            .expect('Content-Type', /json/)
            .expect(200, done());
    });

    it(`${endpoint}?addr=${addr} => should return a JSON with head property with fields ${addr_head_keys} that is not empty`, (done) => {
        api.get(`${endpoint}?addr=${addr}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head).to.have.all.keys(addr_head_keys).that.is.not.empty;
                expect(res.body.head.balance).to.have.all.keys(balance_keys);
                done();
            });
    });
});
