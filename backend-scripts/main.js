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
// 	let privateKeyWhitelister = "9f42c9d8e753db56330ee67b91fdd7fd47f034862f1b96e83bc65acc2e2a463b"; // owner
// 	let addressToWhitelist = "0x2aB2829D8759775b0d2A4301f7692ED83561A30e";
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

run = async () => {
	let result = await crowdsaleService.tokensPurchase("0x411964c3Cf5098E23015cb3A5a556126d497d648");
	console.log(result);
}

run();