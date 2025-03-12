(function () {
    const PENDO_API_KEY = 'f9de6ff2-6520-4d30-6d8f-d4182af04436'; // ✅ Set the Pendo API Key
    const COOKIE_EXPIRATION_DAYS = 365; // 1 Year

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            try {
                if (!shouldLoadPendo()) {
                    return;
                }

                const companyId = Liferay.ThemeDisplay.getCompanyId();
                const domainName = window.location.hostname;
                const visitorId = `anon-${companyId}`;

                // ✅ 1️⃣ First check: If both required cookies are already set, enable tracking immediately
                const hasPersonalizationConsent = getCookie('CONSENT_TYPE_PERSONALIZATION') === 'true';
                const hasConfiguredConsent = getCookie('USER_CONSENT_CONFIGURED') === 'true';

                if (hasPersonalizationConsent && hasConfiguredConsent) {
                    setCookie('USER_CONSENT_USAGE_TRACKING', 'true', COOKIE_EXPIRATION_DAYS);
                    initializePendo(visitorId, domainName);
                    return;
                }

                // ✅ 2️⃣ Second check: If USER_CONSENT_USAGE_TRACKING is set, proceed with tracking
                const hasUsageConsent = getCookie('USER_CONSENT_USAGE_TRACKING') === 'true';

                if (hasUsageConsent) {
                    initializePendo(visitorId, domainName);
                    return;
                }

                // ✅ 3️⃣ Third check: If consent is not granted, check for existing banners and inject one if needed
                if (!document.querySelector('.portlet-boundary_com_liferay_cookies_banner_web_portlet_CookiesBannerPortlet_')) {
                    injectCookieBanner(visitorId, domainName);
                }

            } catch (error) {
                console.error('Error initializing Pendo:', error);
            }
        }, 2000);
    });

    function shouldLoadPendo() {
        return (
            Liferay.ThemeDisplay.isControlPanel() ||
            document.querySelector('nav.cadmin.control-menu-container') &&
            document.querySelector('nav.cadmin.lfr-product-menu-panel')
        );
    }

    function initializePendo(visitorId, domainName) {
        (function (apiKey) {
            (function (p, e, n, d, o) {
                var v, w, x, y, z;
                o = p[d] = p[d] || {};
                o._q = o._q || [];

                v = ['initialize', 'identify', 'updateOptions', 'pageLoad', 'track'];
                for (w = 0, x = v.length; w < x; ++w) {
                    (function (m) {
                        o[m] = o[m] || function () {
                            o._q[m === v[0] ? 'unshift' : 'push']([m].concat([].slice.call(arguments, 0)));
                        };
                    })(v[w]);
                }

                y = e.createElement(n);
                y.async = true;
                y.src = 'https://cdn.pendo.io/agent/static/' + apiKey + '/pendo.js';

                z = e.getElementsByTagName(n)[0];
                z.parentNode.insertBefore(y, z);
            })(window, document, 'script', 'pendo');
        })(PENDO_API_KEY);

        if (window.pendo) {
            pendo.initialize({
                visitor: { id: visitorId },
                account: { id: domainName }
            });
        }

        Liferay.on('endNavigate', () => {
            if (window.pendo) {
                pendo.pageLoad();
            }
        });
    }

    function injectCookieBanner(visitorId, domainName) {
        const banner = document.createElement('div');
        banner.setAttribute('aria-label', 'banner cookies');
        banner.setAttribute('role', 'dialog');
        banner.style.display = 'block';
        banner.style.position = 'fixed';
        banner.style.bottom = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.backgroundColor = '#fff';
        banner.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.175)';
        banner.style.zIndex = '990';

        banner.innerHTML = `
            <div id="abcd-cookie-container" style="display: block;">
                <span id="abcd-cookie-span"></span>
                <div style="max-width: 1248px; width: 100%; margin: 0 auto; padding: 1.5rem 0;">
                    <div style="display: flex; flex-wrap: wrap; margin-left: -12px; margin-right: -12px;">
                        <div style="display: flex; flex-wrap: nowrap; justify-content: center; padding: 0 0.5rem; margin: -0.25rem -0.5rem; width: 100%;">
                            <div style="flex: 1; min-width: 50px; display: flex; align-items: center;">
                                <p style="margin: 0; font-size: 1rem; line-height: 1.5;">
                                    We use cookies to deliver personalized content and track user movements on Liferay's control panel experience. Accept cookies for the best possible experience.
                                    <a href="#" style="color: #0b5fff; text-decoration: none;">Visit our Privacy Policy</a>
                                </p>
                            </div>
                            <div style="display: flex; align-items: center; margin-left: 1rem;">
                                <button id="abcd-accept-btn"
                                    type="button"
                                    style="background-color: #fff; border: 1px solid #9b92a5; color: #6b6c7e; padding: 0.4375rem 0.9375rem; font-size: 1rem; font-weight: 600; border-radius: 0.25rem; cursor: pointer;">
                                    Accept
                                </button>
                            </div>
                            <div style="display: flex; align-items: center; margin-left: 1rem;">
                                <button id="abcd-decline-btn"
                                    type="button"
                                    style="background-color: #fff; border: 1px solid #9b92a5; color: #6b6c7e; padding: 0.4375rem 0.9375rem; font-size: 1rem; font-weight: 600; border-radius: 0.25rem; cursor: pointer;">
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('abcd-accept-btn').addEventListener('click', () => {
            setCookie('USER_CONSENT_USAGE_TRACKING', 'true', COOKIE_EXPIRATION_DAYS);
            document.body.removeChild(banner);
            initializePendo(visitorId, domainName); // ✅ Dynamically start tracking without a page reload
        });

        document.getElementById('abcd-decline-btn').addEventListener('click', () => {
            document.body.removeChild(banner);
        });
    }

    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }
})();