<?php

foreach($_POST as $key => $value){ 
  
   $tag =  '<img src="'.str_replace('_','+',$key).'">';
   echo $tag;
  
}

//print_r($_POST);








?>