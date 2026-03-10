// ============================================
//  frontend/app/services/auth.service.js
// ============================================

angular.module('MyMovieMania')
.factory('AuthService', ['$http', '$q', 'API', function($http, $q, API) {

    var service = {
        currentUser : null,
        token       : localStorage.getItem('mmm_token') || null
    };

    service.isLoggedIn = function() {
        return !!service.token;
    };

    service.getHeaders = function() {
        return service.token
            ? { headers: { 'Authorization': 'Bearer ' + service.token } }
            : {};
    };

    service.register = function(username, email, password) {
        return $http.post(API.BASE + 'auth/register',
            { username, email, password })
            .then(function(res) {
                service.token = res.data.token;
                service.currentUser = res.data.user;
                localStorage.setItem('mmm_token', service.token);
                return res.data;
            });
    };

    service.login = function(email, password) {
        return $http.post(API.BASE + 'auth/login',
            { email, password })
            .then(function(res) {
                service.token = res.data.token;
                service.currentUser = res.data.user;
                localStorage.setItem('mmm_token', service.token);
                return res.data;
            });
    };

    service.logout = function() {
        service.token       = null;
        service.currentUser = null;
        localStorage.removeItem('mmm_token');
    };

    service.fetchMe = function() {
        if (!service.token) return $q.reject('No token');
        return $http.get(API.BASE + 'auth/me', service.getHeaders())
            .then(function(res) {
                service.currentUser = res.data;
                return res.data;
            });
    };

    service.updateProfile = function(data) {
        return $http.post(API.BASE + 'auth/updateProfile', data, service.getHeaders());
    };

    // Auto-fetch on load
    if (service.token) service.fetchMe();

    return service;
}]);