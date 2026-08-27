import React from 'react';
import {Composition} from 'remotion';
import {CCRPromo, CCRPromoVertical, calculateCCRMetadata, FPS} from './CCRPromo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CCRPromo"
        component={CCRPromo}
        calculateMetadata={calculateCCRMetadata}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={1500}
        defaultProps={{scenes: []}}
      />
      <Composition
        id="CCRPromoVertical"
        component={CCRPromoVertical}
        calculateMetadata={calculateCCRMetadata}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={1500}
        defaultProps={{scenes: []}}
      />
    </>
  );
};
