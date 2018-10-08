const chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    supertest = require('supertest');

const url = 'http://localhost:3000';
const api = supertest(url);

describe('REST API "api/addressdetails"', () => {
    let endpoint = '/api/addressdetails';
    let addr = '8d12a197cb00d4747a1fe03395095ce2a5cc6819';
    let bad_addr = '0x' + addr.toUpperCase();
    let bad_addr2 = addr.slice(0, -1);
    let bad_addr3 = addr + '1';

    it(`Address "${addr}" => should return a 200 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                addr: addr,
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body.head).to.have.property('addr').that.is.not.empty;
                if (err) return done(err);
                done();
            });
    });

    it(`Address "${bad_addr}" => should be validated and return a 200 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                addr: bad_addr,
            })
            .expect(200)
            .end((err) => {
                if (err) return done(err);
                done();
            });
    });

    it(`Address "${bad_addr2}" => should return a 400 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                addr: bad_addr2,
            })
            .expect(400)
            .end((err, res) => {
                expect(res.body.error).to.have.string('Bad addr value');
                if (err) return done(err);
                done();
            });
    });

    it(`Address "${bad_addr3}" => should return a 400 response`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                addr: bad_addr3,
            })
            .expect(400)
            .end((err, res) => {
                expect(res.body.error).to.have.string('Bad addr value');
                if (err) return done(err);
                done();
            });
    });
});
