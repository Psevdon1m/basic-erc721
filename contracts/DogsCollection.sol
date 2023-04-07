//SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

pragma solidity ^0.8.19;

contract DogsCollection is ERC721("Doggy", "DOG") {
    uint private tokenCounter;
    string public TOKEN_URI = "https://localhost:8080/";

    function mintDog() public returns (uint256) {
        _safeMint(msg.sender, tokenCounter);
        return tokenCounter++;
    }

    function getTokenCounter() public view returns (uint256) {
        return tokenCounter;
    }

    function tokenURI(uint256 /* tokenId */) public view override returns (string memory) {
        return TOKEN_URI;
    }
}
