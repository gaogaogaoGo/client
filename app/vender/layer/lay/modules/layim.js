/*!
 * project name: layui
 * name:         layim.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/10/25
 */

'use strict';

layui.define(['form', 'layer', 'laytpl', 'upload', 'util'], function (exports) {
  var version = '2.0.9';
  var versionInner = '2.1.0';

  var $ = layui.jquery;

  var form = layui.form();
  var layer = layui.layer;
  var laytpl = layui.laytpl;
  var util = layui.util;

  var SHOW = 'layim-show';
  var THIS = 'layim-this';

  var MAX_CHAT_LOG = 10;     // local store max message number
  var MAX_MSG_LENGTH = 3000; // max chat message length

  /**
   * Event bus
   * @type {{}}
   */
  var events = (function () {
    var _cbs = {};

    var on = function (evtName, cb) {
      evtName = evtName.toLowerCase();

      if (!_cbs[evtName]) {
        _cbs[evtName] = [];
      }

      _cbs[evtName].push(cb);
    };

    var off = function (evtName, cb) {
      evtName = evtName.toLowerCase();

      var cbs = _cbs[evtName];

      if (!cbs) {
        return;
      }

      var index = -1;

      for (var i = 0; i < cbs.length; i += 1) {
        if (cbs[i] === cb) {
          index = i;
          break;
        }
      }

      if (index < 0) {
        return;
      }

      _cbs[evtName].splice(index, 1);
    };

    var trigger = function (evtName) {
      evtName = evtName.toLowerCase();

      var cbs = _cbs[evtName];

      if (!cbs || !cbs.length) {
        return;
      }

      var args = Array.prototype.slice.call(arguments, 1);

      for (var i = 0; i < cbs.length; i++) {
        cbs[i].apply(this, args);
      }
    };

    return {
      on: on,
      off: off,
      trigger: trigger
    };
  })();

  /**
   * LayIM external interface class
   * @constructor
   */
  var LayIM = function () {
    this.v = version;
    this.v_inner = versionInner;

    $('body').on('click', '*[layim-event]', function (evt) {
      var $othis = $(this);
      var event = $othis.attr('layim-event');

      if (callbacks[event]) {
        callbacks[event].call(this, $othis, evt);
      }
    });
  };

  /**
   * LayIM class config and initialize
   * @param options
   * @returns {LayIM}
   */
  LayIM.prototype.config = function (options) {
    var skins = [];

    layui.each(Array(4), function (index) {
      skins.push(layui.cache.dir + 'css/modules/layim/skin/' + (index + 1) + '.jpg');
    });

    options = options || {};
    options.skin = options.skin || [];

    layui.each(options.skin, function (index, item) {
      skins.unshift(item);
    });

    options.skin = skins;

    options = $.extend({
      appPath: '',
      init: { url: '', type: 'get', data: {} },
      mine: null,

      members: { url: '', type: 'get', data: {} },

      uploadImage: { url: '', type: 'post' },
      uploadFile: { url: '', type: 'post' },

      skin: [],
      brief: false,
      customerServiceOnly: false,
      title: '我的 IM',
      minimize: false,
      right: '0px',
      minRight: null,
      maxLength: 3000,
      isFriend: true,
      isGroup: true,
      chatlog: null,
      find: null,
      notification: null,
      copyright: true
    }, options);

    if (window.JSON && window.JSON.parse) {
      initialize(options);
    }

    return this;
  };

  /**
   * Register LayIM events
   * @param evtName
   * @param cb
   * @returns {LayIM}
   */
  LayIM.prototype.on = function (evtName, cb) {
    if (typeof cb === "function") {
      events.on(evtName, cb);
    }

    return this;
  };

  /**
   * Return LayIM cache data
   * @returns {{message: {}, chat: Array}}
   */
  LayIM.prototype.cache = function () {
    return cache;
  };

  /**
   * Popup a chat frame
   * @param data
   * @returns {LayIM}
   */
  LayIM.prototype.chat = function (data) {
    popupChat(data);
    return this;
  };

  /**
   * Minimize chat frame
   * @returns {LayIM}
   */
  LayIM.prototype.chatMinimize = function () {
    notifyAndMinimize();
    return this;
  };

  /**
   * Receive message from server by other connect
   * @param msg
   * @returns {LayIM}
   */
  LayIM.prototype.receive = function (msg) {
    receive(msg);
    return this;
  };

  /**
   * Add friend or group
   * @param data
   * @returns {LayIM}
   */
  LayIM.prototype.addFriendOrGroup = function (data) {
    addFriendOrGroup(data);
    return this;
  };

  /**
   * Remove friend or group
   * @param data
   * @returns {LayIM}
   */
  LayIM.prototype.removeFriendOrGroup = function (data) {
    removeFriendOrGroup(data);
    return this;
  };

  /**
   * Render message content to html string
   * @param content
   */
  LayIM.prototype.content = function (content) {
    return layui.data.content(content);
  };

  /**
   * Flash trigger message button
   */
  LayIM.prototype.notification = function () {
    notification();
    return this;
  };

  /**
   * Render friend list item template
   * @param data
   * @returns {string}
   */
  var friendsTpl = function (opt) {
    var nodata = {
      friends: "该分组下暂无好友",
      groups: "暂无群组",
      history: "暂无历史会话"
    };

    opt = opt || {};
    opt.item = opt.item || ('d.' + opt.type);

    return [
      '{{# var length = 0; layui.each(' + opt.item + ', function(i, data){ length++; }}',
        '<li layim-event="chat" data-type="' + opt.type + '" ',
            'data-index="{{ ' + (opt.index || "i") + ' }}" id="layim-' + opt.type + '{{ data.id }}">',
          '<img data-status="{{ data.status||"" }}" src="{{ d.base.appPath + data.avatar }}">',
          '<span>{{ data.remarkName||data.userName||data.fullName||data.name||"佚名" }}</span>',
          '<p title="{{ data.sign || "" }}">{{ data.sign || "" }}</p>',
        '</li>',
      '{{# }); if(length === 0){ }}',
        '<li class="layim-null">' + (nodata[opt.type] || "暂无数据") + "</li>",
      '{{# } }}'
    ].join('');
  };

  /**
   * Main frame template
   * @type {string}
   */
  var mainTpl = [
    '<div class="layui-layim-main">',
      '<div class="layui-layim-info">',
        '<div class="layui-layim-user">{{ d.mine.userName }}</div>',
        '<div class="layui-layim-status">',
          '{{# if(d.mine.status === "Online"){ }}',
            '<span class="layui-icon layim-status-online" layim-event="status" lay-type="show">&#xe617;</span>',
          '{{# } else if(d.mine.status === "Hide") { }}',
            '<span class="layui-icon layim-status-hide" layim-event="status" lay-type="show">&#xe60f;</span>',
          "{{# } }}",
          '<ul class="layui-anim layim-menu-box">',
            '<li {{d.mine.status === "Online" ? "class=layim-this" : ""}} layim-event="status" lay-type="Online">',
              '<i class="layui-icon">&#xe618;</i>',
              '<cite class="layui-icon layim-status-online">&#xe617;</cite>在线',
            '</li>',
            '<li {{d.mine.status === "Hide" ? "class=layim-this" : ""}} layim-event="status" lay-type="Hide">',
              '<i class="layui-icon">&#xe618;</i>',
              '<cite class="layui-icon layim-status-hide">&#xe60f;</cite>隐身',
            '</li>',
          "</ul>",
        "</div>",
        '<p class="layui-layim-remark" layim-event="changeSign" title="{{# if(d.mine.sign){ }}{{d.mine.sign}}{{# } }}">',
          '<input type="text" ' +
                 'value="{{ d.mine.sign || "你很懒，没有写签名" }}" ' +
                 'class="layim-sign-box layim-sign-hide">',
        '</p>',
      '</div>',
      '<ul class="layui-layim-tab{{# if(!d.base.isFriend || !d.base.isGroup){ }}  layim-tab-two {{# } }}">',
        '<li class="layui-icon{{# if(!d.base.isFriend){ }} layim-hide {{# } else { }} layim-this {{# } }}',
          '" title="联系人" layim-event="tab" lay-type="friends">&#xe612;</li>',
        '<li class="layui-icon{{# if(!d.base.isGroup){ }} layim-hide {{# } else if(!d.base.isFriend) { }} layim-this {{# } }}',
          '" title="群组" layim-event="tab" lay-type="groups">&#xe613;</li>',
        '<li class="layui-icon" title="历史会话" layim-event="tab" lay-type="history">&#xe611;</li>',
      '</ul>',
      '<ul class="layim-tab-content{{# if(d.base.isFriend) { }} layim-show {{# } }} layim-list-friends">',
        '{{# layui.each(d.friends, function(index, item) { var spread = d.local["spread"+index]; }}',
          '<li>',
            '<h5 layim-event="spread" lay-type="{{ spread }}">',
              '<i class="layui-icon">{{# if(spread === "true"){ }}&#xe61a;{{# } else {  }}&#xe602;{{# } }}</i>',
              '<span title="{{ item.name || "未命名分组" + index }}">{{ item.name || "未命名分组" + index }}</span>',
              '<em>(<cite class="layim-count"> {{ (item.friends||[]).length }}</cite>)</em>',
            '</h5>',
            '<ul class="layui-layim-list{{# if(spread === "true"){ }} layim-show {{# } }}">',
              friendsTpl({type: 'friends', item: 'item.friends', index: 'index'}),
            '</ul>',
          '</li>',
        '{{# }); if(d.friends.length === 0){ }}',
          '<li>',
            '<ul class="layui-layim-list layim-show"><li class="layim-null">暂无联系人</li></ul>',
          '</li>',
        '{{# } }}',
      '</ul>',
      '<ul class="layim-tab-content{{# if(!d.base.isFriend && d.base.isGroup){ }} layim-show {{# } }}">',
        '<li>',
          '<ul class="layui-layim-list layim-show layim-list-groups">',
            friendsTpl({type: 'groups'}),
          '</ul>',
        '</li>',
      '</ul>',
      '<ul class="layim-tab-content{{# if(!d.base.isFriend && !d.base.isGroup){ }} layim-show {{# } }}">',
        '<li>',
          '<ul class="layui-layim-list layim-show layim-list-history">',
            friendsTpl({type: 'history'}),
          '</ul>',
        '</li>',
      '</ul>',
      '<ul class="layim-tab-content">',
        '<li>',
          '<ul class="layui-layim-list layim-show" id="layui-layim-search"></ul>',
        '</li>',
      '</ul>',
      '<ul class="layui-layim-tool">',
        '<li class="layui-icon layim-tool-search" layim-event="search" title="搜索">&#xe615;</li>',
        '<li class="layui-icon layim-tool-skin" layim-event="skin" title="换肤">&#xe61b;</li>',
        '{{# if(d.base.find){ }}',
          '<li class="layui-icon layim-tool-find" layim-event="find" title="查找">&#xe61f;</li>',
        '{{# } }}',
        '{{# if(!d.base.copyright){ }}',
          '<li class="layui-icon layim-tool-about" layim-event="about" title="关于">&#xe60b;</li>',
        '{{# } }}',
        '{{# if(d.base.notification){ }}',
          '<li class="layui-icon layim-tool-news" layim-event="news" title="消息">&#xe606;</li>',
        '{{# } }}',
      '</ul>',
      '<div class="layui-layim-search">',
        '<input><label class="layui-icon" layim-event="closeSearch">&#x1007;</label>',
      '</div>',
    '</div>'
  ].join('');

  /**
   * Skin frame template
   * @type {string}
   */
  var skinTpl = [
    '<ul class="layui-layim-skin">',
      '{{# layui.each(d.skin, function(index, item){ }}',
        '<li><img layim-event="setSkin" src="{{ item }}"></li>',
      '{{# }); }}',
      '<li layim-event="setSkin"><cite>默认</cite></li>',
      // '<li layim-event="setSkinUser">',
      //   '<span><input type="file" name="file"/><cite>自定义</cite></span>',
      // '</li>',
    '</ul>'
  ].join('');

  /**
   * Chat frame template
   * @type {string}
   */
  var chatTpl = [
    '<div class="layim-chat layim-chat-{{d.data.type}}">',
      '<div class="layim-chat-title">',
        '<a class="layim-chat-other">',
          '<img src="{{ d.base.appPath + d.data.avatar }}">',
          '<span layim-event="{{ d.data.type==="groups" ? "groupMembers" : "" }}">',
            '{{ d.data.remarkName||d.data.userName||d.data.fullName||d.data.name||"佚名" }} {{d.data.temporary ? "<cite>临时会话</cite>" : ""}} ',
            '{{# if(d.data.type==="groups"){ }} ',
              '<em class="layim-chat-members"></em>',
              '<i class="layui-icon">&#xe61a;</i> ',
            '{{# } }}',
          '</span>',
          '<p title="{{ d.data.remark||d.data.sign||"" }}">{{ d.data.remark||d.data.sign||"" }}</p>',
        '</a>',
      '</div>',
      '<div class="layim-chat-main">',
        '<ul></ul>',
      '</div>',
      '<div class="layim-chat-footer">',
        '<div class="layim-chat-tool" data-json="{{encodeURIComponent(JSON.stringify(d.data))}}">',
          '<span class="layui-icon layim-tool-face" title="选择表情" layim-event="face">&#xe60c;</span>',
          '{{# if(d.base && d.base.uploadImage){ }}',
            //'<span class="layui-icon layim-tool-image" title="上传图片" layim-event="image">&#xe60d;<input type="file" name="file"></span>',
          '{{# }; }}',
          '{{# if(d.base && d.base.uploadFile){ }}',
            //'<span class="layui-icon layim-tool-image" title="发送文件" layim-event="image" data-type="file">&#xe61d;<input type="file" name="file"></span>',
          '{{# }; }}',

          '<span class="layui-icon layim-tool-code" title="发送当前位置" layim-event="currentLocation" lay-filter="code">&#xe617;</span>',

         '{{# if(d.base && d.base.chatlog){ }}',
            '<span class="layim-tool-log" layim-event="messageMore"><i class="layui-icon">&#xe60e;</i>聊天记录</span>',
          '{{# }; }}',       
        '</div>',
        '<div class="layim-chat-textarea"><textarea></textarea></div>',
        '<div class="layim-chat-bottom">',
          '<div class="layim-chat-send">',
            '{{# if(!d.base.brief){ }}',
              '<span class="layim-send-close" layim-event="closeThisChat">关闭</span>',
            '{{# } }}',
            '<span class="layim-send-btn" layim-event="send">发送</span>',
            '<span class="layim-send-set" layim-event="setSendHotKey" lay-type="show">',
              '<em class="layui-edge"></em>',
            '</span>',
            '<ul class="layui-anim layim-menu-box">',
              '<li {{d.local.sendHotKey !== "Ctrl+Enter" ? "class=layim-this" : ""}} layim-event="setSendHotKey" lay-type="Enter">',
                '<i class="layui-icon">&#xe618;</i>按Enter键发送消息',
              '</li>',
              '<li {{d.local.sendHotKey === "Ctrl+Enter" ? "class=layim-this" : ""}} layim-event="setSendHotKey"  lay-type="Ctrl+Enter">',
                '<i class="layui-icon">&#xe618;</i>按Ctrl+Enter键发送消息',
              '</li>',
            '</ul>',
          '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  layui.data.date = function (timestamp) {
    var date = new Date(timestamp || new Date());
    return date.toLocaleString().replace(/\//g, '-').replace(/(\s)\D*(\d)/g, '$1$2');
  };

  layui.data.content = function (content) {
    var htmlReg = function (end) {
      return new RegExp(
        '\\n*\\[' + (end || '') +
          '(pre|div|p|table|thead|th|tbody|tr|td|ul|li|ol|li|dl|dt|dd|h2|h3|h4|h5)([\\s\\S]*?)\\]\\n*',
        'g'
      );
    };

    content = (content || '').replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;'); // &
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;'); // <>
    content = content.replace(/'/g, '&#39;').replace(/"/g, '&quot;'); // ' "
    content = content.replace(/@(\S+)(\s+?|$)/g, '@<a href="javascript:;">$1</a>$2'); // @
    content = content.replace(/\s{2}/g, '&nbsp'); // word spacing
    content = content.replace(/img\[([^\s]+?)\]/g, function (str) {
      return '<img class="layui-layim-photos" src="' + str.replace(/(^img\[)|(\]$)/g, '') + '">';
    });
    content = content.replace(/file\([\s\S]+?\)\[[\s\S]*?\]/g, function (str) {
      var href = (str.match(/file\(([\s\S]+?)\)\[/) || [])[1];
      var text = (str.match(/\)\[([\s\S]*?)\]/) || [])[1];

      if (!href) {
        return str;
      }

      return [
        '<a class="layui-layim-file" href="' + href + '" target="_blank">',
          '<i class="layui-icon">&#xe61e;</i>',
          '<cite>' + (text || href) + '</cite>',
        '</a>'
      ].join('');
    }); // file
    content = content.replace(/face\[([^\s\[\]]+?)\]/g, function (str) {
      var alt = str.replace(/^face/g, '');
      return '<img alt="' + alt + '" title="' + alt + '" src="' + faces[alt] + '">'
    }); // faces
    content = content.replace(/a\([\s\S]+?\)\[[\s\S]*?\]/g, function (str) {
      var href = (href.match(/a\(([\s\S]+?)\)\[/) || [])[1];
      var text = (href.match(/\)\[([\s\S]*?)\]/) || [])[1];

      if (!href) {
        return str;
      }

      return '<a href="' + href + '" target="_blank">' + (text || href) + '</a>';
    }); // link
    content = content.replace(htmlReg(), '<$1 $2>').replace(htmlReg('/'), '</$1>'); // code
    content = content.replace(/\n/g, "<br>"); // return

    return content;
  };

  var $layim;        // Main frame
  var $layimMin;     // Minimize frame
  var $layimChat;    // Chat frame
  var $nofityAndMin; // Minimize chat frame
  var chatIndex;     // Chat frame index

  /**
   * Chat message template
   * @type {string}
   */
  var chatMsgTpl = [
    '<li {{ d.mine ? "class=layim-chat-mine" : "" }}>',
      '<div class="layim-chat-user">',
        '<img src="{{ (d.appPath || d.base.appPath) + d.avatar }}">',
        '<cite>',
          '{{# if(d.mine){ }}',
            '<i>{{ layui.data.date(d.timestamp) }}</i>{{ d.remarkName||d.userName||d.fullName||"佚名" }}',
          '{{# } else { }}',
            '{{ d.remarkName||d.userName||d.fullName||"佚名" }}<i>{{ layui.data.date(d.timestamp) }}</i>',
          '{{# } }}',
        '</cite>',
      '</div>',
      '<div class="layim-chat-text">{{ layui.data.content(d.content||"&nbsp") }}</div>',
    "</li>"
  ].join('');

  /**
   * Chat tab template
   * @type {string}
   */
  var chatTabItemTpl = [
    '<li class="layim-chatlist-{{ d.data.type }}{{ d.data.id }} layim-this" layim-event="tabChat">',
      '<img src="{{ d.base.appPath + d.data.avatar }}">',
      '<span>{{ d.data.remarkName||d.data.userName||d.data.fullName||d.data.name||"佚名" }}</span>',
      '{{# if(!d.base.brief){ }}',
        '<i class="layui-icon" layim-event="closeTabChat">&#x1007;</i>',
      '{{# } }}',
    '</li>'
  ].join('');

  /**
   * Ajax data request
   * @param options
   * @param cb
   * @param errType
   * @returns {*|Promise}
   */
  var ajax = function (options, cb, errType) {
    options = options || {};
    return $.ajax({
      url: options.url,
      type: options.type || 'get',
      data: options.stringify ? JSON.stringify(options.data) : options.data,
      dataType: options.dataType || 'json',
      cache: false,
      success: function (res) {
        if (res.success) {
          cb && cb(res.result || {});
        }
        else {
          layer.msg(res.error.message || (errType || "Error") + ": LAYIM_NOT_GET_DATA", {time: 5000});
        }
      },
      error: function (jqXHR, textStatus) {
        if (window.console && console.log) {
          console.error('LAYIM_DATE_ERROR：' + textStatus);
        }
      }
    });
  };

  /**
   * LayIM cache
   * @type {{message: {}, chat: Array}}
   */
  var cache = {
    message: {},
    chat: []
  };

  /**
   * Initialize LayIM
   * @param options
   */
  var initialize = function (options) {
    var mine = options.mine || {};
    var local = layui.data('layim')[mine.id] || {};
    var defaults = {
      base: options,  // base config information
      local: local,   // local layim data
      mine: mine,     // local user data
      history: local.history || {} // recent Contacts
    };

    cache = $.extend(cache, defaults);

    if (options.brief) {
      // Trigger: LayIM ready event
      events.trigger('ready', defaults);
    }
    else {
      ajax(
        options.init,
        function (data) {
          var mine = options.mine || data.mine || {};
          var local = layui.data('layim')[mine.id] || {};

          var defaults = {
            base: options,               // base config information
            local: local,                // local layim data
            mine: mine,                  // local user data
            friends: data.friends|| [],   // friend(include friend group)
            groups: data.groups || [],     // group
            history: local.history || {} // recent Contacts
          };

          cache = $.extend(cache, defaults);

          // if customerServiceOnly is true, no main frame
          if (!options.customerServiceOnly) {
            mainFrm(laytpl(mainTpl).render(defaults));

            if (local.close || options.minimize) {
              minimize();
            }
          }

          if (data.notificationCount) {
            notification();
          }

          // Trigger: LayIM ready event
          events.trigger('ready', defaults);
        },
        'INIT'
      );
    }
  };

  /**
   * Render main frame
   * @param content
   */
  var mainFrm = function (content) {
    return layer.open({
      type: 1,
      area: ["260px", "520px"],
      skin: "layui-box layui-layim",
      title: "&#8203;",
      offset: "rb",
      id: "layui-layim",
      shade: false,
      moveType: 1,
      shift: 2,
      content: content,
      success: function ($layero) {
        var local = layui.data('layim')[cache.mine.id] || {};
        var skin = local.skin;

        $layim = $layero;
        $layim.css({'background-image': skin ? 'url(' + skin + ')' : 'none'});

        if (cache.base.right) {
          $layero.css('margin-left', '-' + cache.base.right);
        }

        // close LayIM minimize frame
        if ($layimMin) {
          layer.close($layimMin.attr('times'));
        }

        // fresh and render the contact list recently
        var recents = [];
        var $recents = $layero.find('.layim-list-history');

        $recents.find('li').each(function () {
          recents.push($(this).prop('outerHTML'));
        });

        if (recents.length > 0) {
          recents.reverse();
          $recents.html(recents.join(''));
        }

        // initialize context menu
        contextMenu();
      },
      cancel: function (index) {
        minimize();

        var local = layui.data('layim')[cache.mine.id] || {};

        local.close = true;
        layui.data('layim', {key: cache.mine.id, value: local});

        return false;
      }
    });
  };

  /**
   * Initialize context menu
   */
  var contextMenu = function () {
    var hide = function () { layer.closeAll('tips'); };
    var showContextMenu = function (content, anchor, offset) {
      layer.tips(content, anchor, {
        tips: 1,
        time: 0,
        shift: 5,
        fix: true,
        skin: 'layui-box layui-layim-contextmenu',
        success: function ($layero) {
          $layero.off('mousedown', stope).on('mousedown', stope);
        }
      });

      $(window).off('resize', hide).on('resize', hide);
      $(document).off('mousedown', hide).on('mousedown', hide);
    };

    // main frame context menu
    $layim.on('contextmenu', function (evt) {
      evt.cancelBubble = true;
      evt.returnValue = false;
      return false;
    });

    // recently contract context menu
    $layim.find('.layim-list-history').on('contextmenu', 'li', function (evt) {
      var $friend = $(this);
      var menu = [
        '<ul data-id="' + $friend[0].id + '" data-index="' + $friend.data("index") + '">',
          '<li layim-event="contextMenuRecently" data-type="one">移除该会话</li>',
          '<li layim-event="contextMenuRecently" data-type="all">清空全部会话列表</li>',
        '</ul>'
      ].join('');

      if (!$friend.hasClass('layim-null')) {
        showContextMenu(menu, this);
      }
    });
/*
    // friend list context menu
    $layim.find('.layim-list-friends').on('contextmenu', '.layui-layim-list li', function (evt) {
      var $friend = $(this);
      var menu = [
        '<ul data-id="' + $friend[0].id + '" data-index="' + $friend.data('index') + '">',
          '<li layim-event="deleteFriend" data-id="' + $friend[0].id + '" >删除好友</li>',
          '<li layim-event="moveFriendTo" data-id="' + $friend[0].id + '" >移动至</li>',
        '</ul>'
      ].join('');

      if (!$friend.hasClass('layim-null')) {
        showContextMenu(menu, this);
      }
    });

    // friend group context menu
    $layim.find('.layim-list-friends').on('contextmenu', 'h5', function (evt) {
      var $friendGroup = $(this);
      var menu = [
        '<ul data-id="' + $friendGroup[0].id + '" data-index="' + $friendGroup.data('index') + '">',
          '<li layim-event="addFriendGroup" data-id="' + $friendGroup[0].id + '" >新建分组</li>',
          '<li layim-event="renameFriendGroup" data-id="' + $friendGroup[0].id + '" >重命名</li>',
          '<li layim-event="deleteFriendGroup" data-id="' + $friendGroup[0].id + '" >删除分组</li>',
        '</ul>'
      ].join('');

      if (!$friendGroup.hasClass('layim-null')) {
        showContextMenu(menu, this);
      }
    });

    // group context menu
    $layim.find('.layim-list-groups').on('contextmenu', 'li', function (evt) {
      var $group = $(this);
      var menu = [
        '<ul data-id="' + $group[0].id + '" data-index="' + $group.data('index') + '">',
          '<li layim-event="sendGroup" data-id="' + $group[0].id + '" >发送群消息</li>',
          '<li layim-event="infoGroup" data-id="' + $group[0].id + '" >查看群资料</li>',
          '<li layim-event="messagesGroup" data-id="' + $group[0].id + '" >消息记录</li>',
          '<li layim-event="iconGroup" data-id="' + $group[0].id + '" >修改群图标</li>',
          '<li layim-event="messageSettingGroup" data-id="' + $group[0].id + '" >群消息设置</li>',
          '<li layim-event="remarkGroup" data-id="' + $group[0].id + '" >修改群备注</li>',
          '<li layim-event="exitGroup" data-id="' + $group[0].id + '" >退出该群</li>',
          // TODO: Group manager permission
          '<li layim-event="transferGroup" data-id="' + $group[0].id + '" >转让该群</li>',
          '<li layim-event="dissolveGroup" data-id="' + $group[0].id + '" >解散该群</li>',
        '</ul>'
      ].join('');

      if (!$group.hasClass('layim-null')) {
        showContextMenu(menu, this);
      }
    });*/
  };

  /**
   * Minimize main frame and show minimize tip frame
   * @param title
   */
  var minimize = function (title) {
    if ($layimMin) {
      layer.close($layimMin.attr('times'));
    }

    if ($layim) {
      $layim.hide();
    }

    cache.mine = cache.mine || {};

    var render = [
      '<div class="layui-layer-title" style="cursor: move;padding: 0; border-bottom: 1px solid #fff; background-color: #fff;" move="ok">',
        '<img src="' + (cache.base.appPath + cache.mine.avatar || layui.cache.dir + "css/pc/layim/skin/logo.jpg") + '">',
      '</div>',
      '<span>' + (title || cache.base.title) + '</span>'
      
     
    ].join('');

    layer.open({
      type: 1,
      title: false,
      id: 'layui-layim-close',
      skin: 'layui-box layui-layim-min layui-layim-close',
      shade: false,
      closeBtn: false,
      shift: 2,
      offset: 'rb',
      content: render,
      success: function ($layero, index) {
        $layimMin = $layero;

        if (cache.base.minRight) {
          $layero.css('margin-left', '-' + cache.base.minRight);
        }

        $layero.on('click', function () {
          layer.close(index);
          $layim.show();

          var local = layui.data('layim')[cache.mine.id] || {};
          local.close = false;
          layui.data('layim', {key: cache.mine.id, value: local});
        });
      }
    });
  };

  /**
   * Popup/open chat frame
   * @param data
   * @returns {*}
   */
  var popupChat = function (data) {
    data = data || {};

    stopTwinkling(data);

    var $chatContainter = $('#layui-layim-chat');
    var renderData = {
      data: data,
      base: cache.base,
      local: cache.local
    };

    if (!data.id) {
      return layer.msg('非法用户');
    }

    if ($chatContainter[0]) {
      var key = data.type + data.id;
      var $chatTab = $layimChat.find('.layim-chat-list');
      var $targetChat = $chatTab.find('.layim-chatlist-' + key);

      // if minimize, restore
      if ($layimChat.css('display') === 'none') {
        $layimChat.show();
      }

      if ($nofityAndMin) {
        layer.close($nofityAndMin.attr('times'));
      }

      if ($chatTab.find('li').length === 1 && !$targetChat[0]) {
        $layimChat.css('width', '800px');
        $chatTab.css('display', 'inline-block');
      }

      if (!$targetChat[0]) {
        $chatTab.append(laytpl(chatTabItemTpl).render(renderData));
        $chatContainter.append(laytpl(chatTpl).render(renderData));
      }

      changeChat($chatTab.find('.layim-chatlist-' + key));

      if (!$targetChat[0]) {
        renderMessage();
      }

      freshRecently(data);
      sendHotKey();

      return chatIndex;
    }

    var index = chatIndex = layer.open({
      type: 1,
      area: ['600px', '520px'],
      skin: 'layui-box layui-layim-chat',
      id: 'layui-layim-chat',
      title: '&#8203;',
      shade: false,
      moveType: 1,
      maxmin: true,
      closeBtn: !cache.base.brief && 1,
      content: laytpl('<ul class="layim-chat-list">' + chatTabItemTpl + "</ul>" + chatTpl).render(renderData),
      success: function ($layero) {
        var local = layui.data('layim')[cache.mine.id] || {};
        var skin = local.skin;

        $layimChat = $layero;
        $layimChat.css({'background-image': skin ? 'url(' + skin + ')' : 'none'});

        sendHotKey();
        freshRecently(data);

        // Trigger: Chat frame change
        events.trigger('chatChange', currentChat());

        renderMessage();
        removeMsgFromQueue();

        $layero.on('click', '.layui-layim-photos', function () {
          var src = this.src;

          layer.close(popupChat.photosIndex);
          layer.photos({
            photos: {
              data: [{alt: '大图模式', src: src}]
            },
            shade: .01,
            closeBtn: 2,
            shift: 0,
            success: function ($layero, index) {
              popupChat.photosIndex = index;
            }
          });
        });
      },
      min: function () {
        notifyAndMinimize();
        return false;
      },
      end: function () {
        layer.closeAll('tips');
      }
    });

    return index;
  };

  /**
   * Show receive message notify and minimize chat frame
   * @param notify
   */
  var notifyAndMinimize = function (notify) {
    var data = notify || currentChat().data;
    var base = cache.base;

    if ($layimChat && !notify) {
      $layimChat.hide();
    }

    if ($nofityAndMin) {
      layer.close($nofityAndMin.attr('times'));
    }

    layer.open({
      type: 1,
      title: false,
      id: 'layui-layim-min',
      skin: 'layui-box layui-layim-min',
      shade: false,
      closeBtn: false,
      shift: data.shift || 2,
      offset: 'b',
      move: '#layui-layim-min img',
      moveType: 1,
      area: ['182px', '54px'],
      content: [
        '<img src="' + base.appPath + data.avatar + '">',
        '<span>' + data.name + '</span>'
      ].join(''),
      success: function ($layero, index) {
        if (!notify) {
          $nofityAndMin = $layero;
        }

        if (base.minRight) {
          layer.style(index, {
            left: $(window).width() - $layero.outerWidth() - parseFloat(base.minRight)
          });
        }

        $layero.find('.layui-layer-content span').on('click', function () {
          layer.close(index);

          if (notify) {
            layui.each(cache.chat, function (index, item) {
              popupChat(item);
            });
          }
          else {
            $layimChat.show();
          }

          if (notify) {
            cache.chat = [];
            readMessageMore();
          }
        });
        $layero.find('.layui-layer-content img').on('click', function (evt) {
          stope(evt);
        });
      }
    });
  };

  /**
   * Switch the chat window
   * @param $targetChat
   * @param del
   * @returns {boolean}
   */
  var changeChat = function ($targetChat, del) {
    $targetChat = $targetChat || $('.layim-chat-list .' + THIS);

    var index = $targetChat.index() === -1 ? 0 : $targetChat.index();
    var chatClass = '.layim-chat';
    var $chat = $layimChat.find(chatClass).eq(index);

    if (del) {
      // close current chat, switch chat frame
      if ($targetChat.hasClass(THIS)) {
        changeChat(index === 0 ? $targetChat.next() : $targetChat.prev());
      }

      // delete chat tab and chat frame
      $targetChat.remove();
      $chat.remove();

      var chatNum = $layimChat.find(chatClass).length;

      // current chat is one, hide left chat tab
      if (chatNum === 1) {
        $layimChat.find('.layim-chat-list').hide();
        $layimChat.css('width', '600px');
      }

      // if all chat frame is empty, close total chat frame
      if (chatNum === 0) {
        layer.close(chatIndex);
      }

      return false;
    }

    $targetChat.addClass(THIS).siblings().removeClass(THIS);
    $chat.css('display', 'inline-block').siblings(chatClass).hide();
    $chat.find('textarea').focus();

    // Trigger: Switch the chat window
    events.trigger('chatChange', currentChat());


    removeMsgFromQueue();
  };

  /**
   * Delete messages(has displays) from the message queue
   */
  var removeMsgFromQueue = function () {
    var current = currentChat();
    var message = cache.message[current.data.type + current.data.id];

    if (message) {
      delete cache.message[current.data.type + current.data.id];
    }
  };

  /**
   * Return current chat information
   * @returns {{elem: *, data, textarea: (*|{})}}
   */
  var currentChat = function () {
    if (!$layimChat) {
      return util.log('当前没有打开的聊天窗口', 'warn');
    }

    var index = $('.layim-chat-list .' + THIS).index();
    var $chat = $layimChat.find('.layim-chat').eq(index);
    var data = JSON.parse(decodeURIComponent($chat.find('.layim-chat-tool').data('json')));

    return {
      elem: $chat,
      data: data,
      textarea: $chat.find('textarea')
    };
  };

  /**
   * Fresh recent Contacts/history
   * @param data
   */
  var freshRecently = function (data) {
    var local = layui.data('layim')[cache.mine.id] || {};
    var history= local.history || {};
    var has = history[data.type + data.id];

    if ($layim) {
      var $history = $layim.find('.layim-list-history');

      data.historyTime = (new Date()).getTime();
      history[data.type + data.id] = data;

      local.history = history;
      layui.data('layim', {key: cache.mine.id, value: local});

      if (!has) {
        var renderData = {};
        renderData[data.type + data.id] = data;

        var histories = laytpl(friendsTpl({
          type: 'history',
          item: 'd.data'
        })).render({data: renderData, base: cache.base});

        $history.prepend(histories);
        $history.find('.layim-null').remove();
      }
    }
  };

  /**
   * Send chat message/content
   * @returns {*}
   */

  var send = function () {
    var data = {
      id: cache.mine ? cache.mine.id : null,
      userName: cache.mine ? cache.mine.userName : '访客',
      avatar: cache.mine ? cache.mine.avatar : (layui.cache.dir + 'css/pc/layim/skin/logo.jpg'),
      mine: true,
      appPath: cache.base.appPath || ''
    };
    var current = currentChat();
    var $messages = current.elem.find('.layim-chat-main ul');

    MAX_MSG_LENGTH = cache.base.maxLength || MAX_MSG_LENGTH;

    data.content = current.textarea.val();

    if (data.content.replace(/\s/g, '') !== '') {
      if (data.content.length > MAX_MSG_LENGTH) {
        return layer.msg('内容最长不能超过' + MAX_MSG_LENGTH + '个字符');
      }

      $messages.append(laytpl(chatMsgTpl).render(data));

      var param = {mine: data, to: current.data};

      cacheMessage({
        userName: param.mine.userName,
        avatar: param.mine.avatar,
        id: param.to.id,
        type: param.to.type,
        content: param.mine.content,
        timestamp: (new Date()).getTime(),
        mine: true
      });

      // Trigger: Send message event
      events.trigger('send', param);
    }

    readMessageMore();
    current.textarea.val('').focus();
  };

  /**
   * Receive message
   * If the message specified by the chat panel did not open, will enter the local message queue,
   * until the specified chat panel is opened, just can show.
   * @param msg
   */
  var receive = function (msg) {
    msg = msg || {};
    msg.mine = msg.userId === cache.mine.id;
    msg.appPath = cache.base.appPath || '';
    msg.timestamp = msg.timestamp || (new Date()).getTime();

    // stored in the local
    cacheMessage(msg);

    var key = msg.type + msg.id;
    var $chatTab = $('.layim-chatlist-' + key);
    var tabIndex = $chatTab.index();

    // not in current chat window and show notify
    if (!$layimChat && msg.content || tabIndex === -1) {
      if (cache.message[key]) {
        // add message queue
        cache.message[key].push(msg);
      }
      else {
        // add message queue
        cache.message[key] = [msg];

        if (msg.type === 'friends') {
          var isFriend = false;

          layui.each(cache.friends, function (gIndex, fGroup) {
            layui.each(fGroup.friends, function (fIndex, friend) {
              if (friend.id === msg.id) {
                friend.type = 'friends';
                friend.name = friend.userName;
                cache.chat.push(friend);

                twinkling(friend);

                return isFriend = true;
              }
            });

            if (isFriend) {
              return true;
            }
          });

          if (!isFriend) {
            msg.name = msg.userName;
            msg.temporary = true;
            cache.chat.push(msg);
          }
        }
        else if (msg.type === 'groups') {
          var isGroup = false;

          layui.each(cache.groups, function (gIndex, group) {
            if (group.id === msg.id) {
              group.type = 'groups';
              group.name = group.name;
              cache.chat.push(group);

              twinkling(group);

              return isGroup = true;
            }
          });

          if (!isGroup) {
            msg.name = msg.name;
            cache.chat.push(msg);
          }
        }
        else {
          msg.name = msg.remarkName || msg.userName || msg.name;
          cache.chat.push(msg);
        }
      }

      // gets the current group avatar
      var group = {};

      if (msg.type === 'groups') {
        layui.each(cache.groups, function (index, item) {
          if (item.id === msg.id) {
            group.avatar = item.avatar;
            return true;
          }
        });
      }

      return notifyAndMinimize({
        name: "收到新消息",
        avatar: group.avatar || msg.avatar,
        shift: 6
      });
    }

    // show notify
    if ($nofityAndMin) {
      $nofityAndMin.addClass('layer-anim-twinkling');
    }

    var current = currentChat();

    // in the chat tab list and add flash animation notify
    if (current.data.type + current.data.id !== key) {
      $chatTab.addClass('layui-anim layer-anim-06');

      setTimeout(function () {
        $chatTab.removeClass('layui-anim layer-anim-06');
      }, 300);
    }

    var $targetChat = $layimChat.find(".layim-chat").eq(tabIndex);
    var $messages = $targetChat.find(".layim-chat-main ul");

    if (msg.content.replace(/\s/g, '') !== '') {
      $messages.append(laytpl(chatMsgTpl).render(msg));
    }

    readMessageMore();
  };

  /**
   * Cache record <MAX_CHAT_LOG: 50> messages to the local storage
   * @param msg
   */
  var cacheMessage = function (msg) {
    var local = layui.data('layim')[cache.mine.id] || {};
    var chatlog = local.chatlog || {};
    var key = msg.type + msg.id;

    if (chatlog[key]) {
      var isCache = false;

      layui.each(chatlog[key], function (index, log) {
        if (log.msgId === msg.msgId && msg.msgId != undefined) {
          isCache = true;
        }
      });

      if (!isCache) {
        chatlog[key].push(msg);
      }

      if (chatlog[key].length > MAX_CHAT_LOG) {
        chatlog[key].shift();
      }
    }
    else {
      chatlog[key] = [msg];
    }

    local.chatlog = chatlog;
    layui.data('layim', {key: cache.mine.id, value: local});
  };

  /**
   * Render messages/chatLog to chat frame
   */
  var renderMessage = function () {
    var local = layui.data('layim')[cache.mine.id] || {};
    var chatlog = local.chatlog || {};

    var current = currentChat();
    var $messages = current.elem.find('.layim-chat-main ul');
    var logs = chatlog[current.data.type + current.data.id];

    layui.each(logs, function (index, item) {
      item.base = cache.base;
      $messages.append(laytpl(chatMsgTpl).render(item));
    });

    // TODO
    if (logs && logs.length) {
      var tip = fromNow(logs[logs.length - 1].timestamp);
        
      if (tip) {
        $messages.prepend([
          '<div class="layim-chat-system">',
            '<span>以上是' + tip + '历史消息</span>',
          '</div>'
        ].join(''));
      }
    }

    readMessageMore();
  };

  /**
   * Time from now
   * @param timestamp
   * @returns {string}
   */
  var fromNow = function (timestamp) {
    timestamp = (new Date()).getTime() - timestamp;

    if (timestamp < 0) {
      util.log('结束日期不能小于开始日期!');
    }

    var result = '';

    if (timestamp / (1000 * 60 * 60 * 24 * 30) > 10) {
        result = parseInt(timestamp / (1000 * 60 * 60 * 24 * 30)) + '个月前';
    }
    else if (timestamp / (1000 * 60 * 60 * 24 * 7) > 10) {
        result = parseInt(timestamp / (1000 * 60 * 60 * 24)) + '个星期前';
    }
    else if (timestamp / (1000 * 60 * 60 * 24) > 10) {
        result = parseInt(timestamp / (1000 * 60 * 60 * 24)) + '天前';
    }
    else if (timestamp / (1000 * 60 * 60) > 10) {
        result = parseInt((timestamp / (1000 * 60 * 60)).toFixed(0)) + '个小时前';
    }
    // else if (timestamp / (1000 * 60) > 10) {
    //   result = (timestamp / (1000 * 60)) + '分钟前';
    // }

    return result;
  };

  /**
   * Add friend or group
   * @param data
   * @returns {*}
   */
  var addFriendOrGroup = function (data) {
    var exist = false;
    var renderData = {};
    var $list = $layim.find('.layim-list-' + data.type);

    if (cache[data.type]) {
      if (data.type === 'friends') {
        // TODO: 前端放到第一个分组(由于后端没有返回)
        data.groupId = cache.friends[0].id;

        layui.each(cache.friends, function (gIndex, group) {
          if (data.groupId === group.id) {
            layui.each(cache.friends[gIndex].friends, function (fIndex, friend) {
              if (friend.id === data.id) {
                return exist = true;
              }
            });

            if (exist) {
              return layer.msg('好友 [' + (data.userName || '') + '] 已经存在列表中', {shift: 6});
            }
            else {
              cache.friends[gIndex].friends = cache.friends[gIndex].friends || [];
              renderData[cache.friends[gIndex].friends.length] = data;
              data.groupIndex = gIndex;
              cache.friends[gIndex].friends.push(data);
              return true;
            }
          }
        });
      }
      else if (data.type === 'groups') {
        layui.each(cache.groups, function (gIndex, group) {
          if (group.id === data.id) {
            return exist = true;
          }
        });

        if (exist) {
          return layer.msg('您已是 [' + (data.name || '') + '] 的群成员', {shift: 6});
        }

        renderData[cache.groups.length] = data;
        cache.groups.push(data);
      }
    }

    if (exist) {
      return;
    }

    var render = laytpl(friendsTpl({
      type: data.type,
      item: 'd.data',
      index: data.type === 'friend' ? 'data.groupIndex' : null
    })).render({data: renderData, base: cache.base});

    if (data.type === 'friends') {
      var $group = $list.find('> li').eq(data.groupIndex);

      $group.find('.layui-layim-list').append(render);
      $group.find('.layim-count').html(cache.friends[data.groupIndex].friends.length);

      if ($group.find('.layim-null')[0]) {
        $group.find('.layim-null').remove();
      }
    }
    else if (data.type === 'groups') {
      $list.append(render);

      if ($list.find('.layim-null')[0]) {
        $list.find('.layim-null').remove();
      }
    }
  };

  /**
   * Remove friend or group
   * @param data
   */
  var removeFriendOrGroup = function (data) {
    var $list = $layim.find('.layim-list-' + data.type);

    if (cache[data.type]) {
      if (data.type === 'friend') {
        layui.each(cache.friend, function (gIndex, group) {
          layui.each(group.friends, function (fIndex, friend) {
            if (data.id.toString() === friend.id) {
              var $group = $list.find('> li').eq(gIndex);
              $group.find('.layui-layim-list > li').eq(fIndex).remove();
              cache.friend[gIndex].friends.splice(fIndex, 1);
              $group.find('.layim-count').html(cache.friend[gIndex].friends.length);

              if (cache.friend[gIndex].friends.length === 0) {
                $group.find('.layui-layim-list').html('<li class="layim-null">该分组下已无好友了</li>');
              }

              return true;
            }
          });
        });
      }
      else if (data.type === 'group') {
        layui.each(cache.group, function (gIndex, group) {
          if (data.id === group.id) {
            $list.find('> li').eq(gIndex).remove();
            cache.group.splice(gIndex, 1);

            if (cache.group.length) {
              $list.html('<li class="layim-null">暂无群组</li>');
            }

            return true;
          }
        });
      }
    }
  };

  /**
   * Render read more message/chatLog to message container
   */
  var readMessageMore = function () {
    var current = currentChat();
    var $msgContainer = current.elem.find('.layim-chat-main');
    var $messages = $msgContainer.find('ul');

    if ($messages.find('li').length >= MAX_CHAT_LOG) {
      var $first = $messages.find('li').eq(0);

      if (!$messages.prev().hasClass('layim-chat-system')) {
        $messages.before([
          '<div class="layim-chat-system">',
            '<span layim-event="messageMore">查看更多记录</span>',
          '</div>'
        ].join(''));
      }

      $first.remove();
    }

    $msgContainer.scrollTop($messages[0].scrollHeight);
    $msgContainer.find('ul li:last').find('img').load(function () {
      $msgContainer.scrollTop($messages[0].scrollHeight);
    });
  };

  /**
   * Bind send message hot key event callback
   */
  var sendHotKey = function () {
    var current = currentChat();
    var $textarea = current.textarea;

    $textarea.focus();
    $textarea.off('keydown').on('keydown', function (evt) {
      var local = layui.data('layim')[cache.mine.id] || {};

      if (local.sendHotKey === 'Ctrl+Enter') {
        if (evt.ctrlKey && evt.keyCode === 13) {
          send();
        }

        return;
      }

      // Enter
      if (evt.keyCode === 13) {
        if (evt.ctrlKey) {
          return $textarea.val($textarea.val() + '\n');
        }

        if (evt.shiftKey) {
          return;
        }

        evt.preventDefault();

        send();
      }
    });
  };

  /**
   * Friends or group list of flashing warning
   * @param data -Message data.
   */
  var twinkling = function (data) {
    if ($layim) {
      $layim.find('.layim-tool-news').addClass('layer-anim-twinkling');
    }

    if (data.type === 'friends'){
      $('#layim-friends' + data.id)
        .addClass('layer-anim-twinkling')
        .parent().prev().addClass('layer-anim-twinkling');
    }
    else if(data.type === 'groups'){
      $('#layim-groups' + data.id).addClass('layer-anim-twinkling');
    }
  };

  /**
   * Stop friends or group list of flashing warning
   * @param data -Message data.
   */
  var stopTwinkling = function (data) {
    if ($layim) {
      $layim.find('.layim-tool-news').removeClass('layer-anim-twinkling');
    }

    if (data.type === 'friends'){
      $('#layim-friends' + data.id)
        .removeClass('layer-anim-twinkling')
        .parent().prev().removeClass('layer-anim-twinkling');
    }
    else if(data.type === 'groups'){
      $('#layim-groups' + data.id).removeClass('layer-anim-twinkling');
    }
  };

  /**
   * Flash trigger message button
   */
  var notification = function () {
    if ($layim) {
      $layim.find('.layim-tool-news').addClass('layer-anim-twinkling');
    }
  };

  var faces = (function () {
    var arr = {};
    var alt = [
      "[微笑]", "[嘻嘻]", "[哈哈]", "[可爱]", "[可怜]", "[挖鼻]", "[吃惊]",
      "[害羞]", "[挤眼]", "[闭嘴]", "[鄙视]", "[爱你]", "[泪]", "[偷笑]",
      "[亲亲]", "[生病]", "[太开心]", "[白眼]", "[右哼哼]", "[左哼哼]", "[嘘]",
      "[衰]", "[委屈]", "[吐]", "[哈欠]", "[抱抱]", "[怒]", "[疑问]", "[馋嘴]",
      "[拜拜]", "[思考]", "[汗]", "[困]", "[睡]", "[钱]", "[失望]", "[酷]",
      "[色]", "[哼]", "[鼓掌]", "[晕]", "[悲伤]", "[抓狂]", "[黑线]", "[阴险]",
      "[怒骂]", "[互粉]", "[心]", "[伤心]", "[猪头]", "[熊猫]", "[兔子]", "[ok]",
      "[耶]", "[good]", "[NO]", "[赞]", "[来]", "[弱]", "[草泥马]", "[神马]",
      "[囧]", "[浮云]", "[给力]", "[围观]", "[威武]", "[奥特曼]", "[礼物]", "[钟]",
      "[话筒]", "[蜡烛]", "[蛋糕]"
    ];

    layui.each(alt, function (index, item) {
      arr[item] = layui.cache.dir + 'images/face/' + index + '.gif';
    });

    return arr;
  })();

  var stope = layui.stope;


  var animationUp = 'layui-anim-up';

  var focusInsert = function (textarea, str) {
    var result;
    var val = textarea.value;

    textarea.focus();

    // ie
    if (document.selection) {
      result = document.selection.createRange();
      document.selection.empty();
      result.text = str;
    }
    else {
      result = [
        val.substring(0, textarea.selectionStart), str, val.substr(textarea.selectionEnd)
      ];

      textarea.focus();
      textarea.value = result.join('');
    }
  };

  var callbacks = {
    /**
     * User online status change
     * @param $othis
     * @param evt
     */
    status: function ($othis, evt) {
      var hide = function () {
        $othis.next().hide().removeClass(animationUp);
      };

      var type = $othis.attr('lay-type');

      if (type === 'show') {
        stope(evt);

        $othis.next().show().addClass(animationUp);
        $(document).off('click', hide).on('click', hide);
      }
      else {
        var $prev = $othis.parent().prev();

        $othis.addClass(THIS).siblings().removeClass(THIS);
        $prev.html($othis.find('cite').html());
        $prev.removeClass('layim-status-' + (type === 'Online' ? 'Hide' : 'Online'))
             .addClass('layim-status-' + type);

        // Trigger: User online status event
        events.trigger('online', type);
      }
    },

    /**
     * User change sign/remark event
     * @param $othis
     * @param evt
     */
    changeSign: function ($othis, evt) {
      $othis.find('input').off('change').on('change', function () {
        var user = cache.mine;
        user.sign = $(this).val();

        // Trigger: User change sign event
        events.trigger('changeSign', user);
      });
    },

    /**
     * Change friend/group/recently
     * @param $othis
     */
    tab: function ($othis) {
      var index;
      var $tab = $layim.find('.layui-layim-tab > li');

      if (typeof $othis === "number") {
        index = $othis;
        $othis = $tab.eq(index);
      }
      else {
        index = $othis.index();
      }

      if (index > 2) {
        $tab.removeClass(THIS);
      }
      else {
        callbacks.tab.index = index;
        $othis.addClass(THIS).siblings().removeClass(THIS);
      }

      var content = '.layim-tab-content';
      $layim.find(content).eq(index).addClass(SHOW).siblings(content).removeClass(SHOW);
    },

    /**
     * Spread/close friend group
     * @param $othis
     */
    spread: function ($othis) {
      var type = $othis.attr('lay-type');
      var spread = type === 'true' ? 'false' : 'true';
      var local = layui.data('layim')[cache.mine.id] || {};

      $othis.next()[type === 'true' ? 'removeClass' : 'addClass'](SHOW);
      local['spread' + $othis.parent().index()] = spread;

      layui.data('layim', {key: cache.mine.id, val: local});

      $othis.attr('lay-type', spread);
      $othis.find('.layui-icon').html(spread === 'true' ? '&#xe61a;' : '&#xe602;');
    },

    /**
     * Search friend/group show in search tab in main frame
     */
    search: function () {
      var $searchResults = $layim.find('#layui-layim-search');
      var $search = $layim.find('.layui-layim-search');
      var $input = $search.find('input');

      var find = function () {
        var key = $input.val().replace(/\s/);

        if (key === '') {
          callbacks.tab(0 | callbacks.tab.index);
        }
        else {
          var results = [];
          var friends = cache.friends || [];
          var groups = cache.groups || [];

          // friend
          for (var gIndex = 0; gIndex < friends.length; gIndex += 1) {
            for (var fIndex = 0; fIndex < (friends[gIndex].friends || []).length; fIndex += 1) {
              if (friends[gIndex].friends[fIndex].userName.indexOf(key) !== -1) {
                friends[gIndex].friends[fIndex].type = 'friends';
                friends[gIndex].friends[fIndex].index = gIndex;
                friends[gIndex].friends[fIndex].list = fIndex;
                results.push(friends[gIndex].friends[fIndex]);
              }
            }
          }

          // group
          for (var gIndex = 0; gIndex < groups.length; gIndex += 1) {
            if (groups[gIndex].name.indexOf(key) !== -1) {
              groups[gIndex].type = 'groups';
              groups[gIndex].index = gIndex;
              groups[gIndex].list = gIndex;
              results.push(groups[gIndex]);
            }
          }

          var render = '';

          if (results.length > 0) {
            for (var i = 0; i < results.length; i += 1) {
              var result = results[i];

              render += [
                '<li layim-event="chat" data-type="' + result.type + '"' +
                    'data-index="' + result.index + '" data-list="' + result.list + '">',
                  '<img src="' + cache.base.appPath + result.avatar + '">',
                  '<span>' + (result.remarkName||result.userName||results[i].name||'佚名') + '</span>',
                  '<p title="' + (result.sign || '') + '">' + (result.sign || '') + '</p>',
                '</li>'
              ].join('');
            }
          }
          else {
            render = '<li class="layim-null">无搜索结果</li>';
          }

          $searchResults.html(render);
          callbacks.tab(3);
        }
      };

      if (!cache.base.isFriend && cache.base.isGroup) {
        callbacks.tab.index = 1;
      }
      else if (!cache.base.isFriend && !cache.base.isGroup) {
        callbacks.tab.index = 2;
      }

      $search.show();
      $input.focus();
      $input.off('keyup', find).on('keyup', find);
    },

    /**
     * Close search tab in main frame
     * @param $othis
     */
    closeSearch: function ($othis) {
      $othis.parent().hide();
      callbacks.tab(0 | callbacks.tab.index);
    },

    /**
     * Open select skin frame
     */
    skin: function () {
      callbacks.skin.index = layer.open({
        type: 1,
        title: '换肤',
        shade: false,
        area: '300px',
        skin: 'layui-box layui-layer-border',
        id: 'layui-layim-skin',
        zIndex: 66666666,
        content: laytpl(skinTpl).render({skin: cache.base.skin})
      });
    },

    /**
     * Open find/add friend/group frame
     */
    find: function () {
      var findModal = [
        '<div class="layui-main">',
          '<form class="layui-form">',
            '<div class="layui-form-item">',
              '<div class="layui-inline">',
                '<div class="layui-input-block">',
                  '<input type="text" name="filter" placeholder="" autocomplete="on" class="layui-input">',
                '</div>',
              '</div>',
              '<div class="layui-inline">',
                '<div class="layui-input-block">',
                  '<input type="radio" name="search" value="friends" title="找人" checked="">',
                  '<input type="radio" name="search" value="groups" title="找群">',
                '</div>',
              '</div>',
              '<div class="layui-inline">',
                '<div class="layui-input-block">',
                  '<button class="layui-btn search">查找</button>',
                  '<button class="layui-btn layui-btn-primary create-group">建群</button>',
                '</div>',
              '</div>',
            '</div>',
          '</form>',
          '<div class="layui-layim-list">',
            '<ul></ul>',
          '</div>',
          '<div class="layui-box layui-laypage layui-laypage-default" id="layui-laypage-5">',
            '<a href="javascript: void(0);" class="layui-laypage-prev" data-page="3">上一页</a>',
            '<a href="javascript: void(0);" class="layui-laypage-next" data-page="5">下一页</a>',
          '</div>',
        '</div>'
      ].join('');

      var friendTpl = [
        '{{# layui.each(d.items, function(index, item){ }}',
        '<li data-item="{{ encodeURIComponent(JSON.stringify(item)) }}">',
          '<img src="{{ d.appPath + item.avatar }}">',
          '<div class="details">',
            '<span>{{ item.userName || item.name }}</span>',
            '<p>{{ item.description || item.emailAddress || "" }}</p>',
            '<button class="layui-btn layui-btn-small" data-type="{{d.type}}">{{ d.type === "friends" ? "加好友" : "加群" }}</button>',
          '</div>',
        '</li>',
        '{{# }); }}'
      ].join('');

      layer.open({
        type: 1,
        title: '查找',
        shade: false,
        area: ['910px', '520px'],
        skin: 'layui-box layui-layer-border',
        id: 'layui-layim-find',
        content: findModal,
        success: function ($layero, index) {
          form.render();

          var $page = $layero.find('.layui-laypage');
          var $next = $layero.find('.layui-laypage-next');
          var $prev = $layero.find('.layui-laypage-prev');

          var maxResultCount = $page.data('max') || 20;

          var load = function (skip, max) {
            var param = $layero.find('.layui-form').serializeFormToObject();
            param.skipCount = skip;
            param.maxResultCount = max;

            if (cache.base.find && typeof cache.base.find === "function") {
              cache.base.find(param, function (data) {
                $page.data('page', {skip: skip, max: max, count: data.displayCount});

                $page.show(); $prev.show(); $next.show();

                if (data.displayCount <= maxResultCount) {
                  $page.hide();
                }
                else if (skip < maxResultCount) {
                  $prev.hide();
                }
                else if (skip + maxResultCount >= data.displayCount) {
                  $next.hide();
                }

                data.appPath = cache.base.appPath;
                data.type = param.search === 'friends' ? 'friends' : 'groups';
                $layero.find('.layui-layim-list ul').empty().html(laytpl(friendTpl).render(data));
              });
            }
          };

          load(0, maxResultCount);

          $layero.find('.layui-form .search').on('click', function (evt) {
            evt.preventDefault();
            load(0, maxResultCount);
          });

          $prev.on('click', function () {
            var page = $page.data('page');

            if (page.skip - page.max > 0) {
              load(page.skip - page.max, page.max);
            }
            else {
              $prev.hide();
              layer.msg('已经是第一页了');
            }
          });
          $next.on('click', function () {
            var page = $page.data('page');

            if (page.skip + page.max < page.count) {
              load(page.skip + page.max, page.max);
            }
            else {
              $next.hide();
              layer.msg('已经是最后一页了');
            }
          });

          $layero.find('.layui-form .create-group').on('click', function (evt) {
            evt.preventDefault();

            layer.open({
              type: 1,
              title: '创建群组',
              shade:[0.8, '#393D49'],
              area: ['350px', '250px;'],
              skin: 'layui-box layui-layer-border',
              id: 'layui-layim-creategroup',
              content: [
                '<form class="layui-form" action="">',
                  '<div class="layui-form-item" style="margin-top:20px;">',
                    '<label class="layui-form-label">群名称</label>',
                    '<div class="layui-input-block">' +
                      '<input style="width:80%"  type="text" name="name" placeholder="群名称" class="layui-input">',
                    '</div>',
                  '</div>',
                  '<div class="layui-form-item">',
                    '<label class="layui-form-label">群介绍</label>',
                    '<div class="layui-input-block">',
                      '<input style="width:80%" type="text" name="description" placeholder="群介绍" class="layui-input">',
                    '</div>',
                  '</div>',
                  '<div class="layui-form-item" style="margin-top:30px;">',
                    '<div class="layui-input-block">',
                      '<button class="layui-btn">立即创建</button>',
                    '</div>',
                  '</div>',
                '</form>'
              ].join(''),
              success: function ($layero, index) {
                $layero.find('.layui-form button').on('click', function (evt) {
                  evt.preventDefault();

                  var param = $layero.find('.layui-form').serializeFormToObject();

                  // Trigger: find modal create group event
                  events.trigger('find.createGroup', param);

                  layer.close(index);
                });
              }
            });
          });

          $layero.find('.layui-layim-list ul').on('click', 'li button', function () {
            var data = $(this).parents('li').data('item');
            data = JSON.parse(decodeURIComponent(data));
            data.type = $(this).data('type');

            var content = '';

            if (data.type === 'friends') {
              content = [
                '<div>您将添加 (' + data.userName + ') 为好友，附加消息:</div>',
                  '<div class="layim-chat-textarea" style="margin-left:0px;">',
                  '<textarea style="border:1px solid gray;width:100%;margin-top:5px;"' +
                    'maxlength="15">你好,我是</textarea>',
                '</div>'
              ].join('');
            }
            else if (data.type === 'groups') {
              content = [
                '<div>您将申请加入群 (' + data.name + ') ，附加消息:</div>',
                  '<div class="layim-chat-textarea" style="margin-left:0px;">',
                  '<textarea style="border:1px solid gray;width:100%;margin-top:5px;"' +
                    'maxlength="15">你好,我是</textarea>',
                '</div>'
              ].join('');
            }

            layer.confirm(content, {
              title: '好友申请',
              shade: [0.8, '#393D49'],
              yes: function (index, $layero) {
                data.other = $layero.find('textarea').val();

                // Trigger: find modal add friend or group event
                events.trigger('find.add', data);

                layer.close(index);
              }
            });
          });
        }
      });
    },

    /**
     * About frame
     */
    about: function () {
      layer.alert(
        [
          '版本： ' + version + '<br>',
          '修订版本： ' + versionInner + '<br>',
          '版权所有：<a href="http://layim.layui.com" target="_blank">layim.layui.com</a>'
        ].join(''),
        {
          title: '关于 LayIM',
          shade: false
        }
      );
    },

    /**
     * Open news frame
     */
    news: function () {
      if ($layim) {
        $layim.find('.layim-tool-news').removeClass('layer-anim-twinkling');
      }

      if (cache.base.notification) {
        if (typeof cache.base.notification === "string") {
          layer.open({
            type: 2,
            title: '消息盒子',
            shade: false,
            area: ['600px', '520px'],
            skin: 'layui-box layui-layer-border',
            id: 'layui-layim-find',
            content: cache.base.news
          });
        }
        else if (typeof cache.base.notification === "function") {
          cache.base.notification();
        }
      }
    },

    /**
     * Setting skin
     * @param $othis
     */
    setSkin: function ($othis) {
      var src = $othis.attr('src');
      var local = layui.data('layim')[cache.mine.id] || {};

      local.skin = src;

      if (!src) {
        delete local.skin;
      }

      layui.data('layim', {key: cache.mine.id, value: local});

      try {
        $layim.css({'background-image': src ? 'url(' + src + ')' : 'none'});
        $layimChat.css({'background-image': src ? 'url(' + src + ')' : 'none'});

        // Trigger: chat skin change event
        events.trigger('skin', src);
      }
      catch (err) {}
    },

    /**
     * Setting user-defined skin by upload image
     * @param $othis
     */
    setSkinUser: function ($othis) {
      layer.close(callbacks.skin.index);
      // TODO: user change skin
      var type = 'uploadSkin';
      var api = {skin: 'uploadSkin', images: 'uploadImage', file: 'uploadFile'};
      var upload = cache.base[api.skin] || {};
      $othis.find('input')[0].click(); // trigger input click

      layui.upload({
        url: upload.url || '',
        method: upload.type,
        file: $othis.find('input')[0],
        unwrap: true,
        success: function (res) {
          if (res.code == 0) {
            res.data = res.data || {};

            $othis.attr('src', res.data.src);
            callbacks.setSkin(othis);

            cache.base.skin.push(res.data.src);
          }
          else {
            layer.msg(res.msg || '上传失败');
          }
        }
      });
    },

    /**
     * Popup chat frame
     * @param $othis
     */
    chat: function ($othis) {
      var local = layui.data('layim')[cache.mine.id] || {};
      var type = $othis.data('type');
      var gIndex = $othis.data('index');
      var fIndex = $othis.attr('data-list') || $othis.index();
      var data = {};

      if (type === 'friends') {
        data = cache[type][gIndex].friends[fIndex];
      }
      else if (type === 'groups') {
        data = cache[type][fIndex];
      }
      else if (type === 'history') {
        data = (local.history || {})[gIndex] || {};
      }

      data.name = data.remarkName || data.userName || data.name;

      if (type !== 'history') {
        data.type = type;
      }

      popupChat(data);
    },

    /**
     * Change chat frame
     * @param $othis
     */
    tabChat: function ($othis) {
      changeChat($othis);
    },

    /**
     * Close selected tab chat frame
     * @param $othis
     */
    closeTabChat: function ($othis) {
      changeChat($othis.parent(), true);
    },

    /**
     * Close current chat frame
     */
    closeThisChat: function () {
      changeChat(null, true);
    },

    /**
     * Get group memeber from server and render to group char frame
     * @param $othis
     * @param evt
     */
    groupMembers: function ($othis, evt) {
      var $dropIcon = $othis.find('.layui-icon');

      var close = function () {
        $dropIcon.html('&#xe61a;');
        $othis.data('down', null);
        layer.close(callbacks.groupMembers.index);
      };
      var stopBubble = function (evt) { stope(evt); };

      if ($othis.data('down')) {
        close();
      }
      else {
        $dropIcon.html('&#xe619;');
        $othis.data('down', true);
        callbacks.groupMembers.index = layer.tips(
          '<ul class="layim-members-list"></ul>',
          $othis,
          {
            tips: 3,
            time: 0,
            shift: 5,
            fix: true,
            skin: 'layui-box layui-layim-members',
            success: function ($layero) {
              var members = cache.base.members || {};
              var current = currentChat();
              
              members.data = $.extend(members.data, {id: current.data.id});
              ajax(members, function (res) {
                var render = '';

                layui.each(res.items, function (index, item) {
                  render += [
                    '<li data-user=" + item + ">',
                      '<a><img src="' + cache.base.appPath + item.avatar + '"></a>',
                      '<p title="' + item.userName + '">' + (item.remarkName || item.userName) + '</p>',
                    '</li>'
                  ].join('');
                });

                $layero.find('.layim-members-list').html(render);

                // Trigger: Render group member event
                events.trigger('members', res);

                $othis.find('.layim-chat-members').html((res.items || []).length + '人');
              });

              $layero.on('mousedown', stopBubble);
            }
          }
        );

        $(window).off('resize', close).on('resize', close);
        $(document).off('mousedown', close).on('mousedown', close);
        $othis.off('mousedown', stopBubble).on('mousedown', stopBubble);
      }
    },

    /**
     * Event Callback: Send chat message/content
     */
    send: function () { send(); },

    /**
     * Setting send message hot key
     * @param $othis
     * @param evt
     */
    setSendHotKey: function ($othis, evt) {
      var $menu = $othis.siblings('.layim-menu-box');

      var hide = function () {
        $menu.hide().removeClass(animationUp);
      };

      var type = $othis.attr('lay-type');

      if (type === 'show') {
        stope(evt);
        $menu.show().addClass(animationUp);
        $(document).off('click', hide).on('click', hide);
      }
      else {
        $othis.addClass(THIS).siblings().removeClass(THIS);

        var local = layui.data('layim')[cache.mine.id] || {};
        local.sendHotKey = type;
        cache.local = local; // TODO: update cache
        layui.data('layim', {key: cache.mine.id, value: local});

        // Trigger: Setting send message hot key event
        events.trigger('sendHotKey', type);
      }
    },

    /**
     * Open select faces frame and auto insert to edit textarea
     * @param $othis
     * @param evt
     */
    face: function ($othis, evt) {
      var content = '';
      var current = currentChat();
      var close = function () {
        layer.close(callbacks.face.index);
      };

      for (var face in faces) {
        content += '<li title="' + face + '"><img src="' + faces[face] + '"></li>';
      }

      content = '<ul class="layui-clear layim-face-list">' + content + '</ul>';

      callbacks.face.index = layer.tips(content, $othis, {
        tips: 1,
        time: 0,
        fix: true,
        skin: 'layui-box layui-layim-face',
        success: function ($layero) {
          $layero.find(".layim-face-list>li")
            .on('mousedown', function (evt) {
              stope(evt);
            })
            .on('click', function () {
              focusInsert(current.textarea[0], 'face' + this.title + ' ');
              layer.close(callbacks.face.index);
            });
        }
      });

      $(window).off('resize', close).on('resize', close);
      $(document).off('mousedown', close).on('mousedown', close);

      stope(evt);
    },
    
    //发送当前位置
    currentLocation: function ($othis, evt) {
        var current = currentChat();
        $('.get-point').removeClass('comment');
        $('.get-point').trigger('click');
        var point = localStorage.getItem('point');
        point = JSON.parse(point);

        var r = new RegExp('(^|&)' + 'id' + '=([^&]*)(&|$)', 'i');
        var id = window.location.search.substr(1).match(r);
        //focusInsert(current.textarea[0],
        //    '[pre class=layui-code data-id=' + id[2] + ' data-posx=' + point.posx
        //    + ' data-posy=' + point.posy + ' data-img='
        //    + point.imgI + ' data-sca=' + point.sca + '][/pre]');

        focusInsert(current.textarea[0],'file(/Platform/Specimen/SliceDetail?id='
           + id[2] + '&posx=' + point.posx + '&posy=' + point.posy + '&img='
           + point.imgI + '&sca=' + point.sca + ')[ 进入位置]');

        $('.get-point').addClass('comment');
    },

    /**
     * Upload image or file to server
     * @param $othis
     */
    image: function ($othis) {
      var type = $othis.data('type') || 'images';
      var api = {images: 'uploadImage', file: 'uploadFile'};
      var current = currentChat();
      var param = cache.base[api[type]] || {};

      layui.upload({
        url: param.url || '',
        method: param.type,
        elem: $othis.find('input')[0],
        unwrap: true,
        type: type,
        success: function (res) {
          if (res.code === false) {
            res.data = res.data || {};

            if (type === 'images') {
              focusInsert(current.textarea[0], 'img[' + (res.data.src || '') + ']');
            }
            else if (type === 'file') {
              focusInsert(
                current.textarea[0],
                'file(' + (res.data.src || '') + ')[' + (res.data.name || '下载文件') + ']'
              );
            }
          }
          else {
            layer.msg(res.msg || '上传失败');
          }
        }
      });
    },

    /**
     * Event Callback: Open more message/chatLog dialog
     * @returns {*}
     */
    messageMore: function () {
      var current = currentChat();

      if (!cache.base.chatlog) {
        return layer.msg('未开启更多聊天记录');
      }

      if (typeof cache.base.chatlog === "string") {
        layer.close(callbacks.messageMore.index);
        callbacks.messageMore.index = layer.open({
          type: 2,
          maxmin: true,
          title: '与 ' + current.data.name + ' 的聊天记录',
          area: ['450px', '100%'],
          shade: false,
          offset: 'rb',
          skin: 'layui-box',
          shift: 2,
          id: 'layui-layim-chatlog',
          content: cache.base.chatlog + '?id=' + current.data.id + '&type=' + current.data.type
        });
      }
      else if (typeof cache.base.chatlog === "function") {
        cache.base.chatlog(current.data);
      }
    },

    // Context menu event callbacks
    /**
     * Recent contact context menu
     * @param $othis
     * @param evt
     */
    contextMenuRecently: function ($othis, evt) {
      var $parent = $othis.parent();
      var type = $othis.data('type');
      var local = layui.data('layim')[cache.mine.id] || {};
      var $histories = $layim.find('.layim-list-history');
      var nullNotify = '<li class="layim-null">暂无历史会话</li>';

      if (type === 'one') {
        var index = $parent.data('index');
        var histories = local.history;
        var history = histories[index];

        delete histories[index];

        local.history = histories;
        layui.data('layim', {key: cache.mine.id, value: local});

        $('#' + $parent.data('id')).remove();

        if ($histories.find('li').length === 0) {
          $histories.html(nullNotify);
        }

        // Trigger: Remove recently contacts event
        events.trigger('removeRecently', history);
      }
      else if (type === 'all') {
        delete  local.history;
        layui.data('layim', {key: cache.mine.id, value: local});
        $histories.html(nullNotify);

        // Trigger: Remove all recently contacts event
        events.trigger('removeAllRecently');
      }

      layer.closeAll('tips');
    },

    deleteFriend: function ($othis, evt) {},

    moveFriendTo: function ($othis, evt) {},

    addFriendGroup: function ($othis, evt) {},

    renameFriendGroup: function ($othis, evt) {},

    deleteFriendGroup: function ($othis, evt) {},

    sendGroup: function ($othis, evt) {},

    infoGroup: function ($othis, evt) {},

    messagesGroup: function ($othis, evt) {},

    iconGroup: function ($othis, evt) {},

    messageSettingGroup: function ($othis, evt) {},

    remarkGroup: function ($othis, evt) {},

    exitGroup: function ($othis, evt) {},

    transferGroup: function ($othis, evt) {},

    dissolveGroup: function ($othis, evt) {}
  };

  exports('layim', new LayIM());
}).addcss('modules/layim/layim.css?v=2.09', 'skinlayimcss');
