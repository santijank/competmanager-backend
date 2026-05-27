<?php
foreach(getenv() as $k => $v) {
    if(stripos($k, 'mysql') !== false || stripos($k, 'db') !== false || stripos($k, 'database') !== false) {
        echo $k . '=' . $v . PHP_EOL;
    }
}
