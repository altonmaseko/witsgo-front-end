# How to get location access on localhost

Some things in javascript, such as asking for a user's location, requires a https server. When working in localhost, we don't have that. Some browsers lets you bypass this rule if you open the website on the same device that you started the server.

However, when you try to access the site via your phone, it won't have the ability to track location. Thus we need to self-sign our own SSL certificates so we can provide this functionality to localhost

# Process
Install the server opener:
```
npm install -g http-server
```

Generate the necessary SSL certs:
```
openssl req -nodes -new -x509 -keyout server.key -out server.cert
```
Run the http-server command[the number after the -p is the port, so change it as needed]:
```
http-server -S -C server.cert -K server.key -p 8080
```
Now to access the server on your computer/phone, you need to the do following:
1. Find your ip address of your computer. For linux, you go into a terminal and type "ifconfig", and take the address that is not 127.0.0.1
2. Type into your browser the website of https://198.168.xx.xx:8080/
3. Verify that this works on your desktop before your phone

Once all this is done, you should be able to access the user's location on the phone using local development.


# Alternatives
You can look at ngrok, but i dont know how to do that so