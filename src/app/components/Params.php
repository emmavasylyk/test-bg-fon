<?php

namespace components;

class Params
{
  public function save()
  {
    if ($this->validatePassword($_POST['password'])) {
      $file = fopen(dirname(__FILE__, 2) . '/params.ini', 'w+');
      fwrite($file, "PRODUCT_NAME={$_POST['PRODUCT_NAME']}\n");
      fwrite($file, "PRODUCT_ID={$_POST['PRODUCT_ID']}\n");
      fwrite($file, "GTM={$_POST['GTM']}\n");
      fwrite($file, "CAPI_LEAD_FORMAT={$_POST['CAPI_LEAD_FORMAT']}\n");
      fwrite($file, "LEELOO_HASH={$_POST['LEELOO_HASH']}\n");
      fwrite($file, "TELEGRAM_BACKEND_URL='{$_POST['TELEGRAM_BACKEND_URL']}'\n");
      fwrite($file, "TELEGRAM_BOT='{$_POST['TELEGRAM_BOT']}'\n");
      fwrite($file, "START_DATE={$_POST['START_DATE']}\n");
      fclose($file);
    } else {
      echo 'Wrong password';
    }
  }

  public function validatePassword($password)
  {
    return password_verify($password, $_ENV['PASSWORD_FORM']);
  }

  public static function getParams()
  {
    return parse_ini_file(dirname(__FILE__, 2) . '/params.ini');
  }
}