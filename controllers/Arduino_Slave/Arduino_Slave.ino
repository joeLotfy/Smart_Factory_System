// HW-130 / L298N motor control
// Runs motor sequence ONLY when "PING" is received from ESP32

const int ENA = 5;
const int IN1 = 8;
const int IN2 = 9;

void setup() {
  // Serial from ESP32 (and USB)
  Serial.begin(9600);

  // Motor control pins
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  // Motor OFF at startup
  stopMotor();
}

void loop() {
  // Check if ESP32 sent something
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    // Run ONLY if command is exactly "PING"
    if (cmd == "PING") {
      runMotorSequence();
    }
  }
}

// -------- Motor Functions --------
void runMotorSequence() {
  // Forward 5 seconds
  motorForward();
  delay(5000);

  // Reverse 5 seconds
  motorReverse();
  delay(5000);

  // Stop motor
  stopMotor();
}

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