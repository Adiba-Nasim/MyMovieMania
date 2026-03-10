// ============================================
//  frontend/app/controllers/detail.controller.js
// ============================================

angular.module('MyMovieMania')

// ---- MOVIE DETAIL ----
.controller('MovieDetailCtrl', ['$scope', '$routeParams', 'MovieService', 'LibraryService', 'AuthService',
function($scope, $routeParams, MovieService, LibraryService, AuthService) {

    $scope.movie          = null;
    $scope.reviews        = [];
    $scope.loading        = true;
    $scope.inWatchlist    = false;
    $scope.isWatched      = false;
    $scope.newReview      = { rating: 3, review_text: '', liked: false };
    $scope.showReviewForm = false;
    $scope.activeTab      = 'cast';
    $scope.trailer        = null;

    var id = $routeParams.id;

    // Always read login state live
    $scope.isLoggedIn = function() {
        return AuthService.isLoggedIn();
    };

    // Load movie details
    MovieService.getDetail(id).then(function(res) {
        $scope.movie   = res.data;
        $scope.loading = false;

        // Find trailer
        var videos = (res.data.videos && res.data.videos.results) || [];
        for (var i = 0; i < videos.length; i++) {
            if (videos[i].type === 'Trailer' && videos[i].site === 'YouTube') {
                $scope.trailer = videos[i];
                break;
            }
        }

        // Check watchlist/watched status if logged in
        if (AuthService.isLoggedIn()) {
            LibraryService.checkWatchlist(id).then(function(r) {
                $scope.inWatchlist = r.data.in_watchlist;
            }).catch(function() {});

            LibraryService.checkWatched(id).then(function(r) {
                $scope.isWatched = r.data.watched;
            }).catch(function() {});
        }
    }).catch(function(err) {
        $scope.loading = false;
        $scope.error   = 'Could not load movie details.';
    });

    // Load reviews (public — no login needed)
    LibraryService.getMovieReviews(id).then(function(res) {
        $scope.reviews = res.data || [];
    }).catch(function() {
        $scope.reviews = [];
    });

    // Toggle watchlist
    $scope.toggleWatchlist = function() {
        if (!AuthService.isLoggedIn()) return;
        var m = $scope.movie;
        if ($scope.inWatchlist) {
            LibraryService.removeWatchlist(m.id).then(function() {
                $scope.inWatchlist = false;
            });
        } else {
            LibraryService.addToWatchlist({
                tmdb_id     : m.id,
                movie_title : m.title,
                poster_path : m.poster_path
            }).then(function() {
                $scope.inWatchlist = true;
            });
        }
    };

    // Toggle watched
    $scope.toggleWatched = function() {
        if (!AuthService.isLoggedIn()) return;
        var m = $scope.movie;
        if ($scope.isWatched) {
            LibraryService.removeWatched(m.id).then(function() {
                $scope.isWatched = false;
            });
        } else {
            LibraryService.markWatched({
                tmdb_id     : m.id,
                movie_title : m.title,
                poster_path : m.poster_path
            }).then(function() {
                $scope.isWatched = true;
            });
        }
    };

    // Submit review
    $scope.submitReview = function() {
        if (!AuthService.isLoggedIn()) return;
        var m = $scope.movie;
        LibraryService.addReview({
            tmdb_id     : m.id,
            movie_title : m.title,
            poster_path : m.poster_path,
            rating      : $scope.newReview.rating,
            review_text : $scope.newReview.review_text,
            liked       : $scope.newReview.liked ? 1 : 0
        }).then(function() {
            $scope.showReviewForm = false;
            $scope.newReview      = { rating: 3, review_text: '', liked: false };
            LibraryService.getMovieReviews(id).then(function(r) {
                $scope.reviews = r.data || [];
            });
        });
    };

    $scope.posterUrl = MovieService.posterUrl;
    $scope.stars     = MovieService.ratingStars;

    // Modal controls
    $scope.openReviewModal = function() {
        // Pre-fill rating+liked from existing review for this movie
        if (AuthService.isLoggedIn()) {
            LibraryService.getMyRating(id).then(function(res) {
                $scope.newReview.rating = res.data.rating || 3;
                $scope.newReview.liked  = res.data.liked  == 1;
            }).catch(function() {
                $scope.newReview = { rating: 3, review_text: '', liked: false };
            });
        }
        $scope.newReview.review_text = ''; // always clear text for new review
        $scope.showReviewForm = true;
        document.body.style.overflow = 'hidden';
    };
    $scope.closeReviewModal = function() {
        $scope.showReviewForm = false;
        document.body.style.overflow = '';
    };

    // Always restore scroll when leaving the page
    $scope.$on('$destroy', function() {
        document.body.style.overflow = '';
    });
}])

