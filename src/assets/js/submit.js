import axios from 'axios';

function generateData(
  name,
  phone = null,
  email = null,
  productName = window.productName,
  productId = window.productId
) {
  const { origin, pathname } = window.location;
  const action_source = `${origin}${pathname}`;

  let data = {
    google_id: readCookie('_ga'),
    name: name,
    phone: phone,
    email: email,
    product_name: productName,
    product_id: productId,
    Potential_Category: 'Course',
    Projects: 'GoIT',
    Course: productId,
    website: 'website',
    SiteURL: action_source,
    leadFormat: window.leadFormat || 'marathon',
    leadActionSource: action_source,
    leadUserAgent: window.navigator.userAgent,
    leadFBP: getCookie('_fbp'),
    leadFBC: getCookie('_fbc'),
    leadIP: window.ipData.ip || '',
  };
  return ensureUtmData(data);
}
function ensureUtmData(data) {
  data.utm_source = getCookie('utm_source');
  data.utm_medium = getCookie('utm_medium');
  data.utm_term = getCookie('utm_term');
  data.utm_campaign = getCookie('utm_campaign');
  data.utm_content = getCookie('utm_content');

  return data;
}
function getCookie(name) {
  var nameEQ = name + '=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
function readCookie(name) {
  let nameEQ = name + '=';
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      let cidLong = c.substring(nameEQ.length, c.length);
      let tmp = cidLong.split('.');
      return tmp[2] + '.' + tmp[3];
    }
  }
  return null;
}
async function send(data) {
  return await axios({
    method: 'post',
    url: './crm/lead.php',
    data: data,
  });
}
async function submit(
  name,
  phone = null,
  email = null,
  productName = window.productName,
  productId = window.productId
) {
  let data = generateData(name, phone, email, productName, productId);
  const response = await send(data);

  return response;
}
export default {
  submit,
  generateData,
};
