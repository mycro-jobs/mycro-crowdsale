pragma solidity ^0.4.23;

import "./BasicCrowdsale.sol";
import "./UnpausableFinalizableCrowdsale.sol";


contract UnpausableBasicCrowdsale is BasicCrowdsale, UnpausableFinalizableCrowdsale {


    constructor(uint256 _rate, address _wallet, address _token, uint256 _openingTime, uint256 _closingTime, uint256 _cap)
    BasicCrowdsale(_rate, _wallet, ERC20(_token), _openingTime, _closingTime, _cap)
    UnpausableFinalizableCrowdsale()
    public {
    }
}

