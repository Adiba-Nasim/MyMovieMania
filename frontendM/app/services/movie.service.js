// ============================================
//  frontend/app/services/movie.service.js
// ============================================

angular.module('MyMovieMania')

// API URL constants
.constant('API', {
    BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:3000/api/'
          : 'https://mymoviemania.onrender.com/api/',
    IMG_W500   : 'https://image.tmdb.org/t/p/w500',
    IMG_W780   : 'https://image.tmdb.org/t/p/w780',
    IMG_ORIG   : 'https://image.tmdb.org/t/p/original',
    IMG_W185   : 'https://image.tmdb.org/t/p/w185',
    PLACEHOLDER: 'https://via.placeholder.com/500x750?text=No+Poster'
})
.factory('MovieService', ['$http', 'API', function($http, API) {

    var svc = {};

    svc.getTrending   = (page=1) => $http.get(API.BASE + `movies/trending?page=${page}`);
    svc.getPopular    = (page=1) => $http.get(API.BASE + `movies/popular?page=${page}`);
    svc.getUpcoming   = (page=1) => $http.get(API.BASE + `movies/upcoming?page=${page}`);
    svc.getTopRated   = (page=1) => $http.get(API.BASE + `movies/toprated?page=${page}`);
    svc.getNowPlaying = (page=1) => $http.get(API.BASE + `movies/nowplaying?page=${page}`);
    svc.search        = (q,page=1) => $http.get(API.BASE + `movies/search?query=${encodeURIComponent(q)}&page=${page}`);
    svc.getDetail     = (id)       => $http.get(API.BASE + `movies/detail?id=${id}`);
    svc.getGenres     = ()         => $http.get(API.BASE + 'movies/genres');
    svc.getByGenre    = (gid,page=1)=> $http.get(API.BASE + `movies/bygenre?genre_id=${gid}&page=${page}`);

    svc.posterUrl = function(path, size) {
        if (!path) return API.PLACEHOLDER;
        var base = size === 'w185' ? API.IMG_W185
                 : size === 'w780' ? API.IMG_W780
                 : size === 'orig' ? API.IMG_ORIG
                 : API.IMG_W500;
        return base + path;
    };

    svc.ratingStars = function(rating) {
        // Convert 0-10 TMDB rating to 0-5
        return (rating / 2).toFixed(1);
    };

    return svc;
}])

.factory('LibraryService', ['$http', 'API', 'AuthService', function($http, API, AuthService) {

    var svc = {};

    var h = function() { return AuthService.getHeaders(); };
    var B = API.BASE + 'library/';

    // Watchlist
    svc.getWatchlist      = ()     => $http.get(B + 'watchlist.get', h());
    svc.addToWatchlist    = (data) => $http.post(B + 'watchlist.add', data, h());
    svc.removeWatchlist   = (tmdb) => $http.delete(B + `watchlist.remove?tmdb_id=${tmdb}`, h());
    svc.checkWatchlist    = (tmdb) => $http.get(B + `watchlist.check?tmdb_id=${tmdb}`, h());

    // Watched
    svc.getWatched        = ()     => $http.get(B + 'watched.get', h());
    svc.markWatched       = (data) => $http.post(B + 'watched.add', data, h());
    svc.removeWatched     = (tmdb) => $http.delete(B + `watched.remove?tmdb_id=${tmdb}`, h());
    svc.checkWatched      = (tmdb) => $http.get(B + `watched.check?tmdb_id=${tmdb}`, h());

    // Reviews
    svc.getMyReviews      = ()     => $http.get(B + 'reviews.get', h());
    svc.getMovieReviews   = (tmdb) => $http.get(B + `reviews.getByMovie?tmdb_id=${tmdb}`, h());
    svc.addReview         = (data) => $http.post(B + 'reviews.add', data, h());
    svc.deleteReview      = (id)   => $http.delete(B + `reviews.delete?review_id=${id}`, h());

    return svc;
}])

.factory('ListsService', ['$http', 'API', 'AuthService', function($http, API, AuthService) {

    var svc = {};
    var h   = function() { return AuthService.getHeaders(); };
    var B   = API.BASE + 'lists/';

    svc.getLists    = (uid)  => $http.get(B + (uid ? `get?user_id=${uid}` : 'get'), h());
    svc.getOne      = (id)   => $http.get(B + `getOne?list_id=${id}`, h());
    svc.createList  = (data) => $http.post(B + 'create', data, h());
    svc.deleteList  = (id)   => $http.delete(B + `delete?list_id=${id}`, h());
    svc.addItem     = (data) => $http.post(B + 'addItem', data, h());
    svc.removeItem  = (lid, tmdb) => $http.delete(B + `removeItem?list_id=${lid}&tmdb_id=${tmdb}`, h());

    return svc;
}]);