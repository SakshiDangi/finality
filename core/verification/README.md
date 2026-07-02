Verification Flow:
incoming transport packet
        ↓
transport schema validation
        ↓
request schema validation
        ↓
timestamp validation
        ↓
signature verification
        ↓
nonce/replay validation
        ↓
settlement transition validation
        ↓
attestation verification
        ↓
protocol acceptance


Validation Flow:
validate schema
    ↓
validate timestamp
    ↓
validate nonce
    ↓
validate sender
    ↓
validate requestId
    ↓
verify signature
    ↓
return deterministic result

Validation Rules: 
Your validator should reject:
Failure             	Why
missing timestamp	malformed request
invalid timestamp	corrupted payload
stale timestamp	        replay risk
future timestamp	time manipulation
non-finite timestamp	unsafe parsing

# Production Validation Flow:
request.timestamp
        ↓
numeric validation
        ↓
current time comparison
        ↓
skew calculation
        ↓
freshness decision
        ↓
deterministic validation result