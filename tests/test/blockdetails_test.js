const chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    supertest = require('supertest');

const url = 'http://localhost:3000';
const api = supertest(url);

describe('REST API "api/blockdetails"', () => {
    let endpoint = '/api/blockdetails';
    let block = '5904606';
    let not_exist_block = '5404606';
    let wrong_block = 'p' + block;

    it(`block "${block}" => should return a 200 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                block: block,
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body.head).to.have.property('block').that.is.not.empty;
                if (err) return done(err);
                done();
            });
    });

    it(`block "${not_exist_block}" => should return a 404 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                block: not_exist_block,
            })
            .expect(404)
            .end((err) => {
                if (err) return done(err);
                done();
            });
    });

    it(`block "${wrong_block}" => should return a 400 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                block: wrong_block,
            })
            .expect(400)
            .end((err) => {
                if (err) return done(err);
                done();
            });
    });
});
