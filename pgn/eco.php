<?php

print "Building ECO data...\n";


function log2file($path, $data, $mode="w"){
   $fh = fopen($path, $mode) or die($path);
   fwrite($fh,$data . "\n");
   fclose($fh);
   chmod($path, 0777);
}


$parts = file('./ECOChessOpeningCodes.txt');
$data = [];
$pgn = '';
$eco = '';
$name = '';
foreach($parts as $part) {
	if(substr($part,0,2) === '1 '){
		$pgn = str_replace("\n","",$part);
	} else {
		$parts2 = explode("\t",$part);
		$eco = str_replace("\n","",$parts2[0]);
		$name = str_replace("\n","",$parts2[1]);
	}

	if(strlen($pgn) && strlen($eco) && strlen($name)){
		$data[] = [
			'eco' => $eco,
			'name' => $name,
			'pgn' => $pgn
		];
		$pgn = '';
		$eco = '';
		$name = '';
	}
}

log2file('./eco.json',json_encode($data));