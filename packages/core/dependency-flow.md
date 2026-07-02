schemas
    ↓
crypto
    ↓
verification
    ↓
replay
    ↓
settlement
    ↓
transport



# core/crypto
serialization (deterministic bytes)
hashing (deterministic identity)
wallet generation  (identitiy generation)
signing  (authorization)
verification (signature validation)


# core/verification
request validation
timestamp validation
signature validation
replay validation
state transition validation

# core/replay
nonce tracking
replay windows
replay state
deduplication

# core/settlement
state machine
finality
transitions
settlement truth

# core/transport
packet handling
routing
deserialization
network safety

# core/storage
persistent state
event logs
replay persistence
settlement persistence

//signing flow architecture
request object
    ↓
canonical serialization
    ↓
UTF-8 bytes
    ↓
keccak256 hash
    ↓
sign digest
    ↓
signature output