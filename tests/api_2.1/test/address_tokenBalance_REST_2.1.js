const chai = require('chai'),
    expect = chai.expect,
    supertest = require('supertest');

const url = process.env.scanurl || 'http://localhost:3000';
const api = supertest(url);

describe('REST API v. 2.1 "address tokenBalance"', () => {
    let endpoint = '/api/v2_1/address/token-balance';
    let addr = process.env.addr || '0x0000000000000000000000000000000000000000';
    let addr_head_keys = [
        'addr',
        'totalEntities',
        'offset',
        'size',
        //'infinityScroll',
        'updateTime',
    ];
    let balance_keys = ['dcm', 'val'];
    let offset = 0,
        size = 50;

    it(`${endpoint}?addr=${addr}&offset=${offset}&size=${size} => should return head with properties ${addr_head_keys} that is not empty and rows not empty Array`, (done) => {
        api.get(`${endpoint}?addr=${addr}&offset=${offset}&size=${size}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head).to.have.all.keys(addr_head_keys).that.is.not.empty;
                expect(res.body.rows).to.be.an('array').that.is.not.empty;
                done();
            });
    });
});
