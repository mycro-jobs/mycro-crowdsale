pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";



/**
 * @title ICOToken
 * @dev Very simple ERC20 Token example.
 * `StandardToken` functions.
 */
contract ICOToken is MintableToken, PausableToken, BurnableToken {

    string public constant name = "Mycro Token";
    string public constant symbol = "MYO";
    uint8 public constant decimals = 18;


    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor() public {
    }
}