import $ from 'jquery';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import countrySelect from 'country-select-js';

import validateLocales from '../../json/validateLocales.json';
import formMessageLocales from '../../json/formMessageLocales.json';

/**
 * It makes a request to Cloudflare's `cdn-cgi/trace` endpoint, parses the response, and returns an
 * object with the parsed data
 * @returns An object with the following properties:
 *   - colo
 *   - http_x_forwarded_for
 *   - ip
 *   - loc
 *   - org
 *   - query_status
 *   - ray
 *   - server_name
 *   - uag
 *   - uip
 *   - visid_incap_<id>
 *   - visid_inc
 */
async function getIpInfo() {
  try {
    const { data } = await axios.get('https://www.cloudflare.com/cdn-cgi/trace');

    return data
      .trim()
      .split('\n')
      .reduce(function (obj, pair) {
        pair = pair.split('=');
        return (obj[pair[0]] = pair[1]), obj;
      }, {});
  } catch (error) {
    console.error(error);
    return {};
  }
}

/**
 * It makes a request to a free API that returns the country code of the user's IP address
 * @returns The country code of the user's IP address.
 */
async function geoIpLookup(defaultCountry = 'ua') {
  if (window.ipData?.loc) {
    return window.ipData?.loc?.toLowerCase() || defaultCountry;
  } else {
    try {
      const { data } = await axios.get('https://ip.nf/me.json');

      return data?.ip?.country_code?.toLowerCase() || defaultCountry;
    } catch (error) {
      console.error(error);
      return defaultCountry;
    }
  }
}

/**
 * It returns a configuration object for the intl-tel-input library
 * @param preferredCountries - An array of country codes that you want to be at the top of the list.
 * @param excludeCountries - An array of country codes to exclude from the dropdown.
 * @returns An object with the following properties:
 * initialCountry: The country code of the country that the user is in.
 * preferredCountries: An array of country codes that will be displayed at the top of the dropdown.
 * excludeCountries: An array of country codes that will be excluded from the dropdown.
 * utilsScript: The path to the utils.js file.
 */
async function getItiConfig(preferredCountries, excludeCountries) {
  const country_code = window.itiInitialCountry || (await geoIpLookup());

  return {
    initialCountry: country_code,
    preferredCountries,
    excludeCountries,
    utilsScript: './assets/js/utils.js',
  };
}

/**
 * It returns a configuration object for the intl-tel-input library
 * @param preferredCountries - An array of country codes that you want to be at the top of the list.
 * @param excludeCountries - An array of country codes to exclude from the dropdown.
 * @returns An object with the following properties:
 *   defaultCountry: The country code of the user's country
 *   preferredCountries: An array of country codes that are preferred
 *   excludeCountries: An array of country codes that are excluded
 *   responsiveDropdown: A boolean that determines whether the dropdown is responsive
 */
async function getCountryConfig(preferredCountries, excludeCountries) {
  const country_code = window.itiInitialCountry || (await geoIpLookup());

  return {
    defaultCountry: country_code,
    preferredCountries,
    excludeCountries,
    responsiveDropdown: false,
  };
}

/**
 * It takes a parameter name as a string, and returns the value of that parameter in the URL
 * @param sParam - The name of the parameter you want to get the value of.
 * @returns The value of the parameter in the URL.
 */
function getUrlParameter(sParam) {
  let sPageURL = decodeURIComponent(window.location.search.substring(1)),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === 'undefined' ? true : sParameterName[1];
    }
  }
}

/**
 * It takes a key and a value, and updates the URL in the browser's address bar with the new key/value
 * pair
 * @param key - The key of the parameter you want to set.
 * @param value - The value to set the parameter to.
 */
function setUrlParameter(key, value) {
  const url = new URL(window.location);
  url.searchParams.set(key, value);
  window.history.pushState({}, document.title, url);
}

/**
 * If the string is a number, return true, otherwise return false
 * @param str - The string to be tested.
 * @returns true or false
 */
