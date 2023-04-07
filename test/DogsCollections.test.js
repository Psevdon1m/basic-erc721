const { assert, expect } = require("chai")
const { ethers, network, deployments } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Dogs Collection Unit Test", () => {
          let dogsCollection, deployer
          beforeEach(async () => {
              let accounts = await ethers.getSigners()

              deployer = accounts[0]
              await deployments.fixture("dogscollection")
              dogsCollection = await ethers.getContract("DogsCollection")
          })
          describe("Constructor", () => {
              it("Intis Dogs Collection Contract", async () => {
                  const name = await dogsCollection.name()
                  const symbol = await dogsCollection.symbol()
                  const id = await dogsCollection.getTokenCounter()
                  assert(name, "Doggy")
                  assert(symbol, "DOG")
                  assert(id.toString(), "0")
              })
          })
          describe("Minting", () => {
              beforeEach(async () => {
                  let tx = await dogsCollection.mintDog()
                  await tx.wait()
              })
              it("it changes the last token id", async () => {
                  const id = await dogsCollection.getTokenCounter()
                  expect(id.toString()).to.not.equal("0")
              })
              it("updates buyer's balance", async () => {
                  const balance = await dogsCollection.balanceOf(deployer.address)
                  const owner = await dogsCollection.ownerOf("0")

                  assert(balance.toString(), "1")
                  assert(owner, deployer.address)
              })
          })
      })
