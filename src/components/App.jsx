// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import '@spectrum-web-components/icons-workflow/icons/sp-icon-more.js';

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Theme } from "@swc-react/theme";
import React, { useEffect, useState, Suspense, useMemo, useCallback } from "react";
import ChartGenerator from "./ChartGenerator/ChartGenerator";
import Confetti from "./Confetti/Confetti";
import WhatsAppSupportWidget from "./WhatsAppSupportWidget/WhatsAppSupportWidget";
import { fetchDynamicConfig, fetchFlagsDirect } from "../services/configService";
import { revalidateSubscription, validateCachedLicense } from "../services/subscriptionValidationService";
import { sendDirectNotification } from "../services/notificationService";
import "./App.css";

const App = ({ addOnUISdk, sandboxProxy }) => {
    const [isPro, setIsPro] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerLicenseKey, setDrawerLicenseKey] = useState('');
    const [drawerLicenseError, setDrawerLicenseError] = useState('');
    const [drawerLicenseLoading, setDrawerLicenseLoading] = useState(false);
    const [flagsData, setFlagsData] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiKey, setConfettiKey] = useState(0);
    const [adobeUserType, setAdobeUserType] = useState("free");
    const [emailModalEnabled, setEmailModalEnabled] = useState(false);
    const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);

    // Inject styles for Spectrum menu items to handle shadow DOM
    useEffect(() => {
        const styleId = 'spectrum-menu-item-padding';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                sp-menu-item {
                    --spectrum-menu-item-padding-left: 20px !important;
                    --spectrum-menu-item-padding-right: 16px !important;
                    --spectrum-menu-item-padding-top: 12px !important;
                    --spectrum-menu-item-padding-bottom: 12px !important;
                }
                /* Try to target shadow DOM content */
                sp-menu-item::part(content),
                sp-menu-item::part(text) {
                    padding-left: 20px !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Also try to apply styles directly to elements after they're created
        const observer = new MutationObserver(() => {
            const menuItems = document.querySelectorAll('sp-menu-item');
            menuItems.forEach(item => {
                if (item.shadowRoot) {
                    const style = document.createElement('style');
                    style.textContent = `
                        :host {
                            --spectrum-menu-item-padding-left: 20px !important;
                            --spectrum-menu-item-padding-right: 16px !important;
                            --spectrum-menu-item-padding-top: 12px !important;
                            --spectrum-menu-item-padding-bottom: 12px !important;
                        }
                        .item {
                            padding-left: 20px !important;
                            padding-right: 16px !important;
                            padding-top: 12px !important;
                            padding-bottom: 12px !important;
                        }
                    `;
                    if (!item.shadowRoot.querySelector('style[data-custom-padding]')) {
                        style.setAttribute('data-custom-padding', 'true');
                        item.shadowRoot.appendChild(style);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    // Fetch configuration on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Check if online
                if (!navigator.onLine) {
                    setEmailModalEnabled(false);
                    // Still try to load project config if cached
                    try {
                        const directResult = await fetchFlagsDirect();
                        if (directResult.success) {
                            setFlagsData(directResult.data);
                        }
                    } catch (e) {
                        // Silent fail for offline
                    }
                    return;
                }

                // Helper function to fetch common config
                const fetchCommonConfig = async () => {
                    try {
                        const response = await fetch('https://configs.swiftools.com/flags/shared/common-flags.json');
                        if (!response.ok) {
                            return null;
                        }
                        const text = await response.text();
                        return JSON.parse(text);
                    } catch (error) {
                        console.error('Failed to fetch common config:', error);
                        return null;
                    }
                };

                // Try dynamic configuration first
                const dynamicResult = await fetchDynamicConfig();

                if (dynamicResult.success) {
                    const projectConfig = dynamicResult.data;

                    // Fetch common config for email modal check
                    const commonConfig = await fetchCommonConfig();

                    if (commonConfig) {
                        // Check both isEnabled flags
                        const commonEnabled = commonConfig.flags?.adobe_express_integration?.free_access_popup?.isEnabled;
                        const projectEnabled = projectConfig.flags?.free_access_popup?.isEnabled;

                        // Both must be true for email modal
                        const modalEnabled = commonEnabled === true && projectEnabled === true;
                        setEmailModalEnabled(modalEnabled);
                    } else {
                        setEmailModalEnabled(false);
                    }

                    // Set flagsData from project config
                    setFlagsData(projectConfig);
                } else {
                    // Fallback to direct fetch
                    const directResult = await fetchFlagsDirect();

                    if (directResult.success) {
                        const projectConfig = directResult.data;

                        // Fetch common config for email modal check
                        const commonConfig = await fetchCommonConfig();

                        if (commonConfig) {
                            // Check both isEnabled flags
                            const commonEnabled = commonConfig.flags?.adobe_express_integration?.free_access_popup?.isEnabled;
                            const projectEnabled = projectConfig.flags?.free_access_popup?.isEnabled;

                            // Both must be true for email modal
                            const modalEnabled = commonEnabled === true && projectEnabled === true;
                            setEmailModalEnabled(modalEnabled);
                        } else {
                            setEmailModalEnabled(false);
                        }

                        // Set flagsData from project config
                        setFlagsData(projectConfig);
                    } else {
                        console.error('Both dynamic and direct config failed:', {
                            dynamicError: dynamicResult.error,
                            directError: directResult.error
                        });
                        setEmailModalEnabled(false);
                        setFlagsData(null);
                    }
                }
            } catch (error) {
                console.error('Configuration fetch failed:', error);
                setEmailModalEnabled(false);
            }
        };
        fetchConfig();
    }, []);

    // Check if user has already submitted email (from storage)
    useEffect(() => {
        const checkEmailSubmission = async () => {
            if (!addOnUISdk?.instance?.clientStorage) {
                return;
            }
            try {
                const { clientStorage } = addOnUISdk.instance;
                const submittedEmail = await clientStorage.getItem('emailSubmitted');
                if (submittedEmail === 'true') {
                    setHasSubmittedEmail(true);
                }
            } catch (error) {
                console.error('Error checking email submission:', error);
            }
        };
        checkEmailSubmission();
    }, [addOnUISdk]);

    // Handler for when email is successfully submitted
    const handleEmailSubmitted = useCallback(async () => {
        setHasSubmittedEmail(true);
        // Store in clientStorage
        if (addOnUISdk?.instance?.clientStorage) {
            try {
                await addOnUISdk.instance.clientStorage.setItem('emailSubmitted', 'true');
            } catch (error) {
                console.error('Error storing email submission:', error);
            }
        }
    }, [addOnUISdk]);

    // Resolve Adobe account type
    useEffect(() => {
        let isMounted = true;
        const resolveAdobeAccountType = async () => {
            if (!addOnUISdk?.app) {
                return;
            }
            try {
                let profile = null;
                if (typeof addOnUISdk.app.getUserProfile === "function") {
                    profile = await addOnUISdk.app.getUserProfile();
                } else if (addOnUISdk.app.currentUserProfile) {
                    profile = await addOnUISdk.app.currentUserProfile;
                }
                let normalizedType = "free";
                const extractedType =
                    profile?.planType ||
                    profile?.accountType ||
                    profile?.type ||
                    profile?.userType ||
                    profile?.tier;
                if (typeof extractedType === "string" && extractedType.length > 0) {
                    normalizedType = extractedType.toLowerCase().includes("premium") ? "premium" : "free";
                } else if (profile?.isPaid === true) {
                    normalizedType = "premium";
                }
                if (isMounted) {
                    setAdobeUserType(normalizedType);
                }
            } catch (error) {
                console.warn("Unable to resolve Adobe account type:", error);
                if (isMounted) {
                    setAdobeUserType("free");
                }
            }
        };

        resolveAdobeAccountType();

        return () => {
            isMounted = false;
        };
    }, [addOnUISdk]);

    // License check on page load
    useEffect(() => {
        const checkLicense = async () => {
            if (!addOnUISdk || !addOnUISdk.instance || !addOnUISdk.instance.clientStorage) {
                setIsPro(false);
                return;
            }

            const { clientStorage } = addOnUISdk.instance;
            const storedKey = await clientStorage.getItem('licenseKey');

            if (storedKey) {
                try {
                    // Re-validate subscription with server
                    const validation = await revalidateSubscription(storedKey);

                    if (!validation.success || !validation.valid) {

                        // Revoke license if needed
                        if (validation.shouldRevoke) {
                            await clientStorage.removeItem('licenseKey');
                            await clientStorage.removeItem('licenseData');
                            setIsPro(false);
                            return;
                        }
                    } else {
                        // Store updated license data for offline checks (supports both old and new API formats)
                        const data = validation.licenseData;
                        const licenseDataToStore = {
                            // New API fields
                            type: data.type || validation.type,
                            provider: data.provider || 'unknown',
                            expires_at: data.expires_at,
                            renewal_at: data.renewal_at,
                            is_subscription: data.is_subscription,
                            // Old API fields (for backward compatibility)
                            status: data.status,
                            renewal_period_end: data.renewal_period_end || data.expires_at,
                            renewal_period_start: data.renewal_period_start || data.created_at,
                            cancel_at_period_end: data.cancel_at_period_end,
                            // Computed fields
                            subscription_type: validation.type,
                            expiresAt: validation.expiresAt ? validation.expiresAt.toISOString() : null,
                            lastValidated: new Date().toISOString()
                        };

                        await clientStorage.setItem('licenseData', JSON.stringify(licenseDataToStore));

                        setIsPro(true);
                    }
                } catch (error) {

                    // Offline mode: Check cached data
                    const storedLicenseData = await clientStorage.getItem('licenseData');

                    if (storedLicenseData) {
                        try {
                            const licenseData = JSON.parse(storedLicenseData);
                            const cachedValidation = validateCachedLicense(licenseData);

                            if (!cachedValidation.valid) {
                                if (cachedValidation.shouldRevoke) {
                                    await clientStorage.removeItem('licenseKey');
                                    await clientStorage.removeItem('licenseData');
                                    setIsPro(false);
                                } else {
                                    setIsPro(false);
                                }
                                return;
                            }

                            setIsPro(true);

                        } catch (parseError) {
                            setIsPro(false);
                        }
                    } else {
                        setIsPro(false);
                    }
                }
            } else {
                setIsPro(false);
            }
        };

        // Check license after addOnUISdk is ready
        if (addOnUISdk && addOnUISdk.instance) {
            checkLicense();
        }
    }, [addOnUISdk]);

    // Email notification on first page load - DISABLED
    // useEffect(() => {
    //     const notify = async () => {
    //         // Check session storage to prevent duplicate notifications
    //         if (sessionStorage.getItem('notificationSent')) {
    //             return;
    //         }

    //         if (!addOnUISdk || !addOnUISdk.app) {
    //             return;
    //         }

    //         // Get webhook URL from config (flagsData)
    //         // Try multiple possible locations in config
    //         const webhookUrl = 
    //             flagsData?.discord_webhook_url ||
    //             flagsData?.notification_webhook_url ||
    //             flagsData?.flags?.discord_webhook_url ||
    //             flagsData?.flags?.notification_webhook_url ||
    //             flagsData?.['adobe_express_integration']?.discord_webhook_url ||
    //             null;

    //         // If no webhook URL in config, skip notification
    //         if (!webhookUrl) {
    //             return;
    //         }

    //         try {
    //             // Get user ID from addOnUISdk
    //             let userId = null;
    //             if (typeof addOnUISdk.app.currentUser === 'object' && addOnUISdk.app.currentUser.userId) {
    //                 userId = await addOnUISdk.app.currentUser.userId();
    //             } else if (typeof addOnUISdk.app.currentUser === 'function') {
    //                 userId = await addOnUISdk.app.currentUser();
    //             } else if (addOnUISdk.app.currentUser) {
    //                 userId = addOnUISdk.app.currentUser;
    //             }

    //             if (userId) {
    //                 await sendDirectNotification(userId, webhookUrl);
    //                 sessionStorage.setItem('notificationSent', 'true');
    //             }
    //         } catch (error) {
    //             // Silently fail - don't break the app
    //             console.warn('Notification failed:', error);
    //         }
    //     };

    //     // Only notify if addOnUISdk is ready
    //     // Don't wait for flagsData - if webhook URL is not in config, notification just won't be sent
    //     if (addOnUISdk && addOnUISdk.app) {
    //         notify();
    //     }
    // }, [addOnUISdk, flagsData]);

    // Promotion config memo
    const promotionConfig = useMemo(() => {
        if (!flagsData?.["ongoing-promotion"]?.isEnabled) {
            return null;
        }

        const promotion = flagsData["ongoing-promotion"];
        const banner = promotion?.promotion_details?.landing_page_banner;
        if (!banner?.isEnabled) {
            return null;
        }

        const normalizedAdobeUserType = (adobeUserType || "free").toLowerCase();
        const adobeUserFilters = Array.isArray(promotion.enabledForAdobeUserTypes)
            ? promotion.enabledForAdobeUserTypes.map((type) => type?.toLowerCase())
            : null;

        if (
            adobeUserFilters &&
            adobeUserFilters.length > 0 &&
            !adobeUserFilters.includes(normalizedAdobeUserType)
        ) {
            return null;
        }

        if (promotion.enabledForPaidUsers === false && isPro) {
            return null;
        }

        return {
            banner,
            buttonAction: banner["button-action"],
            templates: promotion.templates || {},
        };
    }, [flagsData, adobeUserType, isPro]);

    // Handle promotion popup
    const handlePromotionPopup = useCallback(
        async (templateKey) => {
            if (!templateKey) {
                return;
            }
            if (!addOnUISdk?.app?.showModalDialog) {
                return;
            }
            const dialogUrl = `promotion-dialog.html?template=${encodeURIComponent(templateKey)}`;

            // Get title from template content header text
            const template = flagsData?.["ongoing-promotion"]?.templates?.[templateKey];
            const dialogTitle = template?.content?.header?.title || "Special Offer";
            const dialogHeight = template?.content?.specs?.height || 600;
            const dialogWidth = template?.content?.specs?.width || 960;

            try {
                await addOnUISdk.app.showModalDialog({
                    variant: "custom",
                    title: dialogTitle,
                    src: dialogUrl,
                    size: { width: dialogWidth, height: dialogHeight },
                });
            } catch (error) {
                console.error("Error launching promotion dialog:", error);
            }
        },
        [addOnUISdk, flagsData]
    );

    // Handle promotion action
    const handlePromotionAction = useCallback(
        async (action) => {
            if (!action) {
                return;
            }
            const actionType = action.type;
            if (actionType === "url") {
                if (action.url) {
                    window.open(action.url, "_blank", "noopener,noreferrer");
                }
                return;
            }
            if (actionType === "inScreenOpenUrl") {
                const inScreenOpenUrlConfig = action.inScreenOpenUrl;
                const targetUrl =
                    (typeof inScreenOpenUrlConfig === "object" && inScreenOpenUrlConfig?.url)
                        ? inScreenOpenUrlConfig.url
                        : (typeof inScreenOpenUrlConfig === "string"
                            ? inScreenOpenUrlConfig
                            : action.url);

                if (targetUrl) {
                    const width = (typeof inScreenOpenUrlConfig === "object" && inScreenOpenUrlConfig?.width)
                        ? inScreenOpenUrlConfig.width
                        : 1200;
                    const height = (typeof inScreenOpenUrlConfig === "object" && inScreenOpenUrlConfig?.height)
                        ? inScreenOpenUrlConfig.height
                        : 800;

                    const popupFeatures = `width=${width},height=${height},scrollbars=yes,resizable=yes`;
                    const popup = window.open(targetUrl, "offerPopup", popupFeatures);

                    if (popup) {
                        popup.focus();
                    } else {
                        console.warn("Popup blocked, opening in new tab instead");
                        window.open(targetUrl, "_blank", "noopener,noreferrer");
                    }
                }
                return;
            }
            if (actionType === "inScreenPopup") {
                await handlePromotionPopup(action?.inScreenPopup?.currentTemplate);
                return;
            }
        },
        [handlePromotionPopup]
    );

    // On-load promotion popup (delay + show-once logic)
    useEffect(() => {
        // Early return if conditions not met
        if (
            !flagsData?.["ongoing-promotion"]?.onload_promotion_popup?.isEnabled
        ) {
            return;
        }

        const popupConfig = flagsData["ongoing-promotion"].onload_promotion_popup;
        const templateKey = popupConfig.template || promotionConfig?.buttonAction?.inScreenPopup?.currentTemplate;

        if (!templateKey) {
            return;
        }

        const delayMs = Math.max(0, (popupConfig.on_load_delay_seconds || 0) * 1000);
        const showOnlyOnce = popupConfig.show_only_once_per_user === true;

        // Check if we should show the popup
        const checkAndShowPopup = async () => {
            if (showOnlyOnce && addOnUISdk?.instance?.clientStorage) {
                try {
                    const storageKey = `promotion_popup_shown_${templateKey}`;
                    const alreadyShown = await addOnUISdk.instance.clientStorage.getItem(storageKey);
                    if (alreadyShown === "true") {
                        return;
                    }
                } catch (error) {
                    console.warn("Error checking promotion popup status:", error);
                }
            }

            handlePromotionPopup(templateKey);

            if (showOnlyOnce && addOnUISdk?.instance?.clientStorage) {
                try {
                    const storageKey = `promotion_popup_shown_${templateKey}`;
                    await addOnUISdk.instance.clientStorage.setItem(storageKey, "true");
                } catch (error) {
                    console.warn("Error saving promotion popup status:", error);
                }
            }
        };

        const timer = setTimeout(() => {
            checkAndShowPopup();
        }, delayMs);

        return () => {
            clearTimeout(timer);
        };
    }, [flagsData, promotionConfig, handlePromotionPopup, addOnUISdk]);

    const handleSettingsClick = () => {
        setPopoverOpen((open) => !open);
    };

    const handleRemoveLicenseKey = async () => {
        if (!addOnUISdk || !addOnUISdk.instance || !addOnUISdk.instance.clientStorage) {
            return;
        }

        const { clientStorage } = addOnUISdk.instance;
        await clientStorage.removeItem('licenseKey');
        await clientStorage.removeItem('licenseData');
        setIsPro(false);
        setPopoverOpen(false);
    };

    // Reliable confetti trigger function
    const triggerConfetti = () => {
        setShowConfetti(false); // Reset first
        setConfettiKey(prev => prev + 1); // Force re-render
        setTimeout(() => {
            setShowConfetti(true);

            // Auto-hide confetti after 8 seconds
            setTimeout(() => {
                setShowConfetti(false);
            }, 8000);
        }, 50); // Small delay to ensure state reset
    };

    const handleLicenseVerified = async (key, licenseData) => {
        if (!addOnUISdk || !addOnUISdk.instance || !addOnUISdk.instance.clientStorage) {
            console.warn('ClientStorage not available');
            return;
        }

        const { clientStorage } = addOnUISdk.instance;
        await clientStorage.setItem('licenseKey', key);

        // Store full license data including expiration info (supports both old and new API formats)
        if (licenseData) {
            const licenseDataToStore = {
                // New API fields
                type: licenseData.type || 'subscription',
                provider: licenseData.provider || 'unknown',
                expires_at: licenseData.expires_at,
                renewal_at: licenseData.renewal_at,
                is_subscription: licenseData.is_subscription,
                // Old API fields (for backward compatibility)
                status: licenseData.status,
                renewal_period_end: licenseData.renewal_period_end || licenseData.expires_at,
                renewal_period_start: licenseData.renewal_period_start || licenseData.created_at,
                cancel_at_period_end: licenseData.cancel_at_period_end,
                // Computed fields
                lastValidated: new Date().toISOString()
            };

            await clientStorage.setItem('licenseData', JSON.stringify(licenseDataToStore));
        }

        setIsPro(true);
        setDrawerLicenseKey('');
        setDrawerOpen(false);
        triggerConfetti(); // Trigger confetti on success
    };

    const getPricingData = () => {
        if (!flagsData || !flagsData['pricing-page-details']) {
            return null;
        }

        const pricingPageDetails = flagsData['pricing-page-details'];
        const projectPricingInfo = pricingPageDetails['pricing-info'];

        if (projectPricingInfo && Array.isArray(projectPricingInfo) && projectPricingInfo.length > 0) {
            return projectPricingInfo;
        }

        return null;
    };

    const MANAGE_SUBSCRIPTION_URL = "https://adobe.swiftools.com/manage-subscriptions";

    return (
        <Theme system="express" scale="medium" color="light">
            <div className="app-layout">
                {/* Fixed Navbar */}
                <div className="app-navbar">
                    {!isPro && (
                        <>
                            <div className="navbar-spacer"></div>
                            <button
                                className="navbar-unlock-button"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <div className="upgrade-badge"></div>
                                <div className="upgrade-text">
                                    <span className="upgrade-main">UNLOCK UPGRADE</span>
                                </div>
                            </button>
                        </>
                    )}
                    {isPro && (
                        <>
                            <div className="navbar-spacer"></div>
                            <div className="navbar-upgraded-badge">
                                <span className="navbar-upgraded-text">✨UPGRADED✨</span>
                            </div>
                        </>
                    )}
                    <button
                        aria-label="Open menu"
                        className="navbar-menu-button"
                        onClick={handleSettingsClick}
                    >
                        <sp-icon-more style={{ width: 20, height: 20, color: '#888' }}></sp-icon-more>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="app-main-content">
                    {/* Promotion Banner */}
                    {promotionConfig && (
                        <div
                            className={`promotion-banner promotion-banner--${promotionConfig.banner.banner_position || "top"}`}
                            style={{
                                backgroundColor: promotionConfig.banner.background_color,
                                color: promotionConfig.banner.text_color,
                            }}
                        >
                            <div
                                className={`promotion-banner__text ${promotionConfig.banner.marquee_enabled ? "promotion-banner__text--marquee" : ""
                                    }`}
                            >
                                <span>{promotionConfig.banner.title}</span>
                            </div>
                            <button
                                className="promotion-banner__button"
                                disabled={!promotionConfig.buttonAction}
                                onClick={() => handlePromotionAction(promotionConfig.buttonAction)}
                                style={{ color: promotionConfig.banner.text_color }}
                            >
                                {promotionConfig.banner.button_text || "Learn More"}
                            </button>
                        </div>
                    )}

                    <div className="app-view-content">
                        <ChartGenerator
                            sandboxProxy={sandboxProxy}
                            isPro={isPro}
                            addOnUISdk={addOnUISdk}
                            onOpenUpgradeDrawer={() => setDrawerOpen(true)}
                            emailModalEnabled={emailModalEnabled}
                            hasSubmittedEmail={hasSubmittedEmail}
                            onEmailSubmitted={handleEmailSubmitted}
                            flagsData={flagsData}
                        />
                    </div>
                </div>

                {/* Settings Drawer - slides from left */}
                {popoverOpen && (
                    <div className="settings-drawer-overlay" onClick={() => setPopoverOpen(false)}>
                        <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
                            <div className="drawer-header">
                                <h2>Settings</h2>
                                <button className="drawer-close" onClick={() => setPopoverOpen(false)}>×</button>
                            </div>

                            <div className="drawer-content">
                                <div className="settings-menu-list">
                                    {isPro ? (
                                        // Premium user menu options
                                        <>
                                            <button
                                                className="settings-menu-item"
                                                onClick={() => {
                                                    window.open(MANAGE_SUBSCRIPTION_URL, "_blank");
                                                    setPopoverOpen(false);
                                                }}
                                            >
                                                Manage Subscription
                                            </button>

                                            {/* Dynamic settings menu items from configuration */}
                                            {flagsData?.['settings-menu-items']?.map((item, index) => {
                                                if (item.isEnabled) {
                                                    return (
                                                        <button
                                                            key={`dynamic-${item.name}-${index}`}
                                                            className="settings-menu-item"
                                                            onClick={() => {
                                                                window.open(item.url, "_blank");
                                                                setPopoverOpen(false);
                                                            }}
                                                        >
                                                            {item.name}
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })}

                                            <button
                                                className="settings-menu-item"
                                                onClick={() => {
                                                    handleRemoveLicenseKey();
                                                }}
                                            >
                                                Remove existing Licence key
                                            </button>
                                        </>
                                    ) : (
                                        // Non-premium user menu options
                                        <>
                                            <button
                                                className="settings-menu-item"
                                                onClick={() => {
                                                    setDrawerOpen(true);
                                                    setPopoverOpen(false);
                                                }}
                                            >
                                                Activate License Key
                                            </button>

                                            {/* Dynamic settings menu items from configuration */}
                                            {flagsData?.['settings-menu-items']?.map((item, index) => {
                                                if (item.isEnabled) {
                                                    return (
                                                        <button
                                                            key={`dynamic-${item.name}-${index}`}
                                                            className="settings-menu-item"
                                                            onClick={() => {
                                                                window.open(item.url, "_blank");
                                                                setPopoverOpen(false);
                                                            }}
                                                        >
                                                            {item.name}
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upgrade Drawer - slides from right */}
                {drawerOpen && (
                    <div className="upgrade-drawer-overlay" onClick={() => setDrawerOpen(false)}>
                        <div className="upgrade-drawer" onClick={(e) => e.stopPropagation()}>
                            <div className="drawer-header">
                                <h2>Unlock Upgrade</h2>
                                <button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
                            </div>

                            <div className="drawer-content">
                                {/* License Key Activation Section */}
                                <div className="drawer-license-section">
                                    <h3>Activate License Key</h3>
                                    <p>Enter the license key you received after your purchase to unlock all Upgrade features.</p>
                                    <input
                                        type="text"
                                        className="drawer-license-input"
                                        placeholder="Enter your license key"
                                        value={drawerLicenseKey}
                                        onChange={(e) => {
                                            setDrawerLicenseKey(e.target.value);
                                            setDrawerLicenseError('');
                                        }}
                                    />
                                    {drawerLicenseError && <p className="drawer-license-error">{drawerLicenseError}</p>}
                                    <button
                                        className="drawer-license-activate-button"
                                        onClick={async () => {
                                            if (!drawerLicenseKey) {
                                                setDrawerLicenseError('Please enter a license key.');
                                                return;
                                            }
                                            setDrawerLicenseError('');
                                            setDrawerLicenseLoading(true);

                                            try {
                                                const API_URL = 'https://api.swiftools.com/license-validator';
                                                const response = await fetch(API_URL, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        license_identifier: drawerLicenseKey,
                                                        product_name: 'charts-pro'
                                                    }),
                                                });

                                                const data = await response.json();

                                                if (response.ok && data.valid === true) {
                                                    await handleLicenseVerified(drawerLicenseKey, data);
                                                } else {
                                                    const errorMessage = data.message || 'License validation failed: Try again later.';
                                                    setDrawerLicenseError(errorMessage);
                                                }
                                            } catch (error) {
                                                console.error("Error verifying license:", error);
                                                setDrawerLicenseError('Could not connect to verification server. Please check your internet connection.');
                                            } finally {
                                                setDrawerLicenseLoading(false);
                                            }
                                        }}
                                        disabled={drawerLicenseLoading}
                                    >
                                        {drawerLicenseLoading ? 'Verifying...' : 'Activate License Key'}
                                    </button>
                                </div>

                                {/* Pricing Plans Section */}
                                <div className="drawer-pricing-section">
                                    <h3>Pricing Plans</h3>
                                    {getPricingData() ? (
                                        <div className="drawer-pricing-options">
                                            {getPricingData().map((plan, index) => (
                                                <div
                                                    key={index}
                                                    className={`drawer-pricing-option ${plan.isHighlighted ? 'drawer-pricing-option--highlighted' : ''}`}
                                                    onClick={() => {
                                                        window.open(plan.url, "_blank");
                                                    }}
                                                >
                                                    <div className="drawer-pricing-content">
                                                        <div className="drawer-pricing-left">
                                                            <h4>{plan.title}</h4>
                                                            <p className="drawer-pricing-subtitle">{plan.subtitle}</p>
                                                        </div>
                                                        <div className="drawer-pricing-right">
                                                            <p className="drawer-pricing-price">{plan.price}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="drawer-pricing-options">
                                            <div className="drawer-pricing-option drawer-pricing-option--highlighted" onClick={() => {
                                                window.open("https://whop.com/checkout/plan_azOUBQZrkKxLa", "_blank");
                                            }}>
                                                <div className="drawer-pricing-content">
                                                    <div className="drawer-pricing-left">
                                                        <h4>Annual Plan</h4>
                                                        <p className="drawer-pricing-subtitle">Best Value!</p>
                                                    </div>
                                                    <div className="drawer-pricing-right">
                                                        <p className="drawer-pricing-price">$29.99/year</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="drawer-pricing-option" onClick={() => {
                                                window.open("https://whop.com/checkout/plan_gcusW3CtrJbfu", "_blank");
                                            }}>
                                                <div className="drawer-pricing-content">
                                                    <div className="drawer-pricing-left">
                                                        <h4>Monthly Plan</h4>
                                                        <p className="drawer-pricing-subtitle">Starter's Plan</p>
                                                    </div>
                                                    <div className="drawer-pricing-right">
                                                        <p className="drawer-pricing-price">$4.99/month</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Pro Users Message */}
                                <div className="drawer-pro-message">
                                    <p>Pro users get access to all charts and themes.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confetti Effect */}
                {showConfetti && (
                    <Suspense fallback={null}>
                        <Confetti key={confettiKey} duration={8000} />
                    </Suspense>
                )}

                {/* WhatsApp Support Widget - appears on all pages when enabled */}
                <WhatsAppSupportWidget flagsData={flagsData} />
            </div>
        </Theme>
    );
};

export default App;
