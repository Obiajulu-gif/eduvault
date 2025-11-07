# EduVault - Decentralized Educational Materials Sharing Platform

EduVault is an application that allows users to upload educational materials, mint them as NFTs on the Celo Sepolia testnet, and share them with others.
### EduVault Homepage
![Explorer Image](public/homepage.png)

## Features

-   **Decentralized File Storage:** Uploaded documents are stored on IPFS using Pinata, ensuring that the content is decentralized and resilient.
-   **NFT Minting:** Each uploaded document is minted as an NFT on the Celo Sepolia testnet, providing a verifiable record of ownership and authenticity.
-   **Web3 Wallet Integration:** Users can connect their wallets using WalletConnect, MetaMask, or Coinbase Wallet to interact with the platform.
-   **Browse and Discover:** Users can browse and discover educational materials uploaded by others.

### EduVault Explorer
![Explorer Image](public/explorer-image.png)

## Technologies Used

-   **Frontend:** Next.js, React, Tailwind CSS
-   **Web3:** wagmi, viem, RainbowKit, Web3Modal
-   **Decentralized Storage:** IPFS, Pinata
-   **Smart Contracts:** Solidity, OpenZeppelin
-   **Database:** MongoDB

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm, yarn, pnpm, or bun
-   A Web3 wallet (e.g., MetaMask)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Obiajulu-gif/eduvault
    ```
2.  Navigate to the project directory:
    ```bash
    cd eduvault
    ```
3.  Install the dependencies:
    ```bash
    pnpm install
    ```

### Running the Application

1.  Create a `.env` file in the root of the project and add the required environment variables 

```bash
MONGODB_URI=''
JWT_SECRET=''

# Email Configuration
EMAIL_USER=''
EMAIL_PASS=''
NEXT_PUBLIC_APP_URL=http://localhost:3000

BLOB_READ_WRITE_TOKEN=""
PINATA_API_KEY=""
PINATA_API_SECRET=""
PINATA_JWT=""

```
2.  Run the development server:
    ```bash
    pnpm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.


## Smart Contract

The `EduVault` NFT smart contract is deployed on the **Celo Sepolia testnet** at the following address:

**`0x3f48520ca0d8d51345b416b5a3e083dac8790f55`**

You can view the contract on the [Celo Sepolia Block Explorer](https://celo-sepolia.blockscout.com/address/0x3f48520ca0d8d51345b416b5a3e083dac8790f55).

