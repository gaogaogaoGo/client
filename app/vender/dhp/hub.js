dhp.signalr.hubs.common.client.receiveMessage = function (response) {
    if (response.creationTime > new Date()) {
        dhp.log.warn('IM: create time error!');
    }

    if (response.messsageType === 'System') {
        dhp.event.trigger('im.msg.system', response.data);
    }
    else if (response.messsageType === 'ClientToClient') {
        dhp.event.trigger('im.msg.clientToClient', response.data);
    }
    else if (response.messsageType === 'ClientToGroup') {
        dhp.event.trigger('im.msg.clientToGroup', response.data);
    }
    else if (response.messsageType === 'GroupToClient') {
        dhp.event.trigger('im.msg.groupToClient', response.data);
    }
    else if (response.messsageType === 'ApplyHandledToClient') {
        dhp.event.trigger('im.msg.applyHandledToClient', response.data);
    }
    else if (response.messsageType === 'ApplySendedToClient') {
        dhp.event.trigger('im.msg.applySendedToClient', response.data);
    }
    else if (response.messsageType === 'UserOnOffLineToClient') {
        dhp.event.trigger('im.msg.userOnOffLineToClient', response.data);
    }
    else if (response.messsageType === 'UserJoinGroupToClient') {
        dhp.event.trigger('im.msg.userJoinGroupToClient', response.data);
    }
};

