// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Example {
    uint256 private _value;

    function set(uint256 v) external {
        _value = v;
    }

    function get() external view returns (uint256) {
        return _value;
    }
}

