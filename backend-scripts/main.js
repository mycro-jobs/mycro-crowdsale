const crowdsaleService = require('./crowdsale-services');
const walletTransactions = require('./wallet-transactions');
const walletService = require('./wallet-services');
const {
	nodeProvider,
	ICOTokenContract,
	WhitelistedBasicCrowdsaleContract
} = require('./config-blockchain');

// TODO config.json to be moved to process.env (config.blockchain.network could be local, ropsten, mainnet)
// TODO privateKeyWhitelister to come from process.env - this address is only allowed to whitelist
// Current owner address of the contract  = "0x0e0e86a4622F679a45baE10C194f1927ad79e979"
// Current WhiteListManager (whitelister)  address = "0xFeD1564d6F5cE55166DE5deBD7bD43c2902a92bd"
// Current WhiteListManager (whitelister)  privateKey = "0x8750B5E967D91F0B5FA13C7985011347E14FFC3AA2FC1A4C9DA8207DC5A60951"

//Params fot testing the wallet-transactions
const jsonWalletObj = '{"version":3,"id":"baf57050-4349-45c9-894f-ad18fa370f38","address":"6524083c3a4b06cac3bb2d13c7c2bc3aeb50c680","Crypto":{"ciphertext":"39eca1a673e934972e4cc0c508f25f0606425d7df269a37caa9a8b2fb1c75add","cipherparams":{"iv":"c65fc6284df3104992d101d7ba543f78"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"77a5a81b34ca83a2c05d4d5278822f39647b05fd3ca10f1e997e47861f3ebd60","n":8192,"r":8,"p":1},"mac":"cd6c41f594ede562a2d0a79c62730361bb39f26d3b1ade5d3561fcddbeba2e0d"}}';
const password = '123456789'
const amount = '600000000000000'
const beneficiary = "0x6524083C3A4B06CAc3Bb2D13c7C2BC3aeB50C680"
const mnemonic = 'ghost glance strong volcano deal shield bubble audit essence dizzy grief lyrics';
const recoverAddress = '0x502c084a5f8e0b68d12ea1d39d47982d560f2882';



// Get crowdsale owner
// run = async () => {
// 	let owner = await crowdsaleService.getOwner();
// 	console.log(owner);
// };

// Whitelist single address with KYC
// run = async () => {
// 	let privateKeyWhitelister = "0xcd15e42323b3c6adf70cdffaf115a0875b0bbfea9378babed53a6cb2d6dd70d8"; // owner
// 	let addressToWhitelist = "0xb63df2068d209f8ff3925c4c9dbbabfd31301825";
// 	let txnHash = await crowdsaleService.whitelistAddress(privateKeyWhitelister, addressToWhitelist);
// 	console.log(txnHash);
// };

// // Whitelist multiple addresses at once
// run = async () => {
// 	let privateKeyWhitelister = "9f42c9d8e753db56330ee67b91fdd7fd47f034862f1b96e83bc65acc2e2a463b"; // owner
// 	let addressesToWhitelist = [
// 		"0xD3f98E0aDC62Bd5EEe94D79d77164043e86dcE5B",
// 		"0xda8a06f1c910cab18ad187be1faa2b8606c2ec86",
// 		"0x8199de05654e9afa5c081bce38f140082c9a7733",
// 		"0x28bf45680ca598708e5cdacc1414fcac04a3f1ed"
// 	];

// 	let txnHash = await crowdsaleService.whitelistMultipleAddresses(privateKeyWhitelister, addressesToWhitelist);
// 	console.log(txnHash);
// };

// Check if given address is whitelisted
// run = async () => {
// 	let addressToCheck = "0x2aB2829D8759775b0d2A4301f7692ED83561A30e";

// 	let txnHash = await crowdsaleService.isWhitelisted(addressToCheck);
// 	console.log(txnHash);
// };

// Get current tokens sold
// run = async () => {
// 	let tokenInstance = await ICOTokenContract();
// 	let tokensSold = await tokenInstance.totalSupply();

// 	console.log(tokensSold.toString());
// };

// Get current tokens for 1 ETH
// run = async () => {
// 	let tokensAmount = await crowdsaleService.getCurrentTokensForEther("0x2aB2829D8759775b0d2A4301f7692ED83561A30e");
// 	console.log(tokensAmount.toString());
// };

// Buy fiat tokens
// run = async () => {
// 	let result = await crowdsaleService.mintFiatTokens("0x6524083C3A4B06CAc3Bb2D13c7C2BC3aeB50C680", '1000', '0x255438e8a9adc51e9e6bda196d6618c21b0bdc3464e09a812c821e64e9552feb');
// 	console.log(result);
// }

//Mint multiple fiat tokens
// run = async () => {
// 	let result = await crowdsaleService.mintFiatTokensToMany(["0x6524083C3A4B06CAc3Bb2D13c7C2BC3aeB50C680", "0x2B8e7487CdACC95889252FC77b5E8E757aF666E6"], ['1000', '2000'], '0x255438e8a9adc51e9e6bda196d6618c21b0bdc3464e09a812c821e64e9552feb');
// 	console.log(result);
// }

//Mint multiple bounty tokens
// run = async () => {
// 	let result = await crowdsaleService.mintBountyTokensToMany(["0x6524083C3A4B06CAc3Bb2D13c7C2BC3aeB50C680", "0x2B8e7487CdACC95889252FC77b5E8E757aF666E6"], ['1000', '2000'], '0x0d742838e7200dd5e0f9efc5b7260ebe9d1ac458e5a0783904cae0197cda565a');
// 	console.log(result);
// }

