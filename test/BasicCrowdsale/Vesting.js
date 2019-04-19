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

        it("should set ICO token contract correctly ", async function () {
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



    describe.only('freeze tokens to investors', ()  => {

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
        


        it('should set freezing period for investor', async function() {
            let tokenAmount = 2000;
            await basicCrowdsaleInstance.createFiatToken(Andre, tokenAmount);
            await tokenInstance.approve(vestingInstance.address, tokenAmount, {from: Andre});
            let date = new Date().now();
            await vestingInstance.freezeTokensToInvestor(_investor, tokenAmount, 30, {from: Andre});

            let currentInvestor = await vestingInstance.investors.call(_investor)
            currentInvestor = JSON.parse(JSON.stringify(currentInvestor))
            
            assert.equal(currentInvestor[0], tokenAmount)
            assert.equal(currentInvestor[2], true)
        })

        it('should set freezing period for tokens withdraw for investor', async function() {
            let tokenAmount = 2000;
            await basicCrowdsaleInstance.createFiatToken(Andre, tokenAmount);
            await tokenInstance.approve(vestingInstance.address, tokenAmount, {from: Andre});
            await vestingInstance.freezeTokensToInvestor(_investor, tokenAmount, 30, {from: Andre});

            let currentInvestor = await vestingInstance.investors.call(_investor)
            currentInvestor = JSON.parse(JSON.stringify(currentInvestor))
            
            assert.equal(currentInvestor[0], tokenAmount)
            assert.equal(currentInvestor[2], true)
        })


    })

})