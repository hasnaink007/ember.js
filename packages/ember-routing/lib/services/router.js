/**
@module ember
@submodule ember-routing
*/

import {
  Service,
  readOnly
} from 'ember-runtime';
import { shallowEqual } from '../utils';

/**
   The Router service is the public API that provides component/view layer
   access to the router.

   @public
   @class RouterService
   @category ember-routing-router-service
 */
const RouterService = Service.extend({

  /**
     Name of the current route.

     This property represent the logical name of the route,
     which is comma separated.
     For the following router:

     ```app/router.js
     Router.map(function() {
       this.route('about);
       this.route('blog', function () {
         this.route('post', { path: ':post_id' });
       });
     });
     ```

     It will return:

     * `index` when you visit `/`
     * `about` when you visit `/about`
     * `blog.index` when you visit `/blog`
     * `blog.post` when you visit `/blog/some-post-id`

     @property currentRouteName
     @type String
     @public
   */
  currentRouteName: readOnly('_router.currentRouteName'),

  /**
     Current URL for the application.

    This property represent the URL path for this route.
    For the following router:

     ```app/router.js
     Router.map(function() {
       this.route('about);
       this.route('blog', function () {
         this.route('post', { path: ':post_id' });
       });
     });
     ```

     It will return:

     * `/` when you visit `/`
     * `/about` when you visit `/about`
     * `/blog/index` when you visit `/blog`
     * `/blog/post` when you visit `/blog/some-post-id`

     @property currentURL
     @type String
     @public
   */
  currentURL: readOnly('_router.currentURL'),

  /**
    The `location` property determines the type of URL's that your
    application will use.
    The following location types are currently available:
    * `auto`
    * `hash`
    * `history`
    * `none`

    @property location
    @default 'hash'
    @see {Ember.Location}
    @public
  */
  location: readOnly('_router.location'),

  /**
    The `rootURL` property represents the URL of the root of
    the application, '/' by default.
    This prefix is assumed on all routes defined on this app.

    IF you change the `rootURL` in your environment configuration
    like so:

    ```config/environment.js
    'use strict';

    module.exports = function(environment) {
      let ENV = {
        modulePrefix: 'router-service',
        environment,
        rootURL: '/my-root',
      …
      }
    ]
    ```

    This property will return `/my-root`.

    @property rootURL
    @default '/'
    @public
  */
  rootURL: readOnly('_router.rootURL'),
  _router: null,

  /**
     Transition the application into another route. The route may
     be either a single route or route path:

     See [Route.transitionTo](https://emberjs.com/api/classes/Ember.Route.html#method_transitionTo) for more info.

     @method transitionTo
     @category ember-routing-router-service
     @param {String} routeNameOrUrl the name of the route or a URL
     @param {...Object} models the model(s) or identifier(s) to be used while
       transitioning to the route.
     @param {Object} [options] optional hash with a queryParams property
       containing a mapping of query parameters
     @return {Transition} the transition object associated with this
       attempted transition
     @public
   */
  transitionTo(...args) {
    let queryParams;
    let arg = args[0];
    if (resemblesURL(arg)) {
      return this._router._doURLTransition('transitionTo', arg);
    }

    let possibleQueryParams = args[args.length - 1];
    if (possibleQueryParams && possibleQueryParams.hasOwnProperty('queryParams')) {
      queryParams = args.pop().queryParams;
    } else {
      queryParams = {};
    }

    let targetRouteName = args.shift();
    let transition = this._router._doTransition(targetRouteName, args, queryParams, true);
    transition._keepDefaultQueryParamValues = true;

    return transition;
  },

  /**
     Transition into another route while replacing the current URL, if possible.
     The route may be either a single route or route path:

     See [Route.replaceWith](https://emberjs.com/api/classes/Ember.Route.html#method_replaceWith) for more info.

     @method replaceWith
     @category ember-routing-router-service
     @param {String} routeNameOrUrl the name of the route or a URL
     @param {...Object} models the model(s) or identifier(s) to be used while
       transitioning to the route.
     @param {Object} [options] optional hash with a queryParams property
       containing a mapping of query parameters
     @return {Transition} the transition object associated with this
       attempted transition
     @public
   */
  replaceWith(/* routeNameOrUrl, ...models, options */) {
    return this.transitionTo(...arguments).method('replace');
  },

  /**
     Generate a URL based on the supplied route name.

     @method urlFor
     @category ember-routing-router-service
     @param {String} routeName the name of the route
     @param {...Object} models the model(s) or identifier(s) to be used while
       transitioning to the route.
     @param {Object} [options] optional hash with a queryParams property
       containing a mapping of query parameters
     @return {String} the string representing the generated URL
     @public
   */
  urlFor(/* routeName, ...models, options */) {
    return this._router.generate(...arguments);
  },

  /**
     Determines whether a route is active.

     @method isActive
     @category ember-routing-router-service
     @param {String} routeName the name of the route
     @param {...Object} models the model(s) or identifier(s) to be used while
       transitioning to the route.
     @param {Object} [options] optional hash with a queryParams property
       containing a mapping of query parameters
     @return {boolean} true if the provided routeName/models/queryParams are active
     @public
   */
  isActive(/* routeName, ...models, options */) {
    let { routeName, models, queryParams } = this._extractArguments(...arguments);
    let routerMicrolib = this._router._routerMicrolib;
    let state = routerMicrolib.state;

    if (!routerMicrolib.isActiveIntent(routeName, models, null)) { return false; }
    let hasQueryParams = Object.keys(queryParams).length > 0;

    if (hasQueryParams) {
      this._router._prepareQueryParams(routeName, models, queryParams, true /* fromRouterService */);
      return shallowEqual(queryParams, state.queryParams);
    }

    return true;
  },

  _extractArguments(routeName, ...models) {
    let possibleQueryParams = models[models.length - 1];
    let queryParams = {};

    if (possibleQueryParams && possibleQueryParams.hasOwnProperty('queryParams')) {
      let options = models.pop();
      queryParams = options.queryParams;
    }

    return { routeName, models, queryParams };
  }
});

function resemblesURL(str) {
  return typeof str === 'string' && (str === '' || str[0] === '/');
}

export default RouterService;
