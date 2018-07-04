let ethProxy = require('./proxy').getInstance();
let erc20ABI = require('./abi').erc20ABI;

async function getAddrBalance(addr) {
    let provider = await ethProxy.getBestProvider();
    return provider
      ? provider.eth.getBalance(addr)
      : -1
}

function getTokenBalance(walletAddr, tokenAddr) {
    let provider = ethProxy.getBestProvider();
    if (provider) {
        let erc20 = new provider.eth.Contract(erc20ABI, tokenAddr);
        return erc20.methods.balanceOf(walletAddr).call()
    } else {
        return -1
    }
}


const ethBalance = async (req, res) =>
    res.json( await getAddrBalance("0000000000000000000000000000000000000000"));

const tokenBalance = async (req, res) =>
    res.json( await getTokenBalance("c0c91f8e5718658ebcc31c0f57d2726be15901a8", "7c63a5f86740501599fe9a9f5e2f7246374b67e2"));

module.exports = {
    getAddrBalance: getAddrBalance,
    ethBalance: ethBalance,
    tokenBalance: tokenBalance,
};


/*
func RcpAddrBalance(addr string) (string, error) {
	ctx := context.Background()
	byteAddr, _ := hex.DecodeString(addr)
	hashAddr := common.BytesToAddress(byteAddr)

	client := eth_proxy.GetBestPoint()
	if client == nil {
		return "0", errors.New("Temporally problems")
	}
	amount, err := client.BalanceAt(ctx, hashAddr, nil)

	if err != nil {
		hlog.SaveLog("HTTP", hlog.ERROR, "RcpAddrBalance = ", err)
		return "0", err
	} else {
		hlog.SaveLog("HTTP", hlog.MINOR, "RcpAddrBalance = ", amount)
		return fmt.Sprintf("%x", amount), nil
	}
}

func GetAddrTokenBalance(addr string, skip int, size int) ([]structs.TokenHeader, int) {
	clearAddr := CleanHex(Cut0x(addr))

	tokenCol := conf.GetTokenCol()
	tokenTxnCol := conf.GetTokenTxnCol()
	tokenCacheCol := conf.GetERC20CacheCol()

	lastCachedBlock := int64(0)

	allTokens := make([]structs.TokenHeader, 0)
	allTokensMap := make(map[string]structs.TokenHeader)
	cacheTokensMap := make(map[string]structs.TokenHeader)
	lastTokensMap := make(map[string]structs.TokenHeader)

	for pTry:=0; pTry < 5; pTry +=1 {
		var cachedTokenBlocks []structs.AddrERC20TokenCache
		err := tokenCacheCol.Find(bson.M{"addr": clearAddr, "lastblock": bson.M{"$gt": 0}}).All(&cachedTokenBlocks)
		if err != nil || len(cachedTokenBlocks) == 0 {
			time.Sleep(50*time.Millisecond)
		} else {
			for _, c := range cachedTokenBlocks{
				if c.LastBlock > lastCachedBlock{
					lastCachedBlock = c.LastBlock
				}
			}
			break
		}
	}

	cachedTokensList := make([]structs.AddrERC20TokenCache, 0)
	tokenCacheCol.Find(bson.M{"addr": clearAddr, "lastblock":0}).All(&cachedTokensList)
	for _, a := range cachedTokensList {
		tknHead := structs.TokenHeader{
			Addr: a.TokenAddr,
			Name: a.TokenName,
			Smbl: a.TokenSmbl,
			Dcm: a.TokenDcm,
			Type: structs.STD_ERC20,
			Balance: a.Value,
			Icon: "/api/token/icon/" + a.TokenAddr,
			Dynamic: 0,
		}
		cacheTokensMap[a.TokenAddr] = tknHead
		allTokensMap[a.TokenAddr] = tknHead
	}

	// danger place: could be non-cached address with lot of transactions !
	// need here a way to init cache for that address or limit by tx count
	lastTokens := make([]string, 0)
	tokenTxnCol.Find(bson.M{
		"$or": []bson.M{
			{"addrto": clearAddr},
			{"addrfrom": clearAddr},
		},
		"block": bson.M{"$gt": lastCachedBlock},
		"tokentype": structs.STD_ERC20,
	}).Distinct("tokenaddr", &lastTokens)

	for _, a := range lastTokens {
		var tknHead structs.TokenHeader
		err := tokenCol.Find(bson.M{"addr": a}).One(&tknHead)
		if err == nil {
			tknHead.Icon = "/api/token/icon/" + tknHead.Addr
			tknHead.Dynamic = 0
			tknHead.Balance = "*"
			lastTokensMap[tknHead.Addr] = tknHead
			allTokensMap[tknHead.Addr] = tknHead
		}
	}

	for _, a := range allTokensMap {
		allTokens = append(allTokens, a)
	}

	sort.Slice(allTokens, func(i, j int) bool {return allTokens[i].Addr < allTokens[j].Addr})
	totalTokens := len(allTokens)

	fromI := skip
	toI := skip + size
	if fromI < 0 {
		fromI = 0
	}
	if fromI > totalTokens {
		fromI = totalTokens
	}
	if toI < 0 {
		toI = 0
	}
	if toI > totalTokens {
		toI = totalTokens
	}
	if fromI > toI {
		toI = fromI
	}

	part := allTokens[fromI:toI]

	for i := range part{
		if part[i].Balance == "*" {
			balance, err := tokenBalance(clearAddr, part[i].Addr)
			if err == nil {
				part[i].Balance = balance
			} else {
				part[i].Balance = ""
			}
		}
	}

	return part, len(allTokens)
}

func tokenBalance(walletAddr string, tokenAddr string) (string, error) {
	ethClient := eth_proxy.GetBestPoint()

	byteAddrTkn, _ := hex.DecodeString(tokenAddr)
	hashAddrTkn := common.BytesToAddress(byteAddrTkn)

	byteAddrWlt, _ := hex.DecodeString(walletAddr)
	hashAddrWlt := common.BytesToAddress(byteAddrWlt)

	opts := new(bind.CallOpts)
	opts.Pending = true

	erc20, err := contracts.NewErc20String(hashAddrTkn, ethClient)
	if err == nil {
		value, err := erc20.BalanceOf(opts, hashAddrWlt)
		if err == nil {
			return ToHexBig(value), nil
		} else {
			hlog.SaveLog(MN, hlog.ERROR, "Can't get Balance Of token ", tokenAddr, " : ", err)
			return "", err
		}
	} else {
		hlog.SaveLog(MN, hlog.ERROR, "Can't init ERC20 contract for ", tokenAddr, " | ", err)
		return "", err
	}
}
*/