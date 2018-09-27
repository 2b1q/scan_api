/*
 * Transaction model v.2
 */
const cfg = require('../../config/config'),
    cluster = require('cluster'),
    MAX_SKIP = cfg.store.mongo.max_skip,
    moment = require('moment'),
    dbquery = require('./db_query'),
    ethproxy = require('../../node_interaction/eth-proxy-client'),
    cols = cfg.store.cols,
    eth_col = cols.eth,
    token_col = cols.token,
    data_col = cols.tx_data,
    pending_col = cols.pending_tx,
    c = cfg.color,
    ETHDCM = cfg.constants.ethdcm,
    TOKENDCM = cfg.constants.tokendcm,
    FEEDCM = cfg.constants.feedcm;

// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.yellow}[transaction model]${c.red} > ${c.green}[${endpoint}] ${
        c.white
    }`;

/** GetLastTransactions */
const GetLastTransactions = async ({ collection, size, offset }) => {
    console.log(wid_ptrn(`GetLastTransactions ${collection}`));
    const selector = {}; // last tnx selector
    const sort = { block: -1 };
    const fields =
        collection === eth_col
            ? {
                  hash: 1,
                  block: 1,
                  addrfrom: 1,
                  addrto: 1,
                  isotime: 1,
                  type: 1,
                  status: 1,
                  error: 1,
                  iscontract: 1,
                  isinner: 1,
                  value: 1,
                  txfee: 1,
                  gasused: 1,
                  gascost: 1,
                  tokendcm: 1,
              }
            : {
                  hash: 1,
                  block: 1,
                  addrfrom: 1,
                  addrto: 1,
                  isotime: 1,
                  type: 1,
                  status: 1,
                  error: 1,
                  iscontract: 1,
                  isinner: 1,
                  value: 1,
                  txfee: 1,
                  gasused: 1,
                  gascost: 1,
                  tokenaddr: 1,
                  tokenname: 1,
                  tokensmbl: 1,
                  tokendcm: 1,
                  tokentype: 1,
              };

    let count, db_col;
    /** safe db query*/
    try {
        db_col = await dbquery.getcol(collection);
        count = await db_col.count(selector);
    } catch (e) {
        return {
            head: {},
            rows: [],
        };
    }

    return new Promise((resolve) =>
        db_col
            .find(selector, { fields }, { allowDiskUse: true }) // allowDiskUse lets the server know if it can use disk to store temporary results for the aggregation (requires mongodb 2.6 >)
            .sort(sort)
            .skip(offset)
            .limit(size)
            .toArray((err, docs) => {
                if (err) resolve(false);
                resolve({
                    head: {
                        totalEntities: count > MAX_SKIP ? MAX_SKIP : count,
                        offset: offset,
                        size: size,
                    },
                    rows: docs,
                });
            })
    );
};

/** Get transaction details*/
// const GetTxDetails = async (hash) => await dbquery.TxDetails(hash, { hash: hash });
const GetTxDetails = async (hash) => {
    console.log(wid_ptrn(`GetTxDetails ${hash}`));
    const selector = { hash: hash };
    const tx_fields = {
        id: 1,
        hash: 1,
        block: 1,
        addrFrom: 1,
        addrTo: 1,
        time: 1,
        type: 1,
        status: 1,
        error: 1,
        isContract: 1,
        value: 1,
        txFee: 1,
        gasUsed: 1,
        gasCost: 1,
    };
    const data_fields = {
        data: 1,
        // rcplogs: 1, // not necessary yet
    };
    // DB queries
    const data_p = dbquery.findOne(data_col, selector, data_fields); // lookup tx data
    const ethTx_p = dbquery.find(eth_col, selector, tx_fields); // lookup ETH txs in DB
    const tokenTx_p = dbquery.find(token_col, selector); // lookup token txs in DB
    const pendingTx_p = dbquery.findOne(pending_col, selector); // lookup pending tx in DB

    return await Promise.all([ethTx_p, tokenTx_p, data_p, pendingTx_p])
        .then(async ([eth_txs, token_txs, data, pending_tx]) => {
            let response = {};
            if (!Array.isArray(eth_txs)) response.empty = true; // set no data flag
            // if no txs in DB => ask ETH node
            if (response.hasOwnProperty('empty')) {
                console.log(wid_ptrn(`ask for a pending transaction 0x${hash}`));
                const tx = !pending_tx.hash ? await ethproxy.getPendingTransaction(hash).catch(() => null) : pending_tx;
                if (tx) {
                    delete response.empty; // unset no data flag
                    response.head = {
                        id: tx._id ? tx._id : null,
                        hash: tx.hash,
                        block: tx.block || 0,
                        addrFrom: tx.addrfrom,
                        addrTo: tx.addrto,
                        time: tx.isotime ? tx.isotime : moment(),
                        type: 'tx', // тип транзакции. Возможны варианты: [tx]
                        status: -1, // Статус = -1. Результат транзакции не определен.
                        error: '',
                        isContract: 0, // 0 - обычная транзакция, 1 - создание транзакции
                        value: { val: tx.value === null || tx.value === undefined ? null : tx.value, dcm: ETHDCM },
                        txFee: { val: '0', dcm: FEEDCM }, // Всегда 0. Не известно сколько газа потрачено.
                        gasUsed: 0, // Всегда 0. Не известно сколько газа потрачено.
                        gasCost: tx.gascost, // стоимость газа в ETH
                        gasLimit: tx.gaslimit ? tx.gaslimit : null,
                        data: tx.data, // данные, которые были отправлены в транзакцию. В бинарном виде
                    };
                    response.rows = [];
                }
            } else {
                response.rows = [];
                eth_txs.forEach((eth_tx) => {
                    let tx = Object({
                        id: eth_tx._id,
                        hash: eth_tx.hash,
                        block: eth_tx.block,
                        addrFrom: eth_tx.addrfrom,
                        addrTo: eth_tx.addrto,
                        time: eth_tx.isotime,
                        type: eth_tx.type,
                        status: eth_tx.status,
                        error: eth_tx.error,
                        isContract: eth_tx.iscontract,
                        value: { val: eth_tx.value, dcm: ETHDCM },
                        txFee: { val: eth_tx.txfee, dcm: FEEDCM },
                        gasUsed: eth_tx.gasused,
                        gasCost: eth_tx.gascost,
                        data: eth_tx.hash === data.hash ? data.data : undefined,
                    });
                    // ETH head
                    if (tx.type === 'tx') response.head = tx;
                    else response.rows.push(tx);
                });
                // token txs
                Array.isArray(token_txs) &&
                    token_txs.forEach((token_tx) =>
                        response.rows.push(
                            Object({
                                id: token_tx._id,
                                hash: token_tx.hash,
                                block: token_tx.block,
                                addrFrom: token_tx.addrfrom,
                                addrTo: token_tx.addrto,
                                time: token_tx.isotime,
                                type: token_tx.type,
                                status: token_tx.status,
                                error: token_tx.error,
                                isContract: token_tx.iscontract,
                                isInner: token_tx.isinner,
                                value: { val: token_tx.value, dcm: token_tx.tokendcm || TOKENDCM },
                                txFee: { val: token_tx.txfee, dcm: FEEDCM },
                                tokenAddr: token_tx.tokenaddr,
                                tokenName: token_tx.tokenname,
                                tokenSmbl: token_tx.tokensmbl,
                                tokenType: token_tx.tokentype,
                                gasUsed: token_tx.gasused,
                                gasCost: token_tx.gascost,
                            })
                        )
                    );
            }
            return response;
        })
        .catch((e) => e);
};

module.exports = {
    lastTransactions: GetLastTransactions, // API v.2 Get TxDetails
    details: GetTxDetails, // API v.2 Get TxDetails
};
