# 🚀 Arcium Localnet Setup Guide

## Date: October 26, 2025

---

## 📋 Complete Setup Instructions for Local Testing

This guide will help you set up Arcium localnet on your local machine to test the poker program with MPC integration in a clean environment (no corrupted MXE accounts).

---

## ✅ Prerequisites

Before setting up Arcium localnet, you need these installed:

### 1. Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version  # Verify installation
```

### 2. Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version  # Verify installation
solana-keygen new  # Generate keypair if you haven't
```

### 3. Yarn
```bash
npm install -g yarn
# OR using corepack (if you have Node.js 16.10+)
corepack enable
yarn --version  # Verify installation
```

### 4. Anchor (Version 0.31.1 - IMPORTANT!)

**⚠️ Critical: Arcium does NOT support Anchor 0.32.1. You MUST use 0.31.1!**

```bash
# Install Anchor Version Manager (AVM)
cargo install --git https://github.com/coral-xyz/anchor avm --force

# Install Anchor 0.31.1
avm install 0.31.1
avm use 0.31.1

# Verify version
anchor --version
# Should show: anchor-cli 0.31.1
```

### 5. Docker

Check if Docker is already installed:
```bash
docker --version
```

If not installed:
```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER
newgrp docker  # Apply group change

# Test Docker
docker run hello-world
```

### 6. Docker Compose

**Method 1: Manual Installation (Recommended if apt fails)**

```bash
# Set up directory for Docker CLI plugins
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins

# Download latest Docker Compose
# Check https://github.com/docker/compose/releases for latest version
curl -SL https://github.com/docker/compose/releases/download/v2.40.1/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose

# Make it executable
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# Verify installation
docker compose version
# Should show: Docker Compose version v2.40.1
```

**Method 2: Install from Docker's official repository**

```bash
# Add Docker's official GPG key
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Compose plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify
docker compose version
```

---

## 🔧 Install Arcium CLI

### Quick Install (Recommended)

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash

# Reload your shell or run:
source ~/.bashrc  # or ~/.zshrc

# Verify installation
arcium --version
```

The installer will:
- Check all dependencies
- Download `arcup` (Arcium version manager)
- Install the Arcium CLI
- Pull Docker images for Arx Node

---

## ⚙️ Configure for Localnet

### 1. Update Anchor.toml

Add timeout configuration to prevent localnet startup failures:

```toml
[test]
startup_wait = 200000  # 200 seconds - gives validator time to start
```

Your complete `Anchor.toml` should look like:

```toml
[toolchain]
package_manager = "yarn"

[features]
resolution = true
skip-lint = false

[programs.localnet]
arcium_poker = "GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT"

[programs.devnet]
arcium_poker = "GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 \"tests/**/*.ts\""

[test]
startup_wait = 200000
```

### 2. Check Rust Toolchain

Ensure you're using the correct Rust version from `rust-toolchain.toml`:

```bash
cat rust-toolchain.toml
```

Should show:
```toml
[toolchain]
channel = "1.79.0"
```

---

## 🎯 Start Arcium Localnet

### Option 1: Using Arcium CLI (Simplest)

```bash
cd /home/a/arcium_poker

# Start Arcium localnet
arcium localnet
```

This command:
- Starts Solana localnet validator
- Starts Arcium MXE services in Docker containers
- Deploys Arcium programs to localnet

**Keep this terminal open!** Localnet runs in the foreground.

### Option 2: Using Anchor (For debugging)

```bash
# In one terminal
anchor localnet

# This will show more detailed logs if there are issues
```

---

## 🏗️ Deploy Your Program to Localnet

In a **new terminal** (keep localnet running):

```bash
cd /home/a/arcium_poker

# Build the program
anchor build

# Deploy to localnet
anchor deploy --provider.cluster localnet

# Copy the program ID from output
# Should match: GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT
```

---

## 🎲 Initialize MXE for Localnet

After deploying your program, initialize the MXE account:

```bash
arcium init-mxe \
  --callback-program GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT \
  --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  -u localnet
```

**Expected output:**
```
✅ MXE account initialized successfully
MXE address: <some-address>
```

### Verify MXE Account

```bash
arcium mxe-info GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT -u localnet
```

Should show:
```
Authority: <your-pubkey>
Cluster offset: 1078779259
Computation definition offsets: [1]
```

---

## 🧪 Run Tests

Now you can test your poker game with full MPC integration:

```bash
# Run Anchor tests
anchor test --skip-local-validator

# Or run specific test file
yarn run ts-mocha -p ./tsconfig.json tests/arcium_poker.ts
```

**Note:** Use `--skip-local-validator` because localnet is already running.

---

## 🎮 Test Your Poker Game

### Create and Initialize a Game

```typescript
// In your test or frontend code
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { getMXEAccAddress } from '@arcium-hq/reader';

// Connect to localnet
const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

