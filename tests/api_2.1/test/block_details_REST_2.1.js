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
    let wrong_block = 100;
    const HTTP404 = 404,
        HTTP400 = 400,
        ERRORCODE404 = HTTP404,
        ERRORCODE400 = HTTP400;

    it(`${endpoint}?block=${block} => should return "Content-Type: json" and 200 response`, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect('Content-Type', /json/)
            .expect(200, done());
    });

    it(`${endpoint}?block=${Number(block)} (Number) => should return Number block > 0`, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head.block).that.satisfy((block) => typeof block === 'number' && block > 0);
                done();
            });
    });

    it(`${endpoint}?block=${block} (String) => should return Number block > 0`, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head.block).that.satisfy((block) => typeof block === 'number' && block > 0);
                done();
            });
    });

    it(`${endpoint}?block=${block} => should return "gasLimit" & "gasUsed" >=0 `, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head.gasLimit).that.satisfy((gasLimit) => typeof gasLimit === 'number' && gasLimit >= 0);
                expect(res.body.head.gasUsed).that.satisfy((gasUsed) => typeof gasUsed === 'number' && gasUsed >= 0);
                done();
            });
    });

    it(`${endpoint}?block=${block} => "mainTxCount", "innerTxCount", "tokenTxCount" - целые числа`, (done) => {
        api.get(`${endpoint}?block=${block}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.head.mainTxCount).that.satisfy(
                    (mainTxCount) => Number.isInteger(mainTxCount) && mainTxCount >= 0
                );
                expect(res.body.head.mainTxCount).that.satisfy(
                    (innerTxCount) => Number.isInteger(innerTxCount) && innerTxCount >= 0
                );
                expect(res.body.head.mainTxCount).that.satisfy(
                    (tokenTxCount) => Number.isInteger(tokenTxCount) && tokenTxCount >= 0
                );
                done();
            });
    });

    it(`${endpoint}?block=${wrong_block} => should return HTTP status code "${HTTP404}" and errorCode "${ERRORCODE404}"`, (done) => {
        api.get(`${endpoint}?block=${wrong_block}`)
            .expect(HTTP404)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.errorCode).to.equal(ERRORCODE404);
                done();
            });
    });

    it(`${endpoint}?block= => should return HTTP status code "${HTTP400}" and errorCode "${ERRORCODE400}"`, (done) => {
        api.get(`${endpoint}?block=`)
            .expect(HTTP400)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.errorCode).to.equal(ERRORCODE400);
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
