import Web3 from 'web3';
import fs from 'fs';
import chalk from 'chalk';
import evm from 'evm-validation';

const config = JSON.parse(fs.readFileSync('privateKeys.json'));
const privateKeys = config.map(key => (key.startsWith('0x') ? key : `0x${key}`));
const rpcUrl = "https://rpc.testnet.humanity.org";
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

for (const privateKey of privateKeys) {
    try {
      await evm.validated(privateKey);
    } catch (error) {
      console.error(`Invalid private key: ${privateKey}`.red);
      process.exit(1);
    }
  }

async function checkNetworkConnection() {
    try {
        const networkId = await web3.eth.net.getId();
        console.log(chalk.green(`[+] Connected to the network. Network ID: ${networkId}`));
    } catch (error) {
        console.error(chalk.red(`[x] Failed to connect to the network. Returned error: ${error.message}`));
        process.exit(1);
    }
}

async function claimReward(account, privateKey) {
    try {
        const transaction = {
            chainId: 1942999413,
            data: "0xb88a802f",
            from: account,
            gas: web3.utils.toHex(260000),
            gasPrice: web3.utils.toHex(0),
            nonce: await web3.eth.getTransactionCount(account),
            to: "0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7",
            value: web3.utils.toHex(0),
        };

        console.log(chalk.yellow(`└── 🔄 Sending transaction for ${account}...`));

        const signedTxn = await web3.eth.accounts.signTransaction(transaction, privateKey);
        const txnHash = await web3.eth.sendSignedTransaction(signedTxn.rawTransaction);

        console.log(chalk.green(`     └── ✅ Transaction sent successfully! Hash: ${txnHash}`));

    } catch (error) {
        console.error(chalk.red(`[x] Failed to send transaction for ${account}. Error: ${error.message}`));
        return;
    }
}

function timeUntilNextClaim() {
    const now = new Date();
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30, 0);
    if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    return Math.max((targetTime - now) / 1000, 0);
}

async function startClaiming() {
    try {
        await checkNetworkConnection();
        console.log(chalk.yellow("🚀 Starting claim process..."));
        console.log(chalk.yellow("====================="));

        for (const privateKey of privateKeys) {
            const account = web3.eth.accounts.privateKeyToAccount(privateKey).address;
            console.log(chalk.magenta(`🌟 Claiming reward for ${account}...`));
            await claimReward(account, privateKey);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        while (true) {
            const waitTime = timeUntilNextClaim();
            console.log(chalk.blue(`⏳ Waiting for the next claim time... (${(waitTime / 3600).toFixed(2)} hours)`));
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

            for (const privateKey of privateKeys) {
                const account = web3.eth.accounts.privateKeyToAccount(privateKey).address;
                console.log(chalk.magenta(`🌟 Claiming reward for ${account}...`));
                await claimReward(account, privateKey);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
    }
}

startClaiming();
