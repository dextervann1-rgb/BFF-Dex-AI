# BFFDex AI & Kingdom Wallet: Strategic Improvement Roadmap

Based on the analysis of the current codebase and the **MaShabak.io** vision, this roadmap outlines the critical enhancements needed to transition from a prototype to a production-ready AI-driven aid routing protocol.

## 1. Core Technical Enhancements

### Persistent Transaction Ledger
- **Current State**: The "History" tab uses static mock data.
- **Improvement**: Implement a database (e.g., Supabase or TiDB) to store all transactions, voice verification metadata, and EAS attestation links.
- **Benefit**: Provides a real-time, immutable audit trail for all aid distributions.

### Automated QuickBooks Sync
- **Current State**: QuickBooks tokens must be manually copied from logs to Vercel environment variables.
- **Improvement**: Implement a server-side token storage and rotation service. Use a secure database to store the `refresh_token` and automate the refresh flow.
- **Benefit**: Removes manual intervention and ensures zero-interruption expense logging.

### Advanced Voice Security
- **Current State**: Simple phrase matching and voice similarity check.
- **Improvement**: Implement "Liveness Detection" to prevent replay attacks and dynamic passphrases that change periodically.
- **Benefit**: Ensures that only a live, authorized person can trigger payments.

## 2. MaShabak Protocol Expansion

### Multi-Steward Governance
- **Current State**: Single-wallet signing.
- **Improvement**: Integrate with a Gnosis Safe (Multisig) for larger distributions. The AI would prepare the transaction, and the Steward Council would sign it.
- **Benefit**: Aligns with the "Steward Council Governance" mentioned in the MaShabak vision deck.

### Real-Time Impact Attestations
- **Current State**: Basic payment attestations.
- **Improvement**: Expand EAS schemas to include "Impact Proofs" (e.g., photo of delivery, vendor confirmation).
- **Benefit**: Provides 100% verified impact transparency for donors.

### Vendor Routing Logic
- **Current State**: Routing to a single "Kingdom Wallet."
- **Improvement**: Implement a "Vendor Registry" where the AI can look up pre-vetted local vendors (hospitals, water wells) and route funds directly to them based on need.
- **Benefit**: Achieves the "Zero Delay" goal by bypassing intermediaries.

## 3. UX & Operational Improvements

### Live Health Dashboard
- **Current State**: Static sidebar indicators.
- **Improvement**: Implement real-time status checks for the Base RPC, ElevenLabs API, and QuickBooks connection.
- **Benefit**: Immediate visibility into system readiness.

### Mobile-First Voice Interface
- **Current State**: Desktop-focused chat interface.
- **Improvement**: Optimize the voice recorder for mobile browsers and add "Push-to-Talk" functionality.
- **Benefit**: Enables field operators to route funds using only their voice while on the ground.

## 4. Implementation Priority

| Priority | Feature | Category | Effort |
| :--- | :--- | :--- | :--- |
| **High** | Real Transaction History | Security/Audit | Medium |
| **High** | Automated QB Rotation | Operations | Medium |
| **Medium** | Vendor Registry | MaShabak Logic | High |
| **Medium** | Multi-Steward Sign-off | Governance | High |
| **Low** | Liveness Detection | Security | High |

---
**Roadmap prepared for Dexter Vann | MaShabak.io**
