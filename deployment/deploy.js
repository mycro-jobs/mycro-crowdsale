const etherlime = require('etherlime');
const config = require("./config");

const ICOToken = require('../build/ICOToken.json');
const WhitelistedBasicCrowdsale = require('../build/WhitelistedBasicCrowdsale.json');
const MultiSigWallet = require('../build/MultiSigWalletWithDailyLimit.json');
const deployerPrivateKey = ""; // TODO add key

function getFutureTimestamp(plusMinutes) {
    let date = new Date();
    date.setMinutes(date.getMinutes() + plusMinutes);
    let timestamp =+ date;
    timestamp = Math.ceil(timestamp / 1000);
    return timestamp;
}

const rate = 600;
const crowdsaleDuration = 84 * 24 * 60 * 60; // Till 15th May + 60 days = 84days
const openingTime = 1555891200; // 22 April 2019 00:00 h
const closingTime = openingTime + crowdsaleDuration;


// Set up multiSig wallet
// TODO !!!!! to be updated before deploy!!!!
const ANDRE_ACCOUNT_1 = "0xE7CCfa39383C0c9D1bCd0840A427EB0321c28ACe"; // Ledger - Multisig and could create tokens
const ANDRE_ACCOUNT_2 = "0x1005890c9FF46390C683C9A26a96D83a72bCD93E"; // MEW Connect - Multisig
const LIME_CHAIN_ACCOUNT = "0xc3ac5cf22bf80982f06787e9c2a8a520abc857be"; // LimeChain Wallet - Multisig
const Kris_account = "0x6eDf76FD16Bb290A544fDc14fBB4b403D1DEeD9f"; // Kris wallet - multisig
const allAccounts = [ANDRE_ACCOUNT_1, ANDRE_ACCOUNT_2, LIME_CHAIN_ACCOUNT, Kris_account];
const requiredConfirmations = 2;
const dailyLimit = 0;

// TODO set correct gasPrice on deployment
const defaultConfigs = {
    gasPrice: 4000000000, // 4 gwei
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
        const deployer = new etherlime.InfuraPrivateKeyDeployer(deployerPrivateKey, config.network, config.infuraApikey, defaultConfigs);

        // ICOTokenInstance = await deployer.deploy(ICOToken);
        //
        // MultiSigWalletInstance = await deployer.deploy(MultiSigWallet, {}, allAccounts, requiredConfirmations, dailyLimit);
        //
        // CrowdsaleInstance = await deployer.deploy(WhitelistedBasicCrowdsale, {}, rate, MultiSigWalletInstance.contractAddress, ICOTokenInstance.contractAddress, openingTime, closingTime);
        //
        // let tokenOwnershipTransaction = await ICOTokenInstance.contract.transferOwnership(CrowdsaleInstance.contractAddress, defaultConfigs);
        // await ICOTokenInstance.verboseWaitForTransaction(tokenOwnershipTransaction, "Transfer Ownership of Token")
        

        //TODO manually after deployment of the contracts
        const ICOTokenInstanceAddress = '0x50987e6BE405ebac691f8988304562E5efc3B2ea';
        const MultiSigWalletInstanceAddress = '0xf603B0226B2901464E6833d1424340547Ac0bcE3';
        const CrowdsaleInstanceAddress = '0x9E2De29Ba408F7aD0a014164E5FCA0d2d5A45B1a';

        // scripts to add andre_wallet_1
        CrowdsaleInstance = await deployer.wrapDeployedContract(WhitelistedBasicCrowdsale, CrowdsaleInstanceAddress);
        // const minterOneTransaction = await CrowdsaleInstance.contract.addMinter(ANDRE_ACCOUNT_1, defaultConfigs); // Andre ledger wallet
        // await CrowdsaleInstance.verboseWaitForTransaction(minterOneTransaction, 'Add first minter');


        // scripts to add andre_wallet_2
        const minterTwoTransaction = await CrowdsaleInstance.contract.addMinter(MultiSigWalletInstanceAddress, defaultConfigs);
        await CrowdsaleInstance.verboseWaitForTransaction(minterTwoTransaction, 'Add second minter'); // Multisig wallet address

        // scripts to transfer the ownership of the Crowdsale to multiSig wallet
        const transferTransaction = await CrowdsaleInstance.contract.transferOwnership(MultiSigWalletInstanceAddress, defaultConfigs);
        const result = await CrowdsaleInstance.verboseWaitForTransaction(transferTransaction, 'Transfer Ownership');
    
    }

}

module.exports = {
    deploy
}