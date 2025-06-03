import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const CLOCK_SIZE = 200;
const CENTER = CLOCK_SIZE / 2;
const RADIUS = CLOCK_SIZE / 2 - 10;

const AnalogClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getRotation = (unit, maxUnit) => (unit / maxUnit) * 360;

  const secondAngle = getRotation(time.getSeconds(), 60);
  const minuteAngle = getRotation(time.getMinutes(), 60) + secondAngle / 60;
  const hourAngle = getRotation(time.getHours() % 12, 12) + minuteAngle / 12;

  const handCoordinates = (angle, length) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: CENTER + length * Math.cos(rad),
      y: CENTER + length * Math.sin(rad),
    };
  };

  const hour = handCoordinates(hourAngle, RADIUS * 0.5);
  const minute = handCoordinates(minuteAngle, RADIUS * 0.75);
  const second = handCoordinates(secondAngle, RADIUS * 0.85);

  const renderNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= 12; i++) {
      const angle = ((i / 12) * 360 - 90) * (Math.PI / 180);
      const x = CENTER + (RADIUS - 20) * Math.cos(angle);
      const y = CENTER + (RADIUS - 20) * Math.sin(angle);

      numbers.push(
        <SvgText
          key={i}
          x={x}
          y={y + 4} // Ajuste vertical
          fontSize="14"
          fontWeight="bold"
          fill="black"
          textAnchor="middle"
        >
          {i}
        </SvgText>
      );
    }
    return numbers;
  };

  return (
    <View style={styles.container}>
      <Svg width={CLOCK_SIZE} height={CLOCK_SIZE}>
        {/* Borde del reloj */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="black" strokeWidth="4" fill="white" />

        {/* Números */}
        {renderNumbers()}

        {/* Manecilla de la hora */}
        <Line
          x1={CENTER}
          y1={CENTER}
          x2={hour.x}
          y2={hour.y}
          stroke="black"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Manecilla del minuto */}
        <Line
          x1={CENTER}
          y1={CENTER}
          x2={minute.x}
          y2={minute.y}
          stroke="blue"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Manecilla del segundo */}
        <Line
          x1={CENTER}
          y1={CENTER}
          x2={second.x}
          y2={second.y}
          stroke="red"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Centro */}
        <Circle cx={CENTER} cy={CENTER} r={4} fill="black" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 25,
  },
});

export default AnalogClock;
