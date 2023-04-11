const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages } = require("../utils/uploadToPinata")

const imagesLocation = "/Users/mac/Documents/GitHub/basic-erc721/images"

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let dogsTokenUris = []
    if (process.env.UPLOAD_TO_IPFS === "true") {
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
    await storeImages(imagesLocation)
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
    return dogsTokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
