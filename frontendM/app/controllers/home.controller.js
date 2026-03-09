// ============================================
//  frontend/app/controllers/home.controller.js
// ============================================

angular.module('MyMovieMania')

// ---- HOME ----
.controller('HomeCtrl', ['$scope', 'MovieService', 'AuthService',
function($scope, MovieService, AuthService) {

    $scope.user      = AuthService.currentUser;
    $scope.trending  = [];
    $scope.popular   = [];
    $scope.upcoming  = [];
    $scope.loading   = true;

    MovieService.getTrending().then(function(res) {
        $scope.trending = res.data.results.slice(0, 8);
    });

    MovieService.getPopular().then(function(res) {
        $scope.popular = res.data.results.slice(0, 6);
    });

    MovieService.getUpcoming().then(function(res) {
        $scope.upcoming  = res.data.results.slice(0, 6);
        $scope.loading   = false;
    });

    $scope.posterUrl = MovieService.posterUrl;
    $scope.stars     = MovieService.ratingStars;
}])

// ---- MOVIES (browse) ----
.controller('MoviesCtrl', ['$scope', '$routeParams', '$location', 'MovieService',
function($scope, $routeParams, $location, MovieService) {

    $scope.tab        = 'trending';
    $scope.movies     = [];
    $scope.genres     = [];
    $scope.page       = 1;
    $scope.totalPages = 1;
    $scope.loading    = false;

    MovieService.getGenres().then(function(res) {
        $scope.genres = res.data.genres;
    });

    $scope.load = function() {
        $scope.loading = true;
        var p;
        switch ($scope.tab) {
            case 'popular'   : p = MovieService.getPopular($scope.page);    break;
            case 'toprated'  : p = MovieService.getTopRated($scope.page);   break;
            case 'upcoming'  : p = MovieService.getUpcoming($scope.page);   break;
            case 'nowplaying': p = MovieService.getNowPlaying($scope.page); break;
            default          : p = MovieService.getTrending($scope.page);   break;
        }
        p.then(function(res) {
            $scope.movies     = res.data.results || [];
            $scope.totalPages = res.data.total_pages;
            $scope.loading    = false;
        });
    };

    $scope.setTab = function(tab) {
        $scope.tab  = tab;
        $scope.page = 1;
        $scope.load();
    };

    $scope.prevPage = function() { if ($scope.page > 1) { $scope.page--; $scope.load(); } };
    $scope.nextPage = function() { if ($scope.page < $scope.totalPages) { $scope.page++; $scope.load(); } };

    $scope.posterUrl = MovieService.posterUrl;
    $scope.stars     = MovieService.ratingStars;

    $scope.load();
}])

// ---- SEARCH (full page, also live) ----
.controller('SearchCtrl', ['$scope', '$location', '$timeout', 'MovieService', 'LibraryService', 'AuthService',
function($scope, $location, $timeout, MovieService, LibraryService, AuthService) {

    $scope.query      = $location.search().q || '';
    $scope.results    = [];
    $scope.page       = 1;
    $scope.total      = 0;
    $scope.totalPages = 1;
    $scope.loading    = false;
    $scope.searched   = false;

    var debounceTimer = null;

    // Run whenever the input changes (live)
    $scope.onQueryChange = function() {
        if (debounceTimer) $timeout.cancel(debounceTimer);
        if (!$scope.query.trim() || $scope.query.trim().length < 2) {
            $scope.results  = [];
            $scope.searched = false;
            return;
        }
        debounceTimer = $timeout(function() {
            $scope.page = 1;
            $scope.doSearch();
        }, 350);
    };

    $scope.doSearch = function() {
        if (!$scope.query.trim()) return;
        $location.search('q', $scope.query.trim());
        $scope.loading  = true;
        $scope.searched = true;
        MovieService.search($scope.query, $scope.page).then(function(res) {
            $scope.results    = res.data.results || [];
            $scope.total      = res.data.total_results;
            $scope.totalPages = res.data.total_pages;
            $scope.loading    = false;
        });
    };

    // Submit (Enter / button)
    $scope.search = function() {
        if (debounceTimer) $timeout.cancel(debounceTimer);
        $scope.page = 1;
        $scope.doSearch();
    };

    $scope.prevPage = function() {
        if ($scope.page > 1) { $scope.page--; $scope.doSearch(); window.scrollTo(0,0); }
    };
    $scope.nextPage = function() {
        if ($scope.page < $scope.totalPages) { $scope.page++; $scope.doSearch(); window.scrollTo(0,0); }
    };

    $scope.posterUrl  = MovieService.posterUrl;
    $scope.stars      = MovieService.ratingStars;
    $scope.authService = AuthService;

    // Track watched/watchlist state per movie id for this page
    $scope.watchedIds   = {};
    $scope.watchlistIds = {};

    // Quick-add watched from card
    $scope.quickWatched = function(m, $event) {
        $event.preventDefault();
        if (!AuthService.isLoggedIn()) return;
        if ($scope.watchedIds[m.id]) {
            LibraryService.removeWatched(m.id).then(function() {
                $scope.watchedIds[m.id] = false;
            });
        } else {
            LibraryService.markWatched({ tmdb_id: m.id, movie_title: m.title, poster_path: m.poster_path })
                .then(function() { $scope.watchedIds[m.id] = true; });
        }
    };

    // Quick-add watchlist from card
    $scope.quickWatchlist = function(m, $event) {
        $event.preventDefault();
        if (!AuthService.isLoggedIn()) return;
        if ($scope.watchlistIds[m.id]) {
            LibraryService.removeWatchlist(m.id).then(function() {
                $scope.watchlistIds[m.id] = false;
            });
        } else {
            LibraryService.addToWatchlist({ tmdb_id: m.id, movie_title: m.title, poster_path: m.poster_path })
                .then(function() { $scope.watchlistIds[m.id] = true; });
        }
    };

    // Auto-run if arrived with ?q=
    if ($scope.query) $scope.doSearch();
}]);