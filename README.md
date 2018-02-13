# Cookie Dealer
A toolkit to steal browser cookies and reuse them in the attacker's browser for demonstration
purposes. Think of it as [Firesheep](https://en.wikipedia.org/wiki/Firesheep), but as a modern
web extension with a server component to be more flexible. The idea is that stealing the cookie
(which can be done in various ways) is decoupled from reusing the cookie in the attacker's
browser.

This project was developed by Tobias Ospelt (@floyd_ch) from modzero AG (@mod0).

## The basic idea

1. Steal cookies and send cookies to server
1. Store cookies on server and provide them via JSON interface
1. Fetch cookies from server and install them in the attacker's browser

For Step 1 there are various ways to do this:
* Exploit the missing secure flag of the cookie. This toolkit includes a Burp extension that
will do this: [attack_burp_cookie_missing_secure](attack_burp_cookie_missing_secure/). This implementation works well when
Burp is in transparent proxy mode. It will inject an iframe into every non-encrypted HTTP
connection pointing to the vulnerable domain, which will therefore instruct the browser to send
the cookie via non-secure HTTP. The same Burp plugin will then find the cookie in the
non-encrypted traffic and send it to our server.
* Exploit the missing HttpOnly flag of the cookie. Such an attack is not yet implemented: See
folder [attack_xss_cookie_missing_httponly](attack_xss_cookie_missing_httponly)
* Exploit a domain hijacking issue to get access to a cookie that is set to the parent domain
(eg. Single Sign On cookies). Such an attack is not yet implemented.

Step 2 is called the "loot server": See [loot_server_var_www](loot_server_var_www/)

Step 3 is the browser add-on: See folder [browser_addon](browser_addon/)

## Howto
1. Setup a transparent Burp proxy and install the Burp extension that can be found in the
folder [attack_burp_cookie_missing_secure](attack_burp_cookie_missing_secure/). Adjust the options at the beginning of the Burp
extension in the file [burp_ext_cookie_missing_secure.py](attack_burp_cookie_missing_secure/burp_ext_cookie_missing_secure.py).
1. Setup a web server and copy the contents of the folder [loot_server_var_www](loot_server_var_www/) in your
```/var/www/``` directory (assuming ```/var/www/html/``` is your web root). Adjust the options at the beginning of the [data.php](loot_server_var_www/html/cookiedealer/data.php) script.
1. Setup your browser (Firefox was tested) with the add-on in the directory [browser_addon](browser_addon/).
Adjust the options at the beginning of the [panel.js](browser_addon/sidebar/panel.js) script.

As soon as you connect with your victim browser to any non-TLS HTTP website via the transparent Burp
proxy, it will inject an iframe pointing to the attacked domain. Your victim
browser will then send the cookie without TLS (as the cookie is missing the secure flag). The
Burp plugin will pick up the cookie and send it to our loot server. Open your attacker browser
where the browser add-on was installed and click "Refresh from server". The dropdown menu will
show the available cookies. Choose one entry to install it in the attacker's browser. The
attacker browser can now be used to access the attacked domain with the victim's cookie.
