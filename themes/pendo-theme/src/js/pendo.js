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
})('5d72ed16-3b81-4aed-542b-0f6f1f7725f3');

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