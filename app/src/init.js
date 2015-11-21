var spoti = angular.module('spoti',
    ['ngMaterial', 'ngRoute', 'ngResource', 'list', 'toast', 'ngEventEmitter']);
var user_id = localStorage.getItem("user_id");
var SPOTIPLAY_QUEUE_NAME = 'Spotiplay queue';
var toast_something_wrong;
var DEBUG;

spoti.config(['$mdThemingProvider', function($mdThemingProvider){
        var spotiPalette = $mdThemingProvider.extendPalette('light-green', {
       /*     '200': '648f00',
            '300': '648f00',
            '400': '648f00',
            '500': '648f00',
            '600': '648f00',
            '700': '648f00',
            '800': '648f00',
            '900': '648f00',
            'A100': '648f00',
            'A200': '648f00',
            'A400': '85bb22',
            'A700': '85bb22'*/
        });
        $mdThemingProvider.definePalette('spoti', spotiPalette);

        $mdThemingProvider.theme('default').dark()
            .primaryPalette('grey')
            .accentPalette('spoti')
            .warnPalette('spoti')
            .backgroundPalette('grey')
            ;
    }])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/', {
                controller:'HomeController as ctrl',
                templateUrl:'src/front/home.html'
            })
            .when('/auth', {
                controller:'AuthController as ctrl',
                templateUrl:'src/auth/auth.html'
            })
            .when('/logout', {
                controller:'LogoutController as ctrl',
                templateUrl:'src/auth/logout.html'
            })
            .when('/support', {
                controller:'SupportController as ctrl',
                templateUrl:'src/front/support.html'
            })
            .when('/support/sent', {
                controller:'SupportController as ctrl',
                templateUrl:'src/front/support-sent.html'
            })
            .when('/panel', {
                controller:'PanelController as ctrl',
                templateUrl:'src/panel/panel.html'
            })
            .when('/test', {
                controller:'TestController as ctrl',
                templateUrl:'src/test/view.html'
            })
            .otherwise({
                controller:'HomeController as ctrl',
                templateUrl:'src/front/home.html'
            });
    }])
    .config(['$provide', function ($provide) {
        $provide.decorator("$exceptionHandler", ['$delegate', function ($delegate) {

            // http://blog.gospodarets.com/track_javascript_angularjs_and_jquery_errors_with_google_analytics/

            $(document).ajaxError(function (event, request, settings) {
                var err = {
                    result: event.result,
                    status: request.status,
                    statusText: request.statusText,
                    crossDomain: settings.crossDomain,
                    dataType: settings.dataType
                };

                if (request.status != 401)
                    error('AJAX error', err);
            });

            // Pure JavaScript errors handler
            window.addEventListener('error', function (err) {
                Rollbar.error(err);
                //if (toast_something_wrong) toast_something_wrong();
            });

            return function (exception, cause) {
                $delegate(exception, cause);
                Rollbar.error(exception);
                //if (toast_something_wrong) toast_something_wrong();
            };
        }]);
    }]);


function log() {
    if (DEBUG) console.log.apply(console, arguments);
}
function error(str, obj) {
    Rollbar.error(str, obj);
    if (DEBUG) console.error(str, obj);
    if (toast_something_wrong) toast_something_wrong();
}
//document.addEventListener("contextmenu", function(e){
//    e.preventDefault();
//}, false);
