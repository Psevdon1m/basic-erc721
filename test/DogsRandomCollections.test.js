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
                  ethers.utils.parseEther("500")
              )
              txReceipt = await tx.wait()
          })

          describe("Mintes a set of nft and checks the randomness", () => {
              let mintResult = []
              let breedToCountObj = metadata.reduce(
                  (result, obj) => ({ ...result, [obj.name]: 0 }),
                  {}
              )

              it("Mints nft in loop", async () => {
                  let mintPromiseArray = []
                  //1)add batch request nft to promise array

                  for (let i = 0; i < 1000; i++) {
                      const queryInPromise = dogsCollection.requestNft({
                          value: ethers.utils.parseEther("0.01"),
                      })
                      mintPromiseArray.push(queryInPromise)
                  }
                  //2) wait till all promises resolves
                  let result = await Promise.allSettled(mintPromiseArray)
                  mintPromiseArray = []
                  //3) wait till all tansactions are minned

                  for (let res of result) {
                      mintPromiseArray.push(res["value"].wait())
                  }

                  result = await Promise.allSettled(mintPromiseArray)
                  mintPromiseArray = []
                  //4) then contract sends multiple request to vrfCoordinator for a set of random words
                  for (let res of result) {
                      mintPromiseArray.push(
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              res["value"].events[1].args.requestId,
                              dogsCollection.address
                          )
                      )
                  }
                  //5)wait till all promisses are resolved
                  result = await Promise.allSettled(mintPromiseArray)
                  mintPromiseArray = []
                  //6) wait till all transactions are mined
                  for (let res of result) {
                      mintPromiseArray.push(res["value"].wait())
                  }
                  result = await Promise.allSettled(mintPromiseArray)
                  const filter = dogsCollection.filters["NftMinted"]()
                  const events = await dogsCollection.queryFilter(filter)
                  const breedArray = Object.keys(breedToCountObj)
                  events.forEach((el) => {
                      const key = breedArray[Number(el.args[0])]
                      breedToCountObj[key]++
                  })
                  console.log(breedToCountObj)
              })
          })
      })
