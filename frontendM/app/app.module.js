// ============================================
//  frontend/app/app.module.js  —  MyMovieMania
// ============================================

angular.module('MyMovieMania', ['ngRoute', 'ngAnimate'])

.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

    $routeProvider
        .when('/', {
            templateUrl : 'app/views/home.html',
            controller  : 'HomeCtrl',
            title       : 'Home'
        })
        .when('/movies', {
            templateUrl : 'app/views/movies.html',
            controller  : 'MoviesCtrl',
            title       : 'Movies'
        })
        .when('/movie/:id', {
            templateUrl : 'app/views/movie-detail.html',
            controller  : 'MovieDetailCtrl',
            title       : 'Movie'
        })
        .when('/search', {
            templateUrl : 'app/views/search.html',
            controller  : 'SearchCtrl',
            title       : 'Search'
        })
        .when('/profile', {
            templateUrl : 'app/views/profile.html',
            controller  : 'ProfileCtrl',
            title       : 'My Profile',
            requireAuth : true
        })
        .when('/diary', {
            templateUrl : 'app/views/diary.html',
            controller  : 'DiaryCtrl',
            title       : 'My Diary',
            requireAuth : true
        })
        .when('/watchlist', {
            templateUrl : 'app/views/watchlist.html',
            controller  : 'WatchlistCtrl',
            title       : 'Watchlist',
            requireAuth : true
        })
        .when('/lists', {
            templateUrl : 'app/views/lists.html',
            controller  : 'ListsCtrl',
            title       : 'My Lists',
            requireAuth : true
        })
        .when('/login', {
            templateUrl : 'app/views/auth.html',
            controller  : 'AuthCtrl',
            title       : 'Sign In'
        })
        .otherwise({ redirectTo: '/' });
}])

// Route change: update title + auth guard
.run(['$rootScope', '$location', 'AuthService', function($rootScope, $location, AuthService) {
    $rootScope.$on('$routeChangeStart', function(event, next) {
        $rootScope.pageTitle = (next.$$route && next.$$route.title)
            ? next.$$route.title + ' — MyMovieMania'
            : 'MyMovieMania';

        if (next.$$route && next.$$route.requireAuth && !AuthService.isLoggedIn()) {
            $location.path('/login');
        }
    });
}]);