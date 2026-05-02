// Pin definitions
#define S0 4
#define S1 5
#define S2 6
#define S3 7
#define sensorOut 8

const int ENA = 9;
const int IN1 = 10;
const int IN2 = 11;


// Variables for frequency readings
int r = 0;
int g= 0;
int b = 0;

void setup() {
  // Set pin modes
  pinMode(S0, OUTPUT);
  pinMode(S1, OUTPUT);
  pinMode(S2, OUTPUT);
  pinMode(S3, OUTPUT);
  pinMode(sensorOut, INPUT);

  // Set frequency scaling to 20%
  digitalWrite(S0, HIGH);
  digitalWrite(S1, LOW);

  Serial.begin(9600);

  // Motor control pins
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  // Motor OFF at startup
  stopMotor();
}

void loop() {
  

  // --- Read RED ---
  digitalWrite(S2, LOW);
  digitalWrite(S3, LOW);
  r = pulseIn(sensorOut, LOW);
  Serial.print("R = ");
  Serial.print(r);

  delay(100);

  // --- Read GREEN ---
  digitalWrite(S2, HIGH);
  digitalWrite(S3, HIGH);
  g = pulseIn(sensorOut, LOW);
  Serial.print(" G = ");
  Serial.print(g);
  delay(100);

  // --- Read BLUE ---
  digitalWrite(S2, LOW);
  digitalWrite(S3, HIGH);
  b = pulseIn(sensorOut, LOW);
  Serial.print(" B = ");
  Serial.println(b);

  if (r<g && r<b && r< 70 && g>100 && b>100){
    Serial.print(" RED DETECTED!!!!! ");
    //motor reverse for 5 sec when red detected
    stopMotor();
    delay(500);
    motorReverse();
    delay(5000);
    stopMotor();
    delay(500);
  }
  else if (g<r && g<b){
    Serial.print(" GREEN DETECTED!!!!! ");
  }
  else if (b<r && b<g){
    Serial.print(" BLUE DETECTED!!!!! ");
  }
  else {
    Serial.print(" No Color Detected  ");
  }


  delay(200);
  //motor is forward in normal
  motorForward();
}




//motor functions

void motorForward() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 200); // speed
}

void motorReverse() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  analogWrite(ENA, 200);
}

void stopMotor() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, 0);
}