angular.module('firebase.ref', ['firebase', 'firebase.config'])
  .factory('Ref', ['$window', 'FBURL', function($window, FBURL) {
    'use strict';

    function pathRef(args) {
        for (var i = 0; i < args.length; i++) {
            if (angular.isArray(args[i])) {
                args[i] = pathRef(args[i]);
            }
            else if( typeof args[i] !== 'string' ) {
                throw new Error('Argument '+i+' to firebaseRef is not a string: '+args[i]);
            }
        }
        return args.join('/');
    }

    /**
       * Example:
       * <code>
       *    function(firebaseRef) {
         *       var ref = firebaseRef('path/to/data');
         *    }
       * </code>
       *
       * @function
       * @name firebaseRef
       * @param {String|Array...} path relative path to the root folder in Firebase instance
       * @return a Firebase instance
       */
    function firebaseRef(path /*  */){
        var ref = new $window.Firebase(FBURL);
        var args = Array.prototype.slice.call(arguments);
        if( args.length ) {
            ref = ref.child(pathRef(args));
        }
        return ref;
    }

    return {
        child: firebaseRef,
        ref: firebaseRef,
    };
}]);
