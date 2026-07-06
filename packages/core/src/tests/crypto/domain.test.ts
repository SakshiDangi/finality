import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createSigningDomain,
  createWrapperDomain,
  DEFAULT_SIGNING_DOMAIN,
  ENVIRONMENT_DOMAIN,
  isValidSigningDomain,
  PROTOCOL_DOMAIN,
  WRAPPER_DOMAIN,
} from "../../crypto/domain.js";

describe(
  "crypto/domain",
  () => {
    it(
      "should create deterministic signing domain string",
      () => {
        const result =
          createSigningDomain({
            protocol:
              PROTOCOL_DOMAIN.CORE,

            environment:
              ENVIRONMENT_DOMAIN.DEVELOPMENT,

            version:
              "1.0.0",
          });

        expect(result)
          .toBe(
            "FINALITY_CORE_V1:DEVELOPMENT:1.0.0",
          );
      },
    );

    it(
      "should create wrapper-isolated signing domain",
      () => {
        const result =
          createSigningDomain({
            protocol:
              PROTOCOL_DOMAIN.CORE,

            environment:
              ENVIRONMENT_DOMAIN.PRODUCTION,

            wrapper:
              WRAPPER_DOMAIN.BRIDGE,

            version:
              "1.0.0",
          });

        expect(result)
          .toBe(
            "FINALITY_CORE_V1:PRODUCTION:FINALITY_BRIDGE_WRAPPER_V1:1.0.0",
          );
      },
    );

    it(
      "should create wrapper domain helper",
      () => {
        const result =
          createWrapperDomain(
            WRAPPER_DOMAIN.TETHER,
          );

        expect(result)
          .toEqual({
            protocol:
              PROTOCOL_DOMAIN.CORE,

            environment:
              ENVIRONMENT_DOMAIN.DEVELOPMENT,

            wrapper:
              WRAPPER_DOMAIN.TETHER,

            version:
              "1.0.0",
          });
      },
    );

    it(
      "should create wrapper domain with custom environment",
      () => {
        const result =
          createWrapperDomain(
            WRAPPER_DOMAIN.CROO,
            ENVIRONMENT_DOMAIN.STAGING,
          );

        expect(result.environment)
          .toBe(
            ENVIRONMENT_DOMAIN.STAGING,
          );

        expect(result.wrapper)
          .toBe(
            WRAPPER_DOMAIN.CROO,
          );
      },
    );

    it(
      "should expose default signing domain",
      () => {
        expect(
          DEFAULT_SIGNING_DOMAIN,
        ).toEqual({
          protocol:
            PROTOCOL_DOMAIN.CORE,

          environment:
            ENVIRONMENT_DOMAIN.DEVELOPMENT,

          version:
            "1.0.0",
        });
      },
    );

    it(
      "should validate valid signing domain",
      () => {
        const result =
          isValidSigningDomain({
            protocol:
              PROTOCOL_DOMAIN.SETTLEMENT,

            environment:
              ENVIRONMENT_DOMAIN.PRODUCTION,

            version:
              "1.0.0",
          });

        expect(result)
          .toBe(true);
      },
    );

    it(
      "should reject null signing domain",
      () => {
        const result =
          isValidSigningDomain(
            null,
          );

        expect(result)
          .toBe(false);
      },
    );

    it(
      "should reject invalid signing domain",
      () => {
        const result =
          isValidSigningDomain({
            protocol: 123,
            environment: true,
            version: [],
          });

        expect(result)
          .toBe(false);
      },
    );

    it(
      "should reject missing version",
      () => {
        const result =
          isValidSigningDomain({
            protocol:
              PROTOCOL_DOMAIN.CORE,

            environment:
              ENVIRONMENT_DOMAIN.LOCAL,
          });

        expect(result)
          .toBe(false);
      },
    );
  },
);