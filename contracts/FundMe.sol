//get funds from users
//withdraw funds
//Set a minimum funding value in USD

//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "./PriceConverter.sol";

error FundMe__NotOwner();

/**@title A sample Funding Contract
 * @author Patrick Collins
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */

contract FundMe {
    // 832511
    // 812595

    //type declarations
    using PriceConverter for uint256;

    //state variables
    uint256 public constant MINIMUM_USD = 10 * 1e18;
    //21,415 gas - constant
    //23,515 gas - non-constant
    //It saves almost an entire dollar

    address[] private s_funders;

    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    // normal - 23622 gas
    // immutable - 21508 gas
    // immutable and constant are saving gas because
    // they are not using storage, they are storing into bytecode of contract

    modifier onlyOwner() {
        // require(i_owner == msg.sender, FundMe__NotOwner());
        if (msg.sender != i_owner) revert FundMe__NotOwner();

        _; // if this was before require, rest of the code will be executed first, and then require of this modifier will work
    }

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // What happens if someone sends ETH to this contract without calling the fund function
    // receive()
    // fallback()

    function fund() public payable {
        // want to be able to set minimum fund amount in USD
        // 1. How do we send ETH to a contract
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        );

        // 1e18 = 1*10**18
        // if getConversionRate() had 2 parameters, then it would be passed inside Like msg.value.getConversionRate(2nd para);
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
        //what is reverting
        //undo any action that happens before require in same scope, sends the remaining gas back
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            s_addressToAmountFunded[s_funders[funderIndex]] = 0;
        }
        // reset the array
        s_funders = new address[](0);
        // actually withdraw
        // 3 ways of sending eth are
        // transfer - auto revert if fails
        // payable(msg.sender).transfer(address(this).balance);
        // send - doesn't auto revert if fails and return a bool
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed!");
        // call - returns 2 var- bool ,bytes
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
        // revert();
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        //mappings can't be in memory

        for (uint256 funderIndex; funderIndex < funders.length; funderIndex++) {
            s_addressToAmountFunded[funders[funderIndex]] = 0;
        }

        s_funders = new address[](0);

        (bool callSuccess, ) = payable(i_owner).call{
            value: address(this).balance
        }("");

        require(callSuccess);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
