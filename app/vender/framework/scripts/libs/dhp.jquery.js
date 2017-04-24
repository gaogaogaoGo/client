/*!
 * project name: Dhp.Web.Resources
 * name:         dhp.jquery.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/8/18
 */

'use strict';

var dhp;
(function (_, $) {
  if (!$) {
    return;
  }

  // Ajax
  _.ajax = function (options) {
    var opts = $.extend({}, _.ajax.defaultOpts, options);

    return $.Deferred(function ($dfd) {
      $.ajax(opts)
        .done(function (data, textStatus, jqXHR) {
          if (data.__dhp) {
            _.ajax.response(data, options, $dfd, jqXHR);
          }
          else {
            $dfd.resolve(data);
            options.success && options.success(data);
          }
        })
        .fail(function (jqXHR) {
          if (jqXHR.responseJSON && jqXHR.responseJSON.__dhp) {
            _.ajax.response(jqXHR.responseJSON, options, $dfd, jqXHR);
          }
          else {
            _.ajax.responseError(jqXHR, options, $dfd);
          }
        });
    });
  };

  $.extend(_.ajax, {
    defaultOpts: {
      dataType: 'json',
      type: 'post',
      contentType: 'application/json',
      success: undefined,
      error: undefined
    },

    defaultError: {
      message: 'An error has occurred!',
      details: 'Error detail not sent by server.'
    },

    defaultError401: {
      message: 'You are not authenticated!',
      details: 'You should be authenticated (sign in) in order to perform this operation.'
    },

    defaultError403: {
      message: 'You are not authorized!',
      details: 'You are not allowed to perform this operation.'
    },

    logError: function (error) {
      _.log.error(error);
    },
    showError: function (error) {
      if (error.details) {
        return _.message.error(error.details, error.message);
      }
      else {
        return _.message.error(error.message || _.ajax.defaultError.message);
      }
    },

    targetUrl: function (url) {
      if (!url) {
        location.href = _.appPath;
      }
      else {
        location.href = url;
      }
    },

    unauthorizedRequest: function (msgPromise, url) {
      if (msgPromise) {
        msgPromise.done(function () {
          _.ajax.targetUrl(url);
        });
      }
      else {
        _.ajax.targetUrl(url);
      }
    },

    response: function (data, options, $dfd, jqXHR) {
      if (!!data) {
        if (data.success === true) {
          $dfd && $dfd.resolve(data.result, data, jqXHR);
          options.success && options.success(data.result, data, jqXHR);

          if (data.targetUrl) {
            _.ajax.targetUrl(data.targetUrl);
          }
        }
        else if (data.success === false) {
          var promise = null;

          if (data.error) {
            promise = _.ajax.showError(data.error);
          }
          else {
            data.error = _.ajax.defaultError;
          }

          _.ajax.logError(data.error);

          $dfd && $dfd.reject(data.error, jqXHR);
          options.error && options.error(data.error, jqXHR);

          if (jqXHR.status == 401) {
            _.ajax.unauthorizedRequest(promise, data.targetUrl);
          }
        }
        // not wrapped result
        else {
          $dfd && $dfd.resolve(data, null, jqXHR);
          options.success && options.success(data, null, jqXHR);
        }
      }
      // no data sent to back
      else {
        $dfd && $dfd.resolve(jqXHR);
        options.success && options.success(jqXHR);
      }
    },
    responseError: function (jqXHR, options, $dfd) {
      switch (jqXHR.status) {
        case 401:
          _.ajax.unauthorizedRequest(
            _.ajax.showError(_.ajax.defaultError401), _.appPath
          );
          break;
        case 403:
          _.ajax.showError(_.ajax.defaultError403);
          break;
        default:
          _.ajax.showError(_.ajax.defaultError);
          break;
      }

      $dfd.reject.apply(this, arguments);
      options.error && options.error.apply(this, arguments);
    },

    block: function (options) {
      if (!!options && typeof options.block !== "undefined") {
        // block whole page
        if (options.block === true) {
          _.ui.setBusy();
        }
        // block an element
        else {
          _.ui.setBusy(options.block);
        }
      }
    },
    unblock: function (options) {
      if (!!options && typeof options.block !== "undefined") {
        // unblock whole page
        if (options.block === true) {
          _.ui.clearBusy();
        }
        // unblock an element
        else {
          _.ui.clearBusy(options.block);
        }
      }
    }
  });

  /*
   * jQuery Form Plugin
   * http://www.malsup.com/jquery/form/
   */
  // jQuery form
  if (!!$.fn.ajaxForm) {
    $.fn.dhpAjaxForm.defaults = { method: 'post' };

    $.fn.dhpAjaxForm = function (options) {
      var opts = $.extend({}, $.fn.dhpAjaxForm.defaults, options);

      opts.beforeSubmit = function () {
        _.ajax.block(opts);
        options.beforeSubmit && options.beforeSubmit.apply(this, arguments);
      };

      opts.success = function (data) {
        _.ajax.response(data, options);
      };

      opts.error = function () {
        _.log.info('ajax form error');
      };

      opts.complete = function () {
        _.ajax.unblock(opts);
        options.complete && options.complete.apply(this, arguments);
      };

      return this.ajaxForm(opts);
    };
  }

  // Dynamic script initialized
  _.event.on('dhp.dynamicScriptsInitialized', function () {
    _.ajax.defaultError.message = _.localization.dhpWeb('DefaultError');
    _.ajax.defaultError.details = _.localization.dhpWeb('DefaultErrorDetail');
    _.ajax.defaultError401.message = _.localization.dhpWeb('DefaultError401');
    _.ajax.defaultError401.details = _.localization.dhpWeb('DefaultErrorDetail401');
    _.ajax.defaultError403.message = _.localization.dhpWeb('DefaultError403');
    _.ajax.defaultError403.details = _.localization.dhpWeb('DefaultErrorDetail403');
  });
})(dhp || (dhp = {}), jQuery);
 
