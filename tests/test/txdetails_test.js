const chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    supertest = require('supertest');

const url = 'http://localhost:3000';
const api = supertest(url);

describe('REST API "api/txdetails"', () => {
    let endpoint = '/api/txdetails';
    let hash = '0x0379187D81a4fce1637583e13ee05474690491b7c6ce93434647696d16a5fe63';
    let bad_hash_less_chars = hash.slice(0, -1);
    let bad_hash_more_chars = hash + '1';
    let bad_hash_caps = hash.substring(2).toUpperCase();

    it(`hash "${hash}" => should return a 200 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                hash: hash,
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body.head).to.have.property('hash').that.is.not.empty;
                if (err) return done(err);
                done();
            });
    });

    it(`hash "${bad_hash_less_chars}" => should return a 400 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                hash: bad_hash_less_chars,
            })
            .expect(400)
            .end((err, res) => {
                expect(res.body.error).to.have.string('Bad Hash value');
                if (err) return done(err);
                done();
            });
    });

    it(`hash "${bad_hash_more_chars}" => should return a 400 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                hash: bad_hash_more_chars,
            })
            .expect(400)
            .end((err) => {
                if (err) return done(err);
                done();
            });
    });

    it(`hash "${bad_hash_caps}" => should return a 200 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                hash: bad_hash_caps,
            })
            .expect(200)
            .end((err) => {
                if (err) return done(err);
                done();
            });
    });
});
