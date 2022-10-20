const { getNamedAccounts } = require("hardhat")

async function main() {
    const deployer = (await getNamedAccounts()).deployer
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("funding contract...")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)

    console.log("Withdraw successful")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
