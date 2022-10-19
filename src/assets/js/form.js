// Form.js - v1.1.0 - 2022-09-30 @Suzuya_re1

import $ from 'jquery';
import intlTelInput from 'intl-tel-input';
import JustValidate from 'just-validate';
import countrySelect from 'country-select-js';
import service from './service.js';
import crm from './submit.js';

$(window).on('load', async function () {
  // Params
  const params = {
    needsRedirectToLeeloo: window.leelooHash ? true : false,
    needsRedirectToTelegramBackend: window.telegramBackendUrl ? true : false,

    /* It's a check that the domain has MX records on dns server */
    needsCheckEmailDomain: true,

    utmMarks: ['utm_source', 'utm_medium', 'utm_content', 'utm_term', 'utm_campaign'],
    referralMarks: ['SRC', 'from'],

    defaultLocale: 'uk',
    defaultPhoneCountry: 'ua',
    preferredPhoneCountries: ['ua'],
    excludePhoneCountries: ['ru', 'by'],

    forms: [
      {
        formId: 'leadForm',

        /*
        !Zoho CRM params, window vars by default
        productName: 'dummy_product',
        productId: 'dummy_product_id',

        ! Required params if you need send email
        needSendEmail: false,
        onlySendEmail: false,
        emailTitle: 'title',
        emailRecipient: 'test@test.test',

        */
      },
    ],
  };

  /* It's a check that the locale is set. If not, it sets the default locale. */
  if (!window.locale) {
    console.log('Locale is not set, setting default locale: ' + params.defaultLocale);
    window.locale = params.defaultLocale;
  }

  /* It's a check that you can use only one of the following methods: redirect to leeloo or redirect to
telegram backend. */
  if (params.needsRedirectToLeeloo && params.needsRedirectToTelegramBackend) {
    throw new Error(
      'You can use only one of the following methods: redirect to leeloo or redirect to telegram backend'
    );
  }

  /* It's a function that gets the user's IP address. */
  await service.getIpInfo().then(data => (window.ipData = data));

  /* It's a function that gets the country code from the user's IP address. */
  await service
    .geoIpLookup(params.defaultPhoneCountry)
    .then(country_code => (window.itiInitialCountry = country_code));

  /* It's a function that saves the UTM marks to cookies. */
  service.saveParamsToCookies(params.utmMarks);

  /* It's a function that saves the referral marks to cookies. */
  params.telegramBackendUrl && service.saveParamsToCookies(params.referralMarks);

  /* It's a function that takes an array of forms and validates them. */
  Promise.all(params.forms.map(async form => await formHandler(form)));

  /**
   * It's a function that initializes the form
   * @param formParams - form params
   */
  async function formHandler(formParams) {
    const {
      formId,
      productName = window.productName,
      productId = window.productId,
      needSendEmail = false,
      onlySendEmail = false,
      emailTitle = 'New request',
      emailRecipient = 'info@goit.ua',
    } = formParams;

    // Refs
    const form = document.getElementById(formId);

    if (!form) {
      throw new Error(`Form with id ${formId} not found`);
    }

    const name = form.querySelector('[name="name"]');
    const phone = form.querySelector('[type="tel"]');
    const email = form.querySelector('[name="email"]');
    const country = form.querySelector('[name="country"]');

    // Vars
    const iti = intlTelInput(
      phone,
      await service.getItiConfig(params.preferredPhoneCountries, params.excludePhoneCountries)
    );

    $(country).countrySelect(
      await service.getCountryConfig(params.preferredPhoneCountries, params.excludePhoneCountries)
    );

    /* It's a function that initializes the validation library. */
    const validationForm = new JustValidate(
      form,
      service.validationOptions,
      service.getValidationLocale()
    );

    validationForm.setCurrentLocale(window.locale);

    // apply rules to form fields
    service
      .setFormValidation(validationForm)
      .addField(`#${phone.id}`, [
        {
          validator: value => iti.isValidNumber(),
          errorMessage: 'Phone number is invalid!',
        },
      ])
      // submit form
      .onSuccess(async function (event) {
        event.preventDefault();

        /* It's a check that the email domain has MX records on dns server. */
        if (params.needsCheckEmailDomain && !(await service.checkEmailDomain(email.value))) {
          return service.showError(service.translate('emailNotExists'));
        }

        /* It's a function that removes extra spaces */
        name.value = name.value.trim();

        /* It's a function that gets the phone number from the input field. */
        const phoneNumber = iti.getNumber();

        const loading = new service.Loading(form, service.translate('loadingMessage'));
        $(form).css('display', 'none');
        loading.show();

        if (needSendEmail) {
          await service
            .sendEmail({
              title: emailTitle,
              name: name.value,
              phone: phoneNumber,
              email: email.value,
              recipient: emailRecipient,
              // ToDo - add message, attach file, etc.
            })
            .then(res => {
              /* It's a check that the form is only for sending an email.
              If so, it hides the loading block and shows the success block. */
              if (onlySendEmail) {
                service.showSuccess();
              }
            })
            .catch(error => {
              console.log(error);
              service.showError();
            })
            .finally(() => {
              if (onlySendEmail) {
                service.changeFormStep(form, 3);
                loading.hide();
              }
            });
        }

        const crmParams = [name.value, phoneNumber, email.value, productName, productId];

        /* It's a function that generates data for the CRM. */
        const data = crm.generateData(...crmParams);
        /* It's a function that sends data to the CRM. */
        const response = crm.submit(...crmParams);

        /* It's a Google Tag Manager event. */
        dataLayer.push({ event: 'lead' });

        if (!onlySendEmail) {
          // https://www.youtube.com/watch?v=sqcLjcSloXs

          service.changeFormStep(form, 2);

          switch (true) {
            case params.needsRedirectToLeeloo:
              return showLeelooBlock();

            case params.needsRedirectToTelegramBackend:
              return showTelegramBackendBlock();

            default:
              return showDefaultBlock();
          }

          /* It's a function that redirects the user to the Leeloo CRM. */
          async function showLeelooBlock() {
            service.setParamsForLeeloo(data);

            response
              .then(resp => {
                if (resp.status === 200) {
                  service.setUrlParameter('name2', name.value);

                  service.initializeLeeloo(form);
                  $(form).css('display', 'none');
                  $(form).trigger('reset');
                  service.changeFormStep(form, 3);

                  const checkLeeloo = setInterval(() => {
                    const iframe = form.querySelector('.leeloo-lgt-form');
                    if (iframe) {
                      clearInterval(checkLeeloo);
                      dataLayer.push({ event: 'появилось окно с кнопкой' });
                    }
                  }, 2000);
                } else {
                  console.log('error ', resp.statusText);
                  $(form).css('display', 'block');
                  service.showError();
                }
              })
              .catch(err => {
                console.log(err);
                $(form).css('display', 'block');
                service.showError();
              })
              .finally(() => {
                loading.hide();
              });
          }

          /* It's a function that redirects the user to the Telegram backend. */
          async function showTelegramBackendBlock() {
            response.finally(async () => {
              await service.redirectToTelegramBackend(form, data).finally(() => {
                service.changeFormStep(form, 3);
                loading.hide();
              });
            });
          }

          async function showDefaultBlock() {
            response
              .then(resp => {
                if (resp.status === 200) {
                  $(form).trigger('reset');
                  service.changeFormStep(form, 3);
                  service.showSuccess(service.translate('reply'), true, loading, true);
                } else {
                  console.log('error ', resp.statusText);
                  $(form).css('display', 'block');
                  service.showError();
                }
              })
              .catch(err => {
                console.log(err);
                $(form).css('display', 'block');
                service.showError();
                loading.hide();
              });
          }
        }
      });
  }
});
