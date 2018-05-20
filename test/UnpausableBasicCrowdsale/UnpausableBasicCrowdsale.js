const UnpausableBasicCrowdsale = artifacts.require("./UnpausableBasicCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const expectThrow = require('../util').expectThrow;
const timeTravel = require('../util').timeTravel;
const web3FutureTime = require('../util').web3FutureTime;

contract('UnpausableBasicCrowdsale', function (accounts) {

	let tokenInstance;
	let unpausableBasicCrowdsaleInstance;
	let _openingTime;
	let _closingTime;

	const weiInEther = 1000000000000000000;

	const _owner = accounts[0];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const nintyDays = 90 * day;

	const _defaultRate = 100;
	const _cap = 100 * weiInEther;

	describe("initializing crowdsale", () => {

		it("should set initial values correctly", async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			unpausableBasicCrowdsaleInstance = await UnpausableBasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			await tokenInstance.transferOwnership(unpausableBasicCrowdsaleInstance.address);

			let openingTime = await unpausableBasicCrowdsaleInstance.openingTime.call();
			let closingTime = await unpausableBasicCrowdsaleInstance.closingTime.call();
			let wallet = await unpausableBasicCrowdsaleInstance.wallet.call();
			let rate = await unpausableBasicCrowdsaleInstance.rate.call();
			let cap = await unpausableBasicCrowdsaleInstance.cap.call();

			assert(openingTime.eq(_openingTime), "The start time is incorrect");
			assert(closingTime.eq(_closingTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert(cap.eq(_cap), "The rate is incorrect");
			assert.strictEqual(wallet, _wallet, "The start time is incorrect");

			let token = await unpausableBasicCrowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		});

	});

	describe("testing finalization function with paused token", () => {

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			await tokenInstance.pause();

			unpausableBasicCrowdsaleInstance = await UnpausableBasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			await tokenInstance.transferOwnership(unpausableBasicCrowdsaleInstance.address);
		});

		it("should throw if try to finalize before closing date", async function () {
			await expectThrow(unpausableBasicCrowdsaleInstance.finalize());
		});

		it("should unpause token", async function () {
			const tokenIsPausedBeforeFinalization = await tokenInstance.paused();
			await timeTravel(web3, nintyDays + day);
			await unpausableBasicCrowdsaleInstance.finalize();
			const tokenIsPausedAfterFinalization = await tokenInstance.paused();
			assert.isTrue(tokenIsPausedBeforeFinalization, 'Token is not paused on init');
			assert.isFalse(tokenIsPausedAfterFinalization, 'Token is not paused after execution of finalization');
		});

	});


});