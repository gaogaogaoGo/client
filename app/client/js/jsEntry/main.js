/**
 * layer 和common
 */

import { Handle } from '../common/base';
import { dhp } from '../common/dhp';
import { login } from '../account/login';

window.dhp = dhp;
let handle = new Handle();

var str = localStorage.getItem('str');
if (str) {
	str = handle.decrypt(str);
	$('script[data-type="dynamic"]').attr('src','http://localhost:7682/DhpScripts/GetScripts?access_token='+ str);
}
