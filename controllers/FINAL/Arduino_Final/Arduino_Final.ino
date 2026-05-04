#include <Servo.h>

const int ENA = 3;
const int IN1 = 32;
const int IN2 = 33;

const int ENB = 5;
const int IN3 = 30;
const int IN4 = 31;

//ultrasonic pins
const int trigPin = 9;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
const int echoPin = 10;
//servo motor pin
const int servoPin = 6;


void setup() {
  // put your setup code here, to run once:
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  pinMode(ENB, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);


}

void loop() {
  // put your main code here, to run repeatedly:
  // motorForward1();
  // motorForward2();
  // delay(3000);
  stopMotor1();
  stopMotor2();
  // delay(3000);
  // motorReverse1();
  // motorReverse2();
  // delay(3000);
  // stopMotor1();
  // stopMotor2();
  // delay(3000);


}




//motor functions

void motorForward1() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 200); // speed
  // int i = 20;
  // do{
  //   if (i >= 200) {
  //     i += 20;
  //     analogWrite(ENA, i);
  //     delay(160);
  //   } else {
  //     continue;
  //   }
  // } while (true);
}

void motorReverse1() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  analogWrite(ENA, 200);
  // int i = 20;
  // do{
  //   if (i >= 200) {
  //     i += 20;
  //     analogWrite(ENA, i);
  //     delay(160);
  //   } else {
  //     continue;
  //   }
  // } while (true);
}

void stopMotor1() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
  // int i = 200;
  // do{
  //   if (i <= 0) {
  //     i -= 20;
  //     analogWrite(ENA, i);
  //     delay(160);
  //   } else {
  //     continue;
  //   }
  // } while (true);
}



//motor functions

void motorForward2() {
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENB, 200); // speed
}

void motorReverse2() {
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  analogWrite(ENB, 200);
}

void stopMotor2() {
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  analogWrite(ENB, 0);
}