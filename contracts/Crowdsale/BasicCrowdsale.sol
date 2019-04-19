pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract BasicCrowdsale is MintedCrowdsale, FinalizableCrowdsale {
    
    uint256 public cap = 100000000 * (10 ** 18); // Total number of MYO tokens that would be created
    uint256 public capForSale = 71000000 * (10 ** 18); // Total MYO tokens that could be sold during the ICO
    uint256 public bountyTokensCap = 5000000 * (10 ** 18); // Total number of MYO tokens that would be given as a reward
    uint256 public reservedForTeamTokens = 29000000 * (10 ** 18); // Tokens reserved for rewardpool, advisors and team that will be minted after Crowdsale
    uint256 public totalMintedBountyTokens; // Total number of MYO tokens given as a reward

    uint256 public privateSaleEndDate;
    mapping (address => bool) public minters;

    uint256 constant MIN_CONTRIBUTION_AMOUNT = 10 finney;
    uint256 constant MAX_CONTRIBUTION_AMOUNT = 250 ether;

    uint256 public constant PRIVATE_SALE_CAP = 26000000 * (10 ** 18);
    uint256 public constant PRIVATE_SALE_DURATION = 24 days; // to be calculated according to deployment day; the end date should be 15 May

    uint256 public constant MAIN_SALE_DURATION = 60 days;
    uint256 public mainSaleDurationExtentionLimitInDays = 120; //max days the duration of the ICO can be extended

    event LogFiatTokenMinted(address sender, address beficiary, uint256 amount);
    event LogFiatTokenMintedToMany(address sender, address[] beneficiaries, uint256[] amount);
    event LogBountyTokenMinted(address minter, address beneficiary, uint256 amount);
    event LogBountyTokenMintedToMany(address sender, address[] beneficiaries, uint256[] amount);
    event LogPrivateSaleExtended(uint256 extentionInDays);
    event LogMainSaleExtended(uint256 extentionInDays);
    event LogRateChanged(uint256 rate);
    event LogMinterAdded(address minterAdded);
    event LogMinterRemoved(address minterRemoved);

    constructor(uint256 _rate, address _wallet, address _token, uint256 _openingTime, uint256 _closingTime)
    Crowdsale(_rate, _wallet, ERC20(_token))
    TimedCrowdsale(_openingTime, _closingTime) public {
        privateSaleEndDate = _openingTime.add(PRIVATE_SALE_DURATION);
    }

    // only addresses who are allowed to mint
    modifier onlyMinter (){
        require(minters[msg.sender]);
        _;
    }

    function buyTokens(address beneficiary) public payable {
        require(msg.value >= MIN_CONTRIBUTION_AMOUNT);
        require(msg.value <= MAX_CONTRIBUTION_AMOUNT);
        if(now <= privateSaleEndDate) {
            require(MintableToken(token).totalSupply() < PRIVATE_SALE_CAP);
        }
        uint amount = _getTokenAmount(msg.value);
        require(MintableToken(token).totalSupply().add(amount) <= capForSale);
        super.buyTokens(beneficiary);
    }

    function addMinter(address _minter) public onlyOwner {
        require(_minter != address(0));
        minters[_minter] = true;
        emit LogMinterAdded(_minter);
    }

    function removeMinter(address _minter) public onlyOwner {
        minters[_minter] = false;
        emit LogMinterRemoved(_minter);
    }

    function createFiatToken(address beneficiary, uint256 amount) public onlyMinter() returns(bool){
        require(!hasClosed());
        mintFiatToken(beneficiary, amount);
        emit LogFiatTokenMinted(msg.sender, beneficiary, amount);
        return true;
    }

    function createFiatTokenToMany(address[] beneficiaries, uint256[] amount) public onlyMinter() returns(bool){
        multiBeneficiariesValidation(beneficiaries, amount);
        for(uint i = 0; i < beneficiaries.length; i++){
            mintFiatToken(beneficiaries[i], amount[i]);
        } 
        emit LogFiatTokenMintedToMany(msg.sender, beneficiaries, amount);
        return true;
    }

    function mintFiatToken(address beneficiary, uint256 amount) internal {
        require(MintableToken(token).totalSupply().add(amount) <= capForSale);
        MintableToken(token).mint(beneficiary, amount);
    }

    function createBountyToken(address beneficiary, uint256 amount) public onlyMinter() returns (bool) {
        require(!hasClosed());
        mintBountyToken(beneficiary, amount);
        emit LogBountyTokenMinted(msg.sender, beneficiary, amount);
        return true;
    }

    function createBountyTokenToMany(address[] beneficiaries, uint256[] amount) public onlyMinter() returns (bool) {
        multiBeneficiariesValidation(beneficiaries, amount);
        for(uint i = 0; i < beneficiaries.length; i++){
            mintBountyToken(beneficiaries[i], amount[i]);
        }
        
        emit LogBountyTokenMintedToMany(msg.sender, beneficiaries, amount);
        return true;
    }

    function mintBountyToken(address beneficiary, uint256 amount) internal {
        require(MintableToken(token).totalSupply().add(amount) <= capForSale);
        require(totalMintedBountyTokens.add(amount) <= bountyTokensCap);
        MintableToken(token).mint(beneficiary, amount);
        totalMintedBountyTokens = totalMintedBountyTokens.add(amount);
    }

    function multiBeneficiariesValidation(address[] beneficiaries, uint256[] amount) internal view {
        require(!hasClosed());
        require(beneficiaries.length > 0);
        require(amount.length > 0);
        require(beneficiaries.length == amount.length);
    }

    /**
        @param extentionInDays is a simple number of the days, e.c. 3 => 3 days
     */
    function extendPrivateSaleDuration(uint256 extentionInDays) public onlyOwner returns (bool) {
        require(now <= privateSaleEndDate);
        extentionInDays = extentionInDays.mul(1 days); // convert the days in seconds
        privateSaleEndDate = privateSaleEndDate.add(extentionInDays);
        closingTime = closingTime.add(extentionInDays);
        emit LogPrivateSaleExtended(extentionInDays);
        return true;
    }

    /**
        @param extentionInDays is a simple number of the days, e.c. 3 => 3 days
     */
    function extendMainSailDuration(uint256 extentionInDays) public onlyOwner returns (bool) {
        require(now > privateSaleEndDate);
        require(!hasClosed());
        require(mainSaleDurationExtentionLimitInDays.sub(extentionInDays) >= 0);

        uint256 extention = extentionInDays.mul(1 days); // convert the days in seconds
        mainSaleDurationExtentionLimitInDays = mainSaleDurationExtentionLimitInDays.sub(extentionInDays); // substract days from the limit
        closingTime = closingTime.add(extention);

        emit LogMainSaleExtended(extentionInDays);
        return true;
    }

    function changeRate(uint _newRate) public onlyOwner returns (bool) {
        require(!hasClosed());
        require(_newRate != 0);
        rate = _newRate;
        emit LogRateChanged(_newRate);
        return true;
    }

    // after finalization will be minted manually reservedForTeamTokens amount
    function finalization() internal {
        MintableToken(token).transferOwnership(owner);
        super.finalization();
    }
}