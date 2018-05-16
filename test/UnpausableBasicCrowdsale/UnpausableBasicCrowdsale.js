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

	describe("Testing finalization function with paused token", () => {

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