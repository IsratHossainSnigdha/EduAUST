<?php

namespace App\Services;

use App\Models\User;

/**
 * Minimal, dependency-free HS256 JSON Web Token implementation.
 *
 * Issues short-lived access tokens and (for "remember me") longer-lived
 * refresh tokens, all signed with the application's JWT secret.
 */
class JwtService
{
    /**
     * Issue an access token — plus a refresh token when "remember me" is set —
     * for the given user.
     *
     * @return array<string, mixed>
     */
    public function tokensFor(User $user, bool $remember = false): array
    {
        $accessTtl = (int) config('services.jwt.access_ttl');

        $response = [
            'token_type' => 'Bearer',
            'access_token' => $this->encode([
                'sub' => $user->id,
                'email' => $user->email,
                'type' => 'access',
            ], $accessTtl),
            'expires_in' => $accessTtl,
        ];

        if ($remember) {
            $refreshTtl = (int) config('services.jwt.refresh_ttl');
            $response['refresh_token'] = $this->encode([
                'sub' => $user->id,
                'type' => 'refresh',
            ], $refreshTtl);
            $response['refresh_expires_in'] = $refreshTtl;
        }

        return $response;
    }

    /**
     * Encode a signed JWT with the given claims and lifetime (seconds).
     *
     * @param  array<string, mixed>  $claims
     */
    public function encode(array $claims, int $ttl): string
    {
        $now = time();
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $payload = array_merge($claims, [
            'iat' => $now,
            'exp' => $now + $ttl,
        ]);

        $segments = [
            $this->base64UrlEncode(json_encode($header)),
            $this->base64UrlEncode(json_encode($payload)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $this->secret(), true);
        $segments[] = $this->base64UrlEncode($signature);

        return implode('.', $segments);
    }

    /**
     * Verify a token's signature and expiry, returning its claims or null.
     *
     * @return array<string, mixed>|null
     */
    public function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        $expected = hash_hmac('sha256', "$header.$payload", $this->secret(), true);
        if (! hash_equals($expected, $this->base64UrlDecode($signature))) {
            return null;
        }

        $claims = json_decode($this->base64UrlDecode($payload), true);
        if (! is_array($claims)) {
            return null;
        }

        if (isset($claims['exp']) && time() >= (int) $claims['exp']) {
            return null;
        }

        return $claims;
    }

    /**
     * The signing secret for HS256.
     */
    private function secret(): string
    {
        return (string) (config('services.jwt.secret') ?: config('app.key'));
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        return (string) base64_decode(strtr($data, '-_', '+/'), true);
    }
}
