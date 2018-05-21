const crowdsaleService = require('./crowdsale-services');
const { ICOTokenContract } = require('./config-blockchain');

// TODO config.json to be moved to process.env (config.blockchain.network could be local, ropsten, mainnet)
// TODO privateKeyWhitelister to come from process.env - this address is only allowed to whitelist

// Get crowdsale owner
// run = async () => {
// 	let owner = await crowdsaleService.getOwner();
// 	console.log(owner);
// };

// Whitelist single address with KYC
// run = async () => {
// 	let privateKeyWhitelister = "0x7ab741b57e8d94dd7e1a29055646bafde7010f38a900f55bbd7647880faa6ee8"; // owner
// 	let addressToWhitelist = "0x87e0ed760fb316eeb94bd9cf23d1d2be87ace3d8";
// 	let txnHash = await crowdsaleService.whitelistAddress(privateKeyWhitelister, addressToWhitelist);
// 	console.log(txnHash);
// };

// Whitelist multiple addresses at once
// run = async () => {
// 	let privateKeyWhitelister = "0x7ab741b57e8d94dd7e1a29055646bafde7010f38a900f55bbd7647880faa6ee8"; // owner
// 	let addressesToWhitelist = [
// 		"0xfec44e15328b7d1d8885a8226b0858964358f1d6",
// 		"0xda8a06f1c910cab18ad187be1faa2b8606c2ec86",
// 		"0x8199de05654e9afa5c081bce38f140082c9a7733",
// 		"0x28bf45680ca598708e5cdacc1414fcac04a3f1ed"
// 	];
//
// 	let txnHash = await crowdsaleService.whitelistMultipleAddresses(privateKeyWhitelister, addressesToWhitelist);
// 	console.log(txnHash);
// };

// Check if given address is whitelisted
// run = async () => {
// 	let addressToCheck = "0x8199de05654e9afa5c081bce38f140082c9a7733";
//
// 	let txnHash = await crowdsaleService.isWhitelisted(addressToCheck);
// 	console.log(txnHash);
// };

// Get current tokens sold
// run = async () => {
// 	let tokenInstance = await ICOTokenContract();
// 	let tokensSold = await tokenInstance.totalSupply();
//
// 	console.log(tokensSold.toString());
// };

// Get current tokens for 1 ETH
run = async () => {
	let tokensAmount = await crowdsaleService.getCurrentTokensForEther();
	console.log(tokensAmount.toString());
};

run();