import type {
Envelope,
} from "../base/envelope.js";

import type {
HashDigest,
} from "../base/primitives.js";

import {
verifyEnvelopeSignature,
type SignatureVerificationResult,
} from "../verification/signature.js";

import {
verifyTimestamp,
type TimestampVerificationResult,
} from "../verification/timestamp.js";

import {
detectReplay,
type ReplayDetectionResult,
type ReplayDetectorContext,
} from "../replay/replay-detector.js";

export interface RequestVerifierContext
extends ReplayDetectorContext {
/**

* Deterministic runtime time.
  */
  currentTime:
  number;
  }

  export interface RequestVerificationResult {
/**

* Verification success state.
  */
  success:
  boolean;

/**

* Deterministic request digest.
  */
  digest?:
  HashDigest;

/**

* Signature verification result.
  */
  signature:
  SignatureVerificationResult;

/**

* Timestamp verification result.
  */
  timestamp:
  TimestampVerificationResult;

/**

* Replay verification result.
  */
  replay?:
  ReplayDetectionResult;

/**

* Human-readable diagnostics.
  */
  reason?:
  string;
  }


  export function verifyRequest(
envelope:
Envelope,

context:
RequestVerifierContext,
): RequestVerificationResult {
/* =====================================

* STEP 1
* SIGNATURE VERIFICATION
* ===================================*/

const signature =
verifyEnvelopeSignature(
envelope,
);

if (
!signature.success
) {
return {
success: false,

  digest:
    signature.digest,

  signature,

  timestamp: {
    success: false,
  },

  reason:
    signature.reason,
};

}

/* =====================================

* STEP 2
* TIMESTAMP VERIFICATION
* ===================================*/

const timestamp =
verifyTimestamp(
envelope,
context.currentTime,
);

if (
!timestamp.success
) {
return {
success: false,

  digest:
    signature.digest,

  signature,

  timestamp,

  reason:
    timestamp.reason,
};
}

/* =====================================

* STEP 3
* REPLAY DETECTION
* ===================================*/

const replay =
detectReplay(
envelope,
context,
);

if (
!replay.success
) {
return {
success: false,

  digest:
    replay.digest,

  signature,

  timestamp,

  replay,

  reason:
    replay.reason,
};
}

/* =====================================

* SUCCESS
* ===================================*/

return {
success: true,

digest:
  replay.digest,

signature,

timestamp,

replay,
};
}
