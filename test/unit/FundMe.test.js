const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//Only runs on local network
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function() {
              // deploy our fund me contract using hardhat deploy
              // const accounts = await ethers.getSigners()
              // const account0 = accounts[0]

              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function() {
              it("sets the aggregator addresses properly", async function() {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", function() {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough"
                  )
              })

              it("updates the amount funded data structure", async function() {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("adds funder to the array of the getFunder", async () => {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", function() {
              beforeEach(async function() {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw fund from a single funder", async function() {
                  // arrange
                  const startingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await ethers.provider.getBalance(
                      deployer
                  )
                  // act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt

                  //gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const newFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const newDeployerBalance = await ethers.provider.getBalance(
                      deployer
                  )

                  // assert

                  assert.equal(newFundMeBalance, 0)
                  assert.equal(
                      newDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
              })

              it("allows us to withdraw when there are multiple getFunder", async () => {
                  const accounts = await ethers.getSigners()
                  //Arrange
                  for (let i = 1; i < accounts.length; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )

                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await ethers.provider.getBalance(
                      deployer
                  )

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt

                  //gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const newFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const newDeployerBalance = await ethers.provider.getBalance(
                      deployer
                  )

                  // assert

                  assert.equal(newFundMeBalance, 0)
                  assert.equal(
                      newDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
                  // Make sure the getFunder array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < accounts.length; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function() {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(fundMeConnectedContract.withdraw()).to.be
                      .reverted
              })

              it("Cheaper Withdraw test", async () => {
                  const accounts = await ethers.getSigners()
                  //Arrange
                  for (let i = 1; i < accounts.length; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )

                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await ethers.provider.getBalance(
                      deployer
                  )

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt

                  //gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const newFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const newDeployerBalance = await ethers.provider.getBalance(
                      deployer
                  )

                  // assert

                  assert.equal(newFundMeBalance, 0)
                  assert.equal(
                      newDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
                  // Make sure the getFunder array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < accounts.length; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("cheapWithdraw fund from a single funder", async function() {
                  // arrange
                  const startingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await ethers.provider.getBalance(
                      deployer
                  )
                  // act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt

                  //gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const newFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const newDeployerBalance = await ethers.provider.getBalance(
                      deployer
                  )

                  // assert

                  assert.equal(newFundMeBalance, 0)
                  assert.equal(
                      newDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
              })
          })
      })
