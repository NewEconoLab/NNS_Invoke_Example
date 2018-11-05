
class nnstools
{
    /**
     * 将域名字符串转换为 hash 主要用于根域名的转换
     * @param {string} domain 域名
     */
    nameHash(domain)
    {
        const domain_bytes = ThinNeo.Helper.String2Bytes(domain);
        const hashd = Neo.Cryptography.Sha256.computeHash(domain_bytes);
        return new Neo.Uint256(hashd);
    }

    /**
     * 父域名加上子域名得到 域名 hash 例： test.neo - neo(父域名) test(子域名)
     * @param {string} roothash 根域名
     * @param {string} subdomain 子域名
     * @returns {Neo.Uint256} 域名hash
     */
    nameHashSub(roothash, subdomain)
    {
        const bs = ThinNeo.Helper.String2Bytes(subdomain);
        if (bs.length == 0)
            return roothash;

        const domain = Neo.Cryptography.Sha256.computeHash(bs);
        const domain_bytes = new Uint8Array(domain);
        const domainUint8arry = domain_bytes.concat(new Uint8Array(roothash.bits.buffer));

        const sub = Neo.Cryptography.Sha256.computeHash(domainUint8arry);
        return new Neo.Uint256(sub);
    }

    /**
     * 返回一组域名的最终hash
     * @param {string[]} domainarray 域名倒叙的数组
     */
    nameHashArray(domainarray)
    {
        domainarray.reverse();
        var hash = this.nameHash(domainarray[ 0 ]);
        for (var i = 1; i < domainarray.length; i++)
        {
            hash = this.nameHashSub(hash, domainarray[ i ]);
        }
        return hash;
    }

    /**
     * 将域名字符串映射成地址
     * @param {string} domain 域名 支持二级或一级 test2.test1.test || test1.test 
     */
    async resolveDomain(domain)
    {
        var arr = domain.split('.');
        if(arr.length===3)
        {
            const roothash = this.nameHash(arr[2]);
            const namehash = this.nameHashSub(roothash,arr[1]);
            const addr = await this.resolveData(namehash,arr[0]);
            return addr;
        }
        else if(arr.length===2)
        {
            const roothash = this.nameHash(arr[1]);
            const namehash = this.nameHashSub(roothash,arr[0]);
            this.resolveData(namehash,"");
            return addr;
        }
        else
        {
            throw new Error("This domain name is not supported for the time bein.");
        }
    }

    /**
     * 映射域名
     * @param {Neo.Uint256} namehash 一级域名加上根域名得到的 namehash test111.neo
     * @param {string} sld 二级域名字符串 test
     */
    async resolveData(namehash,sld)
    {
        var sb = new ThinNeo.ScriptBuilder();
        sb.EmitParamJson([
            "(str)addr",
            "(hex256)" + namehash,
            "(str)" + sld
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
            if (state.includes("HALT, BREAK"))
            {
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


