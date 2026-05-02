/*****************************************************
 *  ESP32 + DHT11 + MQTT
 *  Reads temperature & humidity
 *  Publishes data every 2 seconds approx.
 *****************************************************/
#include <WiFi.h>              // WiFi library for ESP32
#include <PubSubClient.h>      // MQTT library
#include <DHT.h>               // DHT sensor library
#define MQTT_MAX_PACKET_SIZE 128
#define DHTPIN 4                // GPIO where DHT11 DATA pin is connected
#define PIR_PIN 27              //PIR pin
#define MQ2_PIN 39              //MQ-2 pin
/************ WIFI CONFIG ************/
const char* ssid = "YUSUF 3MK";                 //wifi network name
const char* password = "12345678";        //wifi password

/************ MQTT CONFIG ************/
const char* mqtt_server = "192.168.43.136";  //the laptop's IP, MQTT broker is local but it need the ESP a (this device's IP using ipconfig on the command prompt)
const int   mqtt_port   = 1883;                 //MQTT connection port

/************ MQTT TOPICS ************/
//Topics to subscribe to
const char* temp_topic = "graduationProject/dht11/temperature"; 
const char* hum_topic  = "graduationProject/dht11/humidity";
const char* gas_topic = "graduationProject/mq2/gas";
const char* motion_topic = "graduationProject/pir/motion";

/************ DHT CONFIG ************/
#define DHTTYPE DHT11     //Sensor type

DHT dht(DHTPIN, DHTTYPE);     //idk lol

/************ WIFI & MQTT OBJECTS ************/
WiFiClient espClient;             // WiFi client
PubSubClient client(espClient);   // MQTT client

unsigned long lastMsg = 0;        // Used for timing
const long interval = 2000;       // Publish every 2 seconds

/*****************************************************
 *  Connect ESP32 to WiFi
 *****************************************************/
void setupWiFi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");

    attempts++;
    if (attempts > 50) {
      Serial.println("\n❌ WiFi failed, restarting ESP32");
      ESP.restart();
    }
  }

  Serial.println("\n✅ WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

/*****************************************************
 *  This function is called when MQTT message arrives
 *  (Not used yet, but important LATER)
 *****************************************************/
void mqttCallback(char* topic, byte* message, unsigned int length) {
  // Empty for now
}

/*****************************************************
 *  Connect ESP32 to MQTT Broker
 *****************************************************/
void reconnectMQTT() {
  // Loop until connected
  while (!client.connected()) {
    Serial.print("Connecting to MQTT........");

    // Try to connect
    String clientId = "ESP32_DHT11_";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println(" ✅ connected");
    } else {
      Serial.print(" ❌ failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2 seconds");
      delay(2000);
    }
  }
}

/*****************************************************
 *  SETUP FUNCTION (Runs once)
 *****************************************************/
void setup() {
  Serial.begin(115200); //serial monitor baud rate
  pinMode(PIR_PIN, INPUT);
  pinMode(MQ2_PIN, INPUT);
  
  dht.begin();             // Start DHT sensor
  delay(2000);             //DHT must not read too fast
  setupWiFi();             // Connect to WiFi

  client.setServer(mqtt_server, mqtt_port);       //set the server
  client.setCallback(mqttCallback);               //empty function

  //UART to Arduino
  //TX = GPIO 17, RX unused
  Serial2.begin(9600, SERIAL_8N1, -1, 17);      // -1 means  RX pin is not used

  delay(1000);
}
 
/*****************************************************
  *   LOOP FUNCTION (Runs forever)  
*****************************************************/
void loop() {

  Serial2.println("PING");
  Serial.println("Sent: PING");
  delay(1400);

  // Reconnect to MQTT if disconnected
  if (!client.connected()) {
    reconnectMQTT();
  }

  client.loop();  // Keeps MQTT connection alive

  unsigned long now = millis();     //millis returns the number of milliseconds passed since the code started

  // Publish sensor data every interval
  if (now - lastMsg > interval) {
    lastMsg = now;

    // Read temperature and humidity
    float temperature = dht.readTemperature();   // Celsius
    delay(100);
    float humidity = dht.readHumidity();      // humidity

    // Check if reading failed
    if (isnan(temperature) || isnan(humidity)) {   //isnan means Is Not A Number
      Serial.println("❌ Failed to read from DHT sensor!");
      return;
    }

    // Convert float to string
    char tempStr[8];
    char humStr[8];

    dtostrf(temperature, 1, 2, tempStr);      //dtostrf converts double or float to a string
    dtostrf(humidity, 1, 2, humStr);

    // Publish to MQTT
    //publish each topic of dht11
    client.publish(temp_topic, tempStr);
    client.publish(hum_topic, humStr);

    // Print to Serial Monitor
    Serial.print("🌡 Temperature: ");
    Serial.print(tempStr);
    Serial.print(" °C  | 💧 Humidity: ");
    Serial.print(humStr);
    Serial.println(" %");
  }

  //PIR read and publish and print in Serial monitor
  if (digitalRead(PIR_PIN)) {
    client.publish(motion_topic, "1");
    Serial.println("🚨 PIR: Motion detected");
  } else {
     client.publish(motion_topic, "0");
    Serial.println("✅ PIR: No motion");
  }

  //MQ-2 read and publish 
  static unsigned long lastMQ2Time = 0;
  const long mq2Interval = 2000; // 2 seconds

  if (millis() - lastMQ2Time > mq2Interval) {
    lastMQ2Time = millis();

    int mq2Value = analogRead(MQ2_PIN); // 0 - 4095

    char mq2Str[10];
    itoa(mq2Value, mq2Str, 10);

    client.publish(gas_topic, mq2Str);

    Serial.print("🔥 MQ-2 Gas Value: ");
    Serial.println(mq2Value);
  }

  delay(1300);
}