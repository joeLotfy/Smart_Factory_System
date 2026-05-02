How to set this system up
install:-
1- Mosquitto MQTT Broker
2- MongoDB server
3- CP210x Windows Drivers (for esp32 USB connection)
3- MQTT Explorer (optional)
4- MongoDB Compass (optional)
5- Arduino IDE & VSCode (optional for code review and/or editing)

You need to edit the mosquitto.conf file in the Mosquitto installaion path, add 
'listener 1883
allow_anonymous true'
to make the broker listen on the 1883 port.