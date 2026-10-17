// Subscription validation service for checking license expiration
// Handles both old (license-verifier) and new (license-validator) API formats
// Supports Razorpay and Whop providers with onetime and subscription types

const NEW_API_URL = 'https://api.swiftools.com/license-validator';
const PRODUCT_NAME = 'charts-pro';

/**
 * Validates subscription based on API response data
 * Supports both old and new response formats for backward compatibility
 * @param {Object} data - License verification API response
 * @returns {Object} Validation result with valid flag, type, reason, etc.
 */
export const validateSubscription = (data) => {
    // 1. Base validation check
    if (data.valid !== true) {
        return {
            valid: false,
            reason: data.message || 'License not valid',
            shouldRevoke: true
        };
    }

    // 2. Detect license type (new API has explicit 'type' field)
    const licenseType = data.type; // "onetime" | "subscription" | undefined (old format)
    const isSubscription = data.is_subscription === true;

    // 3. Check for lifetime/onetime license (no expiration)
    // New API: type === "onetime" with expires_at === null
    // Old API: status === "completed" with no renewal periods
    const isLifetime =
        (licenseType === 'onetime' && data.expires_at === null) ||
        (data.status === 'completed' &&
            data.renewal_period_end === null &&
            data.renewal_period_start === null &&
            data.expires_at === undefined);

    if (isLifetime) {
        return {
            valid: true,
            type: 'lifetime',
            provider: data.provider || 'unknown',
            reason: 'Lifetime license - no expiration'
        };
    }

    // 4. Get expiration date (support both old and new field names)
    // New API: expires_at (Unix timestamp in seconds)
    // Old API: renewal_period_end (Unix timestamp in seconds)
    const expirationTimestamp = data.expires_at ?? data.renewal_period_end;

    // 5. Check active subscriptions
    if (data.status === 'active') {
        if (expirationTimestamp) {
            const expiresAt = new Date(expirationTimestamp * 1000);
            const now = new Date();

            if (now > expiresAt) {
                return {
                    valid: false,
                    reason: 'Subscription has expired',
                    shouldRevoke: true
                };
            }

            return {
                valid: true,
                type: isSubscription ? 'subscription' : 'onetime',
                provider: data.provider || 'unknown',
                expiresAt: expiresAt,
                reason: 'Active subscription'
            };
        } else {
            // Active but no expiration (shouldn't happen for subscription, but handle gracefully)
            return {
                valid: true,
                type: isSubscription ? 'subscription' : 'lifetime',
                provider: data.provider || 'unknown',
                reason: 'Active license (no expiration data)'
            };
        }
    }

    // 6. Handle "completed" status (could be lifetime or ended subscription)
    if (data.status === 'completed' || data.status_raw === 'completed' || data.status_raw === 'paid') {
        if (expirationTimestamp) {
            const expiresAt = new Date(expirationTimestamp * 1000);
            if (new Date() > expiresAt) {
                return {
                    valid: false,
                    reason: 'Subscription expired',
                    shouldRevoke: true
                };
            }
            return {
                valid: true,
                type: 'subscription',
                provider: data.provider || 'unknown',
                expiresAt: expiresAt,
                reason: 'Completed status with valid period'
            };
        }
        // No expiration = lifetime
        return {
            valid: true,
            type: 'lifetime',
            provider: data.provider || 'unknown',
            reason: 'Completed status (lifetime or one-time purchase)'
        };
    }

    // 7. Invalid status (cancelled, expired, etc.)
    return {
        valid: false,
        reason: `Invalid subscription status: ${data.status || data.status_raw || 'unknown'}`,
        shouldRevoke: true
    };
};

/**
 * Validates cached license data for offline mode
 * Supports both old and new cached data formats
 * @param {Object} licenseData - Cached license data
 * @returns {Object} Validation result
 */
export const validateCachedLicense = (licenseData) => {
    try {
        // Check if cached validation is recent (within 24 hours)
        const lastValidated = new Date(licenseData.lastValidated);
        const hoursSinceValidation = (new Date() - lastValidated) / (1000 * 60 * 60);

        if (hoursSinceValidation > 24) {
            return {
                valid: false,
                reason: 'Cached license data too old, need re-validation',
                shouldRevoke: false // Don't revoke, just require re-validation
            };
        }

        // Determine license type (support both old and new field names)
        const subscriptionType = licenseData.subscription_type || licenseData.type;

        // For lifetime licenses, always allow (even offline)
        if (subscriptionType === 'lifetime' || subscriptionType === 'onetime') {
            // For onetime, check if it has no expiration
            const hasNoExpiration = !licenseData.expiresAt && !licenseData.expires_at;
            if (subscriptionType === 'lifetime' || hasNoExpiration) {
                return {
                    valid: true,
                    type: 'lifetime',
                    reason: 'Lifetime license (offline)'
                };
            }
        }

        // Get expiration date (support both old and new field names)
        const expiresAtValue = licenseData.expiresAt || licenseData.expires_at;

        // For subscriptions, check expiration date
        if (expiresAtValue) {
            // Handle both ISO string and Unix timestamp
            let expiresAt;
            if (typeof expiresAtValue === 'number') {
                expiresAt = new Date(expiresAtValue * 1000);
            } else {
                expiresAt = new Date(expiresAtValue);
            }

            if (new Date() > expiresAt) {
                return {
                    valid: false,
                    reason: 'Subscription expired (cached check)',
                    shouldRevoke: true
                };
            }
        }

        // Check renewal_period_end from cache (old format)
        if (licenseData.renewal_period_end) {
            const renewalEnd = new Date(licenseData.renewal_period_end * 1000);
            if (new Date() > renewalEnd) {
                return {
                    valid: false,
                    reason: 'Renewal period ended (cached check)',
                    shouldRevoke: true
                };
            }
        }

        return {
            valid: true,
            type: subscriptionType || 'subscription',
            reason: 'Valid cached subscription (offline)'
        };

    } catch (error) {
        return {
            valid: false,
            reason: 'Error parsing cached license data',
            shouldRevoke: false
        };
    }
};

/**
 * Re-validates subscription with server using new API
 * @param {string} licenseKey - License key to validate
 * @returns {Promise<Object>} Validation result with full license data
 */
export const revalidateSubscription = async (licenseKey) => {
    try {
        const response = await fetch(NEW_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                license_identifier: licenseKey,
                product_name: PRODUCT_NAME
            }),
        });

        if (!response.ok) {
            throw new Error(`Verification request failed: ${response.status}`);
        }

        const data = await response.json();
        const validation = validateSubscription(data);

        return {
            ...validation,
            licenseData: data,
            success: true
        };
    } catch (error) {
        return {
            success: false,
            valid: false,
            error: error.message
        };
    }
};
