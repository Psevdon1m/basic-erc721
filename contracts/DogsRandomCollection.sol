// SPDX-License-Identifier: MIT
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "hardhat/console.sol";

error DogsRandomCollection__RangeOutOfValue();
error DogsRandomCollection__NotAllowed();
error DogsRandomCollection__PriceTooLow();
error DogsRandomCollection__WithdrawFailed();

pragma solidity ^0.8.19;

contract DogsRandomCollection is VRFConsumerBaseV2, ERC721URIStorage {
    enum Breed {
        POODLE,
        HUSKY,
        LABRADOR_RETRIEVER,
        GOLDEN_RETRIEVER,
        CHIHUAHUA,
        BULLDOG,
        BEAGLE,
        DALMATIAN,
        SIBERIAN_HUSKY
    }
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    address public owner;
    uint256 public mint_fee = 0.01 ether;
    uint256 public tokenCounter;
    uint64 public immutable subscriptionId;
    uint32 private immutable callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint8 internal constant MAX_CHANCE = 100;
    bytes32 private immutable gasLane;
    string[9] internal dogsTokenUris;

    mapping(uint256 => address) public requestIdToSender;
    modifier only(address who) {
        if (msg.sender != who) revert DogsRandomCollection__NotAllowed();
        _;
    }

    event NftRequested(uint256 indexed requestId, address indexed buyer);
    event NftMinted(Breed indexed dogBreed, address indexed buyer, uint256 indexed tokenId);

    constructor(
        address _vrfCoordinatorV2,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit,
        bytes32 _gasLane,
        string[9] memory _dogsTokenUris
    ) VRFConsumerBaseV2(_vrfCoordinatorV2) ERC721("Random Doggy Dogs", "RDD") {
        owner = msg.sender;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        subscriptionId = _subscriptionId;
        callbackGasLimit = _callbackGasLimit;
        gasLane = _gasLane;
        dogsTokenUris = _dogsTokenUris;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < mint_fee) {
            revert DogsRandomCollection__PriceTooLow();
        }
        requestId = vrfCoordinator.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );
        requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address dogOwner = requestIdToSender[requestId];
        uint newTokenId = tokenCounter;

        // console.log("random number is %s", randomWords[0]);
        // uint256 testValue = randomWords[0] % MAX_CHANCE;
        // console.log("modded test value is  %s", testValue);
        uint8 dogType = uint8(randomWords[0] % MAX_CHANCE);
        Breed dogBreed = getBreed(dogType);
        // console.log("Dog breed is %s: ", uint256(dogBreed));
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, dogsTokenUris[uint8(dogBreed)]);
        tokenCounter++;
        emit NftMinted(dogBreed, dogOwner, newTokenId);
    }

    function getBreed(uint8 dogType) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint8[9] memory chanceArray = getChanceArray();

        for (uint8 i; i < chanceArray.length; ) {
            if (dogType >= cumulativeSum && dogType < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
            unchecked {
                ++i;
            }
        }
        revert DogsRandomCollection__RangeOutOfValue();
    }

    function withdraw() public only(owner) {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        if (!success) {
            revert DogsRandomCollection__WithdrawFailed();
        }
    }

    function getChanceArray() public pure returns (uint8[9] memory) {
        return [11, 11, 11, 11, 11, 11, 11, 11, MAX_CHANCE];
    }

    function changeMintPrice(uint256 newPrice) public only(owner) {
        require(newPrice > mint_fee, "Incorrect new price.");
        mint_fee = newPrice;
    }

    function getDogTokenUri(uint256 index) public view returns (string memory) {
        return dogsTokenUris[index];
    }
}
