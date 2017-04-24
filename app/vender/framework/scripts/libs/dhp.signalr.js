/*!
 * project name: Dhp.Web.Resources
 * name:         dhp.signalr.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/7/26
 */

'use strict';

var dhp;
(function (_, $) {
  // Check if SignalR is defined
  if (!$ || !$.connection) {
    return;
  }

  _.signalr = _.signalr || {};
  _.signalr.hubs = _.signalr.hubs || {};

  _.signalr.hubs.common = $.connection.dhpCommonHub;

  var commonHub = _.signalr.hubs.common;

  if (!commonHub) {
    return;
  }

  commonHub.client.getNotification = function (notification) {
    _.event.trigger('dhp.notifications.received', notification);
  };

  _.signalr.connect = function () {
    $.connection.hub.start().done(function () {
      _.log.debug('Connected to SignalR server!');

      _.event.trigger('dhp.signalr.connected');

      commonHub.server.register().done(function () {
        _.log.debug('Registered to the SignalR server!');
      });
    });
  };

  if (_.signalr.autoConnect === undefined) {
    _.signalr.autoConnect = true;
  }

  if (_.signalr.autoConnect) {
    _.signalr.connect();
  }

  // reconnect if hub disconnects
  $.connection.hub.disconnected(function () {
    if (!_.signalr.autoConnect) {
      return;
    }

    setTimeout(function () {
      if ($.connection.hub.state === $.signalR.connectionState.disconnected) {
        $.connection.hub.start();
      }
    }, 5000);
  });
})(dhp || (dhp = {}), jQuery);
 
