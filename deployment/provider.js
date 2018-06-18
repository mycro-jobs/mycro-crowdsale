const ethers = require('ethers');
const config = require("./config");

const ICOTokenAbi = require('./contracts-abi/ICOToken.json').abi;
const ICOTokenBytecode = require('./contracts-abi/ICOToken.json').bytecode;
const ICOTokenName = require('./contracts-abi/ICOToken.json').contractName;
const WhitelistedBasicCrowdsaleAbi = require('./contracts-abi/WhitelistedBasicCrowdsale.json').abi;
const WhitelistedBasicCrowdsaleBytecode = require('./contracts-abi/WhitelistedBasicCrowdsale.json').bytecode;
const WhitelistedBasicCrowdsaleName = require('./contracts-abi/WhitelistedBasicCrowdsale.json').contractName;

const nintyDaysInMinutes = 90 * 24 * 60;
let date = Date.now() /100 | 0;
const _startTime = date + 60;
const _endTime = _startTime + nintyDaysInMinutes;
const _defaultRate = 500;
const _wallet = '0xD3f98E0aDC62Bd5EEe94D79d77164043e86dcE5B';

const privateKey = process.argv[2];

const weiInEther = 1000000000000000000;
const _cap = "500000000000000000000";

run = async function() {
    let nodeProvider = getNodeProvider();

    function getNodeProvider() {
        if(config.network === "local"){
            return new ethers.providers.JsonRpcProvider("http://localhost:8545/");
        }
        return new ethers.providers.InfuraProvider(config.network, config.infuraApikey);
    }
    
    let initWallet = async () => {
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

