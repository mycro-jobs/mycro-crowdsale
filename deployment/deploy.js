const etherlime = require('etherlime');
const config = require("./config");

const VestingContract = require('../build/Vesting.json')

// TODO set correct gasPrice on deployment
const defaultConfigs = {
    gasPrice: 20200000000,
    gasLimit: 4700000
}

let VestingInstance;
// TODO set before deployment
const tokenContractAddress = '0x17a39801E871D31D381904bA4cf299bd666DB814';
const deployerPrivateKey = '9C854BD14857DD1F107ECB94E1AEEAA8E9538E3DC41D082D5FE0E452E87A2F28';


const deploy = async (network, secret) => {

    if (config.network === 'local') {

        const deployer = new etherlime.EtherlimeGanacheDeployer();
        deployer.defaultOverrides = defaultConfigs;

        VestingInstance = await deployer.deploy(VestingContract, {}, tokenContractAddress)

    } else {
        const deployer = new etherlime.InfuraPrivateKeyDeployer(deployerPrivateKey, config.network, config.infuraApikey, defaultConfigs)

        VestingInstance = await deployer.deploy(VestingContract, {}, tokenContractAddress)    
    }

}

module.exports = {
    deploy
}