// ---- AUTH ----
.controller('AuthCtrl', ['$scope', '$location', 'AuthService',
function($scope, $location, AuthService) {

    if (AuthService.isLoggedIn()) { $location.path('/'); return; }

    $scope.mode         = 'login';
    $scope.form         = {};
    $scope.error        = '';
    $scope.fieldError   = '';
    $scope.loading      = false;
    $scope.showPassword = false;

    $scope.togglePassword = function(inputId) {
        var input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            $scope.showPassword = true;
        } else {
            input.type = 'password';
            $scope.showPassword = false;
        }
    };

    // Client-side validation before hitting backend
    function validateRegister() {
        var f = $scope.form;
        if (!f.username || !f.username.trim()) {
            $scope.error = 'Username is required.'; $scope.fieldError = 'username'; return false;
        }
        if (f.username.trim().length < 3) {
            $scope.error = 'Username must be at least 3 characters.'; $scope.fieldError = 'username'; return false;
        }
        if (!/^[a-zA-Z0-9_\.]+$/.test(f.username.trim())) {
            $scope.error = 'Username can only contain letters, numbers, _ and .'; $scope.fieldError = 'username'; return false;
        }
        if (!f.email || !f.email.trim()) {
            $scope.error = 'Email is required.'; $scope.fieldError = 'email'; return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
            $scope.error = 'Please enter a valid email address.'; $scope.fieldError = 'email'; return false;
        }
        if (!f.password) {
            $scope.error = 'Password is required.'; $scope.fieldError = 'password'; return false;
        }
        if (f.password.length < 6) {
            $scope.error = 'Password must be at least 6 characters.'; $scope.fieldError = 'password'; return false;
        }
        return true;
    }

    function validateLogin() {
        var f = $scope.form;
        if (!f.email || !f.email.trim()) {
            $scope.error = 'Email is required.'; $scope.fieldError = 'email'; return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
            $scope.error = 'Please enter a valid email address.'; $scope.fieldError = 'email'; return false;
        }
        if (!f.password) {
            $scope.error = 'Password is required.'; $scope.fieldError = 'password'; return false;
        }
        return true;
    }

    $scope.submit = function() {
        $scope.error      = '';
        $scope.fieldError = '';

        // Run client-side validation first
        var valid = $scope.mode === 'login' ? validateLogin() : validateRegister();
        if (!valid) return;

        $scope.loading = true;

        var p = $scope.mode === 'login'
            ? AuthService.login($scope.form.email, $scope.form.password)
            : AuthService.register($scope.form.username, $scope.form.email, $scope.form.password);

        p.then(function() {
            $location.path('/profile');
        }).catch(function(err) {
            $scope.loading    = false;
            $scope.error      = (err.data && err.data.error) || 'Something went wrong. Please try again.';
            $scope.fieldError = (err.data && err.data.field) || '';
        });
    };

    $scope.switchMode = function(m) {
        $scope.mode       = m;
        $scope.error      = '';
        $scope.fieldError = '';
        $scope.form       = {};
        $scope.showPassword = false;
    };

    $scope.clearFieldError = function(field) {
        if ($scope.fieldError === field || $scope.fieldError === 'all') {
            $scope.error      = '';
            $scope.fieldError = '';
        }
    };
}])

