const { assert, expect } = require("chai")

const { ethers, network, deployments } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const metadata = require("../metadata.json")
const { parsePromiseArray } = require("./utils/parseFunctions")

const timer = (ms) => new Promise((res) => setTimeout(res, ms))

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random Dogs Collection unit test", () => {
          let dogsCollection, vrfCoordinatorV2Mock, deployer, subscriptionId
          const dogsTokenUris = [
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
          beforeEach(async () => {
              let accounts = await ethers.getSigners()
              deployer = accounts[0]

              await deployments.fixture(["mocks", "randomipfs"])
              dogsCollection = await ethers.getContract("DogsRandomCollection")
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")

              subscriptionId = (await dogsCollection.subscriptionId()).toString()
              tx = await vrfCoordinatorV2Mock.addConsumer(subscriptionId, dogsCollection.address)
              txReceipt = await tx.wait()
              tx = await vrfCoordinatorV2Mock.fundSubscription(
                  subscriptionId,
                  ethers.utils.parseEther("100")
              )
              txReceipt = await tx.wait()
              console.log("subsc funded")
              console.log(
                  await vrfCoordinatorV2Mock.consumerIsAdded(subscriptionId, dogsCollection.address)
              )
              console.log({
                  dogsCollection: dogsCollection.address,
                  vrfCoordinatorV2Mock: vrfCoordinatorV2Mock.address,
                  deployer: deployer.address,
              })
          })

          describe("Mintes a set of nft and checks the randomness", () => {
              let mintResult = []
              let breedToCountObj = metadata.reduce(
                  (result, obj) => ({ ...result, [obj.name]: 0 }),
                  {}
              )

              it("Mints nft in loop", async () => {
                  let mintPromiseArray = []
                  for (let i = 0; i < 1; i++) {
                      const queryInPromise = dogsCollection.requestNft({
                          value: ethers.utils.parseEther("0.01"),
                      })
                      mintPromiseArray.push(queryInPromise)
                  }
                  let result = await Promise.allSettled(mintPromiseArray)
                  mintPromiseArray = []
                  for (let res of result) {
                      mintPromiseArray.push(res["value"].wait())
                  }
                  result = await Promise.allSettled(mintPromiseArray)

                  await vrfCoordinatorV2Mock.fulfillRandomWords() // todo fullfill request for consumet
                  console.log(await dogsCollection.balanceOf(deployer.address))
              })
          })
      })
