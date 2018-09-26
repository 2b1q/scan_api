const chai = require('chai'),
    expect = chai.expect,
    supertest = require('supertest'),
    check = require('../../utils/tools').check;

const url = process.env.scanurl || 'http://localhost:3000';
const api = supertest(url);

describe('REST API v. 2.1 "block details"', () => {
    let endpoint = '/api/v2_1/block/details';
    let block = process.env.block || '6366555';
    let block_head_keys = ['block', 'gasLimit', 'gasUsed', 'hash', 'innerTxCount', 'mainTxCount', 'time', 'tokenTxCount'];
    let time = 'time';

    it(`${endpoint}?block=${block} => should return "Content-Type: json" and 200 response`, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect('Content-Type', /json/)
            .expect(200, done());
    });

    it(`${endpoint}?block=${block} => should return block details for block ${block}`, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head.block).to.equal(Number(block));
                done();
            });
    });

    it(`${endpoint}?block=${block} => should return a JSON with head property with fields ${block_head_keys} that is not empty`, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head).to.have.all.keys(block_head_keys).that.is.not.empty;
                done();
            });
    });

    it(`head => should have property '${time}' with UTC format time value`, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head)
                    .to.have.property(time)
                    .that.satisfy((time) => check.utc(time));
                done();
            });
    });
});
