pragma solidity ^0.4.23;

import "./../Token/ICOToken.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract UnpausableFinalizableCrowdsale is FinalizableCrowdsale {

    function finalization() internal {
        ICOToken _token = ICOToken(token);

        if (_token.paused()) {
            _token.unpause();
        }

        super.finalization();
    }
}