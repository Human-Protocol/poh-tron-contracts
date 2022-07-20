// SPDX-License-Identifier: MIT
pragma solidity >=0.8.5 <0.9.0;

import "../HumanOnly.sol";

contract HumanOnlyMock is HumanOnly {
    event Success();

    constructor() {
        setHumanityValidator(0x27fB77993FEe0c8c49685Ee98c0c9030017cC223);
    }

    function testBasicPoH(bytes calldata proof) public basicPoH(proof) {
        emit Success();
    }

    function testSovereignPoH(bytes calldata proof) public sovereignPoH(proof) {
        emit Success();
    }
}