// Buy bounty tokens
// run = async () => {
// 	let result = await crowdsaleService.mintBountyTokens("0x6524083C3A4B06CAc3Bb2D13c7C2BC3aeB50C680", '1000', '0x255438e8a9adc51e9e6bda196d6618c21b0bdc3464e09a812c821e64e9552feb');
// 	console.log(result);
// }

//Get address token balance 

// run = async () => {
// 	let tokenInstance = await ICOTokenContract();
// 	let tokensSold = await tokenInstance.balanceOf("0x2B8e7487CdACC95889252FC77b5E8E757aF666E6");
// 	console.log(tokensSold.toString())
// }

//Add whitelist manager
//This function can be called only by the Owner of the contract, in our case this will be the multisig wallet, don't inegrate with backend/frontend
// run = async () => {
// 	let result = await crowdsaleService.addWhitelistManager("0xFeD1564d6F5cE55166DE5deBD7bD43c2902a92bd", "0x9C854BD14857DD1F107ECB94E1AEEAA8E9538E3DC41D082D5FE0E452E87A2F28");
// 	console.log(result)
// }

//Get Whitelist manager
// run = async () => {
// 	let result = await WhitelistedBasicCrowdsaleContract.whitelistManagers("0xFeD1564d6F5cE55166DE5deBD7bD43c2902a92bd");
// 	console.log(result)
// }

//Add minter
//This function can be called only by the Owner of the contract, in our case this will be the multisig wallet, don't inegrate with backend/frontend
// run = async () => {
// 	let result = await crowdsaleService.addMinter("0x2B8e7487CdACC95889252FC77b5E8E757aF666E6", "0xcd15e42323b3c6adf70cdffaf115a0875b0bbfea9378babed53a6cb2d6dd70d8");
// 	console.log(result)
// }

//Get minter
// run = async () => {
// 	let result = await WhitelistedBasicCrowdsaleContract.minters("0x2B8e7487CdACC95889252FC77b5E8E757aF666E6");
// 	console.log(result)
// }


// run = async () => {
// 	let result = await crowdsaleService.tokensPurchase("0x411964c3Cf5098E23015cb3A5a556126d497d648");
// 	console.log(result);
// }


//Wallet Transaction Scripts

//Buy tokens
// run = async () => {
// 	let initialTokenBalance = await walletTransactions.getTokenBalance("0xB63dF2068d209F8Ff3925C4c9DbBAbfD31301825")
// 	console.log(initialTokenBalance.toString());

// 	let result = await walletTransactions.buyICOTokens(jsonWalletObj, password, amount, "0xB63dF2068d209F8Ff3925C4c9DbBAbfD31301825");
// 	console.log(result);
// 	await nodeProvider.waitForTransaction(result.hash)
// 	let finalTokenBalance = await walletTransactions.getTokenBalance("0xB63dF2068d209F8Ff3925C4c9DbBAbfD31301825")
// 	console.log(finalTokenBalance.toString());
// }

//Send ETH
// run = async () => {
// 	let initialETHBalance = await walletTransactions.getEthBalance("0xB63dF2068d209F8Ff3925C4c9DbBAbfD31301825")
// 	console.log(initialETHBalance.toString());

// 	let result = await walletTransactions.sendEth(jsonWalletObj, password, amount, beneficiary);
// 	console.log(result);
// 	await nodeProvider.waitForTransaction(result.hash)
// 	let finalETHBalance = await walletTransactions.getEthBalance("0xB63dF2068d209F8Ff3925C4c9DbBAbfD31301825")
// 	console.log(finalETHBalance.toString());
// }

//Send Mycro Tokens to address
// run = async () => {
// 	let initialTokenBalance = await walletTransactions.getTokenBalance("0xB63dF2068d209F8Ff3925C4c9DbBAbfD31301825")
// 	let initialTokenBalance2 = await walletTransactions.getTokenBalance("0x6524083C3A4B06CAc3Bb2D13c7C2BC3aeB50C680")
// 	console.log(initialTokenBalance.toString());
// 	console.log(initialTokenBalance2.toString());

// 	let result = await walletTransactions.sendMycroTokens(jsonWalletObj, password, amount, "0x6524083C3A4B06CAc3Bb2D13c7C2BC3aeB50C680");
// 	console.log(result);

// 	await nodeProvider.waitForTransaction(result.hash)
// 	let finalTokenBalance = await walletTransactions.getTokenBalance("0xB63dF2068d209F8Ff3925C4c9DbBAbfD31301825")
// 	let finalTokenBalance2 = await walletTransactions.getTokenBalance("0x6524083C3A4B06CAc3Bb2D13c7C2BC3aeB50C680")
// 	console.log(finalTokenBalance.toString());
// 	console.log(finalTokenBalance2.toString());
// }


//Wallet

//Create wallet from password
// run = async () => {
// 	let walletCreate = await walletService.createFromPassword(password);
// 	console.log(walletCreate);

// }

//Recover wallet from mnemonic 
run = async () => {
	let walletRecover = await walletService.recoverFromMnemonic(mnemonic, password, recoverAddress);
	console.log(walletRecover);

}

run();