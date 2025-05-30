import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const AnalogClock = ({ hour = 9, minute = 0 }) => {
  const radius = 75;
  const center = radius;
  const hourAngle = ((hour % 12) + minute / 60) * 30; // cada hora = 30 grados
  const minuteAngle = minute * 6; // cada minuto = 6 grados

  const getHandCoords = (length, angle) => {
    const rad = (Math.PI / 180) * (angle - 90); // ajusta para que 0° esté arriba
    return {
      x: center + length * Math.cos(rad),
      y: center + length * Math.sin(rad),
    };
  };

  const hourCoords = getHandCoords(radius * 0.5, hourAngle);
  const minuteCoords = getHandCoords(radius * 0.8, minuteAngle);

  return (
    <View style={{ width: radius * 2, height: radius * 2 }}>
      <Svg height={radius * 2} width={radius * 2}>
        {/* Borde del reloj */}
        <Circle cx={center} cy={center} r={radius} stroke="black" strokeWidth="2" fill="#eee" />
        {/* Manecilla de la hora */}
        <Line
          x1={center}
          y1={center}
          x2={hourCoords.x}
          y2={hourCoords.y}
          stroke="black"
          strokeWidth="4"
        />
        {/* Manecilla del minuto */}
        <Line
          x1={center}
          y1={center}
          x2={minuteCoords.x}
          y2={minuteCoords.y}
          stroke="black"
          strokeWidth="2"
        />
        {/* Centro del reloj */}
        <Circle cx={center} cy={center} r={4} fill="black" />
      </Svg>
    </View>
  );
};

export default AnalogClock;
