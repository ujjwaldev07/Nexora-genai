// Nexora AI Motion & Ambient Engine Configuration

export type MotionQualityLevel = 'high' | 'medium' | 'low' | 'reduced';

export interface MotionConfig {
  quality: MotionQualityLevel;
  particleCount: number;
  enableNeuralConnections: boolean;
  enableTravelingLightBeacons: boolean;
  parallaxStrength: number;
  speedMultiplier: number;
  glowIntensity: number;
}

export const getMotionConfig = (quality: MotionQualityLevel = 'high'): MotionConfig => {
  // Check if disabled via URL or localStorage for benchmarking (?motion=off)
  const isDebugOff = 
    typeof window !== 'undefined' && 
    (new URLSearchParams(window.location.search).get('motion') === 'off' || 
     localStorage.getItem('nexora_motion') === 'off');

  if (isDebugOff) {
    return {
      quality: 'reduced',
      particleCount: 0,
      enableNeuralConnections: false,
      enableTravelingLightBeacons: false,
      parallaxStrength: 0,
      speedMultiplier: 0,
      glowIntensity: 0.3,
    };
  }

  switch (quality) {
    case 'low':
      return {
        quality: 'low',
        particleCount: 25,
        enableNeuralConnections: false,
        enableTravelingLightBeacons: false,
        parallaxStrength: 0.2,
        speedMultiplier: 0.7,
        glowIntensity: 0.6,
      };
    case 'medium':
      return {
        quality: 'medium',
        particleCount: 45,
        enableNeuralConnections: true,
        enableTravelingLightBeacons: true,
        parallaxStrength: 0.6,
        speedMultiplier: 0.85,
        glowIntensity: 0.85,
      };
    case 'reduced':
      return {
        quality: 'reduced',
        particleCount: 0,
        enableNeuralConnections: false,
        enableTravelingLightBeacons: false,
        parallaxStrength: 0,
        speedMultiplier: 0,
        glowIntensity: 0.5,
      };
    case 'high':
    default:
      return {
        quality: 'high',
        particleCount: 75,
        enableNeuralConnections: true,
        enableTravelingLightBeacons: true,
        parallaxStrength: 1.0,
        speedMultiplier: 1.0,
        glowIntensity: 1.0,
      };
  }
};
