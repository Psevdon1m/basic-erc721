const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
const metadata = require("../metadata.json")
require("dotenv").config()

const imagesLocation = "/Users/mac/Documents/GitHub/basic-erc721/images"

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let dogsTokenUris = []
    if (process.env.UPLOAD_TO_IPFS == "true") {
        dogsTokenUris = await fetchTokenUris()
    }

    let vrfCoordinatorV2Address, subscriptionId
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait()
        subscriptionId = txReceipt.events[0].args.subId
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }
    log("=============================================")

    // const args = [
    //     vrfCoordinatorV2Address,
    //     subscriptionId,
    //     networkConfig[chainId].gasLane,
    //     networkConfig[chainId].mintFee,
    //     networkConfig[chainId].callbackGasLimit,
    //     dogsTokenUris,
    // ]
}

async function fetchTokenUris() {
    let tokenUris = []
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (let imageUploadResponsesIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadata[imageUploadResponsesIndex] }
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`
        console.log("uploading metadata...")
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
