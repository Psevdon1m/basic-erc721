const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
const metadata = require("../metadata.json")

require("dotenv").config()
const pinataAoiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = new pinataSDK(pinataAoiKey, pinataApiSecret)
async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(fullImagesPath)
    let responses = []
    console.log("Uploading to pinata...")
    for (let fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        try {
            const res = await pinata.pinFileToIPFS(readableStreamForFile, {
                pinataMetadata: {
                    ...metadata[fileIndex],
                },
            })
            responses.push(res)
        } catch (error) {
            console.log(error)
        }
    }
    console.log("============ IPFS All good===============")
    console.log({ responses, files })
    return { responses, files }
}

module.exports = { storeImages }
