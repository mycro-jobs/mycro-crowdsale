const BasicCrowdsale = artifacts.require("./BasicCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const VestingContract = artifacts.require("./Vesting.sol");
const expectThrow = require('../util').expectThrow;
const timeTravel = require('../util').timeTravel;
const web3FutureTime = require('../util').web3FutureTime;

contract(' Vesting', function (accounts) {

    let tokenInstance;
    let basicCrowdsaleInstance;
    let vestingInstance;
	let _openingTime;
    let _closingTime;
    const _defaultRate = 600;
	
	const weiInEther = 1000000000000000000;

    const _owner = accounts[0];
    const Andre = accounts[1];
    const _wallet = accounts[6];
	const _notOwner = accounts[7];
    const _investor = accounts[8];
    const _notInvestor = accounts[9];

	const day = 24 * 60 * 60;
    const tenDays = 10 * day;
    const thirtyDays = 30 * day;
	const ninetyDays = 90 * day;

    describe('initialize vesting contract', () => {

        it("should set Vesting contract correctly ", async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
            });
            
            vestingInstance = await VestingContract.new(tokenInstance.address, {
                from: _owner
            });

            let token = await vestingInstance.mycroToken.call();

            assert.equal(token, tokenInstance.address)
		});
    });



    describe('freeze tokens to investors', ()  => {

        let tokenAmount = 2000;
        let transaction;

        beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
            });
            
            vestingInstance = await VestingContract.new(tokenInstance.address, {
                from: _owner
            });

            await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
            
            await basicCrowdsaleInstance.createFiatToken(Andre, tokenAmount);
            await tokenInstance.approve(vestingInstance.address, tokenAmount, {from: Andre});
            transaction = await vestingInstance.freezeTokensToInvestor(_investor, tokenAmount, 30, {from: Andre});
        });
        

        it('should set freezing period for investor', async function() {
            let initialTime = Math.floor(new Date().getTime() / 60000); // time in minutes
            let currentInvestor = await vestingInstance.investors.call(_investor)
            currentInvestor = JSON.parse(JSON.stringify(currentInvestor))
            
            assert.equal(currentInvestor[0], tokenAmount)
            // assert.equal(Math.floor(currentInvestor[1] / 60), initialTime + thirtyDays / 60)
            assert.equal(currentInvestor[2], true)

        })

        it('should not allow an investor to withdraw funds before freezing period is passed', async function() {
            await timeTravel(web3, tenDays); //only 10 days passed
            await expectThrow(vestingInstance.withdraw(tokenAmount, {from: _investor}))
        })

        it('should allow an investor to withdraw funds after freezing period is passed', async function() {
            let investorBalanceBefore = await tokenInstance.balanceOf.call(_investor);

            await timeTravel(web3,thirtyDays); //let the freeze period pass

            await vestingInstance.withdraw(tokenAmount, {from: _investor});
            let investorBalanceAfter = await tokenInstance.balanceOf.call(_investor);

            assert.notEqual(investorBalanceBefore, investorBalanceAfter)
            assert(investorBalanceAfter.eq(tokenAmount))
        })

        it('should allow an investor to withdraw funds at parts', async function() {
            let halfTokenAmount = tokenAmount / 2;

            await timeTravel(web3, thirtyDays); //let the freeze period pass

            await vestingInstance.withdraw(halfTokenAmount, {from: _investor});

            let investorBalanceFirstWithdraw = await tokenInstance.balanceOf.call(_investor);
            assert(investorBalanceFirstWithdraw.eq(halfTokenAmount))

            await vestingInstance.withdraw(halfTokenAmount, {from: _investor});
            let investorBalanceSecondWithdraw = await tokenInstance.balanceOf.call(_investor);
            assert(investorBalanceSecondWithdraw.eq(tokenAmount))
        })

        it('should not allow an investor to withdraw the funds twice', async function() { 
            await timeTravel(web3,thirtyDays); //let the freeze period pass

            await vestingInstance.withdraw(tokenAmount, {from: _investor});
            await expectThrow(vestingInstance.withdraw(tokenAmount, {from: _investor}))
        })

        it('should not allow an investor to withdraw more funds than he have', async function() {
            await timeTravel(web3,thirtyDays); //let the freeze period pass
            await expectThrow(vestingInstance.withdraw(tokenAmount + 1, {from: _investor}))
        })

        it('it should revert if non investor tries to withdraw funds', async function() {
            await expectThrow(vestingInstance.withdraw(tokenAmount, {from: _notInvestor}))
        })

        it("should emit event on set freeze period for investor", async function () {
            const expectedEvent = 'LogFreezedTokensToInvestor';
            
			assert.lengthOf(transaction.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(transaction.logs[0].event, expectedEvent, `The event emitted was ${transaction.logs[0].event} instead of ${expectedEvent}`);
        });
        
        it("should emit event on withdraw of investor", async function () {
            const expectedEvent = 'LogWithdraw';

            await timeTravel(web3, thirtyDays)
            transaction = await vestingInstance.withdraw(tokenAmount, {from: _investor})
            
			assert.lengthOf(transaction.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(transaction.logs[0].event, expectedEvent, `The event emitted was ${transaction.logs[0].event} instead of ${expectedEvent}`);
		});

    })

    describe('multiple freezing tokens', () => {
        beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
            });
            
            vestingInstance = await VestingContract.new(tokenInstance.address, {
                from: _owner
            });

            await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
            
        });

        it('should set freeze periods for more than one investors and to allow them to withdraw', async function() {
            let firstAmount = 2000;
            let secondAmount = 6000;
            
            await basicCrowdsaleInstance.createFiatToken(Andre, firstAmount);
            await tokenInstance.approve(vestingInstance.address, firstAmount, {from: Andre});
            await vestingInstance.freezeTokensToInvestor(_investor, firstAmount, 30, {from: Andre});

            await basicCrowdsaleInstance.createFiatToken(Andre, secondAmount);
            await tokenInstance.approve(vestingInstance.address, secondAmount, {from: Andre});
            await vestingInstance.freezeTokensToInvestor(_wallet, secondAmount, 40, {from: Andre});

            await timeTravel(web3, thirtyDays); //let the freeze period pass for the first investor

            await vestingInstance.withdraw(firstAmount, {from: _investor});

            await timeTravel(web3, tenDays); //let the freeze period pass for the second investor
            
            await vestingInstance.withdraw(secondAmount, {from: _wallet});

            let investorOneBalance = await tokenInstance.balanceOf.call(_investor);
            let investorTwoBalance = await tokenInstance.balanceOf.call(_wallet);

            assert(investorOneBalance.eq(firstAmount))
            assert(investorTwoBalance.eq(secondAmount))

        })

        it('should freeze tokens to investor twice', async function() {
            let firstAmount = 2000;
            let secondAmount = 6000;
            
            await basicCrowdsaleInstance.createFiatToken(Andre, firstAmount);
            await tokenInstance.approve(vestingInstance.address, firstAmount, {from: Andre});
            await vestingInstance.freezeTokensToInvestor(_investor, firstAmount, 30, {from: Andre});

            await timeTravel(web3, tenDays);

            await basicCrowdsaleInstance.createFiatToken(Andre, secondAmount);
            await tokenInstance.approve(vestingInstance.address, secondAmount, {from: Andre});
            await vestingInstance.freezeTokensToInvestor(_investor, secondAmount, 10, {from: Andre});

            await timeTravel(web3, thirtyDays);

            await vestingInstance.withdraw(firstAmount + secondAmount, {from: _investor});

            let investorBalance = await tokenInstance.balanceOf.call(_investor);
            assert(investorBalance.eq(firstAmount + secondAmount))
        })

        it('should revert if Andre has not approved amount of tokens to be locked in vesting contract for investor', async function() {
            let tokenAmount = 2000;
            
            await basicCrowdsaleInstance.createFiatToken(Andre, tokenAmount);
            await expectThrow(vestingInstance.freezeTokensToInvestor(_investor, tokenAmount, 30, {from: Andre}));
        })

        it('should revert if tokenAmount is 0', async function() {
            let tokenAmount = 2000;
            let invalidAmount = 0;
            
            await basicCrowdsaleInstance.createFiatToken(Andre, tokenAmount);
            await tokenInstance.approve(vestingInstance.address, tokenAmount, {from: Andre});
            await expectThrow(vestingInstance.freezeTokensToInvestor(_investor, invalidAmount, 30, {from: Andre}));
        })

        it('should revert if investor address is invalid', async function() {
            let tokenAmount = 2000;
            
            await basicCrowdsaleInstance.createFiatToken(Andre, tokenAmount);
            await tokenInstance.approve(vestingInstance.address, tokenAmount, {from: Andre});

            await expectThrow(vestingInstance.freezeTokensToInvestor('0x0', tokenAmount, 30, {from: Andre}));
        })


    })

})