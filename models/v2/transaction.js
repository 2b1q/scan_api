/*
 * Transaction model v.2
 */
const cfg = require('../../config/config'),
    cluster = require('cluster'),
    MAX_SKIP = cfg.store.mongo.max_skip,
    moment = require('moment'),
    dbquery = require('./db_query'),
    eth_func = require('../../ether/functions'),
    eth_col = cfg.store.cols.eth,
    token_col = cfg.store.cols.token,
    c = cfg.color;

// worker id pattern
const wid_ptrn = (endpoint) =>
    `${c.green}worker[${cluster.worker.id}]${c.red}[API v.2]${c.yellow}[transaction model]${c.red} > ${c.green}[${endpoint}] ${c.white}`;

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

    const db_col = await dbquery.getcol(collection);
    let count = await db_col.count(selector);

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
                        totalEntities: count,
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
        data: 1,
    };
    // DB queries
    const ethTx_p = await dbquery.find(eth_col, selector, tx_fields);
    const tokenTx_p = await dbquery.find(token_col, selector);

    return await Promise.all([ethTx_p, tokenTx_p])
        .then(async ([eth_txs, token_txs]) => {
            let response = {};
            if (!Array.isArray(eth_txs)) response.empty = true;
            // set no data flag
            else var [eth_tx] = eth_txs; // use var instead of let
            // if no txs in DB => ask ETH node
            if (response.hasOwnProperty('empty')) {
                console.log(`======= ask ETH node for pending transaction ${hash}=======`);
                const tx = await eth_func.providerEthProxy('tx', { hash: '0x' + hash });
                if (tx) {
                    console.log(`Pending tx: \n${tx}`);
                    delete response.empty; // unset no data flag
                    response.head = {
                        id: '',
                        hash: tx.hash,
                        block: 0,
                        addrFrom: tx.from,
                        addrTo: tx.to,
                        time: moment(), // время транзакции = текущее время. Номер блока не определен.
                        type: 'tx', // тип транзакции. Возможны варианты: [tx]
                        status: -1, // Статус = -1. Результат транзакции не определен.
                        isContract: 0, // 0 - обычная транзакция, 1 - создание транзакции
                        value: parseInt(tx.value, 10).toString(16),
                        txFee: '0', // Всегда 0. Не известно сколько газа потрачено.
                        dcm: 18,
                        gasUsed: 0, // Всегда 0. Не известно сколько газа потрачено.
                        gasCost: parseInt(tx.gasPrice), // стоимость газа в ETH
                        data: tx.input, // данные, которые были отправлены в транзакцию. В бинарном виде
                    };
                    response.rows = [];
                }
            } else {
                // ETH head
                response.head = {
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
                    value: eth_tx.value,
                    txFee: eth_tx.txfee,
                    dcm: 18,
                    gasUsed: eth_tx.gasused,
                    gasCost: eth_tx.gascost,
                    data: eth_tx.data,
                };
                // token txs
                if (Array.isArray(token_txs)) {
                    response.rows = token_txs.map((token) =>
                        Object({
                            id: token._id,
                            hash: token.hash,
                            block: token.block,
                            addrFrom: token.addrfrom,
                            addrTo: token.addrto,
                            time: token.isotime,
                            type: token.type,
                            status: token.status,
                            error: token.error,
                            isContract: token.iscontract,
                            isInner: token.isinner,
                            value: token.value,
                            tokenAddr: token.tokenaddr,
                            tokenName: token.tokenname,
                            tokenSmbl: token.tokensmbl,
                            tokenType: token.tokentype,
                            txFee: token.txfee,
                            dcm: token.tokendcm,
                            gasUsed: token.gasused,
                            gasCost: token.gascost,
                        })
                    );
                } else response.rows = [];
            }
            return response;
        })
        .catch((e) => e);
};

module.exports = {
    lastTransactions: GetLastTransactions, // API v.2 Get TxDetails
    details: GetTxDetails, // API v.2 Get TxDetails
};
