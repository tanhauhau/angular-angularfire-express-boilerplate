'use strict';
(function() {
    'use strict';
    angular.module('app', [
        'firebase',
        'firebase.ref',
        'firebase.auth',
        'ui.router',
        'underscore',
        'app.controllers',
    ])
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'auth/login.html',
            controller: 'LoginController'
        })
        .state('home', {
            url: '/',
            templateUrl: 'main/main.html',
            controller: 'MainController'
        });

        // if none of the above states are matched, use this as the fallback
        //Hack for bug https://github.com/angular-ui/ui-router/issues/600
        //Solution from frankwallis
        $urlRouterProvider.otherwise(function($injector, $location){
            var $state = $injector.get("$state");
            $state.go('home');
        });
    })
    .run(function($rootScope, $state, Auth){
        $rootScope.$on('$stateChangeStart', function(event, next, nextParams, fromState, fromParams){
            if (next.needAuthenticate) {
                var user = Auth.$getAuth();
                if (user === null) {
                    event.preventDefault();
                    $state.go('login');
                }
            }
        });
        Auth.$onAuth(function(authData){
            if (!authData) {
                $state.go('login');
            }
        });
    });
})();
