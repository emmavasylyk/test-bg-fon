<?php
// Файлы phpmailer
require 'phpmailer/PHPMailer.php';
require 'phpmailer/Exception.php';

// Переменные, которые отправляет пользователь
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);
logRequest($input);

$title = $input['title'];
$name = $input['name'];
$email = $input['email'];
$phone = $input['phone'];
$message = $input['message'];
$recipient = $input['recipient'];


// Формирование самого письма
$body = "Name: $name \n
        Phone: $phone \n
        Email: $email \n
        Message: $message";

// Настройки PHPMailer
$mail = new PHPMailer\PHPMailer\PHPMailer();
$mail->CharSet = 'UTF-8';
try {
	$mail->From = $email;
	$mail->FromName = $name;
	// Получатель письма
	$mail->addAddress($recipient);

	// Отправка сообщения
	$mail->isHTML(false);
	$mail->Subject = $title;
	$mail->Body = $body;

	// Проверяем отравленность сообщения
	if ($mail->send()) {
		$result = 'success';
	} else {
		$result = 'error';
	}
} catch (Exception $e) {
	$result = 'error';
	$status = "The message was not sent. The reason for the error: {$mail->ErrorInfo}";
}

$mail->ClearAddresses();
$mail->clearAttachments();

// Отображение результата
echo json_encode(['result' => $result, 'resultfile' => $rfile, 'status' => $status]);

function logRequest($request)
{
	$file = fopen('mail.log', 'a+');
	$date = date(DATE_RFC822);

	$string = [
		'date' => $date,
		'input' => $request,
	];
	fwrite($file, json_encode($string, JSON_UNESCAPED_UNICODE) . ',');
	fclose($file);
}