(function(apiKey) {
    (function(p, e, n, d, o) {
        var v, w, x, y, z;
        o = p[d] = p[d] || {};
        o._q = o._q || [];

        v = ['initialize', 'identify', 'updateOptions', 'pageLoad', 'track'];
        for (w = 0, x = v.length; w < x; ++w) {
            (function(m) {
                o[m] = o[m] || function() {
                    o._q[m === v[0] ? 'unshift' : 'push']([m].concat([].slice.call(arguments, 0)));
                };
            })(v[w]);
        }

        y = e.createElement(n);
        y.async = !0;
        y.src = 'https://cdn.pendo.io/agent/static/' + apiKey + '/pendo.js';

        z = e.getElementsByTagName(n)[0];
        z.parentNode.insertBefore(y, z);
    })(window, document, 'script', 'pendo');
})('5d72ed16-3b81-4aed-542b-0f6f1f7725f3');

// Fetch Liferay metadata and initialize Pendo
document.addEventListener('DOMContentLoaded', () => {
    const liferayVersion = Liferay.Util.getPortalVersion();
    const siteName = Liferay.ThemeDisplay.getSiteGroupName();
    const userId = Liferay.ThemeDisplay.getUserId();

    if (window.pendo) {
        pendo.initialize({
            visitor: {
                id: `user-${userId}` // Pseudo-anonymized user ID
            },
            account: {
                id: Liferay.ThemeDisplay.getScopeGroupId(),
                name: siteName,
                liferay_version: liferayVersion
            }
        });
    }
});

Liferay.on('endNavigate', () => {
    if (window.pendo) {
        pendo.pageLoad();
    }
});

