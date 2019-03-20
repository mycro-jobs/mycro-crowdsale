const ethers = require('ethers');

const {
    nodeProvider
} = require('./config-blockchain.js');
const basicValidators = require("./validation/basicValidaton.js");

class WalletService {

    static progressCallback() {};


    /**
     * 
     * @param {Private key of the wallet as a String} privateKey 
     * @returns {Instance of a wallet object}
     */
    static async initWalletFromPrivateKey(privateKey) {
        return new ethers.Wallet(privateKey, nodeProvider);
    }

    /**
     * Creates new Mycro wallet from password
     * @param {Password for the wallet as a String} password 
     * @returns {Wallet object with address, jsonObj and mnemonic}
     */
    static async createFromPassword(password) {
        basicValidators.validatePassword(password);

        const mnemonic = await ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));

        return await this.generateAccountFromMnemonicEthers(mnemonic, password, this.progressCallback())
    }

    /**
     * Recovers a wallet by providing the mnemonic, address and password of the wallet
     * @param {The twelve words seed phrase of the lost waller as a String} mnemonic 
     * @param {The password of the lost wallet as a String} password 
     * @param {The address of the lost wallet as a String} address 
     * @returns {Returns new wallet object}
     * 
     * This is how progressCallback can be used. Example from ethersjs documentation.
     * var password = "password123";

        function callback(percent) {
            console.log("Encrypting: " + parseInt(percent * 100) + "% complete");
        }

        var encryptPromise = wallet.encrypt(password, callback);
     */
    static async recoverFromMnemonic(mnemonic, password, address) {
        basicValidators.validatePassword(password);
        basicValidators.validateEtherAddress(address);
        this.validateMnemonic(mnemonic);

        let result = await this.generateAccountFromMnemonicEthers(mnemonic, password, this.progressCallback());

        if (result.address.toLowerCase() !== address.toLowerCase()) {
            throw new Error("The addresses don't match with the mnemonic and password");
        }
        return result;
    }

    /**
     * Sub function for creating the wallet with password. Creates account from mnemomnic
     * @param {Twelve words seed phrase as a String} mnemonic 
     * @param {Wallet's password as a String} _newPassword 
     * @param {Arrow function for a callback} progressCallback
     * @returns {Wallet object with the parameters} 
     */
    static async generateAccountFromMnemonicEthers(mnemonic, _newPassword, _progressCallback) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);

        const encryptPromise = await wallet.encrypt(_newPassword, _progressCallback);

        const json = await encryptPromise;
        return {
            address: wallet.address,
            fileName: JSON.parse(json)['x-ethers'].gethFilename,
            jsonFile: JSON.parse(json),
            mnemonic
        };
    }

    /**
     * Function that validates if the mnemonic is valid or not
     * @param {Twelve words seed phrase} mnemonic 
     * @returns {Returns true or throws error, depends on the result.}
     */
    static validateMnemonic(mnemonic) {
        if (!ethers.HDNode.isValidMnemonic(mnemonic)) {
            throw ERROR.INVALID_MNEMONIC;
        }

        return true;
    }



}

module.exports = WalletService;