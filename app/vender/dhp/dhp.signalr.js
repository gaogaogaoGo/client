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
(function(_, $) {
  // Check if SignalR is defined
  if (!$ || !$.connection) {
    return;
  }

  _.signalr = _.signalr || {};
  _.signalr.hubs = _.signalr.hubs || {};

  _.signalr.hubs.common = $.connection.dhpCommonHub;

  $.connection.hub.url = 'http://localhost:7682/signalr';
$.connection.hub.qs = { 'access_token': 'uoMjnlAkeM6LNgMrDqTdSX02D0-9D-8I2g6P0Dxr5-RxpXmWEuNRBhX_2Ii-ppipCq8V31LI_WyzpR-dLJHdFq-qQjxg_hZKpkLJI0uW5H4vjJA1dpbnt8YUw2calXCJcdrS_HYzqmaCu6bTLMjeXeL0GgrrCV1AagJxZax_dGdptlKoi3fGei3U8i21TPdoJwFw_x6BWoivAVO1CVaLts8tkBXxNkE48QkIlOwVSbMwOex9R9vR33I71xZ-DbXknMyFGp1yQ5DtbD43DoSp7CRIrOcTzLk_xKHfkbvGP1GdkOjEpSiz0tOjLrgJt-fkfdueWKIRit6ZBdVm7JmHNWlQg7Rwc_1QXvkiDCa93dGoWHTwxT1bEObPBwIuURTRJ9jkJEvYs4UotXmD_90xKfV1TSgv0ToV_mnygVCmqX9iwXHMZ5p7jRpswPT_HN79' };


  //"access_token='Bearer '";// + encodeURIComponent(dhp.auth.getToken());

  var commonHub = _.signalr.hubs.common;

  if (!commonHub) {
    return;
  }

  commonHub.client.getNotification = function(notification) {
    _.event.trigger('dhp.notifications.received', notification);
  };

  _.signalr.connect = function() {
    $.connection.hub.start().done(function() {
      _.log.debug('Connected to SignalR server!');

      _.event.trigger('dhp.signalr.connected');

      commonHub.server.register().done(function() {
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
  $.connection.hub.disconnected(function() {
    if (!_.signalr.autoConnect) {
      return;
    }

    setTimeout(function() {
      if ($.connection.hub.state === $.signalR.connectionState.disconnected) {
        $.connection.hub.start();
      }
    }, 5000);
  });
})(dhp || (dhp = {}), jQuery);