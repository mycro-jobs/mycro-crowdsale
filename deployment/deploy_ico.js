const etherlime = require('etherlime');
const config = require("./config");

const ICOToken = require('../build/ICOToken.json');
const WhitelistedBasicCrowdsale = require('../build/WhitelistedBasicCrowdsale.json');
const MultiSigWallet = require('../build/MultiSigWalletWithDailyLimit.json');
const deployerPrivateKey = "9C854BD14857DD1F107ECB94E1AEEAA8E9538E3DC41D082D5FE0E452E87A2F28";

function getFutureTimestamp(plusMinutes) {
    let date = new Date();
    date.setMinutes(date.getMinutes() + plusMinutes);
    let timestamp =+ date;
    timestamp = Math.ceil(timestamp / 1000);
    return timestamp;
}

const rate = 600;
const crowdsaleDuration = 84 * 24 * 60 * 60; // 90 days
const openingTime = 1555891200; // 22 April 2019 00:00 h
const closingTime = openingTime + crowdsaleDuration;


// Set up multiSig wallet
// TODO !!!!! to be updated before deploy!!!!
const ANDRE_ACCOUNT_1 = "0xd9995bae12fee327256ffec1e3184d492bd94c31";
const ANDRE_ACCOUNT_2 = "0xFeD1564d6F5cE55166DE5deBD7bD43c2902a92bd";
const LIME_CHAIN_ACCOUNT = "0x0e0e86a4622F679a45baE10C194f1927ad79e979";
const allAccounts = [ANDRE_ACCOUNT_1, ANDRE_ACCOUNT_2, LIME_CHAIN_ACCOUNT];
const requiredConfirmations = 2;
const dailyLimit = 0;

// TODO set correct gasPrice on deployment
const defaultConfigs = {
    gasPrice: 20200000000,
    gasLimit: 4700000
}


let ICOTokenInstance;
let MultiSigWalletInstance;
let CrowdsaleInstance;


const deploy = async (network, secret) => {

    if (config.network === 'local') {

        const deployer = new etherlime.EtherlimeGanacheDeployer();
        deployer.defaultOverrides = defaultConfigs;

        ICOTokenInstance = await deployer.deploy(ICOToken)

        MultiSigWalletInstance = await deployer.deploy(MultiSigWallet, {}, allAccounts, requiredConfirmations, dailyLimit);

        CrowdsaleInstance = await deployer.deploy(WhitelistedBasicCrowdsale, {}, rate, MultiSigWalletInstance.contractAddress, ICOTokenInstance.contractAddress, openingTime, closingTime);

        await CrowdsaleInstance.contract.transferOwnership(MultiSigWalletInstance.contractAddress);

        await ICOTokenInstance.contract.transferOwnership(CrowdsaleInstance.contractAddress);


    } else {
        const deployer = new etherlime.InfuraPrivateKeyDeployer(deployerPrivateKey, config.network, config.infuraApikey, defaultConfigs)

        ICOTokenInstance = await deployer.deploy(ICOToken)

        MultiSigWalletInstance = await deployer.deploy(MultiSigWallet, {}, allAccounts, requiredConfirmations, dailyLimit);
        
        CrowdsaleInstance = await deployer.deploy(WhitelistedBasicCrowdsale, {}, rate, MultiSigWalletInstance.contractAddress, ICOTokenInstance.contractAddress, openingTime, closingTime);

        let tokenOwnershipTransaction = await ICOTokenInstance.contract.transferOwnership(CrowdsaleInstance.contractAddress);
        await ICOTokenInstance.verboseWaitForTransaction(tokenOwnershipTransaction, "Transfer Ownership of Token")
        

        //TODO manually after deployment of the contracts
        // const ICOTokenInstanceAddress = ''
        // const MultiSigWalletInstanceAddress = ''
        // const CrowdsaleInstanceAddress = ''

        // // scripts to add andre_wallet_1
        // CrowdsaleInstance = await deployer.wrapDeployedContract(WhitelistedBasicCrowdsale, CrowdsaleInstanceAddress);
        // const minterOneTransaction = await CrowdsaleInstance.addMinter(''); //andre_wallet_1
        // await CrowdsaleInstance.verboseWaitForTransaction(minterOneTransaction, 'Add first minter');


        // // scripts to add andre_wallet_2
        // const minterTwoTransaction = await CrowdsaleInstance.addMinter(''); //andre_wallet_2
        // await CrowdsaleInstance.verboseWaitForTransaction(minterTwoTransaction, 'Add second minter');

        // // scripts to transfer the ownership of the Crowdsale to multiSig wallet
        // const transferTransaction = await CrowdsaleInstance.contract.transferOwnership(MultiSigWalletInstanceAddress);
        // const result = await CrowdsaleInstance.verboseWaitForTransaction(transferTransaction, 'Transfer Ownership');
    
    }

}

module.exports = {
    deploy
}