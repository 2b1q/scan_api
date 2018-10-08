/*
 REST API v.2
 transaction controller
 */
const ethproxy = require('../../node_interaction/eth-proxy-client'),
    db = require('../../libs/db'),
    logger = require('../../utils/logger')(module),
    moment = require('moment'),
    cfg = require('../../config/config'),
    ETHDCM = cfg.constants.ethdcm,
    cols = cfg.store.cols,
    pending_col = cols.pending_tx,
    check = require('../../utils/checker').cheker();

/** Check Tx parameters */
const checkTxParams = (req, res) => {
    let params = req.query || {};
    // params destructing
    let { offset, size } = params;
    offset = parseInt(offset); // convert to Number
    size = parseInt(size); // convert to Number
    // check params existing
    if (!offset && offset !== 0) {
        res.status(400).json(check.get_msg().no_offset);
        return false;
    } else if (!size) {
        res.status(400).json(check.get_msg().no_size);
        return false;
    }
    return check.normalize_pagination({}, size, offset);
};

/** findQuery polymorphic */
const find = (collection, query, skip, limit, sort) =>
    new Promise(
        (resolve, reject) =>
            db
                .get()
                .then((db_instance) => {
                    if (!db_instance) resolve();
                    (sort &&
                        db_instance
                            .collection(collection)
                            .find(query)
                            .sort(sort)
                            .skip(skip)
                            .limit(limit)
                            .toArray((err, txs) => {
                                if (err) reject(err); // handle error on query crash
                                resolve(txs);
                            })) ||
                        db_instance
                            .collection(collection)
                            .find(query)
                            .skip(skip)
                            .limit(limit)
                            .toArray((err, txs) => {
                                if (err) reject(err); // handle error on query crash
                                resolve(txs);
                            });
                })
                .catch((e) => reject(e)) // handle error if no DB instance
    );

/** GetLast Tokens Transactions endpoint */
const NodeStatus = async (req, res) => {
    try {
        let response = await ethproxy.getStatus();
        console.log(response);
        res.json({ data: response });
    } catch (e) {
        logger.error(e);
        return { error: e };
    }
};

/** pendingTx endpoint */
const pendingTx = (req, res) => {
    let options = checkTxParams(req, res);
    options &&
        find(pending_col, {}, options.offset, options.size, { isotime: -1 })
            .then((txs) =>
                res.json({
                    head: {
                        offset: options.offset,
                        size: options.size,
                        updateTime: moment(),
                    },
                    rows: txs.map((tx) =>
                        Object({
                            id: tx._id,
                            hash: tx.hash,
                            addrFrom: tx.addrfrom,
                            addrTo: tx.addrto,
                            time: tx.isotime,
                            value: { val: tx.value, dcm: ETHDCM },
                            gasCost: tx.gascost,
                            gasLimit: tx.gaslimit,
                        })
                    ),
                })
            )
            .catch((e) => {
                logger.error(e);
                res.json(check.get_msg().not_found);
            });
};

module.exports = {
    NodeStatus: NodeStatus, // [HTTP REST] (API v.2) GetLast Tokens Transactions endpoint
    pending: pendingTx,
};