// ---- PROFILE ----
.controller('ProfileCtrl', ['$scope', '$location', '$http', 'AuthService', 'LibraryService', 'API',
function($scope, $location, $http, AuthService, LibraryService, API) {

    if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }

    $scope.user        = AuthService.currentUser || {};
    $scope.reviews     = [];
    $scope.watched     = [];
    $scope.editMode    = false;
    $scope.editForm    = {};
    $scope.saving      = false;
    $scope.saveSuccess = false;
    $scope.saveError   = '';

    // Load fresh user data
    AuthService.fetchMe().then(function(u) {
        $scope.user = u;
    }).catch(function() {});

    LibraryService.getMyReviews().then(function(r) {
        $scope.reviews = (r.data || []).slice(0, 6);
    }).catch(function() {});

    LibraryService.getWatched().then(function(r) {
        $scope.watched = (r.data || []).slice(0, 8);
    }).catch(function() {});

    // Start editing
    $scope.startEdit = function() {
        $scope.editForm    = { username: $scope.user.username, bio: $scope.user.bio || '' };
        $scope.editMode    = true;
        $scope.saveSuccess = false;
        $scope.saveError   = '';
    };

    // Cancel editing
    $scope.cancelEdit = function() {
        $scope.editMode = false;
        $scope.saveSuccess = false;
        $scope.saveError   = '';
    };

    // Save profile
    $scope.saveProfile = function() {
        if (!$scope.editForm.username.trim()) {
            $scope.saveError = 'Username cannot be empty.';
            return;
        }
        $scope.saving    = true;
        $scope.saveError = '';

        $http.post(API.BASE + 'auth/updateProfile',
            { username: $scope.editForm.username, bio: $scope.editForm.bio },
            AuthService.getHeaders()
        ).then(function(res) {
            $scope.saving      = false;
            $scope.saveSuccess = true;
            $scope.editMode    = false;
            // Update local user object
            $scope.user.username = $scope.editForm.username;
            $scope.user.bio      = $scope.editForm.bio;
            AuthService.currentUser.username = $scope.editForm.username;
            AuthService.currentUser.bio      = $scope.editForm.bio;
        }).catch(function(err) {
            $scope.saving    = false;
            $scope.saveError = (err.data && err.data.error) || 'Could not save. Try again.';
        });
    };

    $scope.logout = function() {
        AuthService.logout();
        $location.path('/');
    };

    $scope.posterUrl = function(path) {
        return path ? 'https://image.tmdb.org/t/p/w185' + path : 'https://via.placeholder.com/185x278?text=?';
    };
}])


// ---- DIARY ----
.controller('DiaryCtrl', ['$scope', '$location', 'LibraryService', 'AuthService',
function($scope, $location, LibraryService, AuthService) {

    if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }

    $scope.reviews    = [];
    $scope.watched    = [];
    $scope.loading    = true;
    $scope.activeTab  = 'reviews'; // 'reviews' or 'watched'

    $scope.setTab = function(tab) { $scope.activeTab = tab; };

    function load() {
        var p1 = LibraryService.getMyReviews().then(function(res) {
            $scope.reviews = res.data || [];
        }).catch(function() { $scope.reviews = []; });

        var p2 = LibraryService.getWatched().then(function(res) {
            $scope.watched = res.data || [];
        }).catch(function() { $scope.watched = []; });

        Promise.all([p1, p2]).then(function() { $scope.loading = false; $scope.$apply(); });
    }
    load();

    $scope.deleteReview = function(id) {
        if (!confirm('Delete this review?')) return;
        LibraryService.deleteReview(id).then(load);
    };

    $scope.posterUrl = function(path) {
        return path
            ? 'https://image.tmdb.org/t/p/w185' + path
            : 'https://via.placeholder.com/185x278?text=?';
    };
}])

// ---- DIARY REVIEWS (full page) ----
.controller('DiaryReviewsCtrl', ['$scope', '$location', 'LibraryService', 'AuthService',
function($scope, $location, LibraryService, AuthService) {
    if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }
    $scope.reviews = [];
    $scope.loading = true;
    LibraryService.getMyReviews().then(function(res) {
        $scope.reviews = res.data || [];
        $scope.loading = false;
    }).catch(function() { $scope.loading = false; });

    $scope.deleteReview = function(id) {
        if (!confirm('Delete this review?')) return;
        LibraryService.deleteReview(id).then(function() {
            $scope.reviews = $scope.reviews.filter(function(r) { return r.id !== id; });
        });
    };
    $scope.posterUrl = function(path) {
        return path ? 'https://image.tmdb.org/t/p/w185' + path : 'https://via.placeholder.com/185x278?text=?';
    };
}])

// ---- DIARY WATCHED (full page) ----
.controller('DiaryWatchedCtrl', ['$scope', '$location', 'LibraryService', 'AuthService',
function($scope, $location, LibraryService, AuthService) {
    if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }
    $scope.watched = [];
    $scope.loading = true;
    LibraryService.getWatched().then(function(res) {
        $scope.watched = res.data || [];
        $scope.loading = false;
    }).catch(function() { $scope.loading = false; });

    $scope.posterUrl = function(path) {
        return path ? 'https://image.tmdb.org/t/p/w185' + path : 'https://via.placeholder.com/185x278?text=?';
    };
}])

