const UnpausableFinalizableCrowdsale = artifacts.require("./UnpausableFinalizableCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const expectThrow = require('../util').expectThrow;
const timeTravel = require('../util').timeTravel;
const web3FutureTime = require('../util').web3FutureTime;

contract('UnpausableFinalizableCrowdsale', function (accounts) {

	let tokenInstance;
	let unpausableFinalizableCrowdsaleInstance;
	let _openingTime;
	let _closingTime;

	const _owner = accounts[0];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const nintyDays = 90 * day;

	const _defaultRate = 100;

	describe("Testing finalization function with paused token", () => {

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			await tokenInstance.pause();

			unpausableFinalizableCrowdsaleInstance = await UnpausableFinalizableCrowdsale.new(_openingTime, _closingTime, _defaultRate, _wallet, tokenInstance.address, {
				from: _owner
			});

			await tokenInstance.transferOwnership(unpausableFinalizableCrowdsaleInstance.address);
		});

		it("should throw if try to finalize before closing date", async function () {
			await expectThrow(unpausableFinalizableCrowdsaleInstance.finalize());
		});

		it("should unpause token", async function () {
			const tokenIsPausedBeforeFinalization = await tokenInstance.paused();
			await timeTravel(web3, nintyDays + day);
			await unpausableFinalizableCrowdsaleInstance.finalize();
			const tokenIsPausedAfterFinalization = await tokenInstance.paused();
			assert.isTrue(tokenIsPausedBeforeFinalization, 'Token is not paused on init');
			assert.isFalse(tokenIsPausedAfterFinalization, 'Token is not paused after execution of finalization');
		});

	});


});