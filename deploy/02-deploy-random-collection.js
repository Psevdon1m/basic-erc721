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
    } else {
        dogsTokenUris = [
            "ipfs://bafybeifpbb5hkgvn6sw4q7cg36spbfh2jsvblfw23tfrmjpjmmczrkjyxq/",
            "ipfs://bafybeihlcmmqolpnije4cxieg5kmsy3vrqgdkmeslgqtpu7orl5ge4lw2e/",
            "ipfs://bafybeicgartkuy2w5avistn55sfn3v3mlatiamx2ludxuvzeqapenwdnrq/",
            "ipfs://bafybeidt5npl5yaepabo6ugi2yuq2fkdpm4l7jtgmft7yuj4yrbffcjkky/",
            "ipfs://bafybeihtodlcjgtmcnethr4mwoqzw3fceg6ucwjzafhe74yl5lsezgmjaa/",
            "ipfs://bafybeicr45pcbmdtcn5t5x7uzt6qjaibv5ibedg3gxczz4l76l7bcs5ndm/",
            "ipfs://bafybeidkyxnrepqes4vdqrhfnr5rskuxtyh67n4jms7trq4f3difzstkfu/",
            "ipfs://bafybeibedyjwajelgxmve72mu2gc5osh5eifpyfbofrji2zeczlxpa3dvq/",
            "ipfs://bafybeicx6uokfxyru3h53kb2snq3hxshec2vbsepnc2hdyvh5au34bze74/",
        ]
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

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].callbackGasLimit,
        networkConfig[chainId].gasLane,
        dogsTokenUris,
    ]
    const dogsRandomCollection = await deploy("DogsRandomCollection", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dogsRandomCollection.address, args)
    }
}

async function fetchTokenUris() {
    let tokenUris = []
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    console.log("uploading metadata...")
    for (let imageUploadResponsesIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadata[imageUploadResponsesIndex] }
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`

        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("success metadata uploaded")
    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
