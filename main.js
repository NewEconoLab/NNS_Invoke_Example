// import { nnstools } from "./nnstool";
async function main() {
    const nns = new nnstools();
    // test.test111.neo
    // const roothash = nns.nameHash("neo");
    // const namehash = nns.nameHashSub(roothash,"test111");
    // const addr = await nns.resolveData(namehash,"test");
    const addr = await nns.resolveDomain("test.test111.neo")
    alert(addr);
}

main();