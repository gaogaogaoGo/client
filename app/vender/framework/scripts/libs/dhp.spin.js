/*!
 * project name: Dhp.Web.Resources
 * name:         dhp.spin.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/8/19
 */

'use strict';

var dhp;
(function (_, $) {
  if (!$ || !$.fn.spin) {
    return;
  }

  _.libs = _.libs || {};

  _.libs.spinjs = {
    config: {
      lines: 11,
      length: 0,
      width: 10,
      radius: 20,
      corners: 1.0,
      trail: 60,
      speed: 1.2
    },
    indicator: {
      lines: 11,
      length: 0,
      width: 4,
      radius: 7,
      corners: 1.0,
      trail: 60,
      speed: 1.2
    }
  };

  _.ui.setBusy = function (element, optionsOrPromise) {
    optionsOrPromise = optionsOrPromise || {};

    // Check if it's promise
    if (optionsOrPromise.always || optionsOrPromise['finally']) {
      optionsOrPromise = { promise: optionsOrPromise };
    }

    var options = $.extend({}, optionsOrPromise);

    if (!element) {
      if (options.block !== false) {
        _.ui.block();
      }

      $('body').spin(_.libs.spinjs.config);
    }
    else {
      var $busyIndicator = $(element).find('.busy-indicator');

      if ($busyIndicator.length) {
        $busyIndicator.spin(_.libs.spinjs.indicator);
      }
      else {
        if (options.blockUI != false) {
          _.ui.block(element);
        }

        $(element).spin(_.libs.spinjs.config);
      }
    }

    if (!!options.promise) {
      if (!!options.promise.always) {
        options.promise.always(function () {
          _.ui.clearBusy(element);
        });
      }
      else if (!!options.promise['finally']) {
        options.promise['finally'](function () {
          _.ui.clearBusy(element);
        });
      }
    }
  };

  _.ui.clearBusy = function (element) {
    if (!element) {
      _.ui.unblock();
      $('body').spin(false);
    }
    else {
      var $indicator = $(element).find('.busy-indicator');

      if ($indicator.length) {
        $indicator.spin(false);
      }
      else {
        _.ui.unblock(element);
        $(element).spin(false);
      }
    }
  };
})(dhp || (dhp = {}), jQuery);
 
