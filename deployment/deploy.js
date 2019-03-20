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

const rate = 800;
const crowdsaleDuration = 116 * 24 * 60 * 60; // 116 days
const openingTime = getFutureTimestamp(1); // 1 minutes from now
const closingTime = openingTime + crowdsaleDuration;


// Set up multiSig wallet
// !!! to be updated before deploy!!!!
const account1 = "0x0e0e86a4622F679a45baE10C194f1927ad79e979";
const account2 = "0xFeD1564d6F5cE55166DE5deBD7bD43c2902a92bd";
const allAccounts = [account1, account2];
const requiredConfirmations = 2;
const dailyLimit = 0;


const defaultConfigs = {
    gasPrice: 20200000000,
    gasLimit: 4700000
}

const deploy = async (network, secret) => {

    if (config.network === 'local') {

        const deployer = new etherlime.EtherlimeGanacheDeployer();
        deployer.defaultOverrides = defaultConfigs;

        const ICOTokenInstance = await deployer.deploy(ICOToken);

        await ICOTokenInstance.contract.pause();

        const MultiSigWalletInstance = await deployer.deploy(MultiSigWallet, {}, allAccounts, requiredConfirmations, dailyLimit);

        const CrowdsaleInstance = await deployer.deploy(WhitelistedBasicCrowdsale, {}, rate, MultiSigWalletInstance.contractAddress, ICOTokenInstance.contractAddress, openingTime, closingTime);

        await CrowdsaleInstance.contract.transferOwnership(MultiSigWalletInstance.contractAddress);

        await ICOTokenInstance.contract.transferOwnership(CrowdsaleInstance.contractAddress);


    } else {
        const deployer = new etherlime.InfuraPrivateKeyDeployer(deployerPrivateKey, config.network, config.infuraApikey, defaultConfigs)

        const ICOTokenInstance = await deployer.deploy(ICOToken)

        await ICOTokenInstance.contract.pause()

        const MultiSigWalletInstance = await deployer.deploy(MultiSigWallet, {}, allAccounts, requiredConfirmations, dailyLimit);

        const CrowdsaleInstance = await deployer.deploy(WhitelistedBasicCrowdsale, {}, rate, MultiSigWalletInstance.contractAddress, ICOTokenInstance.contractAddress, openingTime, closingTime);

        const transferTransaction = await CrowdsaleInstance.contract.transferOwnership(MultiSigWalletInstance.contractAddress);

        const result = await CrowdsaleInstance.verboseWaitForTransaction(transferTransaction, 'Transfer Ownership');
        
        await ICOTokenInstance.contract.transferOwnership(CrowdsaleInstance.contractAddress);
    
    }

}

module.exports = {
    deploy
}