const ethers = require('ethers');
const config = require("./config");

const ICOTokenAbi = require('./contracts-abi/ICOToken.json').abi;
const ICOTokenBytecode = require('./contracts-abi/ICOToken.json').bytecode;
const ICOTokenName = require('./contracts-abi/ICOToken.json').contractName;
const WhitelistedBasicCrowdsaleAbi = require('./contracts-abi/WhitelistedBasicCrowdsale.json').abi;
const WhitelistedBasicCrowdsaleBytecode = require('./contracts-abi/WhitelistedBasicCrowdsale.json').bytecode;
const WhitelistedBasicCrowdsaleName = require('./contracts-abi/WhitelistedBasicCrowdsale.json').contractName;

const nintyDaysInMinutes = 90 * 24 * 60;
const _startTime = Date.now();
const _endTime = _startTime + nintyDaysInMinutes;
const _defaultRate = 500;
const _wallet = '0xd9995bae12fee327256ffec1e3184d492bd94c31';

const weiInEther = 1000000000000000000;
const _cap = "500000000000000000000";

run = async function() {
    let nodeProvider = getNodeProvider();

    function getNodeProvider() {
        if(config.network === "local"){
            return new ethers.providers.JsonRpcProvider("http://localhost:8545/");
        }
        return new ethers.providers.InfuraProvider(ethers.providers.network[config.network], config.infuraApikey);
    }
    
    let initWallet = async () => {
        const privateKey = "0x7ab741b57e8d94dd7e1a29055646bafde7010f38a900f55bbd7647880faa6ee8";
        return new ethers.Wallet(privateKey, nodeProvider);
    }
    
    let wallet = await initWallet();
    
    let runDeployment = async (wallet, txnToDeploy, contractName) => {
        txnToDeploy.gasLimit = config.gasLimit;
        txnToDeploy.gasPrice = config.gasPrice;
    
        let deployment = await wallet.sendTransaction(txnToDeploy);
    
        await nodeProvider.waitForTransaction(deployment.hash);
        const receipt = await nodeProvider.getTransactionReceipt(deployment.hash);
        
        console.log("Contract Address of " + contractName + ": " + receipt.contractAddress);
    
        return receipt.contractAddress;
    }
    
    let deployICOToken = ethers.Contract.getDeployTransaction(ICOTokenBytecode, ICOTokenAbi);
    let ICOTokenAddress = await runDeployment(wallet, deployICOToken, ICOTokenName);
    
    let deployWhitelistedBasicCrowdsale = ethers.Contract.getDeployTransaction(WhitelistedBasicCrowdsaleBytecode, WhitelistedBasicCrowdsaleAbi, _defaultRate, _wallet, ICOTokenAddress, _startTime, _endTime, _cap);
    let WhitelistedBasicCrowdsaleAddress = await runDeployment(wallet, deployWhitelistedBasicCrowdsale, WhitelistedBasicCrowdsaleName);

    let ICOTokenInstance = new ethers.Contract(ICOTokenAddress, ICOTokenAbi, wallet);
    let ICOTokenTransferOwnerTxn = await ICOTokenInstance.transferOwnership(WhitelistedBasicCrowdsaleAddress);
    console.log("Transfering ownership transaction hash is: ", ICOTokenTransferOwnerTxn.hash);

}

run();

