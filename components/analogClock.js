import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { ImageBackground } from 'react-native';
import FrameImage from '../assets/marcoReloj3.png'; // Asegúrate de que la ruta sea correcta

const CLOCK_SIZE = 176;
const CENTER = CLOCK_SIZE / 2;
const RADIUS = CLOCK_SIZE / 2 - 10;

const AnalogClock = ({ direction = 'normal', speed = 50, isCrazy = false, isSwing = false }) => {
  const [pendulum, setPendulum] = useState({
    hour: { angle: 0, velocity: 0, targetAngle: 180 },
    minute: { angle: 0, velocity: 0, targetAngle: 180 }
  }); 
  const animationRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  // Inicializar con la hora actual
  useEffect(() => {
    updateTime();
  }, []);

  // Manejar el cambio a modo swing
  useEffect(() => {
    if (isSwing) {
      const now = new Date();
      const hourAngle = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
      const minuteAngle = now.getMinutes() * 6;
      
      setPendulum({
        hour: { 
          angle: hourAngle, 
          velocity: 0, 
          targetAngle: 180,
          isActive: true 
        },
        minute: { 
          angle: minuteAngle, 
          velocity: 0, 
          targetAngle: 180,
          isActive: true 
        }
      });
    } else {
      updateTime();
      setPendulum({
        hour: { angle: 0, velocity: 0, targetAngle: 180, isActive: false },
        minute: { angle: 0, velocity: 0, targetAngle: 180, isActive: false }
      });
    }
  }, [isSwing]);

  const updateTime = () => {
    const now = new Date();
    setPendulum(prev => ({
      hour: { ...prev.hour, angle: (now.getHours() % 12) * 30 + now.getMinutes() * 0.5 },
      minute: { ...prev.minute, angle: now.getMinutes() * 6 }
    }));
  };

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (!isSwing) {
        if (isCrazy) {
          const speedFactor = 0.5 + (speed / 50) * 3; // Rango de 0.5 a 3.5
          setPendulum(prev => ({
            hour: { ...prev.hour, angle: (prev.hour.angle + 150 * speedFactor * deltaTime) % 360 },
            minute: { ...prev.minute, angle: (prev.minute.angle - 180 * speedFactor * deltaTime) % 360 }
          }));
        } else if (direction === 'left') {
          const speedFactor = 0.5 + (speed / 50) * 3; // Rango de 0.5 a 3.5
          setPendulum(prev => ({
            hour: { ...prev.hour, angle: (prev.hour.angle - 80 * speedFactor * deltaTime) % 360 },
            minute: { ...prev.minute, angle: (prev.minute.angle - 160 * speedFactor * deltaTime) % 360 }
          }));
        } else if (direction === 'right') {
          const speedFactor = 0.5 + (speed / 50) * 3; // Rango de 0.5 a 3.5
          setPendulum(prev => ({
            hour: { ...prev.hour, angle: (prev.hour.angle + 80 * speedFactor * deltaTime) % 360 },
            minute: { ...prev.minute, angle: (prev.minute.angle + 160 * speedFactor * deltaTime) % 360 }
          }));
        } else {
          updateTime();
        }
      } else {
        // Física del péndulo para ambas manecillas
        setPendulum(prev => {
          const gravity = 9.8;
          const length = 1.0;
          const damping = 0.99;
          
          // Actualizar manecilla de horas
          const hourDiff = prev.hour.angle - prev.hour.targetAngle;
          const hourAcceleration = -(gravity / length) * Math.sin(hourDiff * Math.PI / 180);
          let hourVelocity = prev.hour.velocity + hourAcceleration * deltaTime * 30;
          hourVelocity *= damping;
          let hourAngle = prev.hour.angle + hourVelocity * deltaTime * 30;
          
          // Actualizar manecilla de minutos
          const minuteDiff = prev.minute.angle - prev.minute.targetAngle;
          const minuteAcceleration = -(gravity / length) * Math.sin(minuteDiff * Math.PI / 180);
          let minuteVelocity = prev.minute.velocity + minuteAcceleration * deltaTime * 30;
          minuteVelocity *= damping;
          let minuteAngle = prev.minute.angle + minuteVelocity * deltaTime * 30;
          
          return {
            hour: { 
              ...prev.hour, 
              angle: hourAngle, 
              velocity: hourVelocity,
              isActive: Math.abs(hourVelocity) > 0.1 || Math.abs(hourDiff) > 1
            },
            minute: { 
              ...prev.minute, 
              angle: minuteAngle, 
              velocity: minuteVelocity,
              isActive: Math.abs(minuteVelocity) > 0.1 || Math.abs(minuteDiff) > 1
            }
          };
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [direction, speed, isCrazy, isSwing]);

  // Coordenadas de las manecillas
  const getHandCoordinates = (angle, length) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: CENTER + length * Math.cos(rad),
      y: CENTER + length * Math.sin(rad)
    };
  };

  const hourHand = getHandCoordinates(pendulum.hour.angle, RADIUS * 0.5);
  const minuteHand = getHandCoordinates(pendulum.minute.angle, RADIUS * 0.75);

  const renderNumbers = () => {
    return Array(12).fill().map((_, i) => {
      const angle = ((i + 1) / 12) * 360 - 90;
      const rad = angle * (Math.PI / 180);
 /*      return (
        <SvgText
          key={i}
          x={CENTER + (RADIUS - 20) * Math.cos(rad)}
          y={CENTER + (RADIUS - 20) * Math.sin(rad) + 4}
          fontSize="14"
          fontWeight="bold"
          fill="black"
          textAnchor="middle"
        >
          {i + 1}
        </SvgText>
      ); */
    });
  };

return (
  <ImageBackground
    source={FrameImage}
    style={styles.frame}
    resizeMode="contain"
  >
    <Svg width={CLOCK_SIZE} height={CLOCK_SIZE} style={styles.clockSvg}>
      <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="transparent" strokeWidth="3" fill="transparent" />
      {renderNumbers()}
      <Line
        x1={CENTER}
        y1={CENTER}
        x2={hourHand.x}
        y2={hourHand.y}
        stroke="#8c0200"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <Line
        x1={CENTER}
        y1={CENTER}
        x2={minuteHand.x}
        y2={minuteHand.y}
        stroke="#8c0200"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Circle cx={CENTER} cy={CENTER} r={5} fill="#8c0200" />
    </Svg>
  </ImageBackground>
);

};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  frame: {
    width: CLOCK_SIZE + 100,
    height: CLOCK_SIZE + 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockSvg: {
    marginTop: 56, // Puedes ajustar este valor para bajar el reloj
    marginLeft:3, // Ajusta el margen inferior si es necesario
    
    // Alternativamente:
    // transform: [{ translateY: 20 }],
  }
});

export default AnalogClock;