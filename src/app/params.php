<?php

use components\Params;

require_once 'vendor/autoload.php';


/* It loads the .env file */
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

if (!empty($_POST)) {
    $saver = new Params();
    $saver->save();
}

$ini_array = parse_ini_file('params.ini');
?>

<form action="" method="post" style="display:flex; flex-direction:column; gap:10px; max-width:300px;">
    <label for="PRODUCT_NAME">Zoho Product Name</label>
  <input type="text" id="PRODUCT_NAME" name="PRODUCT_NAME" value="<?= $ini_array['PRODUCT_NAME'] ?>"
    placeholder="<?= $ini_array['PRODUCT_NAME'] ?>">

  <label for="PRODUCT_ID">Zoho Product ID</label>
  <input type="text" id="PRODUCT_ID" name="PRODUCT_ID" value="<?= $ini_array['PRODUCT_ID'] ?>"
    placeholder="<?= $ini_array['PRODUCT_ID'] ?>">
  
  <label for="LEELOO_HASH">Leeloo Hash</label>
  <input type="text" id="LEELOO_HASH" name="LEELOO_HASH" value="<?= $ini_array['LEELOO_HASH'] ?>"
    placeholder="<?= $ini_array['LEELOO_HASH'] ?>">
  
    <label for="TELEGRAM_BACKEND_URL">Telegram Backend URL</label>
  <input type="text" id="TELEGRAM_BACKEND_URL" name="TELEGRAM_BACKEND_URL"
    value="<?= $ini_array['TELEGRAM_BACKEND_URL'] ?>" placeholder="<?= $ini_array['TELEGRAM_BACKEND_URL'] ?>">

  <label for="TELEGRAM_BOT">Telegram Bot</label>
  <input type="text" id="TELEGRAM_BOT" name="TELEGRAM_BOT"
    value="<?= $ini_array['TELEGRAM_BOT'] ?>" placeholder="<?= $ini_array['TELEGRAM_BOT'] ?>">
  
    <label for="CAPI_LEAD_FORMAT">CAPI Lead Format</label>
  <input type="text" id="CAPI_LEAD_FORMAT" name="CAPI_LEAD_FORMAT" value="<?= $ini_array['CAPI_LEAD_FORMAT'] ?>"
    placeholder="<?= $ini_array['CAPI_LEAD_FORMAT'] ?>">
  
    <label for="GTM">GTM</label>
  <input type="text" id="GTM" name="GTM" value="<?= $ini_array['GTM'] ?>" placeholder="<?= $ini_array['GTM'] ?>">

  <label for="START_DATE">Start Date</label>
  <input type="text" id="START_DATE" name="START_DATE" value="<?= $ini_array['START_DATE'] ?>"
    placeholder="<?= $ini_array['START_DATE'] ?>">

  <label for="password">Password</label>
  <input type="password" id="password" name="password">

  <button type="submit">Save</button>
</form>
