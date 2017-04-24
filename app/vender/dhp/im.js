layui.config({
    base: '/vender/layer/'
    //version: (new Date()).getTime()
}).extend({
    dhp: '/vender/dhp/lay.dhp'
});

layui.use(['jquery', 'layim', 'layer', 'laytpl', 'form', 'laydate', 'dhp'], function () {
    var form = layui.form();
    var laydate = layui.laydate;
    var layer = layui.layer;
    var laytpl = layui.laytpl;
    var layim = layui.layim;
    var laydhp = layui.dhp;

    window.imMsgContentRender = function (msg) {
        return layim.content(msg);
    };

    var chatlog = function (data) {
        var type = '';

        if (data.type === 'friends') {
            type = 'ClientToClient';
        }
        else if (data.type === 'groups') {
            type = 'ClientToGroup';
        }

        var content = [
          '<div class="layui-main" style="width: 100%;margin-top: 15px;">',
            '<form class="layui-form">',
                '<div class="layui-form-item">',
                  '<label class="layui-form-label" style="text-align: center;width: 60px;">时间范围</label>',
                  '<div class="layui-input-inline">',
                    '<input name="startDate" class="layui-input" placeholder="开始日期" id="LAY_demorange_s">',
                  '</div>',
                  '<div class="layui-input-inline">',
                    '<input name="endDate" class="layui-input" placeholder="截止日期" id="LAY_demorange_e">',
                  '</div>',
                '</div>',
                '<div class="layui-form-item">',
                  '<div class="layui-inline">',
                    '<div class="layui-input-block" style="width: 100px;">',
                      '<input type="text" name="filter" placeholder="" autocomplete="on" class="layui-input">',
                    '</div>',
                  '</div>',
                  '<div class="layui-inline">',
                    '<div class="layui-input-block" style="margin-left: 0;">',
                      '<input type="radio" name="search" value="all" title="所有" checked="">',
                      '<input type="radio" name="search" value="image" title="图片">',
                      '<input type="radio" name="search" value="file" title="文件">',
                    '</div>',
                  '</div>',
                  '<div class="layui-inline">',
                    '<div class="layui-input-block" style="margin-left: 0;">',
                      '<button class="layui-btn search">查找</button>',
                    '</div>',
                  '</div>',
                '</div>',
            '</form>',
            '<div class="layim-chat-main">',
              '<ul>',
                '<div class="layim-chat-system"><span>暂无历史纪录哦</span></div>',
              '</ul>',
            '</div>',
            '<div class="layui-box layui-laypage layui-laypage-default" style="display: none;">',
              '<a href="javascript: void(0);" class="layui-laypage-next">更多</a>',
            '</div>',
          '</div>'
        ].join('');

        var msgTpl = [
          '{{# layui.each(d.items, function(index, item) { }}',
          '<li {{ !item.user ? "class=layim-chat-mine" : "" }}>',
            '<div class="layim-chat-user">',
              '{{# if (item.user) { }}',
              '<img src="{{ d.appPath + item.user.avatar }}">',
              '<cite>',
                '{{ item.user.remarkName || item.user.userName || item.user.fullName || "佚名" }}',
                '<i>{{ layui.data.date(item.creationTime) }}</i>',
              '</cite>',
              '{{# } else { }}',
              '<img src="{{ d.appPath + d.mine.avatar }}">',
              '<cite>',
                '{{ d.mine.remarkName || d.mine.userName || d.mine.fullName || "佚名" }}',
                '<i>{{ "  " + item.creationTime.replace("T", " ") }}</i>',
              '</cite>',
              '{{# } }}',
            '</div>',
            '<div class="layim-chat-text">',
              '{{ imMsgContentRender(item.content) }}',
            '</div>',
          '</li>',
          '{{# }); }}'
        ].join('');

        layer.close(chatlog.index);
        chatlog.index = layer.open({
            type: 1,
            maxmin: true,
            title: '与 ' + data.name + ' 的聊天记录',
            area: ['450px', '100%'],
            shade: false,
            offset: 'rb',
            skin: 'layui-box',
            shift: 2,
            id: 'layui-layim-chatlog',
            content: content,
            success: function ($layero, index) {
                form.render();

                $layero.find('.layim-chat-main').height(
                    $layero.find('#layui-layim-chatlog').height() -
                    $layero.find('.layui-form').height() - 100
                );

                var $page = $layero.find('.layui-laypage');
                var maxResultCount = 20;
                var start = {
                    min: '2015-06-16 23:59:59',
                    max: '2099-06-16 23:59:59',
                    istoday: false,
                    choose: function (datas) {
                        end.min = datas; //开始日选好后，重置结束日的最小日期
                        end.start = datas //将结束日的初始值设定为开始日
                    }
                };
                var end = {
                    min: laydate.now(),
                    max: '2099-06-16 23:59:59',
                    istoday: false,
                    choose: function (datas) {
                        start.max = datas; //结束日选好后，重置开始日的最大日期
                    }
                };

                var load = function (skip, empty) {
                    var param = $layero.find('.layui-form').serializeFormToObject();
                    param.targetId = data.id;
                    param.messageType = type;
                    param.skipCount = skip | 0;
                    param.maxResultCount = maxResultCount;

                    if (param.search === 'image') {
                        param.isImage = true;
                    }
                    else if (param.search === 'file') {
                        param.isFile = true;
                    }

                    laydhp.ajax({
                        contentType: 'application/json; charset=utf-8',
                        type: 'get',
                        url: laydhp.appPath + 'api/im/msg/list',
                        data: param
                    }).done(function (res) {
                        console.log(res);
                        res.appPath = laydhp.appPath;
                        res.mine = layim.cache().mine;

                        var $msgs = $layero.find('ul');

                        if (empty) {
                            $msgs.empty();
                        }

                        if (res.items.length) {
                            $msgs.append(laytpl(msgTpl).render(res));
                        }
                        else if (res.items.length <= 0 && empty) {
                            $msgs.html('<div class="layim-chat-system"><span>暂无历史纪录哦</span></div>');
                        }

                        if (skip + maxResultCount > res.totalCount) {
                            $page.hide();
                        }
                        else {
                            $page.show();
                        }

                        $page.data('skip', skip);
                    });
                };

                $('#LAY_demorange_s').on('click', function () {
                    start.elem = this;
                    laydate(start);
                });

                $('#LAY_demorange_e').on('click', function () {
                    end.elem = this;
                    laydate(end);
                });

                $layero.find('.search').on('click', function (evt) {
                    evt.preventDefault();

                    load(0, true);
                });

                $page.on('click', function (evt) {
                    var skip = $page.data('skip') | 0;
                    load(skip + maxResultCount, false);
                });
            }
        });
    };

    var find = function (data, cb) {
        var url = '';

        if (data.search === 'friends') {
            url = 'api/im/lookup/users';
        }
        else if (data.search === 'groups') {
            url = 'api/im/lookup/groups';
        }

        laydhp.ajax({
            contentType: 'application/json; charset=utf-8',
            type: 'get',
            url: laydhp.appPath + url,
            data: data
        }).done(function (data) {
            cb && cb(data);
        });
    };
    
    var notifications = function (data) {
        var notificationTpl = [
        '{{# layui.each(d.items, function(index, item) { }}',
          '{{# if (item.type === "ClientToClient") { }}',
            '<li class="{{item.type+item.data.fromUser.id}}" data-item="{{ encodeURIComponent(JSON.stringify(item)) }}">',
              '<img src="{{ d.appPath + item.data.fromUser.avatar }}">',
              '<span>',
                '好友 <b>{{item.data.fromUser.userName}}</b> 向您发送了消息:<br>' +
                '{{item.data.content}}',
              '</span>',
              '<div class="details">',
                '<button class="layui-btn layui-btn-small view">查看</button>',
              '</div>',
            '</li>',
          '{{# } else if (item.type === "ClientToGroup") { }}',
          '<li data-item="{{ encodeURIComponent(JSON.stringify(item)) }}">',
            '<img src="{{ d.appPath + item.data.group.avatar }}">',
            '<span>',
              '群 <b>{{item.data.group.name}}</b> 消息:<br>' +
              '{{item.data.content}}',
            '</span>',
            '<div class="details">',
              '<button class="layui-btn layui-btn-small view">查看</button>',
            '</div>',
          '</li>',
          '{{# } else if (item.type === "ApplySendedToClient") { }}',
          '<li data-item="{{ encodeURIComponent(JSON.stringify(item)) }}">',
            '<img src="{{ d.appPath + item.data.fromUser.avatar }}">',
            '<span>',
              '<b>{{item.data.fromUser.userName}}</b> 请求加您为好友<br>  ',
              '信息: <b>{{item.data.other}}</b> ',
            '</span>',
            '<div class="details">',
              '<button class="layui-btn layui-btn-small accept">同意</button>',
              '<button class="layui-btn layui-btn-small reject">拒绝</button>',
            '</div>',
          '</li>',
          '{{# } else if (item.type === "UserJoinGroupToClient") { }}',
          '<li data-item="{{ encodeURIComponent(JSON.stringify(item)) }}">',
            '<img src="{{ d.appPath + item.data.fromUser.avatar }}">',
            '<span>',
              '<b>{{item.data.fromUser.userName}}</b> 请求加入群 {{item.data.group.name}}</b><br>  ',
              '信息: <b>{{item.data.other}}</b> ',
            '</span>',
            '<div class="details">',
              '<button class="layui-btn layui-btn-small accept">同意</button>',
              '<button class="layui-btn layui-btn-small reject">拒绝</button>',
            '</div>',
          '</li>',
          '{{# } }}',
        '{{# }); }}'
        ].join('');

        layer.open({
            type: 1,
            title: '消息盒子',
            shade: false,
            area: ['600px', '520px'],
            skin: 'layui-box layui-layer-border',
            id: 'layui-layim-notification',
            content: [
              '<div class="layui-main">',
                '<div class="layui-layim-list">',
                  '<ul>',
                    '<div class="layim-chat-system"><span>暂无消息提醒哦</span></div>',
                  '</ul>',
                '</div>',
                '<div class="layui-box layui-laypage layui-laypage-default" style="display:none;">',
                  '<a href="javascript: void(0);" class="layui-laypage-next">更多</a>',
                '</div>',
              '</div>'
            ].join(''),
            success: function ($layero, index) {
                var maxResultCount = 20;
                var $page = $layero.find('.layui-laypage');

                var load = function (skip, empty) {
                    var data = {
                        maxResultCount: maxResultCount,
                        skipCount: skip,
                        state: 'Unread'
                    };

                    laydhp.ajax({
                        contentType: 'application/json; charset=utf-8',
                        type: 'get',
                        url: laydhp.appPath + 'api/im/notification/list',
                        data: data
                    }).done(function (data) {
                        data.appPath = laydhp.appPath;

                        var $notifications = $layero.find('.layui-layim-list ul');

                        if (empty) {
                            $notifications.empty();
                        }

                        if (empty && data.displayCount <= 0) {
                            $notifications.html('<div class="layim-chat-system"><span>暂无消息提醒哦</span></div>');
                        }

                        $notifications.append(laytpl(notificationTpl).render(data));

                        if (skip + maxResultCount > data.displayCount) {
                            $page.hide();
                        }
                        else {
                            $page.show();
                        }

                        $page.data('skip', skip);
                    });
                };

                load(0, true);

                $page.on('click', function () {
                    var skip = $page.data('skip') | 0;
                    load(skip + maxResultCount, false)
                });

                $layero.find('.layui-layim-list ul').on('click', 'li button.view', function () {
                    var data = $(this).parents('li').data('item');
                    data = JSON.parse(decodeURIComponent(data));

                    if (data.type === 'ClientToClient') {
                        var all = $layero.find('.' + data.type + data.data.fromUser.id);

                        for (var i = 0; i < all.length; i += 1) {
                            var data = $(all[i]).data('item');
                            data = JSON.parse(decodeURIComponent(data));

                            // Trigger: find modal create group event
                            laydhp.event.trigger('im.notification.view', data);

                            var msg = data.data.fromUser;
                            msg.msgId = data.id;
                            msg.content = data.data.content;
                            msg.timestamp = data.creationTime;
                            msg.type = 'friends';
                            layim.receive(msg);

                            $(all[i]).remove();
                        }
                    }

                    // Trigger: find modal create group event
                    //laydhp.event.trigger('im.notification.view', data);

                    $(this).parents('li').remove();
                });
                $layero.find('.layui-layim-list ul').on('click', 'li button.accept', function () {
                    var data = $(this).parents('li').data('item');
                    data = JSON.parse(decodeURIComponent(data));

                    // Trigger: find modal create group event
                    laydhp.event.trigger('im.notification.view', data);

                    // Trigger: find modal create group event
                    laydhp.event.trigger('im.notification.accept', data.data);

                    $(this).parents('li').remove();
                });
                $layero.find('.layui-layim-list ul').on('click', 'li button.reject', function () {
                    var data = $(this).parents('li').data('item');
                    data = JSON.parse(decodeURIComponent(data));

                    // Trigger: find modal create group event
                    laydhp.event.trigger('im.notification.view', data);

                    // Trigger: find modal create group event
                    laydhp.event.trigger('im.notification.reject', data.data);

                    $(this).parents('li').remove();
                });
            }
        });
    };

    layim.config({
        appPath: laydhp.appPath || '/',

        init: { url: '/api/im/list' },

        members: { url: '/api/im/group/members' },

        uploadImage: {
            url: '/layimapi/upload_img',
            type: ''
        },
        uploadSkin: {
            url: '/layimapi/upload_img?uid=',
            type: ''
        },
        uploadFile: {
            url: '/layimapi/upload_file',
            type: ''
        },
        moveType: 1,
        skin: [],
        chatlog: chatlog,
        find: find,
        notification: notifications,
        copyright: true
    });

    //监听初始化完成消息
    layim.on('ready', function (data) {});
    //监听发送消息
    layim.on('send', function (data) {
        var type = 'ClientToClient';

        if (data.to.type === 'groups') {
            type = 'ClientToGroup'
        }

        laydhp.ajax({
            contentType: 'application/json; charset=utf-8',
            url: laydhp.appPath + 'api/im/msg/send',
            data: JSON.stringify({
                fromUserId: data.mine.id,
                targetId: data.to.id,
                messageType: type,
                content: data.mine.content
            })
        }).done(function () {
            laydhp.log.info('IM-' + type + ': from ' + data.mine.id + ' to ' + data.to.id);
        });
    });
    //监听在线状态的切换事件
    layim.on('online', function (data) {});
    //监听查看群员
    layim.on('members', function (data) {});
    //监听聊天窗口的切换
    layim.on('chatChange', function (data) {});
    //监听初始化完成消息
    layim.on('removeRecently', function (data) {});
    //监听初始化完成消息
    layim.on('removeAllRecently', function (data) {});
    //监听初始化完成消息
    layim.on('sendHotKey', function (data) {});
    //监听初始化完成消息
    layim.on('skin', function (data) {});
    //监听初始化完成消息
    layim.on('changeSign', function (data) {
        laydhp.ajax({
            contentType: 'application/json; charset=utf-8',
            url: laydhp.appPath + 'api/im/user/sign',
            data: JSON.stringify({sign: data.sign})
        }).done(function (data) {
            layer.msg('签名已更新');
        });
    });
    //监听查找好友中创建群组事件
    layim.on('find.createGroup', function (data) {
        laydhp.ajax({
            contentType: 'application/json; charset=utf-8',
            url: laydhp.appPath + 'api/im/group/add',
            data: JSON.stringify({
                name: data.name,
                description: data.description
            })
        }).done(function (data) {
            data.type = 'groups';
            layim.addFriendOrGroup(data);
            layer.msg('创建成功!');
        });
    });
    //监听查找好友中添加事件
    layim.on('find.add', function (data) {
        var type = data.type === 'friends' ? 'Friend' : 'UserJoinGroup';

        $.ajax({
            contentType: 'application/json; charset=utf-8',
            method: 'post',
            url: laydhp.appPath + 'api/im/apply/send',
            data: JSON.stringify({
                targetId: data.id,
                applyType: type,
                other: data.other
            })
        }).done(function () {
            layer.msg('申请已发送!');
        }).fail(function (data) {
            layer.msg(data.responseJSON.error.message);
        });
    });



    laydhp.event.on('im.notification.view', function (data) {
        var param = { id: data.id, state: 'Read' };

        laydhp.ajax({
            contentType: 'application/json; charset=utf-8',
            url: laydhp.appPath + 'api/im/notification/update',
            data: JSON.stringify(param)
        }).done(function (data) {
            laydhp.log.info('IM-Notification: ' + param.id + ' ' + param.state);
        });
    });

    laydhp.event.on('im.notification.accept', function (data) {
        var param = { id: data.id, result: 'Accept', reason: '' };

        laydhp.ajax({
            contentType: 'application/json; charset=utf-8',
            url: laydhp.appPath + 'api/im/apply/handle',
            data: JSON.stringify(param)
        }).done(function (res) {
            laydhp.log.info('IM-Notification-apply: ' + param.id + ' ' + param.state);

            if (data.applyType === 'Friend') {
                var user = data.fromUser;
                user.type = 'friends';
                layim.addFriendOrGroup(user);
            }
        });
    });

    laydhp.event.on('im.notification.reject', function (data) {
        var param = { id: data.id, result: 'Reject', reason: '' };

        laydhp.ajax({
            contentType: 'application/json; charset=utf-8',
            url: laydhp.appPath + 'api/im/apply/handle',
            data: JSON.stringify(param)
        }).done(function (data) {
            laydhp.log.info('IM-Notification-apply: ' + param.id + ' ' + param.state);
        });
    });

    // 监听收到系统消息事件
    laydhp.event.on('im.msg.System', function (data) {
        console.log(data);
    });

    // 监听收到好友聊天消息事件
    laydhp.event.on('im.msg.clientToClient', function (data) {
        var msg = data.fromUser;
        msg.msgId = data.id;
        msg.content = data.content;
        msg.timestamp = data.creationTime;
        msg.type = 'friends';
        layim.receive(msg);
    });

    // 监听收到群聊天消息事件
    laydhp.event.on('im.msg.clientToGroup', function (data) {
        var msg = data.fromUser;
        msg.userId = data.fromUser.id;
        msg.msgId = data.id;
        msg.content = data.content;
        msg.timestamp = data.creationTime;
        msg.type = 'groups';
        msg.id = data.group.id;
        msg.mine = true;
        layim.receive(msg);
    });

    // 监听收到群通知消息事件
    laydhp.event.on('im.msg.groupToClient', function (data) {
        console.log(data);
    });

    var applyReceive = function (data) {
        data.appPath = laydhp.appPath;
        var notifyTpl = [
            '<li data-item="{{ encodeURIComponent(JSON.stringify(d)) }}">',
            '<img src="{{ d.appPath + d.fromUser.avatar }}" style="margin-left: 10px;">',
            '<span>',
              '{{# if (d.applyType === "Friend") { }}',
                '<b>{{d.fromUser.userName}}</b> 请求加您为好友 <br>',
              '{{# } else if (d.applyType === "UserJoinGroup") { }}',
                '<b>{{d.fromUser.userName}}</b> 请求加入群: <b>{{d.group.name}}</b> <br>',
              '{{# } }}',
              '信息: <b>{{d.other}}</b> ',
            '</span>',
            '<div class="details">',
              '<button class="layui-btn layui-btn-small accept">同意</button>',
              '<button class="layui-btn layui-btn-small reject">拒绝</button>',
            '</div>',
            '</li>'
        ].join('');

        var content = laytpl(notifyTpl).render(data);

        if ($('#layui-layim-notification').length) {
            $('#layui-layim-notification').find('.layui-layim-list ul').append(content);
        }
        else {
            layer.open({
                type: 1,
                title: '消息盒子',
                shade: false,
                area: ['600px', '520px'],
                skin: 'layui-box layui-layer-border',
                id: 'layui-layim-notification',
                content: ['<div class="layui-layim-list">', '<ul>', content, '</ul>', '</div>'].join(''),
                success: function ($layero, index) {
                    $layero.find('.layui-layim-list ul').on('click', 'li button.accept', function () {
                        var data = $(this).parents('li').data('item');
                        data = JSON.parse(decodeURIComponent(data));

                        // Trigger: find modal create group event
                        laydhp.event.trigger('im.notification.accept', data);

                        $(this).parents('li').remove();
                    });
                    $layero.find('.layui-layim-list ul').on('click', 'li button.reject', function () {
                        var data = $(this).parents('li').data('item');
                        data = JSON.parse(decodeURIComponent(data));

                        // Trigger: find modal create group event
                        laydhp.event.trigger('im.notification.reject', data);

                        $(this).parents('li').remove();
                    });
                }
            });
        }
    };

    // 监听收到申请消息事件
    laydhp.event.on('im.msg.applySendedToClient', applyReceive);

    // 监听收到已处理申请消息事件
    laydhp.event.on('im.msg.applyHandledToClient', function (data) {
        if (data.result === 'Accept') {
            if (data.applyType === 'Friend') {
                var user = data.targetUser;
                user.type = 'friends';
                layim.addFriendOrGroup(user);

                layer.msg('已添加好友：' + user.userName);
            }
            else if (data.applyType === 'UserJoinGroup') {
                var group = data.group;
                group.type = 'groups';
                layim.addFriendOrGroup(group);

                layer.msg('已加入群：' + group.name);
            }
        }
        else if (data.result === 'Reject') {
            if (data.applyType === 'Friend') {
                var user = data.targetUser;
                layer.msg('好友：' + user.userName + ' 拒绝了您的申请！');
            }
            else if (data.applyType === 'UserJoinGroup') {
                var group = data.group;
                layer.msg('群：' + group.name + ' 的管理员 ' + '拒绝了您的入群申请！');
            }
        }
    });

    // 监听收到用户上下线消息事件
    laydhp.event.on('im.msg.userOnOffLineToClient', function (data) {
        console.log(data);
    });

    // 监听收到用户入群消息事件
    laydhp.event.on('im.msg.userJoinGroupToClient', applyReceive);
});