// ---- WATCHLIST ----
.controller('WatchlistCtrl', ['$scope', '$location', 'LibraryService', 'AuthService',
function($scope, $location, LibraryService, AuthService) {

    if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }

    $scope.items   = [];
    $scope.loading = true;

    function load() {
        LibraryService.getWatchlist().then(function(res) {
            $scope.items   = res.data || [];
            $scope.loading = false;
        }).catch(function() { $scope.loading = false; });
    }
    load();

    $scope.remove = function(tmdbId) {
        LibraryService.removeWatchlist(tmdbId).then(load);
    };

    $scope.markWatched = function(item) {
        LibraryService.markWatched({
            tmdb_id     : item.tmdb_id,
            movie_title : item.movie_title,
            poster_path : item.poster_path
        }).then(load);
    };

    $scope.posterUrl = function(path) {
        return path
            ? 'https://image.tmdb.org/t/p/w185' + path
            : 'https://via.placeholder.com/185x278?text=?';
    };
}])

// ---- LISTS ----
.controller('ListsCtrl', ['$scope', '$location', '$timeout', 'ListsService', 'MovieService', 'AuthService',
function($scope, $location, $timeout, ListsService, MovieService, AuthService) {

    if (!AuthService.isLoggedIn()) { $location.path('/login'); return; }

    $scope.lists      = [];
    $scope.newList    = { title: '', description: '', is_public: true };
    $scope.showForm   = false;
    $scope.activeList = null;
    $scope.addQuery   = '';
    $scope.addResults = [];
    $scope.addSearching = false;
    var addDebounce = null;

    $scope.posterUrl = MovieService.posterUrl;

    function loadLists() {
        ListsService.getLists().then(function(r) {
            $scope.lists = r.data || [];
            // Fetch preview posters for each list
            $scope.lists.forEach(function(list) {
                ListsService.getOne(list.id).then(function(res) {
                    list.preview = (res.data.items || []).slice(0, 4).map(function(i) { return i.poster_path; });
                }).catch(function() {});
            });
        }).catch(function() {});
    }
    loadLists();

    $scope.createList = function() {
        if (!$scope.newList.title.trim()) return;
        ListsService.createList($scope.newList).then(function() {
            $scope.newList  = { title: '', description: '', is_public: true };
            $scope.showForm = false;
            loadLists();
        });
    };

    $scope.deleteList = function(id, $event) {
        $event.stopPropagation();
        if (!confirm('Delete this list?')) return;
        ListsService.deleteList(id).then(loadLists);
    };

    // Open list detail
    $scope.openList = function(list) {
        ListsService.getOne(list.id).then(function(res) {
            $scope.activeList = res.data;
            $scope.addQuery   = '';
            $scope.addResults = [];
        });
    };

    $scope.closeList = function() {
        $scope.activeList = null;
        $scope.addQuery   = '';
        $scope.addResults = [];
        loadLists();
    };

    // Check if movie already in active list
    $scope.isInList = function(tmdbId) {
        if (!$scope.activeList) return false;
        return ($scope.activeList.items || []).some(function(i) { return i.tmdb_id == tmdbId; });
    };

    // Search for movies to add
    $scope.onAddQueryChange = function() {
        if (addDebounce) $timeout.cancel(addDebounce);
        if (!$scope.addQuery || $scope.addQuery.length < 2) {
            $scope.addResults = [];
            return;
        }
        addDebounce = $timeout(function() {
            $scope.addSearching = true;
            MovieService.search($scope.addQuery, 1).then(function(res) {
                $scope.addResults   = (res.data.results || []).slice(0, 8);
                $scope.addSearching = false;
            }).catch(function() { $scope.addSearching = false; });
        }, 350);
    };

    // Add movie to active list
    $scope.addToList = function(m) {
        if (!$scope.activeList || $scope.isInList(m.id)) return;
        var pos = ($scope.activeList.items || []).length;
        ListsService.addItem({
            list_id     : $scope.activeList.id,
            tmdb_id     : m.id,
            movie_title : m.title,
            poster_path : m.poster_path || '',
            position    : pos
        }).then(function() {
            // Add to local list immediately
            $scope.activeList.items.push({
                tmdb_id     : m.id,
                movie_title : m.title,
                poster_path : m.poster_path || '',
                position    : pos
            });
        });
    };

    // Remove movie from active list
    $scope.removeFromList = function(tmdbId) {
        if (!$scope.activeList) return;
        ListsService.removeItem($scope.activeList.id, tmdbId).then(function() {
            $scope.activeList.items = $scope.activeList.items.filter(function(i) {
                return i.tmdb_id != tmdbId;
            });
        });
    };
}]);