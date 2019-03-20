pragma solidity ^0.4.24;

import "./BasicCrowdsale.sol";
import "./MultipleWhitelistedCrowdsale.sol";


contract WhitelistedBasicCrowdsale is BasicCrowdsale, MultipleWhitelistedCrowdsale {


    constructor(uint256 _rate, address _wallet, address _token, uint256 _openingTime, uint256 _closingTime)
    BasicCrowdsale(_rate, _wallet, ERC20(_token), _openingTime, _closingTime)
    MultipleWhitelistedCrowdsale()
    public {
    }
}