// Your program ID
const POKER_PROGRAM_ID = new PublicKey("GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT");
const ARCIUM_PROGRAM_ID = new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6");

// Derive MXE account (should match init-mxe output)
const mxeAccount = getMXEAccAddress(POKER_PROGRAM_ID);

// Initialize game
const gameId = new BN(1);
const [gamePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("game"), wallet.publicKey.toBuffer(), gameId.toArrayLike(Buffer, "le", 8)],
  POKER_PROGRAM_ID
);

await program.methods
  .initializeGame(
    gameId,
    new BN(10),   // small blind
    new BN(20),   // big blind
    new BN(100),  // min buy-in
    new BN(1000), // max buy-in
    6             // max players
  )
  .accounts({
    game: gamePda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log("✅ Game initialized:", gamePda.toBase58());
```

### Join and Start Game

```typescript
// Players join
await program.methods
  .joinGame(new BN(500))  // buy-in amount
  .accounts({
    game: gamePda,
    playerState: playerPda,
    player: playerWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Start game (triggers MPC shuffle!)
await program.methods
  .startGame(playerEntropy)  // Array of [u8; 32] for each player
  .accounts({
    game: gamePda,
    authority: authorityWallet.publicKey,
    mxeProgram: ARCIUM_PROGRAM_ID,
    mxeAccount: mxeAccount,
    // ... all other accounts as shown in FINAL_DEPLOYMENT_NEW_PROGRAM.md
  })
  .remainingAccounts(playerAccounts)
  .rpc();

console.log("🎉 Game started with MPC shuffle!");
```

---

## 🐛 Troubleshooting

### Issue: "Timeout: Solana localnet did not come online"

**Solution:**
- Add `startup_wait = 200000` to `[test]` section in `Anchor.toml`
- Ensure no other validator is running on port 8899
- Check Docker containers are running: `docker ps`

### Issue: "Anchor version not supported"

**Solution:**
```bash
# Switch to Anchor 0.31.1
avm use 0.31.1
anchor --version
```

### Issue: "docker compose: command not found"

**Solution:**
- Try `docker-compose` (with hyphen) instead
- Or install manually using Method 1 above

### Issue: "Error 3012 (AccountNotInitialized)"

**Solution:**
- This shouldn't happen on localnet (clean environment)
- Verify MXE was initialized: `arcium mxe-info <program-id> -u localnet`
- Ensure you're using the correct program ID everywhere

### Issue: Docker permission denied

**Solution:**
```bash
sudo usermod -aG docker $USER
newgrp docker
# Or reboot your system
```

---

## 🔄 Stop and Restart Localnet

### Stop Localnet

Press `Ctrl+C` in the terminal running `arcium localnet`

Or if using Docker:
```bash
docker compose down
# Or
docker stop $(docker ps -q)
```

### Restart Fresh Localnet

```bash
# Start localnet again
arcium localnet

# In new terminal, redeploy
anchor deploy --provider.cluster localnet

# Re-initialize MXE
arcium init-mxe \
  --callback-program GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT \
  --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  -u localnet
```

---

## 📊 Expected Workflow

1. **Install prerequisites** (one-time setup)
2. **Install Arcium CLI** (one-time setup)
3. **Configure Anchor.toml** (one-time setup)
4. **Start localnet**: `arcium localnet` (every session)
5. **Deploy program**: `anchor deploy --provider.cluster localnet` (after code changes)
6. **Initialize MXE**: `arcium init-mxe ...` (after deploy)
7. **Run tests**: `anchor test --skip-local-validator`
8. **Iterate**: Make changes, rebuild, redeploy, test

---

## ✅ Benefits of Localnet Testing

- **Clean environment**: No corrupted MXE accounts
- **Fast iteration**: Deploy and test instantly (no devnet wait)
- **Free SOL**: Local validator provides unlimited SOL
- **Full MPC integration**: Test real Arcium computations
- **Debugging**: More detailed logs and control

---

## 🆘 Still Having Issues?

If you encounter problems not covered here:

1. **Check Arcium docs**: https://docs.arcium.com
2. **Verify all versions**:
   ```bash
   anchor --version  # Should be 0.31.1
   solana --version
   docker --version
   docker compose version
   arcium --version
   ```
3. **Check Docker logs**:
   ```bash
   docker compose logs
   ```
4. **Try Anchor localnet directly**:
   ```bash
   anchor localnet  # More detailed error messages
   ```

---

## 📚 Related Documentation

- Main blocker doc: `ARCIUM_MPC_BLOCKERS_AND_SOLUTIONS.md`
- Deployment info: `FINAL_DEPLOYMENT_NEW_PROGRAM.md`
- Frontend integration: `FRONTEND_UPDATES_REQUIRED.md`
- Quick reference: `MPC_QUICK_REFERENCE.md`

---

**Ready to test? Let's start localnet!** 🚀
