const WhitelistedBasicCrowdsale = artifacts.require("./WhitelistedBasicCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const web3FutureTime = require('../util').web3FutureTime;
const expectThrow = require('../util').expectThrow;
const timeTravel = require("../util").timeTravel;

const BN = require('bn.js');

contract('WhitelistedBasicCrowdsale', function (accounts) {

	let tokenInstance;
	let whitelistedBasicCrowdsaleInstance;
	let _openingTime;
	let _closingTime;

	const weiInEther = 1000000000000000000;

	const _owner = accounts[0];
	const _notOwner = accounts[1]
	const _wallet = accounts[9];

	const _whitelistManager = accounts[2];
	const _nonWhitelistManager = accounts[3];

	const _beneficiary = accounts[4];
	const beneficiaries = [accounts[4],accounts[5],accounts[6], accounts[7], accounts[8]];

	const day = 24 * 60 * 60;
	const thirtyDays = 30 * day;
	const sixtyDays = 60 * day;
	const allDays = 90 * day;

	const _defaultRate = 600;
	const _cap = 100000000 * weiInEther;

	describe("initializing crowdsale", () => {

		it("should set initial values correctly", async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + allDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			whitelistedBasicCrowdsaleInstance = await WhitelistedBasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedBasicCrowdsaleInstance.address);

			let openingTime = await whitelistedBasicCrowdsaleInstance.openingTime.call();
			let closingTime = await whitelistedBasicCrowdsaleInstance.closingTime.call();
			let wallet = await whitelistedBasicCrowdsaleInstance.wallet.call();
			let rate = await whitelistedBasicCrowdsaleInstance.rate.call();
			let cap = await whitelistedBasicCrowdsaleInstance.cap.call();
			let privateSaleEndDate = await whitelistedBasicCrowdsaleInstance.privateSaleEndDate.call();
			
			assert(openingTime.eq(_openingTime), "The start time is incorrect");
			assert(closingTime.eq(_closingTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert(cap.eq(_cap), "The rate is incorrect");
			assert.strictEqual(wallet, _wallet, "The wallet is incorrect");
			assert(privateSaleEndDate.eq(_openingTime + thirtyDays), 'The end day of the privatesale is incorrect')

			let token = await whitelistedBasicCrowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		});

	});


	describe('multiple whitelist managers', () => {
		beforeEach(async function(){
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + allDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			whitelistedBasicCrowdsaleInstance = await WhitelistedBasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedBasicCrowdsaleInstance.address);
		})

		it('should set owner as a whitelist manager', async function() {
			let whitelistManager = await whitelistedBasicCrowdsaleInstance.whitelistManagers(_owner)
			assert.isTrue(whitelistManager, "The manager is not added")
		})

		it('should add new whitelist manager', async function() {
			await whitelistedBasicCrowdsaleInstance.addWhitelistManager(_whitelistManager, {from: _owner})
			let whitelistManager = await whitelistedBasicCrowdsaleInstance.whitelistManagers(_whitelistManager);
			assert.isTrue(whitelistManager, "The manager is not added")
		})

		it('should revert if notOwner tries to add new whitelist manager', async function() {
			await expectThrow(whitelistedBasicCrowdsaleInstance.addWhitelistManager(_whitelistManager, {from: _notOwner}))
		})

		it('should revert if address to add is invalid', async function() {
			await expectThrow(whitelistedBasicCrowdsaleInstance.addWhitelistManager('0x0', {from: _owner}))
		})

		it('should remove whitelist manager', async function() {
			await whitelistedBasicCrowdsaleInstance.addWhitelistManager(_whitelistManager, {from: _owner})
			await whitelistedBasicCrowdsaleInstance.removeWhitelistManager(_whitelistManager, {from: _owner});
			let whitelistManager = await whitelistedBasicCrowdsaleInstance.whitelistManagers(_whitelistManager);
			assert.isFalse(whitelistManager, "The manager is not removed")
		})

		it('should revert if notOwner tries to remove whitelist manager', async function() {
			await whitelistedBasicCrowdsaleInstance.addWhitelistManager(_whitelistManager, {from: _owner})
			await expectThrow(whitelistedBasicCrowdsaleInstance.removeWhitelistManager(_whitelistManager, {from: _notOwner}));
		})

	})

	describe('add and remove from whitelist', () => {
		beforeEach(async function(){
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + allDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			whitelistedBasicCrowdsaleInstance = await WhitelistedBasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedBasicCrowdsaleInstance.address);

			await whitelistedBasicCrowdsaleInstance.addWhitelistManager(_whitelistManager, {from: _owner})
		})

		it('should add a beneficiary to the whitelist', async function(){
			await whitelistedBasicCrowdsaleInstance.addToWhitelist(_beneficiary, {from: _whitelistManager});
			let beneficiary = await whitelistedBasicCrowdsaleInstance.whitelist(_beneficiary);
			assert.isTrue(beneficiary, "The beneficiary is not added to whitelist")
		})

		it('should throw if non whitelistManager tries to add a beneficiary to the whitelsit', async function(){
			await expectThrow(whitelistedBasicCrowdsaleInstance.addToWhitelist(_beneficiary, {from: _nonWhitelistManager}))
		})

		it('should add many to whitelist', async function() {
			await whitelistedBasicCrowdsaleInstance.addManyToWhitelist(beneficiaries, {from: _whitelistManager})
			let beneficiary_1 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[4]);
			let beneficiary_2 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[5]);
			let beneficiary_3 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[6]);
			let beneficiary_4 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[7]);
			let beneficiary_5 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[8]);
			assert.isTrue(beneficiary_1, "The beneficiary is not added to whitelist")
			assert.isTrue(beneficiary_2, "The beneficiary is not added to whitelist")
			assert.isTrue(beneficiary_3, "The beneficiary is not added to whitelist")
			assert.isTrue(beneficiary_4, "The beneficiary is not added to whitelist")
			assert.isTrue(beneficiary_5, "The beneficiary is not added to whitelist")
		})

		it('should throw if non whitelist manager tries to add many to whitelist', async function(){
			await expectThrow(whitelistedBasicCrowdsaleInstance.addManyToWhitelist(beneficiaries, {from: _nonWhitelistManager}))
		})

		it('should remove a beneficiary from whitelist', async function() {
			await whitelistedBasicCrowdsaleInstance.addToWhitelist(_beneficiary, {from: _whitelistManager});
			await whitelistedBasicCrowdsaleInstance.removeFromWhitelist(_beneficiary, {from: _whitelistManager})
			let beneficiary = await whitelistedBasicCrowdsaleInstance.whitelist(_beneficiary);
			assert.isFalse(beneficiary, "The beneficiary was not removed from the whitelist")
		})


		it('should revert if not whitelist manager tries to remove a beneficiary from whitelist', async function(){
			await whitelistedBasicCrowdsaleInstance.addToWhitelist(_beneficiary, {from: _whitelistManager});
			await expectThrow(whitelistedBasicCrowdsaleInstance.removeFromWhitelist(_beneficiary, {from:_nonWhitelistManager}))
		})

		it('should add many and remove one from the whitelist', async function(){
			await whitelistedBasicCrowdsaleInstance.addManyToWhitelist(beneficiaries, {from: _whitelistManager})
			await whitelistedBasicCrowdsaleInstance.removeFromWhitelist(accounts[6], {from: _whitelistManager})
			let beneficiary_1 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[4]);
			let beneficiary_2 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[5]);
			let beneficiary_3 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[6]);
			let beneficiary_4 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[7]);
			let beneficiary_5 = await whitelistedBasicCrowdsaleInstance.whitelist(accounts[8]);
			assert.isTrue(beneficiary_1, "The beneficiary is not added to whitelist")
			assert.isTrue(beneficiary_2, "The beneficiary is not added to whitelist")
			assert.isFalse(beneficiary_3, "The beneficiary is not removed to whitelist")
			assert.isTrue(beneficiary_4, "The beneficiary is not added to whitelist")
			assert.isTrue(beneficiary_5, "The beneficiary is not added to whitelist")
		})

	})

	describe('whitlisting to buy tokens', () => {

		const _privateSalePeriod = {
			TIME: 30*day,
			RATE: 600,
			CAP: 26000000 * weiInEther
		};

		beforeEach(async function(){
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + allDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			whitelistedBasicCrowdsaleInstance = await WhitelistedBasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedBasicCrowdsaleInstance.address);
		})

		it('should buy tokens if benefeiciary is whitelisted', async function(){
			let weiSent = 1 * weiInEther;
			await timeTravel(web3, _privateSalePeriod.TIME);
		
			await whitelistedBasicCrowdsaleInstance.addToWhitelist(_beneficiary, {from: _owner})
			await whitelistedBasicCrowdsaleInstance.buyTokens(_beneficiary, {value: weiSent, from: _beneficiary});
	
			let balance = await tokenInstance.balanceOf.call(_beneficiary)
			assert(balance.eq(weiSent * _privateSalePeriod.RATE))
		})

		it('should revert if beneficiary is not whitelisted', async function() {
			await timeTravel(web3, _privateSalePeriod.TIME);
			await expectThrow(whitelistedBasicCrowdsaleInstance.buyTokens(_beneficiary, {value: weiInEther, from: _beneficiary}))
		})

	})

});