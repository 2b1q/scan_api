const chai = require('chai'),
    expect = chai.expect,
    supertest = require('supertest');

const url = process.env.scanurl || 'http://localhost:3000';
const api = supertest(url);

describe('REST API v. 2.1 "block tokens"', () => {
    const ETHDCM = 18,
        MAXSIZE = 200,
        MINSIZE = 0,
        MAXOFFSET = 300000,
        MINOFFSET = MINSIZE;
    let endpoint = '/api/v2_1/block/tokens';
    let block = process.env.block || '6366555',
        offset = 0,
        size = 50;
    let blockNumber_not_found_msg = 'blockNumber not found';
    let block_head_keys = ['totalEntities', 'offset', 'size', 'blockNumber', 'updateTime'];
    let block_ether_rows_keys = [
        'id',
        'hash',
        'block',
        'addrFrom',
        'addrTo',
        'time',
        'type',
        'status',
        'error',
        'isContract',
        'isInner',
        'value',
        'txFee',
        'gasUsed',
        'gasCost',
    ];
    let block_token_rows_keys = block_ether_rows_keys.concat(['tokenAddr', 'tokenName', 'tokenSmbl', 'tokenDcm', 'tokenType']);
    let value_keys = ['dcm', 'val'];
    let bad_offset = -1,
        bad_size = -1;

    it(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size} => should return "Content-Type: json" and 200 response`, (done) => {
        api.get(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size}`)
            .expect('Content-Type', /json/)
            .expect(200, done());
    });

    it(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size} => should return a JSON with head property with fields ${block_head_keys} that is not empty`, (done) => {
        api.get(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head).to.have.all.keys(block_head_keys).that.is.not.empty;
                done();
            });
    });

    it(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size} => should return a JSON with rows array wich first element is JSON with fields [${block_token_rows_keys}]`, (done) => {
        api.get(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.rows[0]).to.have.all.keys(block_token_rows_keys);
                done();
            });
    });

    it(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size} => first ETH tx should have property 'value' with properties: "${value_keys}" where dcm === ETHDCM`, (done) => {
        api.get(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.rows[0].value)
                    .to.have.all.keys(value_keys)
                    .and.to.have.property('dcm')
                    .that.satisfy((num) => num === ETHDCM);
                done();
            });
    });

    it(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size} => first ETH tx should have property 'txFee' with properties: "${value_keys}" where dcm === ETHDCM`, (done) => {
        api.get(`${endpoint}?blockNumber=${block}&offset=${offset}&size=${size}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.rows[0].txFee)
                    .to.have.all.keys(value_keys)
                    .and.to.have.property('dcm')
                    .that.satisfy((num) => num === ETHDCM);
                done();
            });
    });

    it(`${endpoint}?blockNumber=${block}&offset=${offset} => should return 400 response`, (done) => {
        api.get(`${endpoint}?blockNumber=${block}&offset=${offset}`)
            .expect('Content-Type', /json/)
            .expect(400, done());
    });

    it(`${endpoint}?block=${block}&offset=${offset}&size=${size} => should return 400 response with error ${blockNumber_not_found_msg}`, (done) => {
        api.get(`${endpoint}?block=${block}&offset=${offset}&size=${size}`)
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.error).to.equal(blockNumber_not_found_msg);
                done();
            });
    });

    it(`${endpoint}?blockNumber=${block}&offset=${bad_offset}&size=${bad_size} => should normalize size & offset`, (done) => {
        api.get(`${endpoint}?blockNumber=${block}&offset=${bad_offset}&size=${bad_size}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head)
                    .property('offset')
                    .to.satisfy((num) => num >= MINOFFSET && num <= MAXOFFSET);
                expect(res.body.head)
                    .property('size')
                    .to.satisfy((num) => num >= MINSIZE && num <= MAXSIZE);
                done();
            });
    });
});
