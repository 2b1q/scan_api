const chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    supertest = require('supertest');

const url = 'http://localhost:3000';
const api = supertest(url);

describe('REST API "api/list"', () => {
    let endpoint = '/api/list';
    let addr = '1b9f3068783c0cab4ccf9e0fc60416dbf4ece3b5';
    let addr_0x = '0x' + addr;
    let reach_addr = '8d12a197cb00d4747a1fe03395095ce2a5cc6819';
    let addr_0x_caps = '0x8D12a197cb00d4747a1fe03395095ce2a5cc6819';
    let addr_0x_caps_without_1_char = addr_0x_caps.slice(0, -1);
    let block = '5904606';

    it('moduleId "address" => "listOfTokensBalances" => should return a 400 response', (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfTokensBalances',
                moduleId: 'address',
                params: {
                    entityId: addr,
                    page: 1,
                    size: 10,
                },
            })
            .expect(400)
            .end((err) => {
                if (err) return done(err);
                done();
            });
    });

    it('moduleId "address" => "listOfTokensBalances" => should validate bad address by length', (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfTokensBalances',
                moduleId: 'address',
                params: {
                    entityId: addr + 'b',
                    page: 1,
                    size: 10,
                },
            })
            .expect(400)
            .end((err, res) => {
                expect(res.body).to.have.property('error');
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "address" => "listOfTokens" Address "${addr}" => should return tokens`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfTokens',
                moduleId: 'address',
                params: {
                    entityId: addr,
                    page: 1,
                    size: 10,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body.rows).to.be.an('array').that.is.not.empty;
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "address" => "listOfTokens" 0x Address "${addr_0x}" => should return tokens`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfTokens',
                moduleId: 'address',
                params: {
                    entityId: addr_0x,
                    page: 1,
                    size: 10,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body.rows).to.be.an('array').that.is.not.empty;
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "address" => "listOfETH" Address "${addr}" => should return 'Not found'`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfETH',
                moduleId: 'address',
                params: {
                    entityId: addr,
                    page: 1,
                    size: 10,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.have.property('error');
                expect(res.body.error).to.equal('Not found');
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "address" => "listOfETH" Reach Address "${reach_addr}" => should return > 10 ETH transactions`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfETH',
                moduleId: 'address',
                params: {
                    entityId: reach_addr,
                    page: 1,
                    size: 10,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.have.property('head');
                expect(res.body.head.totalEntities).to.satisfy((num) => num > 10);
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "address" => "listOfTokenBalance" Reach Address "${reach_addr}" => should return at least 1 token`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfTokenBalance',
                moduleId: 'address',
                params: {
                    entityId: reach_addr,
                    page: 1,
                    size: 10,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.have.property('head');
                expect(res.body.head.totalEntities).to.satisfy((num) => num > 1);
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "address" => "listOfTokenBalance" 0x Address with Capital char "${addr_0x_caps}" => should be valid`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfTokenBalance',
                moduleId: 'address',
                params: {
                    entityId: addr_0x_caps,
                    page: 1,
                    size: 10,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.have.property('head');
                expect(res.body.head).to.have.property('entityId');
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "address" => "listOfTokenBalance" Address < 40 chars "${addr_0x_caps_without_1_char}" => should return status 400`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfTokenBalance',
                moduleId: 'address',
                params: {
                    entityId: addr_0x_caps_without_1_char,
                    page: 1,
                    size: 10,
                },
            })
            .expect(400)
            .end((err) => {
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "transactions" => "listOfETH" Pagination check (params: {page: 3, size: 100}) => should skip 200 items`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfETH',
                moduleId: 'transactions',
                params: {
                    page: 3,
                    size: 100,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.have.property('head');
                expect(res.body.head.skip).to.be.eq(200);
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "tokens" => "listOfTokens" Pagination check (params: {page: 3, size: 100}) => should skip 200 items`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfTokens',
                moduleId: 'tokens',
                params: {
                    page: 3,
                    size: 100,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.have.property('head');
                expect(res.body.head.skip).to.be.eq(200);
                if (err) return done(err);
                done();
            });
    });

    it(`moduleId "block" => "listOfETH" Block: ${block} pagination check (params: {page: 3, size: 20}) => should skip 40 items`, (done) => {
        api.post(endpoint)
            .set('Accept', 'application/json')
            .send({
                listId: 'listOfETH',
                moduleId: 'block',
                params: {
                    entityId: block,
                    page: 3,
                    size: 20,
                },
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.have.property('head');
                expect(res.body.head.skip).to.be.eq(40);
                if (err) return done(err);
                done();
            });
    });
});
