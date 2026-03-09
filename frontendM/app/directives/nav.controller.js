// ============================================
//  frontend/app/directives/nav.controller.js
//  Includes: live search with debounce + dropdown
// ============================================

angular.module('MyMovieMania')

// ---- NAVBAR + LIVE SEARCH ----
.controller('NavCtrl', ['$scope', '$location', '$timeout', '$http', 'AuthService', 'API',
function($scope, $location, $timeout, $http, AuthService, API) {

    $scope.authService   = AuthService;
    $scope.searchQuery   = '';
    $scope.liveResults   = [];
    $scope.showDropdown  = false;
    $scope.searching     = false;
    $scope.activeIndex   = -1;

    var debounceTimer = null;
    var MIN_CHARS     = 2;
    var DEBOUNCE_MS   = 320;

    // ---- Triggered on every keystroke ----
    $scope.onSearchChange = function() {
        $scope.activeIndex = -1;

        if ($scope.searchQuery.length < MIN_CHARS) {
            $scope.liveResults  = [];
            $scope.showDropdown = $scope.searchQuery.length > 0; // show hint
            if (debounceTimer) $timeout.cancel(debounceTimer);
            return;
        }

        $scope.showDropdown = true;
        $scope.searching    = true;

        if (debounceTimer) $timeout.cancel(debounceTimer);

        debounceTimer = $timeout(function() {
            $http.get(API.BASE + 'movies/search?query=' + encodeURIComponent($scope.searchQuery) + '&page=1')
                .then(function(res) {
                    $scope.liveResults = (res.data.results || []).slice(0, 7);
                    $scope.searching   = false;
                })
                .catch(function() {
                    $scope.liveResults = [];
                    $scope.searching   = false;
                });
        }, DEBOUNCE_MS);
    };

    // ---- Keyboard navigation ----
    $scope.onKeydown = function(evt) {
        var len = $scope.liveResults.length;
        if (!$scope.showDropdown || !len) {
            // Enter with no dropdown → go to full search page
            if (evt.key === 'Enter' && $scope.searchQuery.trim()) {
                $scope.goFullSearch();
            }
            return;
        }

        if (evt.key === 'ArrowDown') {
            evt.preventDefault();
            $scope.activeIndex = ($scope.activeIndex + 1) % len;
        } else if (evt.key === 'ArrowUp') {
            evt.preventDefault();
            $scope.activeIndex = ($scope.activeIndex - 1 + len) % len;
        } else if (evt.key === 'Enter') {
            evt.preventDefault();
            if ($scope.activeIndex >= 0 && $scope.liveResults[$scope.activeIndex]) {
                var movie = $scope.liveResults[$scope.activeIndex];
                $location.path('/movie/' + movie.id);
                $scope.closeDropdown();
            } else {
                $scope.goFullSearch();
            }
        } else if (evt.key === 'Escape') {
            $scope.closeDropdown();
        }
    };

    // ---- Go to full search results page ----
    $scope.goFullSearch = function() {
        if ($scope.searchQuery.trim()) {
            $location.path('/search').search('q', $scope.searchQuery.trim());
            $scope.closeDropdown();
        }
    };

    $scope.onFocus = function() {
        if ($scope.searchQuery.length >= MIN_CHARS || $scope.searchQuery.length > 0) {
            $scope.showDropdown = true;
        }
    };

    $scope.closeDropdown = function() {
        $scope.showDropdown = false;
        $scope.activeIndex  = -1;
    };

    $scope.clearSearch = function() {
        $scope.searchQuery  = '';
        $scope.liveResults  = [];
        $scope.showDropdown = false;
        $scope.searching    = false;
        if (debounceTimer) $timeout.cancel(debounceTimer);
    };

    $scope.isActive = function(path) {
        return $location.path() === path;
    };

    $scope.logout = function() {
        AuthService.logout();
        $location.path('/');
    };
}])

// Star rating display directive
.directive('starRating', function() {
    return {
        restrict : 'E',
        scope    : { rating: '=', max: '@' },
        template : '<span class="stars">{{ getStars() }}</span>',
        link     : function(scope) {
            scope.getStars = function() {
                var r   = parseFloat(scope.rating) || 0;
                var max = parseInt(scope.max) || 5;
                var out = '';
                for (var i = 1; i <= max; i++) {
                    if (i <= r)        out += '★';
                    else if (i - 0.5 <= r) out += '½';
                    else               out += '☆';
                }
                return out;
            };
        }
    };
})

// Movie poster with fallback
.directive('moviePoster', ['API', function(API) {
    return {
        restrict : 'E',
        scope    : { path: '@', size: '@', cls: '@' },
        template : '<img ng-src="{{ src }}" class="{{ cls }}" alt="Poster" ' +
                   'ng-error="src=fallback">',
        link     : function(scope) {
            scope.fallback = API.PLACEHOLDER;
            scope.$watch('path', function(p) {
                if (!p) { scope.src = API.PLACEHOLDER; return; }
                var base = scope.size === 'sm'   ? API.IMG_W185
                         : scope.size === 'lg'   ? API.IMG_W780
                         : scope.size === 'orig' ? API.IMG_ORIG
                         : API.IMG_W500;
                scope.src = base + p;
            });
        }
    };
}])

// Number filter: 7.4 → "7.4 / 10"
.filter('tmdbRating', function() {
    return function(r) {
        return r ? parseFloat(r).toFixed(1) + ' / 10' : 'N/A';
    };
})

// Year from date string
.filter('releaseYear', function() {
    return function(d) {
        return d ? d.substring(0, 4) : '—';
    };
})

// Minute → "2h 14m"
.filter('runtime', function() {
    return function(mins) {
        if (!mins) return '—';
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return (h ? h + 'h ' : '') + m + 'm';
    };
});