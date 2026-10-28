// Package security_test exercises the upstream JOSE parser used by the edge.
// These tests use synthetic RSA parameters, never operator keys or timing limits.
package security_test

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"testing"

	jose "github.com/go-jose/go-jose/v4"
)

func encodedInteger(bits int) string {
	value := new(big.Int).Lsh(big.NewInt(1), uint(bits-1))
	value.SetBit(value, 0, 1)
	return base64.RawURLEncoding.EncodeToString(value.Bytes())
}

// CVE-2026-116587: oversized RSA JWKs must be rejected by the dependency,
// rather than hidden by scanner exceptions or application-only validation.
func TestRSAJWKModulusBoundary(t *testing.T) {
	for _, fixture := range []struct {
		name     string
		bits     int
		rejected bool
	}{
		{"ordinary public key", 2048, false},
		{"maximum public key", 4096, false},
		{"oversized public key", 4097, true},
	} {
		t.Run(fixture.name, func(t *testing.T) {
			raw, err := json.Marshal(map[string]string{
				"kty": "RSA", "n": encodedInteger(fixture.bits), "e": "AQAB",
			})
			if err != nil {
				t.Fatal(err)
			}
			var key jose.JSONWebKey
			err = json.Unmarshal(raw, &key)
			if fixture.rejected {
				if err == nil {
					t.Fatal("oversized RSA JWK was accepted")
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			public, ok := key.Key.(*rsa.PublicKey)
			if !ok || public.N.BitLen() != fixture.bits {
				t.Fatal("supported public key did not retain its modulus")
			}
		})
	}
}

// Bound private primes before RSA validation. The upstream fix must reject this
// malformed input without relying on environment-sensitive elapsed-time tests.
func TestRSAJWKRejectsDisproportionatePrivatePrimes(t *testing.T) {
	raw, err := json.Marshal(map[string]string{
		"kty": "RSA", "n": encodedInteger(2048), "e": "AQAB",
		"d": "Aw", "p": encodedInteger(16384), "q": "Aw",
	})
	if err != nil {
		t.Fatal(err)
	}
	var key jose.JSONWebKey
	if err := json.Unmarshal(raw, &key); err == nil {
		t.Fatal("RSA JWK with disproportionate primes was accepted")
	}
}
