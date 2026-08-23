<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Verifies Google ID tokens presented by the sign-in button.
 *
 * The token is checked locally against Google's published signing keys, so a
 * forged or altered credential is rejected without trusting anything the
 * client tells us about itself.
 */
class GoogleTokenVerifier
{
    /**
     * Where Google publishes the public keys its ID tokens are signed with.
     */
    private const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    private const CACHE_KEY = 'google:oauth-certs';

    /**
     * Issuers Google uses in the `iss` claim.
     */
    private const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

    /**
     * Verify an ID token and return its claims, or null when it cannot be
     * trusted for any reason.
     *
     * @return array<string, mixed>|null
     */
    public function verify(string $idToken): ?array
    {
        $clientId = (string) config('services.google.client_id');

        if ($clientId === '') {
            Log::warning('Google sign-in attempted without GOOGLE_CLIENT_ID configured.');

            return null;
        }

        $keys = $this->signingKeys();

        if ($keys === null) {
            return null;
        }

        try {
            $claims = (array) JWT::decode($idToken, $keys);
        } catch (\Throwable $e) {
            // Signature, expiry, and malformed-token failures all land here.
            Log::info('Rejected a Google ID token.', ['error' => $e->getMessage()]);

            return null;
        }

        // The token must have been minted for this application, by Google,
        // for an address Google itself has confirmed.
        if (! in_array($claims['iss'] ?? '', self::ISSUERS, true)) {
            return null;
        }

        if (($claims['aud'] ?? null) !== $clientId) {
            return null;
        }

        if (empty($claims['email']) || empty($claims['email_verified'])) {
            return null;
        }

        return $claims;
    }

    /**
     * Google's current signing keys, cached so that every sign-in does not
     * re-fetch them. Keys rotate, so the cache is deliberately short-lived.
     *
     * @return array<string, Key>|null
     */
    private function signingKeys(): ?array
    {
        $jwks = Cache::remember(self::CACHE_KEY, now()->addHour(), function () {
            try {
                $response = Http::timeout(10)->get(self::CERTS_URL);

                return $response->successful() ? $response->json() : null;
            } catch (\Throwable $e) {
                // An unreachable Google — DNS, TLS, or a firewall — must fail
                // the sign-in, not surface as an unhandled 500.
                Log::warning('Could not reach Google to fetch signing keys.', [
                    'error' => $e->getMessage(),
                ]);

                return null;
            }
        });

        if (! is_array($jwks) || empty($jwks['keys'])) {
            // Do not cache a failed fetch: the next attempt should retry.
            Cache::forget(self::CACHE_KEY);
            Log::warning('Could not retrieve Google signing keys.');

            return null;
        }

        try {
            return JWK::parseKeySet($jwks);
        } catch (\Throwable $e) {
            Cache::forget(self::CACHE_KEY);
            Log::warning('Could not parse Google signing keys.', ['error' => $e->getMessage()]);

            return null;
        }
    }
}
