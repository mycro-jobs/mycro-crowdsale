pragma solidity ^0.4.23;


import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";


/**
 * @title ICOToken
 * @dev Very simple ERC20 Token example.
 * `StandardToken` functions.
 */
contract ICOToken is MintableToken, PausableToken {

    string public constant name = "ICO Token";
    string public constant symbol = "ICO";
    uint8 public constant decimals = 18;


    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor() public {
    }
}