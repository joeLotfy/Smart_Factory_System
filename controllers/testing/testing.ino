#include <Servo.h>

//ultrasonic pins
const int trigPin = 9;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
const int echoPin = 10;
//servo motor pin
const int servoPin = 6;
//L298N driver pins
const int ENA = 11;
const int IN1 = 12;
const int IN2 = 13;

Servo myServo;

long duration;
int distance;

int homePos = 0;
int actionPos = 90;

bool triggered = false;   // منع التكرار

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  myServo.attach(servoPin);
  myServo.write(homePos);

  Serial.begin(9600);
}

void loop() {
  // Trigger
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH, 30000);
  distance = duration * 0.034 / 2;

  Serial.println(distance);

  // لو قرب
  if (distance > 0 && distance < 15 && !triggered) {
    triggered = true;

    //work servo
    myServo.write(actionPos);
    delay(2000);
    myServo.write(homePos);

    //driver
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    analogWrite(ENA, 200);   // سرعة
    delay(500);
    
  }

  // لو بعد
  if (distance >= 20) {
    //to stop the servo
    triggered = false;

    //stop the motor driver
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 200);
    delay(500);
  }

  delay(100);
}