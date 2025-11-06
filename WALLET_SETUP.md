# 🔐 EduVault - Web3 Wallet Integration Setup Guide

## 🚀 Quick Start

### Step 1: Get Your WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in to your account
3. Click **"Create New Project"**
4. Give your project a name (e.g., "EduVault")
5. Copy your **Project ID**

### Step 2: Configure Environment Variables

Create a `.env.local` file in the root of your project:

```bash
# In the project root directory
touch .env.local
```

Add your WalletConnect Project ID:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Step 3: Install Dependencies

```bash
pnpm install --legacy-peer-deps
```

### Step 4: Run the Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## ✅ Testing the Wallet Integration

### Test 1: MetaMask Connection (Browser)

**Prerequisites:**
- Install [MetaMask Browser Extension](https://metamask.io/)
- Create or import a wallet
- Get test funds from [Sepolia Faucet](https://sepoliafaucet.com/)

**Steps:**
1. Open the application in your browser
2. Click **"Connect Wallet"** in the navbar
3. In the modal, click **"Choose Your First Wallet"** (if first time)
4. Select **"MetaMask"** from the wallet list
5. MetaMask popup will appear - click **"Connect"**
6. Approve the connection

**Expected Result:**
- Green success message appears
- Your wallet address displays in the navbar (e.g., `0x1234...5678`)
- Balance shows next to your address
- Modal auto-advances to profile setup

### Test 2: WalletConnect (Mobile Wallets)

**Prerequisites:**
- Have a mobile wallet app installed (MetaMask, Trust Wallet, Rainbow, etc.)

**Steps:**
1. Open the application
2. Click **"Connect Wallet"**
3. Select **"WalletConnect"** option
4. QR code appears
5. Open your mobile wallet app
6. Scan the QR code
7. Approve the connection on your phone

**Expected Result:**
- Connection confirmed on both devices
- Wallet address displays
- Can interact with dApp from mobile

### Test 3: Coinbase Wallet

**Prerequisites:**
- Install [Coinbase Wallet Extension](https://www.coinbase.com/wallet) or mobile app

**Steps:**
1. Open the application
2. Click **"Connect Wallet"**
3. Select **"Coinbase Wallet"**
4. Approve connection in Coinbase Wallet

**Expected Result:**
- Connection successful
- Wallet address displays
- Can proceed to profile setup

---

## 🎯 What to Test

### ✅ Connection Flow
- [ ] Click "Connect Wallet" button opens modal
- [ ] Modal shows Step 1: Get a Wallet (educational)
- [ ] Click "Choose Your First Wallet" advances to Step 2
- [ ] All available wallets are displayed
- [ ] Installed wallets show as ready to connect
- [ ] Non-installed wallets show "(Not installed)"
- [ ] Clicking a wallet initiates connection
- [ ] Loading spinner shows during connection
- [ ] Success message appears on successful connection
- [ ] Modal auto-advances to profile setup (Step 3)

### ✅ Connected State
- [ ] Navbar shows connected address (formatted: 0x1234...5678)
- [ ] Green dot indicator shows next to address
- [ ] Balance displays next to address (e.g., "0.123 ETH")
- [ ] Hovering over address shows dropdown menu
- [ ] Dropdown has "View Profile" option
- [ ] Dropdown has "Disconnect" option

### ✅ Profile Setup (Step 3)
- [ ] Can only access after wallet is connected
- [ ] Shows connected wallet address at top
- [ ] If not connected, shows warning message
- [ ] Submit button disabled if not connected
- [ ] All form fields are required
- [ ] Successful submission redirects to dashboard

### ✅ Mobile Responsiveness
- [ ] Modal displays correctly on mobile
- [ ] Wallet buttons are tappable on mobile
- [ ] Connected state shows in mobile menu
- [ ] Balance displays properly on small screens
- [ ] Disconnect works from mobile menu

### ✅ Error Handling
- [ ] Connection rejection shows error message
- [ ] Error message displays in red alert box
- [ ] Can retry connection after error
- [ ] Network errors are caught and displayed
- [ ] User-friendly error messages

### ✅ Disconnection
- [ ] Disconnect from dropdown menu works
- [ ] Disconnect from mobile menu works
- [ ] Modal resets to Step 1 after disconnect
- [ ] Navbar returns to "Connect Wallet" button
- [ ] All wallet state is cleared

---

## 🧪 Test Scenarios

### Scenario 1: First-time User (No Wallet)
1. User clicks "Connect Wallet"
2. Sees Step 1 with wallet options
3. Clicks "I don't have a wallet" link
4. Can learn about wallets

### Scenario 2: User with MetaMask
1. Has MetaMask installed
2. Clicks "Connect Wallet" → "MetaMask"
3. Approves in MetaMask popup
4. Sees success message
5. Completes profile setup
6. Redirected to dashboard

### Scenario 3: Mobile User with WalletConnect
1. Opens site on desktop
2. Selects WalletConnect
3. Scans QR with mobile wallet
4. Approves on phone
5. Connection syncs to desktop
6. Can continue on desktop

### Scenario 4: Connection Error
1. User tries to connect
2. Rejects connection in wallet
3. Error message displays
4. User can try again
5. Second attempt succeeds

### Scenario 5: Switching Wallets
1. User connected with MetaMask
2. Clicks disconnect
3. Reconnects with Coinbase Wallet
4. Different address shows
5. Profile updates accordingly

---

## 🐛 Common Issues & Solutions

### Issue: "WalletConnect QR not showing"
**Solution:** Check that `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set in `.env.local`

### Issue: "MetaMask not detected"
**Solution:** 
- Ensure MetaMask extension is installed
- Try refreshing the page
- Check if MetaMask is unlocked

### Issue: "Connection rejected"
**Solution:** User cancelled in wallet - this is expected behavior. Try again and approve.

### Issue: "Balance not showing"
**Solution:** 
- Ensure wallet has funds
- Wait a few seconds for balance to load
- Check you're on the correct network

### Issue: "Can't proceed to profile setup"
**Solution:** 
- Ensure wallet is actually connected (check for green indicator)
- Try disconnecting and reconnecting
- Check browser console for errors

---

## 📊 Expected Console Messages

When testing, you should see these console messages:

### Successful Connection:
```
✓ Wallet connected: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
✓ Chain ID: 1
✓ Balance loaded: 0.123 ETH
```

### Error Messages:
```
⚠ Connection error: User rejected the request
⚠ Network error: Could not connect to provider
```

---

## 🎉 Success Checklist

Before moving to production, ensure:

- [x] All wallet connections work (MetaMask, WalletConnect, Coinbase)
- [x] Error messages display correctly
- [x] Loading states show properly
- [x] Connected state persists on page refresh
- [x] Disconnection works reliably
- [x] Mobile responsive design works
- [x] Profile setup only accessible when connected
- [x] Balance updates correctly
- [x] All UI elements display correctly

---

## 📝 Notes for Development

### Environment Variables
- Never commit `.env.local` to git
- Use `.env.example` for documentation
- WalletConnect Project ID is safe to expose (it's public)

### Network Configuration
Default networks configured:
- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Polygon (Chain ID: 137)
- Polygon Amoy Testnet (Chain ID: 80002)
- Celo (Chain ID: 42220)
- Celo Alfajores Testnet (Chain ID: 44787)

### Testing on Testnets
Recommended to use **Sepolia** for testing:
- Get free test ETH: https://sepoliafaucet.com/
- No real money needed
- Fast transactions
- Good for development

---

## 🚀 Ready for Testing!

Your Web3 wallet integration is complete and ready to test. Follow the test scenarios above to ensure everything works correctly before deploying to production.

**Happy Testing! 🎊**


