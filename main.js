async function main() {
    let nns = new nnstools();
    let roothash = nns.nameHash("neo");
    let namehash = nns.nameHashSub(roothash,"qingmingzi");
    let addr = await nns.resolveData(namehash);
    alert(addr);
}

let nnstools = class
{
    nameHash(domain)
    {
        var domain_bytes = ThinNeo.Helper.String2Bytes(domain);
        var hashd = Neo.Cryptography.Sha256.computeHash(domain_bytes);
        return new Neo.Uint256(hashd);
    }

    nameHashSub(roothash, subdomain)
    {
        var bs = ThinNeo.Helper.String2Bytes(subdomain);
        if (bs.length == 0)
            return roothash;

        var domain = Neo.Cryptography.Sha256.computeHash(bs);
        var domain_bytes = new Uint8Array(domain);
        var domainUint8arry = domain_bytes.concat(new Uint8Array(roothash.bits.buffer));

        var sub = Neo.Cryptography.Sha256.computeHash(domainUint8arry);
        return new Neo.Uint256(sub);
    }

    async resolveData(namehash)
    {
        var sb = new ThinNeo.ScriptBuilder();
        sb.EmitParamJson([
            "(str)addr",
            "(hex256)" + namehash,
            "(str)" + ""
        ]);
        sb.EmitPushString("resolve");
        sb.EmitAppCall(Neo.Uint160.parse("348387116c4a75e420663277d9c02049907128c7"));
        var data = sb.ToArray();
        let wwwtools = new WWW();
        let res = await wwwtools.rpc_getInvokescript(data)
        let addr = "";
        try
        {
            var state = res.state;
            // info2.textContent = "";
            if (state.includes("HALT, BREAK"))
            {
                // info2.textContent += "Succ\n";
                var stack = res.stack;
                //find name 他的type 有可能是string 或者ByteArray
                if (stack[ 0 ].type == "ByteArray")
                {
                    if (stack[ 0 ].value != "00")
                    {
                        let value = (stack[ 0 ].value).hexToBytes();
                        addr = ThinNeo.Helper.Bytes2String(value);
                    }
                }
            }
        }
        catch (e)
        {
            console.log(e);
        }
        return addr;
    }
}



let WWW = class
{
    constructor()
    {
        this.api="https://api.nel.group/api/mainnet"
        this.apiaggr = "https://apiwallet.nel.group/api/mainnet";
    }
    makeRpcUrl(url, method, ..._params)
    {
        if (url[ url.length - 1 ] != '/')
            url = url + "/";
        var urlout = url + "?jsonrpc=2.0&id=1&method=" + method + "&params=[";
        for (var i = 0; i < _params.length; i++)
        {
            urlout += JSON.stringify(_params[ i ]);
            if (i != _params.length - 1)
                urlout += ",";
        }
        urlout += "]";
        return urlout;
    }
    makeRpcPostBody(method, ..._params)
    {
        var body = {};
        body[ "jsonrpc" ] = "2.0";
        body[ "id" ] = 1;
        body[ "method" ] = method;
        var params = [];
        for (var i = 0; i < _params.length; i++)
        {
            params.push(_params[ i ]);
        }
        body[ "params" ] = params;
        return body;
    }
    
    async rpc_getInvokescript(scripthash)
    {
        var str = this.makeRpcUrl(this.api, "invokescript", scripthash.toHexString());
        var result = await fetch(str, { "method": "get" });
        var json = await result.json();
        if (json[ "result" ] == null)
            return null;
        var r = json[ "result" ][ 0 ]
        return r;
    }
}

main();