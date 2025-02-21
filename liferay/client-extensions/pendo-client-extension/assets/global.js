/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

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
})('f9de6ff2-6520-4d30-6d8f-d4182af04436');

// Initialize Pendo with visitor and account details
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Extract required metadata from Liferay.ThemeDisplay
        const companyId = Liferay.ThemeDisplay.getCompanyId();
        const domainName = window.location.hostname; // Full customer domain
        const visitorId = `anon-${companyId}`; // Pseudo-anonymized user ID

        if (window.pendo) {
            pendo.initialize({
                visitor: {
                    id: visitorId, // Anonymized visitor ID
                },
                account: {
                    id: domainName, // Full customer domain
                }
            });
        }
    } catch (error) {
        console.error('Error initializing Pendo:', error);
    }
});

// Reinitialize Pendo on SPA navigation
Liferay.on('endNavigate', () => {
    if (window.pendo) {
        pendo.pageLoad();
    }
});
