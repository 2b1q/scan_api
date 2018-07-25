const chai = require('chai'),
  should = chai.should(),
  expect = chai.expect,
  supertest = require('supertest');

const url = 'http://localhost:3000';
const api = supertest(url);

describe('List API', () => {
  let endpoint = '/api/list';
  let addr = '1b9f3068783c0cab4ccf9e0fc60416dbf4ece3b5';
  let addr_0x = '0x' + addr;
  let reach_addr = '8d12a197cb00d4747a1fe03395095ce2a5cc6819';

  it('moduleId "address" & listId "listOfTokensBalances" => should return a 400 response', done => {
    api.post(endpoint)
      .set('Accept', 'application/json')
      .send({
        "listId": "listOfTokensBalances",
        "moduleId": "address",
        "params": {
          "entityId": addr,
          "page": 1,
          "size": 10
        }
      })
      .expect(400)
      .end((err, res) => {
        if(err) return done(err);
        done();
      })
  });

  it('moduleId "address" => should validate bad address by length', done => {
    api.post(endpoint)
      .set('Accept', 'application/json')
      .send({
        "listId": "listOfTokensBalances",
        "moduleId": "address",
        "params": {
          "entityId": addr + 'b',
          "page": 1,
          "size": 10
        }
      })
      .expect(400)
      .end((err, res) => {
        expect(res.body).to.have.property('error')
        if(err) return done(err);
        done();
      })
  });

  it(`moduleId "address". Address "${addr}" listOfTokens => should return tokens`, done => {
    api.post(endpoint)
      .set('Accept', 'application/json')
      .send({
        "listId": "listOfTokens",
        "moduleId": "address",
        "params": {
          "entityId": addr,
          "page": 1,
          "size": 10
        }
      })
      .expect(200)
      .end((err, res) => {
        expect(res.body.rows).to.be.an('array').that.is.not.empty;
        if(err) return done(err);
        done();
      })
  });

  it(`moduleId "address". 0x Address "${addr_0x}" listOfTokens => should return tokens`, done => {
    api.post(endpoint)
      .set('Accept', 'application/json')
      .send({
        "listId": "listOfTokens",
        "moduleId": "address",
        "params": {
          "entityId": addr_0x,
          "page": 1,
          "size": 10
        }
      })
      .expect(200)
      .end((err, res) => {
        expect(res.body.rows).to.be.an('array').that.is.not.empty;
        if(err) return done(err);
        done();
      })
  });

  it(`moduleId "address". Address "${addr}" listOfETH => should return 'Not found'`, done => {
    api.post(endpoint)
      .set('Accept', 'application/json')
      .send({
        "listId": "listOfETH",
        "moduleId": "address",
        "params": {
          "entityId": addr,
          "page": 1,
          "size": 10
        }
      })
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Not found')
        if(err) return done(err);
        done();
      })
  });

  it(`moduleId "address". Reach Address "${reach_addr}" => should return > 10 ETH transactions`, done => {
    api.post(endpoint)
      .set('Accept', 'application/json')
      .send({
        "listId": "listOfETH",
        "moduleId": "address",
        "params": {
          "entityId": reach_addr,
          "page": 1,
          "size": 10
        }
      })
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.property('head');
        expect(res.body.head.totalEntities).to.satisfy(num => num > 10);
        if(err) return done(err);
        done();
      })
  });



});