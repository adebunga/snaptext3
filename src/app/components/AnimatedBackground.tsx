'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs';

const AnimatedBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create floating balls
    const ballsCount = 20; // Increased number of balls
    const container = containerRef.current;
    
    for (let i = 0; i < ballsCount; i++) {
      const ball = document.createElement('div');
      const size = Math.random() * 20 + 10; // Larger size range: 10-30px
      
      ball.className = 'absolute rounded-full';
      ball.style.width = `${size}px`;
      ball.style.height = `${size}px`;
      // Using more vibrant colors with higher opacity
      const colors = [
        'rgba(139, 92, 246, 0.3)', // Purple
        'rgba(59, 130, 246, 0.3)', // Blue
        'rgba(236, 72, 153, 0.3)', // Pink
        'rgba(249, 115, 22, 0.3)', // Orange
      ];
      ball.style.background = colors[Math.floor(Math.random() * colors.length)];
      ball.style.left = `${Math.random() * 100}%`;
      ball.style.top = `${Math.random() * 100}%`;
      ball.style.filter = 'blur(2px)';
      
      container.appendChild(ball);
    }

    // Animate each ball
    anime({
      targets: container.children,
      translateX: () => anime.random(-200, 200), // Increased movement range
      translateY: () => anime.random(-200, 200),
      scale: () => [0.7, 1.2], // More noticeable scaling
      opacity: () => [0.3, 0.6], // Higher opacity range
      duration: () => anime.random(4000, 6000), // Longer duration
      delay: () => anime.random(0, 2000), // More varied delays
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutQuad',
    });

    // Clean up
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    />
  );
};

export default AnimatedBackground; 