const ICOToken = artifacts.require("./ICOToken.sol");
const expectThrow = require('../util').expectThrow;
const timeTravel = require('../util').timeTravel;

contract('ICOToken', function (accounts) {

	let tokenInstance;

	const _owner = accounts[0];
	const _notOwner = accounts[1];

	const _name = "Mycro Token";
	const _initialTotalSupply = 0;
	const _decimals = 18;
	const _symbol = "MYO";

	describe("creating ICO token", () => {
		beforeEach(async function () {
			tokenInstance = await ICOToken.new({
				from: _owner
			});
		});

		it("should set owner correctly", async function () {
			let owner = await tokenInstance.owner.call();

			assert.strictEqual(owner, _owner, "The expected owner is not set");
		});

		it("should have no totalSupply", async function () {
			let totalSupply = await tokenInstance.totalSupply.call();

			assert(totalSupply.eq(_initialTotalSupply), `The contract has initial supply of : ${totalSupply.toNumber()}`);
		});

		it("should set the name correctly", async function () {
			let name = await tokenInstance.name.call();

			assert.strictEqual(name, _name, `The contract name is incorrect : ${name}`);
		});

		it("should set the symbol correctly", async function () {
			let symbol = await tokenInstance.symbol.call();

			assert.strictEqual(symbol, _symbol, `The contract symbol is incorrect : ${symbol}`);
		});

		it("should set the decimals correctly", async function () {
			let decimals = await tokenInstance.decimals.call();

			assert(decimals.eq(_decimals), `The contract decimals are incorrect : ${decimals.toNumber()}`);
		});

	});

	describe("creating ICO token", () => {

		it("can timetravel", async function () {
			const dayInSeconds = 24 * 60 * 60;
			const timeBefore = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
			await timeTravel(web3, dayInSeconds);
			const timeAfter = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
			assert.isAtLeast(timeAfter - timeBefore, dayInSeconds, 'It did not advance with a day');

		});

	});


});