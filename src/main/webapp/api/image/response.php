<?php

foreach($_POST as $key => $value){ 
  
  $arr = explode("||||", $key);
  echo "Изображение ".$arr[0]."<br> на сервер прогружено";  
  
  
  $img = str_replace('_', '+', $arr[1]);
  echo "<img src='".$img."' alt='".$arr[0]."'>";
  $img = str_replace('data:image/jpeg;base64,', '', $img);
  $filename = str_replace('_jpg', '.jpg',strtolower($arr[0]));  
  
  $img = base64_decode($img);
  file_put_contents($filename,$img);

}

?>