function isNumeric(str) {
  if (typeof str != 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

/**
 * It takes a form element and returns an object with the form's data
 * @param  - The form element that you want to get the data from.
 * @returns An object with the form data.
 */

function getFormData($form) {
  const unindexed_array = $form.serializeArray();
  const indexed_array = {};

  $.map(unindexed_array, function (n, i) {
    indexed_array[n['name']] = n['value'];
  });

  return indexed_array;
}

/* Setting the validation options for the form. */
const validationOptions = {
  errorFieldCssClass: 'is-invalid',
  errorFieldStyle: {
    border: '1px solid #ca381f',
  },
  errorLabelCssClass: 'is-label-invalid',
  errorLabelStyle: {
    color: '#ca381f',
    textDecoration: 'underlined',
  },
  focusInvalidField: true,
  lockForm: true,
};

/**
 * It takes a locale as an argument, and returns an array of objects with the locale key and the locale
 * dictionary
 * @param locale - The locale to get the validation messages for.
 * @returns An array of objects with a key and a dict property.
 */
function getValidationLocale(locale = window.locale) {
  return validateLocales.map(({ key, dict }) => {
    const localeDict = {};
    localeDict[locale] = dict[locale];

    if (!dict[locale]) {
      throw new Error(
        `No locale found for ${locale}. Please add it to the validateLocales.json file.`
      );
    }

    return { key, dict: localeDict };
  });
}

/**
 * It returns an array of validation rules for each field
 * @param input - The input element that is being validated.
 * @param allInputs - An array of all the inputs in the form.
 * @returns an array of objects.
 */
function getValidationFields(input, allInputs) {
  const { required } = input;
  const { field } = input.dataset;
  const mailregex =
    /^(?=^.{3,63}$)(((^[^-\\!?&.\/][^<>!?&()[\],;:\s@"]{2,}(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,10})))$/;
  /* The above code is a JavaScript object that contains the validation rules for each field. */
  const fields = {
    name: [
      {
        rule: 'required',
        errorMessage: 'Name is required',
      },
      {
        rule: 'customRegexp',
        value: getNameRegex(),
        errorMessage: 'Name is invalid!',
      },
      {
        rule: 'minLength',
        value: 3,
        errorMessage: 'The field must contain a minimum of 3 characters',
      },
      {
        rule: 'maxLength',
        value: 30,
        errorMessage: 'The field must contain a maximum of 30 characters',
      },
    ],
    phone: [
      {
        rule: 'required',
        errorMessage: 'Phone number is required',
      },
    ],
    email: [
      {
        rule: 'required',
        errorMessage: 'Email is required',
      },
      {
        rule: 'email',
        errorMessage: 'Email is invalid!',
      },
      {
        rule: 'customRegexp',
        value: mailregex,
        errorMessage: 'Email is invalid!',
      },
    ],
    message: [
      {
        rule: 'minLength',
        value: 3,
        errorMessage: 'The field must contain a minimum of 3 characters',
      },
      {
        rule: 'maxLength',
        value: 1000,
        errorMessage: 'The field must contain a maximum of 1000 characters',
      },
    ],
    checkbox: [
      {
        rule: 'required',
        errorMessage: 'The field is required',
      },
    ],
    zip: [
      {
        rule: 'required',
        errorMessage: 'Zip code is required',
      },
      {
        rule: 'minLength',
        value: 2,
        errorMessage: 'The field must contain a minimum of 2 symbols',
      },
      {
        rule: 'maxLength',
        value: 20,
        errorMessage: 'The field must contain a maximum of 20 symbols',
      },
    ],
    text: [
      {
        rule: 'minLength',
        value: 3,
        errorMessage: 'The field must contain a minimum of 3 characters',
      },
      {
        rule: 'maxLength',
        value: 100,
        errorMessage: 'The field must contain a maximum of 100 characters',
      },
    ],
    textarea: [
      {
        rule: 'minLength',
        value: 3,
        errorMessage: 'The field must contain a minimum of 3 characters',
      },
      {
        rule: 'maxLength',
        value: 500,
        errorMessage: 'The field must contain a maximum of 500 characters',
      },
    ],
    select: [
      {
        rule: 'required',
        errorMessage: 'The field is required',
      },
    ],
  };

  const country = allInputs.find(input => input.name === 'country');
  if (country) {
    const zipRegex = getZipRegex($(country).countrySelect('getSelectedCountryData').iso2);
    if (zipRegex) {
      fields.zip.push({
        validator: value => {
          if (value.length > 1) {
            const regex = new RegExp(
              getZipRegex($(country).countrySelect('getSelectedCountryData').iso2),
              'i'
            );
            return regex.test(value);
          }
          return true;
        },
        errorMessage: 'Zip code is invalid!',
      });
    }
  }

  return fields[field]
    .filter(({ rule }) => rule !== 'required')
    .concat(required ? fields[field][0] : []);
}

/**
 * It takes a form and applies validation rules to each of its fields
 * @param validationForm - the form to validate
 * @returns A validation form
 */
function setFormValidation(validationForm) {
  const inputs = validationForm.form.elements;

  // apply rules to form fields
  Object.entries(inputs)
    .reduce((acc, [key, value]) => {
      if (isNumeric(key) && value.type !== 'submit') {
        acc.push(value);
      }
      return acc;
    }, [])
    .filter(input => input.dataset.field)
    .map((input, index, arr) => {
      const { id } = input;
      const validationOptionField = getValidationFields(input, arr);

      if (validationOptionField.length) {
        /* Adding an event listener to the input field. */
        $(input).on('input', () => {
          validationForm.revalidateField(`#${id}`);
        });

        validationForm.addField(`#${id}`, getValidationFields(input, arr));
      }
    });

  return validationForm;
}

/**
 * It takes a locale as an argument, and returns an array of objects with a key and a message
 * @param locale - The locale to get the messages for.
 * @returns An array of objects with the key and msg properties.
 */
function getFormMessageLocale(locale) {
  return formMessageLocales.map(({ key, dict }) => {
    if (!dict[locale]) {
      throw new Error(
        `No locale found for ${locale}. Please add it to the formMessageLocale.json file.`
      );
    }

    return { key, msg: dict[locale] };
  });
}

/**
 * It takes a locale and a key, and returns the message associated with that key in the given locale
 * @param key - The key of the message to be translated.
 * @param locale - The locale of the form message.
 * @returns The message for the key that matches the key passed in.
 */
function translate(key, locale = window.locale) {
  const message = getFormMessageLocale(locale).find(({ key: k }) => k === key)?.msg;

  if (!message) {
    throw new Error(`No message found for key ${key}`);
  }

  return message;
}

const postalCodesRegex = [
  {
    abbrev: 'AF',
    name: 'Afghanistan',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'AL',
    name: 'Albania',
    postal: '(120|122)[0-9]{2}',
  },
  {
    abbrev: 'DZ',
    name: 'Algeria',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'AS',
    name: 'American Samoa',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'AD',
    name: 'Andorra',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'AO',
    name: 'Angola',
  },
  {
    abbrev: 'AI',
    name: 'Anguilla',
    postal: 'AI-2640',
  },
  {
    abbrev: 'AG',
    name: 'Antigua and Barbuda',
  },
  {
    abbrev: 'AR',
    name: 'Argentina',
    postal: '[A-Z]{1}[0-9]{4}[A-Z]{3}',
  },
  {
    abbrev: 'AM',
    name: 'Armenia',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'AW',
    name: 'Aruba',
  },
  {
    abbrev: 'AU',
    name: 'Australia',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'AT',
    name: 'Austria',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'AZ',
    name: 'Azerbaijan',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'BS',
    name: 'Bahamas',
  },
  {
    abbrev: 'BH',
    name: 'Bahrain',
  },
  {
    abbrev: 'BD',
    name: 'Bangladesh',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'BB',
    name: 'Barbados',
    postal: 'BB[0-9]{5}',
  },
  {
    abbrev: 'BY',
    name: 'Belarus',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'BE',
    name: 'Belgium',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'BZ',
    name: 'Belize',
  },
  {
    abbrev: 'BJ',
    name: 'Benin',
  },
  {
    abbrev: 'BM',
    name: 'Bermuda',
    postal: '[A-Z]{2}[0-9]{2}',
  },
  {
    abbrev: 'BT',
    name: 'Bhutan',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'BO',
    name: 'Bolivia',
  },
  {
    abbrev: 'BQ',
    name: 'Bonaire',
  },
  {
    abbrev: 'BA',
    name: 'Bosnia and Herzegovina',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'BW',
    name: 'Botswana',
  },
  {
    abbrev: 'BR',
    name: 'Brazil',
    postal: '[0-9]{5}-[0-9]{3}',
  },
  {
    abbrev: 'BN',
    name: 'Brunei',
    postal: '[A-Z]{2}[0-9]{4}',
  },
  {
    abbrev: 'BG',
    name: 'Bulgaria',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'BF',
    name: 'Burkina Faso',
  },
  {
    abbrev: 'BI',
    name: 'Burundi',
  },
  {
    abbrev: 'KH',
    name: 'Cambodia',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'CM',
    name: 'Cameroon',
  },
  {
    abbrev: 'CA',
    name: 'Canada',
    postal: '[A-Z][0-9][A-Z] ?[0-9][A-Z][0-9]',
  },
  {
    abbrev: 'CI',
    name: 'Canary Islands',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'CV',
    name: 'Cape Verde',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'KY',
    name: 'Cayman Islands',
    postal: '[A-Z]{2}[0-9]-[0-9]{4}',
  },
  {
    abbrev: 'CF',
    name: 'Central African Republic',
  },
  {
    abbrev: 'TD',
    name: 'Chad',
  },
  {
    abbrev: 'CI',
    name: 'Channel Islands',
    postal: '[A-Z]{2}[0-9]{2}',
  },
  {
    abbrev: 'CL',
    name: 'Chile',
    postal: '[0-9]{7}',
  },
  {
    abbrev: 'CN',
    name: "China, People's Republic",
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'CO',
    name: 'Colombia',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'KM',
    name: 'Comoros',
  },
  {
    abbrev: 'CG',
    name: 'Congo',
  },
  {
    abbrev: 'CD',
    name: 'Congo, The Democratic Republic of',
  },
  {
    abbrev: 'CK',
    name: 'Cook Islands',
  },
  {
    abbrev: 'CR',
    name: 'Costa Rica',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'CI',
    name: "Côte d'Ivoire",
  },
  {
    abbrev: 'HR',
    name: 'Croatia',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'CU',
    name: 'Cuba',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'CW',
    name: 'Curacao',
  },
  {
    abbrev: 'CY',
    name: 'Cyprus',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'CZ',
    name: 'Czech Republic',
    postal: '[0-9]{3} [0-9]{2}',
  },
  {
    abbrev: 'DK',
    name: 'Denmark',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'DJ',
    name: 'Djibouti',
  },
  {
    abbrev: 'DM',
    name: 'Dominica',
  },
  {
    abbrev: 'DO',
    name: 'Dominican Republic',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'TL',
    name: 'East Timor',
  },
  {
    abbrev: 'EC',
    name: 'Ecuador',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'EG',
    name: 'Egypt',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'SV',
    name: 'El Salvador',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'ER',
    name: 'Eritrea',
  },
  {
    abbrev: 'EE',
    name: 'Estonia',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'ET',
    name: 'Ethiopia',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'FK',
    name: 'Falkland Islands',
    postal: 'FIQQ 1ZZ',
  },
  {
    abbrev: 'FO',
    name: 'Faroe Islands',
    postal: '[0-9]{3}',
  },
  {
    abbrev: 'FJ',
    name: 'Fiji',
  },
  {
    abbrev: 'FI',
    name: 'Finland',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'FR',
    name: 'France',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'PF',
    name: 'French Polynesia',
    postal: '987[0-9]{2}',
    range: ['98700', '98790'],
  },
  {
    abbrev: 'GA',
    name: 'Gabon',
  },
  {
    abbrev: 'GM',
    name: 'Gambia',
  },
  {
    abbrev: 'GE',
    name: 'Georgia',
  },
  {
    abbrev: 'DE',
    name: 'Germany',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'GH',
    name: 'Ghana',
  },
  {
    abbrev: 'GI',
    name: 'Gibraltar',
    postal: 'GX11 1AA',
  },
  {
    abbrev: 'GR',
    name: 'Greece',
    postal: '[0-9]{3} [0-9]{2}',
  },
  {
    abbrev: 'GL',
    name: 'Greenland',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'GD',
    name: 'Grenada',
  },
  {
    abbrev: 'GP',
    name: 'Guadeloupe',
    postal: '971[0-9]{2}',
    range: ['97100', '97190'],
  },
  {
    abbrev: 'GU',
    name: 'Guam',
    postal: '\\d{5}(?:[-\\s]\\d{4})?',
    range: ['96910', '96932'],
  },
  {
    abbrev: 'GT',
    name: 'Guatemala',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'GG',
    name: 'Guernsey',
    postal:
      '([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\\s?[0-9][A-Za-z]{2})',
  },
  {
    abbrev: 'GW',
    name: 'Guinea-Bissau',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'GQ',
    name: 'Guinea-Equatorial',
  },
  {
    abbrev: 'GN',
    name: 'Guinea Republic',
    postal: '[0-9]{3}',
  },
  {
    abbrev: 'GY',
    name: 'Guyana (British)',
  },
  {
    abbrev: 'GF',
    name: 'Guyana (French)',
    postal: '973[0-9]{2}',
    range: ['97300', '97390'],
  },
  {
    abbrev: 'HT',
    name: 'Haiti',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'HN',
    name: 'Honduras',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'HK',
    name: 'Hong Kong',
  },
  {
    abbrev: 'HU',
    name: 'Hungary',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'IS',
    name: 'Iceland',
    postal: '[0-9]{3}',
  },
  {
    abbrev: 'IN',
    name: 'India',
    postal: '[1-9][0-9]{5}',
  },
  {
    abbrev: 'ID',
    name: 'Indonesia',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'IR',
    name: 'Iran',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'IQ',
    name: 'Iraq',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'IE',
    name: 'Ireland, Republic of',
    postal: '(?:^[AC-FHKNPRTV-Y][0-9]{2}|D6W)[ -]?[0-9AC-FHKNPRTV-Y]{4}$',
  },
  {
    abbrev: 'FK',
    name: 'Islas Malvinas',
    postal: 'FIQQ 1ZZ',
  },
  {
    abbrev: 'IL',
    name: 'Israel',
    postal: '[0-9]{5}|[0-9]{7}',
  },
  {
    abbrev: 'IT',
    name: 'Italy',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'CI',
    name: 'Ivory Coast',
  },
  {
    abbrev: 'JM',
    name: 'Jamaica',
  },
  {
    abbrev: 'JP',
    name: 'Japan',
    postal: '[0-9]{3}-[0-9]{4}',
  },
  {
    abbrev: 'JE',
    name: 'Jersey',
    postal:
      '([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\\s?[0-9][A-Za-z]{2})',
  },
  {
    abbrev: 'JO',
    name: 'Jordan',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'KZ',
    name: 'Kazakhstan',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'KE',
    name: 'Kenya',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'KI',
    name: 'Kiribati',
  },
  {
    abbrev: 'KR',
    name: 'Korea, Republic of',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'KP',
    name: 'Korea, The D.P.R of',
  },
  {
    abbrev: 'XK',
    name: 'Kosovo',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'KW',
    name: 'Kuwait',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'KG',
    name: 'Kyrgyzstan',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'LA',
    name: 'Laos',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'LV',
    name: 'Latvia',
    postal: 'LV-[0-9]{4}',
  },
  {
    abbrev: 'LB',
    name: 'Lebanon',
    postal: '[0-9]{4} [0-9]{4}',
  },
  {
    abbrev: 'LS',
    name: 'Lesotho',
    postal: '[0-9]{3}',
  },
  {
    abbrev: 'LR',
    name: 'Liberia',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'LY',
    name: 'Libya',
  },
  {
    abbrev: 'LI',
    name: 'Liechtenstein',
    postal: '[0-9]{4}',
    range: ['9485', '9498'],
  },
  {
    abbrev: 'LT',
    name: 'Lithuania',
    postal: 'LT-[0-9]{5}',
  },
  {
    abbrev: 'LU',
    name: 'Luxembourg',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'MO',
    name: 'Macau',
  },
  {
    abbrev: 'MK',
    name: 'Macedonia, Republic of',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'MG',
    name: 'Madagascar',
    postal: '[0-9]{3}',
  },
  {
    abbrev: 'MW',
    name: 'Malawi',
  },
  {
    abbrev: 'MY',
    name: 'Malaysia',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'MV',
    name: 'Maldives',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'ML',
    name: 'Mali',
  },
  {
    abbrev: 'MT',
    name: 'Malta',
    postal: '[A-Z]{3} [0-9]{4}',
  },
  {
    abbrev: 'MH',
    name: 'Marshall Islands',
    postal: '\\d{5}(?:[-\\s]\\d{4})?',
    range: ['96960', '96970'],
  },
  {
    abbrev: 'MQ',
    name: 'Martinique',
    postal: '972[0-9]{2}',
    range: ['97200', '97290'],
  },
  {
    abbrev: 'MR',
    name: 'Mauritania',
  },
  {
    abbrev: 'MU',
    name: 'Mauritius',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'YT',
    name: 'Mayotte',
    postal: '976[0-9]{2}',
    range: ['97600', '97690'],
  },
  {
    abbrev: 'MX',
    name: 'Mexico',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'MD',
    name: 'Moldova, Republic of',
    postal: 'MD-?[0-9]{4}',
  },
  {
    abbrev: 'MC',
    name: 'Monaco',
    postal: '980[0-9]{2}',
  },
  {
    abbrev: 'MN',
    name: 'Mongolia',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'ME',
    name: 'Montenegro',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'MS',
    name: 'Montserrat',
    postal: 'MSR [0-9]{4}',
    range: ['MSR 1110', 'MSR 1350'],
  },
  {
    abbrev: 'MA',
    name: 'Morocco',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'MZ',
    name: 'Mozambique',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'MM',
    name: 'Myanmar',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'NA',
    name: 'Namibia',
  },
  {
    abbrev: 'NR',
    name: 'Nauru',
  },
  {
    abbrev: 'NP',
    name: 'Nepal',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'NL',
    name: 'Netherlands',
    postal: '(?:NL-)?(\\d{4})\\s*([A-Z]{2})',
  },
  {
    abbrev: 'NC',
    name: 'New Caledonia',
    postal: '988[0-9]{2}',
    range: ['96950', '96952'],
  },
  {
    abbrev: 'NZ',
    name: 'New Zealand',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'NI',
    name: 'Nicaragua',
  },
  {
    abbrev: 'NE',
    name: 'Niger',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'NG',
    name: 'Nigeria',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'NU',
    name: 'Niue',
  },
  {
    abbrev: 'MP',
    name: 'Northern Mariana Islands',
    postal: '^\\d{5}(?:[-\\s]\\d{4})?$',
  },
  {
    abbrev: 'NO',
    name: 'Norway',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'OM',
    name: 'Oman',
    postal: '[0-9]{3}',
  },
  {
    abbrev: 'PK',
    name: 'Pakistan',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'PW',
    name: 'Palau',
    postal: '\\d{5}(?:[-\\s]\\d{4})?',
  },
  {
    abbrev: 'PA',
    name: 'Panama',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'PG',
    name: 'Papua New Guinea',
    postal: '[0-9]{3}',
  },
  {
    abbrev: 'PY',
    name: 'Paraguay',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'PE',
    name: 'Peru',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'PH',
    name: 'Philippines',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'PL',
    name: 'Poland',
    postal: '[0-9]{2}-[0-9]{3}',
  },
  {
    abbrev: 'PT',
    name: 'Portugal',
    postal: '[0-9]{4}-[0-9]{3}',
  },
  {
    abbrev: 'PR',
    name: 'Puerto Rico',
    postal: '\\d{5}(?:[-\\s]\\d{4})?',
  },
  {
    abbrev: 'QA',
    name: 'Qatar',
  },
  {
    abbrev: 'RE',
    name: 'Réunion',
    postal: '974[0-9]{2}',
    range: ['97400', '97490'],
  },
  {
    abbrev: 'RO',
    name: 'Romania',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'RU',
    name: 'Russian Federation',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'RW',
    name: 'Rwanda',
  },
  {
    abbrev: 'MP',
    name: 'Saipan',
    postal: '96950',
  },
  {
    abbrev: 'WS',
    name: 'Samoa',
    postal: 'WS[0-9]{4}',
  },
  {
    abbrev: 'ST',
    name: 'Sao Tome and Principe',
  },
  {
    abbrev: 'SA',
    name: 'Saudi Arabia',
    postal: '[0-9]{5}(-[0-9]{4})?',
  },
  {
    abbrev: 'SN',
    name: 'Senegal',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'RS',
    name: 'Serbia',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'SC',
    name: 'Seychelles',
  },
  {
    abbrev: 'SL',
    name: 'Sierra Leone',
  },
  {
    abbrev: 'SG',
    name: 'Singapore',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'SK',
    name: 'Slovakia',
    postal: '[0-9]{3} [0-9]{2}',
  },
  {
    abbrev: 'SI',
    name: 'Slovenia',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'SB',
    name: 'Solomon Islands',
  },
  {
    abbrev: 'SO',
    name: 'Somalia',
    postal: '[A-Z]{2} [0-9]{5}',
  },
  {
    abbrev: 'ZA',
    name: 'South Africa',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'SS',
    name: 'South Sudan',
  },
  {
    abbrev: 'ES',
    name: 'Spain',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'LK',
    name: 'Sri Lanka',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'BL',
    name: 'St. Barthélemy',
    postal: '[0-9]{5}',
    range: ['97100', '97190'],
  },
  {
    abbrev: 'VI',
    name: 'St. Croix',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'SE',
    name: 'St. Eustatius',
  },
  {
    abbrev: 'SH',
    name: 'St. Helena',
    postal: 'STHL 1ZZ',
  },
  {
    abbrev: 'AG',
    name: 'St. John',
    postal: '\\d{5}(?:[-\\s]\\d{4})?',
  },
  {
    abbrev: 'KN',
    name: 'St. Kitts and Nevis',
    postal: '[A-Z]{2}[0-9]{4}',
  },
  {
    abbrev: 'LC',
    name: 'St. Lucia',
    postal: '[A-Z]{2}[0-9]{2} [0-9]{3}',
  },
  {
    abbrev: 'SX',
    name: 'St. Maarten',
  },
  {
    abbrev: 'VI',
    name: 'St. Thomas',
  },
  {
    abbrev: 'VC',
    name: 'St. Vincent and the Grenadines',
    postal: 'VC[0-9]{4}',
  },
  {
    abbrev: 'SD',
    name: 'Sudan',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'SR',
    name: 'Suriname',
  },
  {
    abbrev: 'SZ',
    name: 'Swaziland',
    postal: '[A-Z]{1}[0-9]{3}',
  },
  {
    abbrev: 'SE',
    name: 'Sweden',
    postal: '[0-9]{3} [0-9]{2}',
  },
  {
    abbrev: 'CH',
    name: 'Switzerland',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'SY',
    name: 'Syria',
  },
  {
    abbrev: 'PF',
    name: 'Tahiti',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'TW',
    name: 'Taiwan',
    postal: '[0-9]{3}(-[0-9]{2})?',
  },
  {
    abbrev: 'TZ',
    name: 'Tanzania',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'TH',
    name: 'Thailand',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'TG',
    name: 'Togo',
  },
  {
    abbrev: 'TO',
    name: 'Tonga',
  },
  {
    abbrev: 'VG',
    name: 'Tortola',
    postal: 'VG[0-9]{4}',
  },
  {
    abbrev: 'TT',
    name: 'Trinidad and Tobago',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'TN',
    name: 'Tunisia',
    postal: '[0-9]{4}',
  },
  {
    abbrev: 'TR',
    name: 'Turkey',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'TM',
    name: 'Turkmenistan',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'TC',
    name: 'Turks and Caicos Islands',
    postal: 'TKCA 1ZZ',
  },
  {
    abbrev: 'TV',
    name: 'Tuvalu',
  },
  {
    abbrev: 'UG',
    name: 'Uganda',
  },
  {
    abbrev: 'UA',
    name: 'Ukraine',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'AE',
    name: 'United Arab Emirates',
  },
  {
    abbrev: 'GB',
    name: 'United Kingdom',
    postal:
      '([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\\s?[0-9][A-Za-z]{2})',
  },
  {
    abbrev: 'US',
    name: 'United States of America',
    postal: '\\d{5}(?:[-\\s]\\d{4})?',
  },
  {
    abbrev: 'UY',
    name: 'Uruguay',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'UZ',
    name: 'Uzbekistan',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'VU',
    name: 'Vanuatu',
  },
  {
    abbrev: 'VE',
    name: 'Venezuela',
    postal: '[0-9]{4}(-[A-Z]{1})?',
  },
  {
    abbrev: 'VN',
    name: 'Vietnam',
    postal: '[0-9]{6}',
  },
  {
    abbrev: 'VG',
    name: 'Virgin Islands (British)',
    postal: 'VG[0-9]{4}',
  },
  {
    abbrev: 'VI',
    name: 'Virgin Islands (US)',
    range: ['00801', '00851'],
    postal: '\\d{5}(?:[-\\s]\\d{4})?',
  },
  {
    abbrev: 'YE',
    name: 'Yemen',
  },
  {
    abbrev: 'ZM',
    name: 'Zambia',
    postal: '[0-9]{5}',
  },
  {
    abbrev: 'ZW',
    name: 'Zimbabwe',
  },
];

/**
 * It returns a regular expression that matches a name in the given locale
 * @param [locale] - The locale of the user.
 * @returns A regular expression that matches a string of characters that are allowed in a name.
 */
function getNameRegex(locale = window.locale) {
  switch (locale) {
    case 'en':
      return /^[a-zñáéíóúü ,.'-]+$/i;

    case 'pl':
      return /^.*[A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ ,.'-]{2,}$/i;

    case 'es':
      return /^[a-zñáéíóúü ,.'-]+$/i;

    case 'ro':
      return /^[a-zA-Z0-9À-ž ,.'-]{2,}$/i;

    default:
      return /^.[a-zA-Zа-яА-ЯёЁЇїІіЄєҐґ0-9 ,.'`-]{1,19}$/gm;
  }
}

/**
 * It takes a country code as a parameter and returns a regular expression that can be used to validate
 * a postal code for that country
 * @param countryCode - The country code of the country you want to validate the postal code for.
 * @returns The postal code regex for the country code passed in.
 */
function getZipRegex(countryCode) {
  return (
    postalCodesRegex.find(country => country.abbrev.toLowerCase() === countryCode)?.postal || ''
  );
}

/**
 * It takes a formData object and adds the values to the URL as query parameters
 * @param formData - the form data object
 */
function setParamsForLeeloo(formData) {
  let fields = {
    utm_source: 'utm_source',
    utm_medium: 'utm_medium',
    utm_term: 'utm_term',
    utm_campaign: 'utm_campaign',
    umt_content: 'umt_content',
    phone: 'phone',
    email: 'email',
    name: 'first_name',
    google_id: 'ga',
  };

  let keys = Object.keys(formData);
  let url = new URL(window.location);

  for (let i = 0; i < keys.length; i++) {
    if (formData[keys[i]] !== undefined && formData[keys[i]] !== null) {
      if (fields.hasOwnProperty(keys[i])) {
        if (formData[keys[i]].length > 0) {
          url.searchParams.set(fields[keys[i]], formData[keys[i]]);
        }
      }
    }
  }

  window.history.pushState({}, document.title, url);
}

/**
 * It creates a div with a class of leeloo and appends it to the form's parent element
 * @param form - The form you want to add Leeloo to.
 * @param [leelooHash] - This is the hash that you can find in the Leeloo init code.
 */
function initializeLeeloo(form, leelooHash = window.leelooHash) {
  const leeloo = $(`<div class='leeloo'><div class="wepster-hash-${leelooHash}"></div></div>`).css(
    'display',
    'none'
  );
  $(form).parent().append(leeloo);

  window.LEELOO = function () {
    window.LEELOO_INIT = { id: '5d0cb9cdaad9f4000e4b8e07' };
    var js = document.createElement('script');
    js.src = 'https://app.leeloo.ai/init.js';
    js.async = true;
    document.getElementsByTagName('head')[0].appendChild(js);
  };
  LEELOO();
  window.LEELOO_LEADGENTOOLS = (window.LEELOO_LEADGENTOOLS || []).concat(leelooHash);

  $('.leeloo').css('display', 'block');
}

/**
 * It sends a POST request to the mail.php file with the data object as the body of the request
 * @param data - The data object that will be sent to the server.
 * @returns The result of the axios.post request.
 */
async function sendEmail(data) {
  const result = await axios.post('./mail.php', data);
  return result.data;
}

/**
 * It takes an array of utm marks, checks if they exist in the URL, and if they do, it saves them to
 * cookies
 * @param array - an array of utm marks to save to cookies
 */
function saveParamsToCookies(array) {
  array.forEach(utmMark => {
    const utm = getUrlParameter(utmMark);
    if (utm) {
      Cookies.set(utmMark, utm);
    }
  });
}

/* It creates a loading div with a progress bar and message, and then removes it when the loading is
complete */
class Loading {
  constructor(form, message = 'Loading...', closeModal = false) {
    this.form = form;
    this.message = message;
    this.closeModal = closeModal;
  }

  show() {
    const loadingDiv = `<div data-${this.form.id}-loading><p>${this.message}</p><div class="progress-bar"><div class="color"></div></div></div>`;
    $(this.form).parent().append(loadingDiv);
  }

  hide() {
    $(`[data-${this.form.id}-loading]`).remove();
    if (this.closeModal) {
      closeModalItem();
    }
  }
}

/**
 * When the user clicks on the close button, the modal is hidden and the body is no longer
 * scroll-hidden
 */

function closeModalItem() {
  $('[data-modal]').addClass('is-hidden');
  $('body').removeClass('scroll-hidden');
}

/**
 * It shows an error message to the user
 * @param errorMessage - The error message to display.
 * @param [autoClose=true] - If true, the alert will automatically close after 2 seconds.
 * @param [loading=null] - The loading object that you can pass to showLoading() to hide it.
 * @param [closeModal=false] - If the modal should be closed after the error is shown.
 */
function showError(errorMessage, autoClose = true, loading = null, closeModal = false) {
  if (loading) {
    loading.hide();
  }

  if (closeModal) {
    closeModalItem();
  }

  let timerInterval;

  const options = {
    titleText: translate('error'),
    text: errorMessage || translate('tryAgain'),
    icon: 'error',
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn',
    },
  };

  if (autoClose) {
    options.timer = 2000;
    options.timerProgressBar = true;
    options.didOpen = () => {
      Swal.showLoading();
      timerInterval = setInterval(() => {}, 100);
    };

    options.willClose = () => {
      clearInterval(timerInterval);
    };
  }

  Swal.fire(options);
}

/**
 * It shows a success message to the user
 * @param successMessage - The message to display in the alert.
 * @param [autoClose=true] - If true, the alert will close automatically after 2 seconds.
 * @param [loading=null] - The loading element that you want to hide.
 * @param [closeModal=false] - If you want to close the modal after the success message is shown, set
 * this to true.
 * @param [btnLink=null] - The link to open in a new tab
 * @param [btnText=null] - The text of the button.
 */
function showSuccess(
  successMessage,
  autoClose = true,
  loading = null,
  closeModal = false,
  btnLink = null,
  btnText = null
) {
  if (loading) {
    loading.hide();
  }

  if (closeModal) {
    closeModalItem();
  }

  let timerInterval;

  const options = {
    titleText: translate('thanks'),
    text: successMessage || translate('reply'),
    icon: 'success',
    iconColor: '#FF6C00',
    showCloseButton: true,
  };

  if (btnLink && btnText) {
    options.confirmButtonText = btnText;
    options.buttonsStyling = false;
    options.customClass = {
      confirmButton: 'btn',
    };
  }

  if (autoClose) {
    options.timer = 2000;
    options.timerProgressBar = true;
    options.didOpen = () => {
      Swal.showLoading();
      timerInterval = setInterval(() => {}, 100);
    };

    options.willClose = () => {
      clearInterval(timerInterval);
    };
  }

  Swal.fire(options).then(result => {
    if (result.isConfirmed && btnLink) {
      window.open(btnLink, '_blank');
    }
  });
}

/**
 * It sends the data to the backend, and if the backend responds with success, it adds a button to the
 * form that redirects the user to the Telegram bot
 * @param form - The form element
 * @param data - The data object that is sent to the backend.
 */
async function redirectToTelegramBackend(form, data) {
  //Send data async to inner telegram admin bot
  const apiUrl = `${window.telegramBackendUrl}/api/v2/telegram/user/uid/variables/set`;

  const telegramUid = uid();

  const urlParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fromID',
  ];

  const utmMarks = urlParams.reduce((acc, curr) => {
    if (Cookies.get(curr)) {
      acc[curr] = Cookies.get(curr);
    }

    return acc;
  }, {});

  let userVariables = { ...data, ...utmMarks };

  const setTelegramVariablesRequest = {
    uid: telegramUid,
    variables: userVariables,
  };

  if (!window.telegramBot) {
    throw new Error('Telegram bot is not initialized');
  }

  //Craft telegram redirect link
  let redirectLink = `https://t.me/${window.telegramBot}?start=UID-${telegramUid}`;

  const fromID = Cookies.get('fromID');
  if (fromID) {
    redirectLink += '__FROM-' + fromID;
  }

  const telegramDiv = `<div data-${form.id}-telegram><p class="text-center">${translate(
    'telegramBackendMessage'
  )}</p><button type="button" class="form-btn">Telegram</button></div>`;

  //Send data to telegram backend
  try {
    const { data } = await axios.post(apiUrl, setTelegramVariablesRequest);

    if (data.success) {
      $(form).parent().append(telegramDiv);

      $(`[data-${form.id}-telegram] button`).on('click', function (e) {
        window.open(redirectLink, '_blank');
        $(`[data-${form.id}-telegram]`).remove();
        showSuccess();
      });
    } else {
      showError();
    }
  } catch (error) {
    console.log(error);
    showError();
  }
}

/**
 * Generate a random string of length 32, where each character is a hexadecimal digit.
 * @returns A string of random characters.
 */
function uid() {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * It sends an HTTP request to the server, and returns true if the server says the email is available,
 * and false if the server says the email is not available
 * @param email - The email address to check.
 * @returns A boolean value.
 */
async function checkEmailDomain(email) {
  try {
    const { data } = await axios.post('./check-email.php', { email });
    return data?.status === 'ok' ? true : false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

/**
 * It takes a form and a step number, and toggles the active class on the current step and the next
 * step
 * @param form - the form element
 * @param nextStep - The next step to show.
 */
function changeFormStep(form, nextStep) {
  $('li').index($(`[data-${form.id}-steps] .active`).toggleClass('active'));
  $(`[data-${form.id}-steps] li:nth-child(${nextStep})`).toggleClass('active');
}

export default {
  validationOptions,
  getValidationLocale,
  setFormValidation,
  translate,
  Loading,
  getItiConfig,
  getIpInfo,
  geoIpLookup,
  isNumeric,
  getFormData,
  getCountryConfig,
  getZipRegex,
  getUrlParameter,
  setUrlParameter,
  showError,
  showSuccess,
  setParamsForLeeloo,
  initializeLeeloo,
  redirectToTelegramBackend,
  sendEmail,
  saveParamsToCookies,
  checkEmailDomain,
  changeFormStep,
};
